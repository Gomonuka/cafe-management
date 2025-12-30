import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMe } from "../auth/useMe";

export default function RequireCompany() {
  const { user, loading } = useMe();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  // на всякий: если кто-то сюда попал без логина
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  // только company_admin обязан иметь company
  if (user.role === "company_admin" && !user.company) {
    // чтобы не было редирект-лупа
    if (loc.pathname !== "/app/create-company") {
      return <Navigate to="/app/create-company" replace />;
    }
  }

  return <Outlet />;
}
