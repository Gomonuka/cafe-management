import "../../styles/ui.css";

export default function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="toggle-dot" />
    </button>
  );
}
