package config

import (
	"fmt"
	"os"
)

type Config struct {
	HTTPAddr           string
	JWTSecret          string
	DBPath             string
	FarazAPIKey        string
	FarazLineNumber    string
	ZarinpalMerchantID string
}

// Load loads configuration from environment
func Load() *Config {
	return &Config{
		HTTPAddr:           getEnv("HTTP_ADDR", ":8080"),
		JWTSecret:          getEnv("JWT_SECRET", "dev-local-secret"),
		DBPath:             getEnv("DB_PATH", "./sms_panel.db"),
		FarazAPIKey:        getEnv("FARAZ_API_KEY", ""),
		FarazLineNumber:    getEnv("FARAZ_LINE_NUMBER", ""),
		ZarinpalMerchantID: getEnv("ZARINPAL_MERCHANT_ID", ""),
	}
}

func getEnv(key, defaultVal string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultVal
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.JWTSecret == "dev-local-secret" {
		fmt.Println("⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET in .env for production!")
	}
	return nil
}
