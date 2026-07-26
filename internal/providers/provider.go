package providers

import (
	"context"
	"errors"
)

var ErrNotConfigured = errors.New("provider not configured")

type SendRequest struct {
	Recipient   string
	Message     string
	LineNumber  string
	NumberFormat string // english | persian
}

type SendResult struct {
	ProviderRef string
	Stub        bool
	Skipped     bool
	SkipReason  string
}

type SMSProvider interface {
	Name() string
	Configured() bool
	Send(ctx context.Context, req SendRequest) (SendResult, error)
}
