//  frontend/src/components/ui/Select.tsx
import type { ReactNode } from "react";
import "../../styles/ui.css";

type Props = {
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
};

export default function Select({ label, leftIcon, rightIcon, value, onChange, options }: Props) {
  return (
    <div className="f">
      {label ? <div className="f-label">{label}</div> : null}
      <div className="f-field">
        {leftIcon ? <span className="f-ic left">{leftIcon}</span> : null}
        <select className="f-input f-select" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {rightIcon ? <span className="f-ic right">{rightIcon}</span> : null}
      </div>
    </div>
  );
}
