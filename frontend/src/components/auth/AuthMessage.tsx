//  frontend/src/components/auth/AuthMessage.tsx
const translate = (msg: string): string => {
  switch (msg) {
    case "This field may not be blank.":
    case "This field is required.":
      return "Lauks ir obligāts.";
    case "Invalid refresh token.":
    case "Refresh tokens nav derīgs.":
      return "Refresh tokens nav derīgs.";
    case "Refresh token missing.":
    case "Refresh tokens nav atrasts.":
      return "Refresh tokens nav atrasts.";
    case "Nepareiza parole.":
      return "Nepareiza parole.";
    case "Lietotajs ir blokets.":
    case "Lietotāja profils ir bloķēts.":
    case "Lietotājs ir bloķēts.":
      return "Lietotāja profils ir bloķēts.";
    case "Lietotajs ir izdzests vai neaktivs.":
    case "Lietotājs ir dzēsts vai neaktīvs.":
      return "Lietotāja profils ir dzēsts vai neaktīvs.";
    default:
      return msg;
  }
};

export function ErrorBox({ text }: { text?: string | null }) {
  if (!text) return null;

  let clean: string = typeof text === "string" ? text : String(text);
  if (typeof clean === "string" && (clean.trim().startsWith("{") || clean.trim().startsWith("["))) {
    try {
      const parsed = JSON.parse(clean);
      if (typeof parsed === "string") clean = parsed;
      else if (Array.isArray(parsed)) clean = parsed.join(" ");
      else if (typeof parsed === "object") {
        const parts: string[] = [];
        Object.entries(parsed).forEach(([k, v]) => {
          const val = Array.isArray(v) ? v.join(" ") : String(v);
          parts.push(val);
        });
        clean = parts.join(" ");
      }
    } catch {
      /* ignore */
    }
  }

  return <div className="err">{translate(clean)}</div>;
}

export function OkBox({ text }: { text?: string | null }) {
  if (!text) return null;
  return <div className="ok">{text}</div>;
}
