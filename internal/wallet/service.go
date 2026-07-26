package wallet

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/island/sms-panel/internal/trace"
)

var ErrInsufficientBalance = errors.New("insufficient balance")

type Service struct {
	db  *sql.DB
	log *trace.Hub
}

func NewService(db *sql.DB, log *trace.Hub) *Service {
	return &Service{db: db, log: log}
}

func (s *Service) Balance(ctx context.Context, userID string) (int64, error) {
	var bal int64
	err := s.db.QueryRowContext(ctx, `SELECT balance_rial FROM wallets WHERE user_id = ?`, userID).Scan(&bal)
	return bal, err
}

func (s *Service) Charge(ctx context.Context, userID string, amount int64, kind, note string) error {
	if amount <= 0 {
		return fmt.Errorf("amount must be positive")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	now := time.Now().UTC().Format(time.RFC3339)
	if _, err := tx.ExecContext(ctx,
		`UPDATE wallets SET balance_rial = balance_rial + ?, updated_at = ? WHERE user_id = ?`,
		amount, now, userID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO wallet_transactions (id, user_id, amount_rial, kind, note, created_at) VALUES (?,?,?,?,?,?)`,
		uuid.NewString(), userID, amount, kind, note, now); err != nil {
		return err
	}
	s.log.OK("wallet", fmt.Sprintf("شارژ %d ریال ثبت شد", amount))
	return tx.Commit()
}

func (s *Service) Debit(ctx context.Context, userID string, amount int64, refType, refID, note string) error {
	if amount <= 0 {
		return fmt.Errorf("amount must be positive")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var bal int64
	if err := tx.QueryRowContext(ctx, `SELECT balance_rial FROM wallets WHERE user_id = ?`, userID).Scan(&bal); err != nil {
		return err
	}
	if bal < amount {
		s.log.Warn("wallet", "موجودی کافی نیست", fmt.Sprintf("نیاز: %d — موجود: %d", amount, bal))
		return ErrInsufficientBalance
	}
	now := time.Now().UTC().Format(time.RFC3339)
	if _, err := tx.ExecContext(ctx,
		`UPDATE wallets SET balance_rial = balance_rial - ?, updated_at = ? WHERE user_id = ?`,
		amount, now, userID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO wallet_transactions (id, user_id, amount_rial, kind, ref_type, ref_id, note, created_at) VALUES (?,?,?,?,?,?,?,?)`,
		uuid.NewString(), userID, -amount, "debit", refType, refID, note, now); err != nil {
		return err
	}
	return tx.Commit()
}

func (s *Service) Refund(ctx context.Context, userID string, amount int64, refType, refID, note string) error {
	return s.Charge(ctx, userID, amount, "refund", note)
}

func (s *Service) ListTransactions(ctx context.Context, userID string, limit int) ([]map[string]any, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, amount_rial, kind, ref_type, ref_id, note, created_at FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
		userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id, kind, refType, refID, note, created string
		var amount int64
		if err := rows.Scan(&id, &amount, &kind, &refType, &refID, &note, &created); err != nil {
			return nil, err
		}
		out = append(out, map[string]any{
			"id": id, "amount_rial": amount, "kind": kind,
			"ref_type": refType, "ref_id": refID, "note": note, "created_at": created,
		})
	}
	return out, rows.Err()
}
