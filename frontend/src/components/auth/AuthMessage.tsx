export function ErrorBox({ text }: { text?: string | null }) {
  if (!text) return null;

  let clean = text;
  if (clean.startsWith("{") || clean.startsWith("[")) {
    try {
      const parsed = JSON.parse(clean);
      if (typeof parsed === "string") clean = parsed;
      else if (Array.isArray(parsed)) clean = parsed.join(" ");
      else if (typeof parsed === "object") {
        const firstKey = Object.keys(parsed)[0];
        const val = (parsed as any)[firstKey];
        clean = Array.isArray(val) ? val.join(" ") : String(val);
      }
    } catch {
      /* ignore */
    }
  }

  return <div className="err">{clean}</div>;
}

export function OkBox({ text }: { text?: string | null }) {
  if (!text) return null;
  return <div className="ok">{text}</div>;
}
