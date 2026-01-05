//  frontend/src/layouts/AppLayout.tsx
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import type { Role } from "../components/sidebar/sidebar.config";
import { logout as apiLogout, getMe } from "../auth/auth.api";
import "../styles/layout.css";

export default function AppLayout({ children }: { children?: ReactNode }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("client");
  const [fullName, setFullName] = useState<string>("Lietotajs");
  const [requiresProfile, setRequiresProfile] = useState(false);
  const [requiresCompany, setRequiresCompany] = useState(false);

  useEffect(() => {
    let mounted = true;
    getMe().then((res) => {
      if (!mounted || !res.ok) return;
      setRole(res.data.role as Role);
      setFullName([res.data.first_name, res.data.last_name].filter(Boolean).join(" ") || res.data.username);
      setRequiresProfile(Boolean(res.data.requires_profile_completion));
      setRequiresCompany(Boolean(res.data.requires_company_creation));
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const shouldForceProfile = requiresProfile && role !== "employee";
    const shouldForceCompany = requiresCompany && role === "company_admin";

    if (shouldForceProfile && loc.pathname !== "/app/profile") {
      nav("/app/profile", { replace: true });
    } else if (
      shouldForceCompany &&
      !loc.pathname.startsWith("/app/create-company") &&
      !loc.pathname.startsWith("/app/profile")
    ) {
      nav("/app/create-company", { replace: true });
    }
  }, [requiresProfile, requiresCompany, role, loc.pathname, nav]);

  const logout = async () => {
    await apiLogout();
    nav("/", { replace: true });
  };

  return (
    <div className="app">
      <div className="sidebar-desktop">
        <Sidebar role={role} fullName={fullName} onLogout={logout} />
      </div>

      {open ? (
        <div className="drawer-backdrop" onMouseDown={() => setOpen(false)}>
          <div className="drawer" onMouseDown={(e) => e.stopPropagation()}>
            <Sidebar role={role} fullName={fullName} onLogout={logout} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="app-main">
        <div className="topbar">
          <button className="burger" type="button" onClick={() => setOpen(true)} aria-label="Menu">
            ☰
          </button>
        </div>

        <div className="page">{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}
