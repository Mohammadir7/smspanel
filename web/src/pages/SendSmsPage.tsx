import { useEffect, useMemo, useState } from "react";
import { authHeaders, useAuth } from "../auth/AuthContext";
import { useTrace } from "../trace/TraceContext";

function countRecipients(raw: string) {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

export function SendSmsPage() {
  const { token } = useAuth();
  const { logClient } = useTrace();
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [estimate, setEstimate] = useState<Record<string, number> | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>("");

  const recipientCount = useMemo(() => countRecipients(recipients), [recipients]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!message && !recipients) {
        setEstimate(null);
        return;
      }
      fetch("/api/v1/sms/estimate", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ message, recipients }),
      })
        .then((r) => r.json())
        .then(setEstimate)
        .catch(() => setEstimate(null));
    }, 300);
    return () => clearTimeout(t);
  }, [message, recipients, token]);

  async function send() {
    setSending(true);
    setResult("");
    logClient("step", "sms.ui", "ارسال درخواست به سرور");
    try {
      const res = await fetch("/api/v1/sms/send", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ message, recipients }),
      });
      const data = await res.json();
      if (!res.ok) {
        logClient("error", "sms.ui", "ارسال رد شد", data.error, data.error);
        setResult(data.error ?? "خطا");
        return;
      }
      logClient("ok", "sms.ui", `کمپین ${data.campaign_id} در صف قرار گرفت`);
      setResult(
        `ثبت شد — ${data.recipients} گیرنده، هزینه ${Number(data.cost_rial).toLocaleString("fa-IR")} ریال` +
          (data.provider_note ? ` · ${data.provider_note}` : "")
      );
    } catch (e) {
      logClient("error", "sms.ui", "خطای شبکه", undefined, String(e));
      setResult("خطای ارتباط با سرور");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <h1>ارسال پیامک</h1>
      <p className="muted">متن آزاد — هزینه قبل از ارسال نمایش داده می‌شود.</p>
      <div className="card" style={{ maxWidth: 720 }}>
        <label className="label">گیرندگان (هر خط یا با کاما)</label>
        <textarea
          className="textarea"
          placeholder="09121234567&#10;09131112222"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
        />
        <label className="label" style={{ marginTop: 12 }}>
          متن پیام
        </label>
        <textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="row" style={{ marginTop: 16, justifyContent: "space-between" }}>
          <div className="muted">
            {recipientCount} گیرنده
            {estimate ? (
              <>
                {" · "}
                {estimate.parts_per_message} پارت ·{" "}
                <strong>{Number(estimate.cost_rial).toLocaleString("fa-IR")} ریال</strong>
              </>
            ) : null}
          </div>
          <button type="button" className="btn btn-primary" disabled={sending} onClick={send}>
            {sending ? "در حال ثبت…" : "ارسال"}
          </button>
        </div>
        {result ? <p style={{ marginTop: 12 }}>{result}</p> : null}
      </div>
    </>
  );
}
