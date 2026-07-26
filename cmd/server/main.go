package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	// Load configuration from environment
	httpAddr := getEnv("HTTP_ADDR", ":8080")
	jwtSecret := getEnv("JWT_SECRET", "dev-local-secret")

	// Initialize router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	// Routes
	r.Post("/api/v1/auth/login", handleLogin)
	r.Post("/api/v1/auth/logout", handleLogout)

	r.Get("/api/v1/users/profile", handleGetProfile)
	r.Put("/api/v1/users/profile", handleUpdateProfile)

	r.Get("/api/v1/wallet/balance", handleGetBalance)
	r.Post("/api/v1/wallet/charge", handleChargeWallet)

	r.Post("/api/v1/sms/send", handleSendSMS)
	r.Get("/api/v1/sms/status/{id}", handleGetSMSStatus)

	fmt.Printf("🚀 Server running on %s\n", httpAddr)
	fmt.Printf("🔐 JWT Secret configured: %v\n", jwtSecret != "")

	if err := http.ListenAndServe(httpAddr, r); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

// Placeholder handlers
func handleLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"todo","message":"Login handler"}`)
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"success"}`)
}

func handleGetProfile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"todo"}`)
}

func handleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"todo"}`)
}

func handleGetBalance(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"balance":0,"currency":"rial"}`)
}

func handleChargeWallet(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"todo"}`)
}

func handleSendSMS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"todo"}`)
}

func handleGetSMSStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"pending"}`)
}

// Middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Helper
func getEnv(key, defaultVal string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultVal
}
