package models

import "time"

type SMS struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	PhoneNumber string    `json:"phone_number"`
	Message     string    `json:"message"`
	Status      string    `json:"status"` // pending, sent, failed
	Cost        int64     `json:"cost"`
	Provider    string    `json:"provider"` // faraz, etc
	CreatedAt   time.Time `json:"created_at"`
	SentAt      *time.Time `json:"sent_at,omitempty"`
}

type SendSMSRequest struct {
	PhoneNumbers []string `json:"phone_numbers"`
	Message      string   `json:"message"`
}

type SendSMSResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}
