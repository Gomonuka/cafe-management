//  frontend/src/components/ui/Card.tsx
import type { ReactNode, CSSProperties } from "react";
import "../../styles/ui.css";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export default function Card({ children, className, style }: Props) {
  const cls = className ? `card ${className}` : "card";
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}
