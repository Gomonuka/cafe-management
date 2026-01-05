//  frontend/src/components/auth/AuthField.tsx
import type { ReactNode } from "react";

type BaseProps = {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconClick?: () => void;
  placeholder?: string;
  autoComplete?: string;
};

type InputProps = BaseProps & {
  kind?: "input";
  inputType?: string;
  value: string;
  onChange: (v: string) => void;
};

type SelectProps = BaseProps & {
  kind: "select";
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
};

type Props = InputProps | SelectProps;

export default function AuthField(props: Props) {
  const isSelect = "kind" in props && props.kind === "select";

  return (
    <div className="field">
      {props.leftIcon ? <span className="icon-left">{props.leftIcon}</span> : null}

      {isSelect ? (
        <select
          className="input select"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        >
          {props.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="input"
          type={props.inputType ?? "text"}
          placeholder={props.placeholder}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          autoComplete={props.autoComplete}
        />
      )}

      {props.rightIcon ? (
        <span
          className="icon-right"
          role={props.onRightIconClick ? "button" : undefined}
          tabIndex={props.onRightIconClick ? 0 : -1}
          onClick={props.onRightIconClick}
        >
          {props.rightIcon}
        </span>
      ) : null}
    </div>
  );
}
