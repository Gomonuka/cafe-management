import type { InputHTMLAttributes, ReactNode } from "react";
import "../../styles/ui.css";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconClick?: () => void;
  value: string;
  onChange: (v: string) => void;
};

export default function Input({
  label,
  leftIcon,
  rightIcon,
  onRightIconClick,
  value,
  onChange,
  className,
  ...rest
}: Props) {
  return (
    <div className="f">
      {label ? <div className="f-label">{label}</div> : null}
      <div className="f-field">
        {leftIcon ? <span className="f-ic left">{leftIcon}</span> : null}
        <input
          className={`f-input ${className ?? ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
        {rightIcon ? (
          <span
            className="f-ic right"
            role={onRightIconClick ? "button" : undefined}
            onClick={onRightIconClick}
          >
            {rightIcon}
          </span>
        ) : null}
      </div>
    </div>
  );
}
