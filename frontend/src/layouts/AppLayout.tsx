import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import type { Role } from "../components/sidebar/sidebar.config";
import { logout as apiLogout, getMe } from "../auth/auth.api";
import "../styles/layout.css";

export default function AppLayout({ children }: { children?: ReactNode }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("client");
  const [fullName, setFullName] = useState<string>("Lietotājs");

  useEffect(() => {
    let mounted = true;
    getMe().then((res) => {
      if (!mounted || !res.ok) return;
      setRole(res.data.role as Role);
      setFullName([res.data.first_name, res.data.last_name].filter(Boolean).join(" ") || res.data.username);
    });
    return () => {
      mounted = false;
    };
  }, []);

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
