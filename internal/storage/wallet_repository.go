package storage

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/island/sms-panel/internal/models"
)

type WalletRepository struct {
	db *DB
}

func NewWalletRepository(database *DB) *WalletRepository {
	return &WalletRepository{db: database}
}

// CreateTransaction creates a wallet transaction
func (r *WalletRepository) CreateTransaction(ctx context.Context, userID string, amount int64, txType, reason string) (*models.WalletTransaction, error) {
	id := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO wallet_transactions (id, user_id, amount, type, reason, status, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.conn.ExecContext(ctx, query,
		id, userID, amount, txType, reason, "completed", now,
	)
	if err != nil {
		return nil, err
	}

	return &models.WalletTransaction{
		ID:        id,
		UserID:    userID,
		Amount:    amount,
		Type:      txType,
		Reason:    reason,
		CreatedAt: now,
	}, nil
}

// GetUserBalance retrieves user wallet balance
func (r *WalletRepository) GetUserBalance(ctx context.Context, userID string) (int64, error) {
	query := `
		SELECT balance FROM users WHERE id = ?
	`

	var balance int64
	err := r.db.conn.QueryRowContext(ctx, query, userID).Scan(&balance)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, nil
		}
		return 0, err
	}

	return balance, nil
}

// GetTransactionHistory retrieves transaction history
func (r *WalletRepository) GetTransactionHistory(ctx context.Context, userID string, limit, offset int) ([]models.WalletTransaction, error) {
	query := `
		SELECT id, user_id, amount, type, reason, created_at
		FROM wallet_transactions
		WHERE user_id = ?
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.conn.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []models.WalletTransaction
	for rows.Next() {
		var tx models.WalletTransaction
		err := rows.Scan(
			&tx.ID,
			&tx.UserID,
			&tx.Amount,
			&tx.Type,
			&tx.Reason,
			&tx.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, tx)
	}

	return transactions, rows.Err()
}
