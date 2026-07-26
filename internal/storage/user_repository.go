package storage

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/island/sms-panel/internal/models"
)

type UserRepository struct {
	db *DB
}

func NewUserRepository(database *DB) *UserRepository {
	return &UserRepository{db: database}
}

// CreateUser creates a new user
func (r *UserRepository) CreateUser(ctx context.Context, phoneNumber, email, passwordHash, role string) (*models.User, error) {
	id := uuid.New().String()
	now := time.Now()

	query := `
		INSERT INTO users (id, phone_number, email, password_hash, role, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	_, err := r.db.conn.ExecContext(ctx, query,
		id, phoneNumber, email, passwordHash, role, now, now,
	)
	if err != nil {
		return nil, err
	}

	return &models.User{
		ID:          id,
		PhoneNumber: phoneNumber,
		Email:       email,
		Role:        role,
		Balance:     0,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// GetUserByPhoneNumber retrieves user by phone number
func (r *UserRepository) GetUserByPhoneNumber(ctx context.Context, phoneNumber string) (*models.User, error) {
	query := `
		SELECT id, phone_number, email, role, balance, created_at, updated_at
		FROM users
		WHERE phone_number = ? AND status = 'active'
	`

	var user models.User
	err := r.db.conn.QueryRowContext(ctx, query, phoneNumber).Scan(
		&user.ID,
		&user.PhoneNumber,
		&user.Email,
		&user.Role,
		&user.Balance,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &user, nil
}

// GetUserByID retrieves user by ID
func (r *UserRepository) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	query := `
		SELECT id, phone_number, email, role, balance, created_at, updated_at
		FROM users
		WHERE id = ? AND status = 'active'
	`

	var user models.User
	err := r.db.conn.QueryRowContext(ctx, query, userID).Scan(
		&user.ID,
		&user.PhoneNumber,
		&user.Email,
		&user.Role,
		&user.Balance,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &user, nil
}

// UpdateUserBalance updates user balance
func (r *UserRepository) UpdateUserBalance(ctx context.Context, userID string, amount int64) error {
	query := `
		UPDATE users
		SET balance = balance + ?, updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.conn.ExecContext(ctx, query, amount, time.Now(), userID)
	return err
}

// GetPasswordHash retrieves password hash for authentication
func (r *UserRepository) GetPasswordHash(ctx context.Context, phoneNumber string) (string, error) {
	query := `
		SELECT password_hash FROM users
		WHERE phone_number = ? AND status = 'active'
	`

	var hash string
	err := r.db.conn.QueryRowContext(ctx, query, phoneNumber).Scan(&hash)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", errors.New("user not found")
		}
		return "", err
	}

	return hash, nil
}
