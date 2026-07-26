package sms

import (
	"context"
	"fmt"
)

type Provider interface {
	Send(ctx context.Context, phoneNumber, message string) (string, error)
	GetStatus(ctx context.Context, id string) (string, error)
}

type MockProvider struct{}

// Send simulates sending an SMS
func (m *MockProvider) Send(ctx context.Context, phoneNumber, message string) (string, error) {
	fmt.Printf("[MOCK SMS] To: %s, Message: %s\n", phoneNumber, message)
	return "mock-provider-id-123", nil
}

// GetStatus returns mock status
func (m *MockProvider) GetStatus(ctx context.Context, id string) (string, error) {
	return "sent", nil
}

type SMSService struct {
	provider Provider
}

// NewSMSService creates a new SMS service
func NewSMSService(provider Provider) *SMSService {
	return &SMSService{
		provider: provider,
	}
}

// SendSMS sends an SMS through the provider
func (s *SMSService) SendSMS(ctx context.Context, phoneNumber, message string) (string, error) {
	return s.provider.Send(ctx, phoneNumber, message)
}

// GetSMSStatus retrieves SMS status
func (s *SMSService) GetSMSStatus(ctx context.Context, id string) (string, error) {
	return s.provider.GetStatus(ctx, id)
}
