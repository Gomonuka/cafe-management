//  frontend/src/components/auth/AuthCard.tsx
import type { ReactNode } from "react";
import logo from "../../assets/crms-logo-1.png";

type Props = {
  title?: string;
  subtitle?: ReactNode;
  children: ReactNode;
  bottom?: ReactNode;
};

export default function AuthCard({ title, subtitle, children, bottom }: Props) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-card">
          <img className="logo" src={logo} alt="CRMS" />
          {title && <div className="title">{title}</div>}
          {subtitle && <div className="subtitle">{subtitle}</div>}
          {children}
        </div>

        {bottom ? <div className="auth-bottom">{bottom}</div> : null}
      </div>
    </div>
  );
}
