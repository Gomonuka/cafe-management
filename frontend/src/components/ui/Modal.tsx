import type { ReactNode } from "react";
import "../../styles/ui.css";

export default function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-x" onClick={onClose} type="button">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
