package models

import "time"

type WalletTransaction struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Amount    int64     `json:"amount"`
	Type      string    `json:"type"` // charge, debit
	Reason    string    `json:"reason"`
	CreatedAt time.Time `json:"created_at"`
}

type ChargeWalletRequest struct {
	Amount int64  `json:"amount"`
	Method string `json:"method"` // zarinpal, etc
}

type ChargeWalletResponse struct {
	TransactionID string `json:"transaction_id"`
	RedirectURL   string `json:"redirect_url,omitempty"`
}
