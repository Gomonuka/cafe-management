import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMe } from "../auth/useMe";

export default function RequireAuth() {
  const { user, loading } = useMe();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  return <Outlet />;
}
