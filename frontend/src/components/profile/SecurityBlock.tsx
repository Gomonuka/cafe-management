//  frontend/src/components/profile/SecurityBlock.tsx
import { FiLock } from "react-icons/fi";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function SecurityBlock({ onChangePassword }: { onChangePassword: () => void }) {
  return (
    <Card>
      <div className="block-title">Drošība</div>

      <Input label="Parole" leftIcon={<FiLock />} value="************" onChange={() => {}} disabled />

      <div className="actions actions-wide" style={{ marginTop: 10 }}>
        <Button variant="primary" onClick={onChangePassword}>
          Mainīt paroli
        </Button>
      </div>
    </Card>
  );
}
