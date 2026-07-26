import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AdminPage() {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;

  return (
    <>
      <h1>مرکز کنترل</h1>
      <div className="card">
        <p className="muted">اسکلت ادمین — فاز بعد: branding، pricing، کاربران، provider، سود.</p>
        <ul>
          <li>Branding (نام، لوگو، رنگ، footer توسعه‌دهنده)</li>
          <li>قیمت‌گذاری و tier</li>
          <li>تأیید شارژ دستی</li>
          <li>Api-Key فراز و خط — فعلاً از env</li>
        </ul>
      </div>
    </>
  );
}
