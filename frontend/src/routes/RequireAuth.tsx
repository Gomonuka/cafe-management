// RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMe } from "../auth/useMe";

export default function RequireAuth() {
  const { user, loading } = useMe();
  const loc = useLocation();

  if (loading)
    return (
      <div className="loading-wrap">
        <div className="spinner" aria-label="Ielāde">
          <div className="spinner-inner" />
        </div>
        <div className="spinner-text">Ielāde...</div>
      </div>
    );

  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  return <Outlet />;
}
