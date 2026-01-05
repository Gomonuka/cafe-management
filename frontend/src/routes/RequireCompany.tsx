// RequireCompany.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMe } from "../auth/useMe";

export default function RequireCompany() {
  const { user, loading } = useMe();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  // ja kāds šeit nokļuvis bez pieteikšanās
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  // tikai company_admin ir jābūt company
  if (user.role === "company_admin" && !user.company) {
    // lai nebūtu redirect loopa
    if (loc.pathname !== "/app/create-company") {
      return <Navigate to="/app/create-company" replace />;
    }
  }

  return <Outlet />;
}
