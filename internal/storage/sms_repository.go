package storage

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/island/sms-panel/internal/models"
)

type SMSRepository struct {
	db *DB
}

func NewSMSRepository(database *DB) *SMSRepository {
	return &SMSRepository{db: database}
}

// CreateSMS creates a new SMS record
func (r *SMSRepository) CreateSMS(ctx context.Context, userID, phoneNumber, message string, cost int64, provider string) (*models.SMS, error) {
	id := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO sms (id, user_id, phone_number, message, status, cost, provider, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.conn.ExecContext(ctx, query,
		id, userID, phoneNumber, message, "pending", cost, provider, now,
	)
	if err != nil {
		return nil, err
	}

	return &models.SMS{
		ID:          id,
		UserID:      userID,
		PhoneNumber: phoneNumber,
		Message:     message,
		Status:      "pending",
		Cost:        cost,
		Provider:    provider,
		CreatedAt:   now,
	}, nil
}

// GetSMSByID retrieves SMS by ID
func (r *SMSRepository) GetSMSByID(ctx context.Context, smsID string) (*models.SMS, error) {
	query := `
		SELECT id, user_id, phone_number, message, status, cost, provider, created_at, sent_at
		FROM sms
		WHERE id = ?
	`

	var sms models.SMS
	var sentAt sql.NullTime

	err := r.db.conn.QueryRowContext(ctx, query, smsID).Scan(
		&sms.ID,
		&sms.UserID,
		&sms.PhoneNumber,
		&sms.Message,
		&sms.Status,
		&sms.Cost,
		&sms.Provider,
		&sms.CreatedAt,
		&sentAt,
	)

	if err != nil {
		return nil, err
	}

	if sentAt.Valid {
		sms.SentAt = &sentAt.Time
	}

	return &sms, nil
}

// UpdateSMSStatus updates SMS status
func (r *SMSRepository) UpdateSMSStatus(ctx context.Context, smsID, status string) error {
	query := `
		UPDATE sms
		SET status = ?
		WHERE id = ?
	`

	_, err := r.db.conn.ExecContext(ctx, query, status, smsID)
	return err
}

// UpdateSMSStatusWithTime updates SMS status and sets sent time
func (r *SMSRepository) UpdateSMSStatusWithTime(ctx context.Context, smsID, status string) error {
	query := `
		UPDATE sms
		SET status = ?, sent_at = ?
		WHERE id = ?
	`

	_, err := r.db.conn.ExecContext(ctx, query, status, time.Now(), smsID)
	return err
}

// GetUserSMSHistory retrieves SMS history for a user
func (r *SMSRepository) GetUserSMSHistory(ctx context.Context, userID string, limit, offset int) ([]models.SMS, error) {
	query := `
		SELECT id, user_id, phone_number, message, status, cost, provider, created_at, sent_at
		FROM sms
		WHERE user_id = ?
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.conn.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var smsList []models.SMS
	for rows.Next() {
		var sms models.SMS
		var sentAt sql.NullTime

		err := rows.Scan(
			&sms.ID,
			&sms.UserID,
			&sms.PhoneNumber,
			&sms.Message,
			&sms.Status,
			&sms.Cost,
			&sms.Provider,
			&sms.CreatedAt,
			&sentAt,
		)
		if err != nil {
			return nil, err
		}

		if sentAt.Valid {
			sms.SentAt = &sentAt.Time
		}

		smsList = append(smsList, sms)
	}

	return smsList, rows.Err()
}
