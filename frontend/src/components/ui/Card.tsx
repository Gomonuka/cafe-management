import type { ReactNode } from "react";
import "../../styles/ui.css";

export default function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}
