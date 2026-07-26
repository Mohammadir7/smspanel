package httpapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/island/sms-panel/internal/auth"
	"github.com/island/sms-panel/internal/billing"
	"github.com/island/sms-panel/internal/config"
	"github.com/island/sms-panel/internal/sms"
	"github.com/island/sms-panel/internal/trace"
	"github.com/island/sms-panel/internal/wallet"
)

type Server struct {
	cfg      config.Config
	log      *trace.Hub
	db       *sql.DB
	auth     *auth.Service
	wallet   *wallet.Service
	sms      *sms.Service
	zarinpal *billing.ZarinpalGateway
}

func New(cfg config.Config, log *trace.Hub, db *sql.DB, authSvc *auth.Service, walletSvc *wallet.Service, smsSvc *sms.Service, zp *billing.ZarinpalGateway) *Server {
	return &Server{cfg: cfg, log: log, db: db, auth: authSvc, wallet: walletSvc, sms: smsSvc, zarinpal: zp}
}

func (s *Server) Router() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(s.cors)

	log := s.log
	log.RegisterRoutes(r)

	r.Get("/api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{
			"status": "ok",
			"faraz_configured": s.cfg.FarazConfigured(),
			"zarinpal_configured": s.cfg.ZarinpalConfigured(),
		})
	})

	r.Get("/api/v1/branding", s.handleBranding)

	r.Post("/api/v1/auth/login", s.handleLogin)

	r.Group(func(pr chi.Router) {
		pr.Use(s.requireAuth)
		pr.Get("/api/v1/me", s.handleMe)
		pr.Get("/api/v1/wallet", s.handleWallet)
		pr.Get("/api/v1/wallet/transactions", s.handleWalletTx)
		pr.Post("/api/v1/wallet/manual-topup-request", s.handleManualTopup)
		pr.Post("/api/v1/wallet/online-topup", s.handleOnlineTopup)
		pr.Post("/api/v1/sms/estimate", s.handleSMSEstimate)
		pr.Post("/api/v1/sms/send", s.handleSMSSend)
	})

	r.Post("/api/v1/webhooks/payment/zarinpal", s.handleZarinpalWebhook)

	return r
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if !strings.HasPrefix(h, "Bearer ") {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "ورود لازم است"})
			return
		}
		claims, err := s.auth.ParseToken(strings.TrimPrefix(h, "Bearer "))
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "توکن نامعتبر"})
			return
		}
		ctx := context.WithValue(r.Context(), ctxUserID, claims.UserID)
		ctx = context.WithValue(ctx, ctxUserRole, claims.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

type ctxKey string

const ctxUserID ctxKey = "uid"
const ctxUserRole ctxKey = "role"

func userID(r *http.Request) string {
	v, _ := r.Context().Value(ctxUserID).(string)
	return v
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Phone    string `json:"phone"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "بدنه درخواست نامعتبر"})
		return
	}
	token, user, err := s.auth.Login(r.Context(), body.Phone, body.Password)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "شماره یا رمز اشتباه است"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"token": token, "user": user})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"id": userID(r), "role": r.Context().Value(ctxUserRole)})
}

func (s *Server) handleBranding(w http.ResponseWriter, r *http.Request) {
	var name, logo, color, devName, devContact, support string
	_ = s.db.QueryRowContext(r.Context(),
		`SELECT brand_name, logo_url, primary_color, developer_name, developer_contact, support_url FROM branding WHERE id = 1`).
		Scan(&name, &logo, &color, &devName, &devContact, &support)
	writeJSON(w, http.StatusOK, map[string]any{
		"brand_name": name, "logo_url": logo, "primary_color": color,
		"developer_name": devName, "developer_contact": devContact, "support_url": support,
	})
}

func (s *Server) handleWallet(w http.ResponseWriter, r *http.Request) {
	bal, err := s.wallet.Balance(r.Context(), userID(r))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"balance_rial": bal})
}

func (s *Server) handleWalletTx(w http.ResponseWriter, r *http.Request) {
	list, err := s.wallet.ListTransactions(r.Context(), userID(r), 50)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"transactions": list})
}

func (s *Server) handleManualTopup(w http.ResponseWriter, r *http.Request) {
	s.log.Step("wallet", "درخواست شارژ دستی ثبت شد (منتظر تأیید ادمین)")
	writeJSON(w, http.StatusAccepted, map[string]string{
		"status":  "pending_admin",
		"message": "درخواست شما ثبت شد. پس از تأیید ادمین کیف پول شارژ می‌شود.",
	})
}

func (s *Server) handleOnlineTopup(w http.ResponseWriter, r *http.Request) {
	var body struct {
		AmountRial int64 `json:"amount_rial"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.AmountRial <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "مبلغ نامعتبر"})
		return
	}
	url, _, err := s.zarinpal.CreatePayment(r.Context(), body.AmountRial, "", "شارژ کیف پول")
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"error":   "درگاه آنلاین هنوز فعال نیست",
			"detail":  err.Error(),
			"fallback": "از شارژ دستی استفاده کنید",
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"payment_url": url})
}

func (s *Server) handleZarinpalWebhook(w http.ResponseWriter, r *http.Request) {
	s.log.Info("billing", "Callback درگاه دریافت شد (placeholder)")
	writeJSON(w, http.StatusOK, map[string]string{"status": "ignored_until_configured"})
}

func (s *Server) handleSMSEstimate(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Message    string `json:"message"`
		Recipients string `json:"recipients"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "بدنه نامعتبر"})
		return
	}
	count := len(strings.FieldsFunc(body.Recipients, func(r rune) bool {
		return r == ',' || r == ';' || r == '\n'
	}))
	writeJSON(w, http.StatusOK, s.sms.Estimate(body.Message, count))
}

func (s *Server) handleSMSSend(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Message    string `json:"message"`
		Recipients string `json:"recipients"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "بدنه نامعتبر"})
		return
	}
	recipients := strings.FieldsFunc(body.Recipients, func(r rune) bool {
		return r == ',' || r == ';' || r == '\n'
	})
	res, err := s.sms.Send(r.Context(), sms.SendInput{
		UserID: userID(r), Message: body.Message, Recipients: recipients,
	})
	if err != nil {
		if sms.IsBadInput(err) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		if err == wallet.ErrInsufficientBalance {
			writeJSON(w, http.StatusPaymentRequired, map[string]string{"error": "موجودی کیف پول کافی نیست"})
			return
		}
		s.log.Error("sms", "خطا در ارسال", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (s *Server) StartReconciliation(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Minute)
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.log.Step("billing", "اجرای دوره‌ای مغایرت‌گیری")
				_, _, _ = s.zarinpal.Reconcile(ctx, "", "")
			}
		}
	}()
}
