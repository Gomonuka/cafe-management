import { FiUploadCloud, FiX } from "react-icons/fi";
import Card from "../ui/Card";
import Button from "../ui/Button";
import "../../styles/profile.css";

export default function AvatarBlock({
  avatarUrl,
  onUpload,
  onRemove,
}: {
  avatarUrl?: string | null;
  onUpload: () => void;
  onRemove: () => void;
}) {
  return (
    <Card>
      <div className="block-title">Konta fotogrāfija</div>

      <div className="avatar-row">
        <div className="avatar">
          {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : null}
        </div>

        <button className="avatar-remove" type="button" onClick={onRemove} title="Remove">
          <FiX />
        </button>
      </div>

      <Button variant="ghost" full onClick={onUpload}>
        <span className="btn-ic"><FiUploadCloud /></span>
        Augšupielādēt jauno fotogrāfiju
      </Button>
    </Card>
  );
}
