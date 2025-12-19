import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import type { Role } from "../components/sidebar/sidebar.config";
import "../styles/layout.css";

export default function AppLayout({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const user = useMemo(
    () => ({
      role: (localStorage.getItem("role") as Role) || "client",
      fullName: localStorage.getItem("fullName") || "Tests Testiņš",
    }),
    []
  );

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    nav("/", { replace: true });
  };

  return (
    <div className="app">
      <div className="sidebar-desktop">
        <Sidebar role={user.role} fullName={user.fullName} onLogout={logout} />
      </div>

      {open ? (
        <div className="drawer-backdrop" onMouseDown={() => setOpen(false)}>
          <div className="drawer" onMouseDown={(e) => e.stopPropagation()}>
            <Sidebar
              role={user.role}
              fullName={user.fullName}
              onLogout={logout}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <main className="app-main">
        <div className="topbar">
          <button className="burger" type="button" onClick={() => setOpen(true)} aria-label="Menu">
            ☰
          </button>
        </div>

        <div className="page">{children}</div>
      </main>
    </div>
  );
}
