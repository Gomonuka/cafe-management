import { Outlet } from "react-router-dom";
import { useMe } from "../auth/useMe";

export default function RequireRoles({ allowed }: { allowed: Array<string> }) {
  const { user, loading } = useMe();

  if (loading) return <div style={{ padding: 24 }}>Ielāde...</div>;
  if (!user) return null;
  if (!allowed.includes(user.role)) {
    return (
      <div style={{ padding: 24, fontWeight: 700, color: "#d9534f" }}>
        Nav piekļuves šim saturam.
      </div>
    );
  }
  return <Outlet />;
}
