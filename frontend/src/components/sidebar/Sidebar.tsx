import { NavLink } from "react-router-dom";
import { FiLogOut, FiUser } from "react-icons/fi";
import { menuByRole, roleLabel, type Role } from "./sidebar.config";
import "../../styles/layout.css";
import logo from "../../assets/crms-logo-2.png";

type Props = {
  role: Role;
  fullName: string;
  onLogout: () => void;
  onNavigate?: () => void;
};

export default function Sidebar({ role, fullName, onLogout, onNavigate }: Props) {
  const items = menuByRole[role];

  return (
    <aside className="sidebar">
      <div className="sb-top">
        <img className="sb-logo" src={logo} alt="CRMS" />
        <div className="sb-title">Kafejnīcu un restorānu vadības sistēma</div>
      </div>

      <nav className="sb-nav">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={onNavigate}
              className={({ isActive }) => `sb-link ${isActive ? "active" : ""}`}
            >
              <span className="sb-ic"><Icon /></span>
              <span>{it.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sb-bottom">
        <div className="sb-user">
          <span className="sb-user-ic"><FiUser /></span>
          <div>
            <div className="sb-role">{roleLabel[role]}</div>
            <div className="sb-name">{fullName}</div>
          </div>
        </div>

        <button className="sb-logout" onClick={onLogout} type="button" title="Logout">
          <FiLogOut />
        </button>
      </div>
    </aside>
  );
}
