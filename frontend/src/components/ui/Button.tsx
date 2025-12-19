import type { ButtonHTMLAttributes } from "react";
import "../../styles/ui.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "ghost";
  full?: boolean;
};

export default function Button({ variant = "primary", full, className, ...rest }: Props) {
  return (
    <button
      className={`btn btn-${variant} ${full ? "btn-full" : ""} ${className ?? ""}`}
      {...rest}
    />
  );
}
