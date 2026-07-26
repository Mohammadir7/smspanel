package faraz

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/island/sms-panel/internal/config"
	"github.com/island/sms-panel/internal/providers"
	"github.com/island/sms-panel/internal/trace"
)

type Client struct {
	cfg    config.Config
	log    *trace.Hub
	http   *http.Client
}

func New(cfg config.Config, log *trace.Hub) *Client {
	return &Client{
		cfg: cfg,
		log: log,
		http: &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) Name() string { return "faraz" }

func (c *Client) Configured() bool { return c.cfg.FarazConfigured() }

// Send free-text via peer endpoint when configured; otherwise stub skip.
func (c *Client) Send(ctx context.Context, req providers.SendRequest) (providers.SendResult, error) {
	if !c.Configured() {
		c.log.Warn("providers.faraz", "ارسال واقعی رد شد — Api-Key فراز تنظیم نشده", "حالت آزمایشی: پیام در صف شبیه‌سازی می‌شود")
		return providers.SendResult{
			Stub:       true,
			Skipped:    true,
			SkipReason: "FARAZ_API_KEY خالی است",
			ProviderRef: "stub-" + time.Now().Format("150405"),
		}, nil
	}

	line := req.LineNumber
	if line == "" {
		line = c.cfg.FarazLineNumber
	}
	if line == "" {
		c.log.Warn("providers.faraz", "خط ارسال تنظیم نشده", "FARAZ_LINE_NUMBER را در env قرار دهید")
		return providers.SendResult{}, fmt.Errorf("line_number required")
	}

	// Free-text bulk/P2P: endpoint may vary; using documented REST base + peer-style payload.
	// Adjust path when final Faraz doc for free-text is confirmed.
	url := strings.TrimSuffix(c.cfg.FarazBaseURL, "/") + "/sms/send"
	body := map[string]any{
		"recipient":     req.Recipient,
		"message":       req.Message,
		"line_number":   line,
		"number_format": defaultFormat(req.NumberFormat),
	}
	raw, _ := json.Marshal(body)

	c.log.Step("providers.faraz", "در حال ارسال به API فراز برای "+req.Recipient)

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return providers.SendResult{}, err
	}
	httpReq.Header.Set("Accept", "application/json")
	httpReq.Header.Set("Api-Key", c.cfg.FarazAPIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	res, err := c.http.Do(httpReq)
	if err != nil {
		c.log.Error("providers.faraz", "خطا در ارتباط با فراز", err)
		return providers.SendResult{}, err
	}
	defer res.Body.Close()
	respBody, _ := io.ReadAll(res.Body)

	if res.StatusCode >= 400 {
		c.log.Error("providers.faraz", fmt.Sprintf("پاسخ خطا از فراز (%d)", res.StatusCode),
			fmt.Errorf("%s", string(respBody)))
		return providers.SendResult{}, fmt.Errorf("faraz http %d: %s", res.StatusCode, string(respBody))
	}

	c.log.OK("providers.faraz", "ارسال به فراز پذیرفته شد")
	return providers.SendResult{ProviderRef: string(respBody), Stub: false}, nil
}

func defaultFormat(f string) string {
	if f == "" {
		return "english"
	}
	return f
}
