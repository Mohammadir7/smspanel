package auth

import (
	"context"
	"crypto/subtle"
	"database/sql"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/island/sms-panel/internal/config"
	"github.com/island/sms-panel/internal/trace"
)

var ErrInvalidCredentials = errors.New("invalid credentials")

type Service struct {
	db  *sql.DB
	cfg config.Config
	log *trace.Hub
}

type Claims struct {
	UserID string `json:"uid"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func NewService(db *sql.DB, cfg config.Config, log *trace.Hub) *Service {
	return &Service{db: db, cfg: cfg, log: log}
}

func (s *Service) EnsureDemoUsers(ctx context.Context) error {
	s.log.Step("auth", "بررسی کاربران پیش‌فرض")
	var count int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&count); err != nil {
		return err
	}
	if count > 0 {
		s.log.Info("auth", "کاربران از قبل وجود دارند")
		return nil
	}
	adminHash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	userHash, _ := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)
	now := time.Now().UTC().Format(time.RFC3339)

	users := []struct {
		id, phone, name, role, hash string
	}{
		{uuid.NewString(), "09120000001", "مدیر پنل", "admin", string(adminHash)},
		{uuid.NewString(), "09120000002", "کاربر نمونه", "user", string(userHash)},
	}
	for _, u := range users {
		if _, err := s.db.ExecContext(ctx,
			`INSERT INTO users (id, phone, name, role, password_hash, created_at) VALUES (?,?,?,?,?,?)`,
			u.id, u.phone, u.name, u.role, u.hash, now); err != nil {
			return err
		}
		if _, err := s.db.ExecContext(ctx,
			`INSERT INTO wallets (user_id, balance_rial, updated_at) VALUES (?, ?, ?)`,
			u.id, 500000, now); err != nil {
			return err
		}
	}
	s.log.OK("auth", "کاربران demo ساخته شدند (admin/user)")
	return nil
}

func (s *Service) Login(ctx context.Context, phone, password string) (token string, user map[string]any, err error) {
	s.log.Step("auth", "ورود کاربر "+phone)
	var id, name, role, hash string
	err = s.db.QueryRowContext(ctx,
		`SELECT id, name, role, password_hash FROM users WHERE phone = ?`, phone).
		Scan(&id, &name, &role, &hash)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			s.log.Warn("auth", "ورود ناموفق", "کاربر یافت نشد")
			return "", nil, ErrInvalidCredentials
		}
		return "", nil, err
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		s.log.Warn("auth", "ورود ناموفق", "رمز اشتباه")
		return "", nil, ErrInvalidCredentials
	}
	claims := Claims{
		UserID: id,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   id,
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	token, err = t.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return "", nil, err
	}
	s.log.OK("auth", "ورود موفق")
	return token, map[string]any{"id": id, "phone": phone, "name": name, "role": role}, nil
}

func (s *Service) ParseToken(tokenStr string) (*Claims, error) {
	t, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (any, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := t.Claims.(*Claims)
	if !ok || !t.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func SecureCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}
