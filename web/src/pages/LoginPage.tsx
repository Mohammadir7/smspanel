import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { DevLogWindow } from "../components/DevLogWindow";

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [phone, setPhone] = useState("09120000002");
  const [password, setPassword] = useState("user123");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await login(phone, password);
      nav("/");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "خطا");
    }
  }

  return (
    <div className="app-shell">
      <main className="main" style={{ maxWidth: 420, margin: "80px auto" }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>ورود به پنل</h1>
          <p className="muted">کاربر demo: 09120000002 / user123</p>
          <form onSubmit={onSubmit}>
            <label className="label">شماره موبایل</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <label className="label" style={{ marginTop: 12 }}>
              رمز عبور
            </label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {err ? <p style={{ color: "var(--error)" }}>{err}</p> : null}
            <button type="submit" className="btn btn-primary" style={{ marginTop: 16, width: "100%" }}>
              ورود
            </button>
          </form>
        </div>
      </main>
      <DevLogWindow />
    </div>
  );
}
