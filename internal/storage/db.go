package storage

import (
	"database/sql"
	"fmt"
	"sync"

	_ "modernc.org/sqlite"
)

type DB struct {
	conn *sql.DB
	mu   sync.RWMutex
}

var (
	db *DB
	mu sync.Once
)

// Init initializes the database connection
func Init(dbPath string) (*DB, error) {
	var err error
	mu.Do(func() {
		conn, e := sql.Open("sqlite", dbPath)
		if e != nil {
			err = e
			return
		}

		if e := conn.Ping(); e != nil {
			err = e
			return
		}

		db = &DB{conn: conn}
	})
	return db, err
}

// GetDB returns the singleton database instance
func GetDB() *DB {
	return db
}

// Close closes the database connection
func (d *DB) Close() error {
	if d.conn != nil {
		return d.conn.Close()
	}
	return nil
}

// Migrate runs all migrations
func (d *DB) Migrate() error {
	migrations := []string{
		createUsersTable,
		createSMSTable,
		createWalletTable,
		createWalletTransactionsTable,
	}

	for _, migration := range migrations {
		if _, err := d.conn.Exec(migration); err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}
	}

	return nil
}

const (
	createUsersTable = `
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			phone_number TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE,
			password_hash TEXT NOT NULL,
			role TEXT DEFAULT 'user',
			balance INTEGER DEFAULT 0,
			status TEXT DEFAULT 'active',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`

	createSMSTable = `
		CREATE TABLE IF NOT EXISTS sms (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			phone_number TEXT NOT NULL,
			message TEXT NOT NULL,
			status TEXT DEFAULT 'pending',
			cost INTEGER DEFAULT 0,
			provider TEXT DEFAULT 'faraz',
			provider_id TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			sent_at DATETIME,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)
	`

	createWalletTable = `
		CREATE TABLE IF NOT EXISTS wallets (
			id TEXT PRIMARY KEY,
			user_id TEXT UNIQUE NOT NULL,
			balance INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)
	`

	createWalletTransactionsTable = `
		CREATE TABLE IF NOT EXISTS wallet_transactions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			amount INTEGER NOT NULL,
			type TEXT NOT NULL,
			reason TEXT,
			ref_id TEXT,
			status TEXT DEFAULT 'completed',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		)
	`
)
