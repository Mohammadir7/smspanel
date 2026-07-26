package storage

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

func OpenSQLite(path string) (*sql.DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("mkdir data: %w", err)
	}
	db, err := sql.Open("sqlite", path+"?_pragma=foreign_keys(1)")
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	return db, nil
}

func Migrate(db *sql.DB) error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			phone TEXT NOT NULL UNIQUE,
			name TEXT NOT NULL DEFAULT '',
			role TEXT NOT NULL DEFAULT 'user',
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS wallets (
			user_id TEXT PRIMARY KEY REFERENCES users(id),
			balance_rial INTEGER NOT NULL DEFAULT 0,
			updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS wallet_transactions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id),
			amount_rial INTEGER NOT NULL,
			kind TEXT NOT NULL,
			ref_type TEXT NOT NULL DEFAULT '',
			ref_id TEXT NOT NULL DEFAULT '',
			note TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS campaigns (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id),
			message TEXT NOT NULL,
			recipient_count INTEGER NOT NULL,
			parts_per_message INTEGER NOT NULL,
			cost_rial INTEGER NOT NULL,
			status TEXT NOT NULL,
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS message_logs (
			id TEXT PRIMARY KEY,
			campaign_id TEXT NOT NULL REFERENCES campaigns(id),
			recipient TEXT NOT NULL,
			status TEXT NOT NULL,
			provider_ref TEXT NOT NULL DEFAULT '',
			error_text TEXT NOT NULL DEFAULT '',
			created_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS branding (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			brand_name TEXT NOT NULL DEFAULT 'پنل پیامک',
			logo_url TEXT NOT NULL DEFAULT '',
			primary_color TEXT NOT NULL DEFAULT '#6366f1',
			developer_name TEXT NOT NULL DEFAULT '',
			developer_contact TEXT NOT NULL DEFAULT '',
			support_url TEXT NOT NULL DEFAULT ''
		)`,
		`INSERT OR IGNORE INTO branding (id) VALUES (1)`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			return fmt.Errorf("migrate: %w", err)
		}
	}
	return nil
}
