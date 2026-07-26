package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	HTTPAddr string
	Env      string

	JWTSecret string

	// Faraz / IranPayamak — empty = bypass (stub send)
	FarazAPIKey     string
	FarazLineNumber string
	FarazBaseURL    string

	// Redis — empty = in-memory queue
	RedisURL string

	// Payment gateways — empty = skip online payment
	ZarinpalMerchantID string
	ZarinpalSandbox    bool

	DBPath string
}

func Load() Config {
	return Config{
		HTTPAddr: getenv("HTTP_ADDR", ":8080"),
		Env:      getenv("APP_ENV", "development"),

		JWTSecret: getenv("JWT_SECRET", "dev-change-me-in-production"),

		FarazAPIKey:     os.Getenv("FARAZ_API_KEY"),
		FarazLineNumber: getenv("FARAZ_LINE_NUMBER", ""),
		FarazBaseURL:    getenv("FARAZ_BASE_URL", "https://api.iranpayamak.com/ws/v1"),

		RedisURL: os.Getenv("REDIS_URL"),

		ZarinpalMerchantID: os.Getenv("ZARINPAL_MERCHANT_ID"),
		ZarinpalSandbox:    getenvBool("ZARINPAL_SANDBOX", true),

		DBPath: getenv("DB_PATH", "./data/sms-panel.db"),
	}
}

func (c Config) FarazConfigured() bool {
	return strings.TrimSpace(c.FarazAPIKey) != ""
}

func (c Config) ZarinpalConfigured() bool {
	return strings.TrimSpace(c.ZarinpalMerchantID) != ""
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func getenvBool(k string, def bool) bool {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return def
	}
	return b
}
