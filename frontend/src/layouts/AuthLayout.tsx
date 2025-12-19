import type { ReactNode } from "react";
import "../styles/auth.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-page">{children}</div>;
}
