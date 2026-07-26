import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authHeaders, useAuth } from "../auth/AuthContext";
import { useTrace } from "../trace/TraceContext";

export function DashboardPage() {
  const { token } = useAuth();
  const { logClient } = useTrace();
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    logClient("step", "dashboard", "بارگذاری وضعیت سیستم");
    Promise.all([
      fetch("/api/v1/health").then((r) => r.json()),
      fetch("/api/v1/wallet", { headers: authHeaders(token) }).then((r) => r.json()),
    ])
      .then(([h, w]) => {
        setHealth(h);
        setBalance(w.balance_rial ?? 0);
        logClient("ok", "dashboard", "داشبورد آماده");
      })
      .catch((e) => logClient("error", "dashboard", "خطا در بارگذاری", undefined, String(e)));
  }, [token, logClient]);

  return (
    <>
      <h1>داشبورد</h1>
      <div className="row" style={{ alignItems: "stretch", flexWrap: "wrap" }}>
        <div className="card" style={{ flex: 1, minWidth: 200 }}>
          <div className="muted">موجودی کیف پول</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {balance != null ? balance.toLocaleString("fa-IR") : "…"} <span className="muted">ریال</span>
          </div>
          <Link to="/wallet">شارژ کیف پول</Link>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 200 }}>
          <div className="muted">ارسال سریع</div>
          <Link to="/send" className="btn btn-primary" style={{ display: "inline-block", marginTop: 8, textDecoration: "none" }}>
            ارسال پیامک
          </Link>
        </div>
      </div>
      {health ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="muted">وضعیت یکپارچه‌سازی</div>
          <ul>
            <li>فراز: {health.faraz_configured ? "✓ تنظیم شده" : "○ موقت — بدون Api-Key"}</li>
            <li>زرین‌پال: {health.zarinpal_configured ? "✓ تنظیم شده" : "○ موقت — درگاه غیرفعال"}</li>
          </ul>
        </div>
      ) : null}
    </>
  );
}
