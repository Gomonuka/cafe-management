import { useRef } from "react";
import { FiUploadCloud } from "react-icons/fi";
import Card from "../ui/Card";
import Button from "../ui/Button";
import "../../styles/profile.css";

export default function AvatarBlock({
  avatarUrl,
  error,
  onUpload,
}: {
  avatarUrl?: string | null;
  error?: string | null;
  onUpload: (file?: File) => void;
}) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
  const mediaHost = apiBase.replace(/\/api\/?$/, "");
  const resolvedAvatar =
    avatarUrl && !avatarUrl.startsWith("http") ? `${mediaHost}${avatarUrl}` : avatarUrl || null;

  const triggerUpload = () => {
    fileInput.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onUpload(file || undefined);
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <Card>
      <div className="block-title">Konta fotogrāfija</div>

      <div className="avatar-row">
        <div className="avatar">{resolvedAvatar ? <img src={resolvedAvatar} alt="avatar" /> : null}</div>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInput}
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      <Button variant="primary" full onClick={triggerUpload}>
        <span className="btn-ic">
          <FiUploadCloud />
        </span>
        Augšupielādēt jauno fotogrāfiju
      </Button>
      {error ? <div className="field-error">{error}</div> : null}
    </Card>
  );
}
