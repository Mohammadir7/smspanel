import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { DevLogWindow } from "./DevLogWindow";
import { useEffect, useState } from "react";

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [branding, setBranding] = useState({
    brand_name: "پنل پیامک",
    developer_name: "",
    developer_contact: "",
    support_url: "",
  });

  useEffect(() => {
    fetch("/api/v1/branding")
      .then((r) => r.json())
      .then(setBranding)
      .catch(() => {});
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <header className="row card" style={{ margin: 0, borderRadius: 0, borderInline: "none", borderTop: "none" }}>
        <strong style={{ fontSize: "1.1rem" }}>{branding.brand_name}</strong>
        <span className="muted">{user.name}</span>
        <div style={{ marginRight: "auto" }} className="row">
          <button type="button" className="btn btn-ghost" onClick={toggle}>
            تم {theme === "dark" ? "روشن" : "تاریک"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            خروج
          </button>
        </div>
      </header>
      <div className="app-body">
        <aside className="sidebar">
          <NavLink className="nav-link" to="/" end>
            داشبورد
          </NavLink>
          <NavLink className="nav-link" to="/send">
            ارسال پیامک
          </NavLink>
          <NavLink className="nav-link" to="/wallet">
            کیف پول
          </NavLink>
          <NavLink className="nav-link" to="/reports">
            گزارش‌ها
          </NavLink>
          <NavLink className="nav-link" to="/contacts">
            مخاطبین
          </NavLink>
          {user.role === "admin" ? (
            <NavLink className="nav-link" to="/admin">
              مرکز کنترل
            </NavLink>
          ) : null}
        </aside>
        <main className="main">
          <Outlet />
        </main>
      </div>
      <footer className="footer-dev">
        {branding.developer_name ? (
          <>
            توسعه: {branding.developer_name}
            {branding.developer_contact ? ` · ${branding.developer_contact}` : ""}
            {branding.support_url ? (
              <>
                {" · "}
                <a href={branding.support_url} target="_blank" rel="noreferrer">
                  پشتیبانی
                </a>
              </>
            ) : null}
          </>
        ) : (
          <span className="muted">بخش توسعه‌دهنده — از پنل ادمین قابل تنظیم است</span>
        )}
      </footer>
      <DevLogWindow />
    </div>
  );
}
