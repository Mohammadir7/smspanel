import { useEffect, useState } from "react";
import { authHeaders, useAuth } from "../auth/AuthContext";
import { useTrace } from "../trace/TraceContext";

export function WalletPage() {
  const { token } = useAuth();
  const { logClient } = useTrace();
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<Record<string, unknown>[]>([]);
  const [amount, setAmount] = useState("100000");
  const [msg, setMsg] = useState("");

  function reload() {
    fetch("/api/v1/wallet", { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((w) => setBalance(w.balance_rial ?? 0));
    fetch("/api/v1/wallet/transactions", { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => setTx(d.transactions ?? []));
  }

  useEffect(() => {
    logClient("step", "wallet.ui", "بارگذاری کیف پول");
    reload();
  }, [token, logClient]);

  async function manualTopup() {
    logClient("step", "wallet.ui", "درخواست شارژ دستی");
    const res = await fetch("/api/v1/wallet/manual-topup-request", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ amount_rial: Number(amount) }),
    });
    const data = await res.json();
    setMsg(data.message ?? data.status);
    logClient("ok", "wallet.ui", "درخواست دستی ثبت شد");
  }

  async function onlineTopup() {
    logClient("step", "wallet.ui", "تلاش شارژ آنلاین");
    const res = await fetch("/api/v1/wallet/online-topup", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ amount_rial: Number(amount) }),
    });
    const data = await res.json();
    if (!res.ok) {
      logClient("warn", "wallet.ui", "درگاه فعال نیست", data.detail ?? data.error);
      setMsg(`${data.error} — ${data.fallback ?? ""}`);
      return;
    }
    window.location.href = data.payment_url;
  }

  return (
    <>
      <h1>کیف پول</h1>
      <div className="card" style={{ maxWidth: 520 }}>
        <div className="muted">موجودی</div>
        <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{balance.toLocaleString("fa-IR")} ریال</div>
        <label className="label" style={{ marginTop: 16 }}>
          مبلغ شارژ (ریال)
        </label>
        <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-primary" onClick={onlineTopup}>
            پرداخت آنلاین
          </button>
          <button type="button" className="btn btn-ghost" onClick={manualTopup}>
            درخواست شارژ دستی
          </button>
        </div>
        {msg ? <p className="muted">{msg}</p> : null}
      </div>
      <div className="card" style={{ marginTop: 16, maxWidth: 720 }}>
        <h3 style={{ marginTop: 0 }}>تراکنش‌ها</h3>
        {tx.length === 0 ? (
          <p className="muted">تراکنشی نیست</p>
        ) : (
          <ul>
            {tx.map((t) => (
              <li key={String(t.id)}>
                {Number(t.amount_rial).toLocaleString("fa-IR")} ریال — {String(t.kind)} — {String(t.note)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
