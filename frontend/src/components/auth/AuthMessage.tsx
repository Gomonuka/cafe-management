export function ErrorBox({ text }: { text?: string | null }) {
  if (!text) return null;
  return <div className="err">{text}</div>;
}

export function OkBox({ text }: { text?: string | null }) {
  if (!text) return null;
  return <div className="ok">{text}</div>;
}
