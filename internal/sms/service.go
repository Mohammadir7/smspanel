package sms

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/island/sms-panel/internal/filter"
	"github.com/island/sms-panel/internal/pricing"
	"github.com/island/sms-panel/internal/providers"
	"github.com/island/sms-panel/internal/queue"
	"github.com/island/sms-panel/internal/smsutil"
	"github.com/island/sms-panel/internal/trace"
	"github.com/island/sms-panel/internal/wallet"
)

type Service struct {
	db       *sql.DB
	log      *trace.Hub
	wallet   *wallet.Service
	filter   *filter.Engine
	pricing  *pricing.Engine
	provider providers.SMSProvider
	q        *queue.Queue
}

func NewService(db *sql.DB, log *trace.Hub, w *wallet.Service, f *filter.Engine, p *pricing.Engine, prov providers.SMSProvider, q *queue.Queue) *Service {
	s := &Service{db: db, log: log, wallet: w, filter: f, pricing: p, provider: prov, q: q}
	q.SetHandler(s.handleJob)
	return s
}

type SendInput struct {
	UserID     string
	Message    string
	Recipients []string
}

type SendResult struct {
	CampaignID   string `json:"campaign_id"`
	Recipients   int    `json:"recipients"`
	Parts        int    `json:"parts_per_message"`
	CostRial     int64  `json:"cost_rial"`
	Status       string `json:"status"`
	ProviderNote string `json:"provider_note,omitempty"`
}

func (s *Service) Estimate(message string, recipientCount int) map[string]any {
	parts := smsutil.CountParts(message)
	price := s.pricing.PricePerPart()
	cost := smsutil.EstimateCostRial(recipientCount, parts, price)
	return map[string]any{
		"parts_per_message": parts,
		"recipients":        recipientCount,
		"price_per_part":    price,
		"cost_rial":         cost,
	}
}

func (s *Service) Send(ctx context.Context, in SendInput) (*SendResult, error) {
	s.log.Step("sms", "شروع ثبت کمپین ارسال")

	recipients := normalizeRecipients(in.Recipients)
	if len(recipients) == 0 {
		return nil, errBadInput("حداقل یک شماره گیرنده لازم است")
	}
	if strings.TrimSpace(in.Message) == "" {
		return nil, errBadInput("متن پیام خالی است")
	}

	parts := smsutil.CountParts(in.Message)
	fr := s.filter.Check(in.Message, parts)
	if !fr.Allowed {
		s.log.Warn("sms", "فیلتر متن رد کرد", fr.Reason)
		return nil, errBadInput(fr.Reason)
	}

	price := s.pricing.PricePerPart()
	cost := smsutil.EstimateCostRial(len(recipients), parts, price)
	s.log.Info("sms", "محاسبه هزینه انجام شد")

	campaignID := uuid.NewString()
	now := time.Now().UTC().Format(time.RFC3339)

	if err := s.wallet.Debit(ctx, in.UserID, cost, "campaign", campaignID, "کسر هزینه ارسال"); err != nil {
		return nil, err
	}

	_, err := s.db.ExecContext(ctx,
		`INSERT INTO campaigns (id, user_id, message, recipient_count, parts_per_message, cost_rial, status, created_at) VALUES (?,?,?,?,?,?,?,?)`,
		campaignID, in.UserID, in.Message, len(recipients), parts, cost, "queued", now)
	if err != nil {
		return nil, err
	}

	for _, r := range recipients {
		msgID := uuid.NewString()
		_, _ = s.db.ExecContext(ctx,
			`INSERT INTO message_logs (id, campaign_id, recipient, status, created_at) VALUES (?,?,?,?,?)`,
			msgID, campaignID, r, "queued", now)
	}

	s.q.Enqueue(queue.Job{
		ID:         uuid.NewString(),
		Kind:       queue.JobSendSMS,
		CampaignID: campaignID,
		Payload: map[string]string{
			"user_id": in.UserID,
			"message": in.Message,
		},
	})

	note := ""
	if !s.provider.Configured() {
		note = "ارسال واقعی فراز تا تنظیم Api-Key به صورت شبیه‌سازی انجام می‌شود"
	}

	s.log.OK("sms", "کمپین در صف قرار گرفت")
	return &SendResult{
		CampaignID: campaignID, Recipients: len(recipients), Parts: parts,
		CostRial: cost, Status: "queued", ProviderNote: note,
	}, nil
}

func (s *Service) handleJob(ctx context.Context, job queue.Job) error {
	if job.Kind != queue.JobSendSMS {
		return nil
	}
	s.log.Step("sms.worker", "پردازش کمپین "+job.CampaignID)

	rows, err := s.db.QueryContext(ctx,
		`SELECT id, recipient FROM message_logs WHERE campaign_id = ? AND status = 'queued'`, job.CampaignID)
	if err != nil {
		return err
	}
	defer rows.Close()

	message := job.Payload["message"]
	userID := job.Payload["user_id"]

	type item struct{ id, recipient string }
	var items []item
	for rows.Next() {
		var it item
		if err := rows.Scan(&it.id, &it.recipient); err != nil {
			return err
		}
		items = append(items, it)
	}

	for _, it := range items {
		_, _ = s.db.ExecContext(ctx, `UPDATE message_logs SET status = 'sending' WHERE id = ?`, it.id)
		res, err := s.provider.Send(ctx, providers.SendRequest{
			Recipient: it.recipient,
			Message:   message,
		})
		now := time.Now().UTC().Format(time.RFC3339)
		if err != nil {
			s.log.Error("sms.worker", "ارسال به "+it.recipient+" ناموفق", err)
			_, _ = s.db.ExecContext(ctx,
				`UPDATE message_logs SET status = 'failed', error_text = ?, created_at = ? WHERE id = ?`,
				err.Error(), now, it.id)
			// refund one message part cost — simplified per recipient
			parts := smsutil.CountParts(message)
			refund := int64(s.pricing.PricePerPart() * parts)
			_ = s.wallet.Refund(ctx, userID, refund, "message", it.id, "بازگشت وجه پیام ناموفق")
			continue
		}
		st := "sent"
		if res.Skipped {
			st = "sent_stub"
		}
		_, _ = s.db.ExecContext(ctx,
			`UPDATE message_logs SET status = ?, provider_ref = ? WHERE id = ?`,
			st, res.ProviderRef, it.id)
	}

	_, _ = s.db.ExecContext(ctx, `UPDATE campaigns SET status = 'completed' WHERE id = ?`, job.CampaignID)
	s.log.OK("sms.worker", "کمپین تکمیل شد")
	return nil
}

func normalizeRecipients(in []string) []string {
	seen := map[string]struct{}{}
	var out []string
	for _, raw := range in {
		for _, part := range strings.FieldsFunc(raw, func(r rune) bool {
			return r == ',' || r == ';' || r == '\n' || r == ' '
		}) {
			p := strings.TrimSpace(part)
			if p == "" {
				continue
			}
			if _, ok := seen[p]; ok {
				continue
			}
			seen[p] = struct{}{}
			out = append(out, p)
		}
	}
	return out
}

type badInputError string

func (e badInputError) Error() string { return string(e) }
func errBadInput(msg string) error    { return badInputError(msg) }

func IsBadInput(err error) bool {
	_, ok := err.(badInputError)
	return ok
}
