package billing

import (
	"context"
	"errors"
)

// PricingRules defines SMS pricing
var PricingRules = map[string]int64{
	"domestic": 500,   // 500 ریال per SMS
	"international": 1000,
}

type BillingService struct{}

// NewBillingService creates a new billing service
func NewBillingService() *BillingService {
	return &BillingService{}
}

// CalculateCost calculates SMS cost based on number type
func (b *BillingService) CalculateCost(phoneNumber string) int64 {
	// Simple logic: if starts with 0981-0989, it's domestic
	if len(phoneNumber) > 3 && (phoneNumber[:3] == "098" || phoneNumber[:4] == "+989") {
		return PricingRules["domestic"]
	}
	return PricingRules["international"]
}

// ValidateSufficientBalance checks if user has enough balance
func (b *BillingService) ValidateSufficientBalance(userBalance, cost int64) error {
	if userBalance < cost {
		return errors.New("insufficient balance")
	}
	return nil
}

// DebitWallet debits amount from wallet
func (b *BillingService) DebitWallet(currentBalance, amount int64) int64 {
	return currentBalance - amount
}
