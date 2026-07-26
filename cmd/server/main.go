package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/island/sms-panel/internal/auth"
	"github.com/island/sms-panel/internal/billing"
	"github.com/island/sms-panel/internal/config"
	"github.com/island/sms-panel/internal/filter"
	"github.com/island/sms-panel/internal/httpapi"
	"github.com/island/sms-panel/internal/pricing"
	"github.com/island/sms-panel/internal/providers/faraz"
	"github.com/island/sms-panel/internal/queue"
	"github.com/island/sms-panel/internal/sms"
	"github.com/island/sms-panel/internal/storage"
	"github.com/island/sms-panel/internal/trace"
	"github.com/island/sms-panel/internal/wallet"
)

func main() {
	cfg := config.Load()
	log := trace.NewHub(500)

	log.Step("boot", "راه‌اندازی سرور پنل پیامک")
	log.Info("boot", "محیط: "+cfg.Env)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	log.Step("storage", "اتصال به پایگاه داده")
	db, err := storage.OpenSQLite(cfg.DBPath)
	if err != nil {
		log.Error("storage", "خطا در باز کردن دیتابیس", err)
		os.Exit(1)
	}
	defer db.Close()
	if err := storage.Migrate(db); err != nil {
		log.Error("storage", "خطا در migration", err)
		os.Exit(1)
	}
	log.OK("storage", "دیتابیس آماده است")

	authSvc := auth.NewService(db, cfg, log)
	if err := authSvc.EnsureDemoUsers(ctx); err != nil {
		log.Error("auth", "خطا در کاربران demo", err)
		os.Exit(1)
	}

	walletSvc := wallet.NewService(db, log)
	pricingEngine := pricing.NewEngine(250)
	filterEngine := filter.NewEngine(10)
	farazClient := faraz.New(cfg, log)
	q := queue.NewMemory(log)
	q.Start(ctx)
	defer q.Stop()

	smsSvc := sms.NewService(db, log, walletSvc, filterEngine, pricingEngine, farazClient, q)
	zp := billing.NewZarinpal(cfg, log)

	if cfg.FarazConfigured() {
		log.OK("providers.faraz", "Api-Key فراز تنظیم شده — ارسال واقعی فعال")
	} else {
		log.Warn("providers.faraz", "Api-Key فراز خالی است", "ارسال در حالت شبیه‌سازی")
	}
	if cfg.ZarinpalConfigured() {
		log.OK("billing.zarinpal", "Merchant زرین‌پال تنظیم شده")
	} else {
		log.Warn("billing.zarinpal", "درگاه زرین‌پال تنظیم نشده", "فقط شارژ دستی / placeholder")
	}

	srv := httpapi.New(cfg, log, db, authSvc, walletSvc, smsSvc, zp)
	srv.StartReconciliation(ctx)

	router := srv.Router()
	httpServer := &http.Server{
		Addr:         cfg.HTTPAddr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second,
	}

	go func() {
		log.Step("http", "سرور HTTP روی "+cfg.HTTPAddr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("http", "سرور متوقف شد", err)
			cancel()
		}
	}()

	log.OK("boot", "سیستم آماده — رابط دسکتاپ را به http://localhost:5173 وصل کنید")

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	select {
	case <-sig:
		log.Info("boot", "دریافت سیگنال خاموش‌سازی")
	case <-ctx.Done():
	}

	shCtx, shCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shCancel()
	_ = httpServer.Shutdown(shCtx)
	log.OK("boot", "خاموش‌سازی تمیز انجام شد")
}
