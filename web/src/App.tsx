import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SendSmsPage } from "./pages/SendSmsPage";
import { WalletPage } from "./pages/WalletPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="send" element={<SendSmsPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="reports" element={<PlaceholderPage title="گزارش‌ها" note="فاز بعد — گزارش کمپین‌ها" />} />
        <Route path="contacts" element={<PlaceholderPage title="مخاطبین" note="فاز بعد — دفترچه تلفن" />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}
