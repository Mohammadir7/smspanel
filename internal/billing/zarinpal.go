package billing

import (
	"context"
	"errors"

	"github.com/island/sms-panel/internal/config"
	"github.com/island/sms-panel/internal/trace"
)

var ErrGatewayNotConfigured = errors.New("payment gateway not configured")

type Gateway interface {
	Name() string
	Configured() bool
	CreatePayment(ctx context.Context, amountRial int64, callbackURL, description string) (paymentURL string, authority string, err error)
	VerifyCallback(ctx context.Context, authority string, amountRial int64) (ok bool, refID string, err error)
	Reconcile(ctx context.Context, from, to string) (matched, fixed int, err error)
}

type ZarinpalGateway struct {
	cfg config.Config
	log *trace.Hub
}

func NewZarinpal(cfg config.Config, log *trace.Hub) *ZarinpalGateway {
	return &ZarinpalGateway{cfg: cfg, log: log}
}

func (g *ZarinpalGateway) Name() string { return "zarinpal" }

func (g *ZarinpalGateway) Configured() bool { return g.cfg.ZarinpalConfigured() }

func (g *ZarinpalGateway) CreatePayment(ctx context.Context, amountRial int64, callbackURL, description string) (string, string, error) {
	if !g.Configured() {
		g.log.Warn("billing.zarinpal", "درگاه زرین‌پال موقتاً رد شد", "ZARINPAL_MERCHANT_ID تنظیم نشده")
		return "", "", ErrGatewayNotConfigured
	}
	_ = ctx
	_ = callbackURL
	_ = description
	g.log.Step("billing.zarinpal", "ایجاد پرداخت (پیاده‌سازی کامل پس از دریافت merchant)")
	return "", "", errors.New("zarinpal integration pending merchant id")
}

func (g *ZarinpalGateway) VerifyCallback(ctx context.Context, authority string, amountRial int64) (bool, string, error) {
	if !g.Configured() {
		return false, "", ErrGatewayNotConfigured
	}
	_ = ctx
	_ = authority
	_ = amountRial
	return false, "", errors.New("pending")
}

func (g *ZarinpalGateway) Reconcile(ctx context.Context, from, to string) (int, int, error) {
	if !g.Configured() {
		g.log.Info("billing.zarinpal", "مغایرت‌گیری رد شد — درگاه تنظیم نشده")
		return 0, 0, nil
	}
	_ = ctx
	_ = from
	_ = to
	g.log.Step("billing.zarinpal", "مغایرت‌گیری (placeholder)")
	return 0, 0, nil
}
