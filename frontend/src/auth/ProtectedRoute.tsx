import { Navigate } from "react-router-dom";
import type { Role } from "../types";
import { useAuth } from "./AuthContext";

function roleHome(role: Role) {
  switch (role) {
    case "client":
      return "/app/companies";
    case "employee":
      return "/app/orders";
    case "company_admin":
      return "/app/admin";
    case "system_admin":
      return "/app/profile";
  }
}

export default function ProtectedRoute({
  allowed,
  children,
}: {
  allowed?: Role[];
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; 

  if (!user) return <Navigate to="/" replace />;

  if (user.is_blocked) return <Navigate to="/blocked" replace />;

  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return <>{children}</>;
}
