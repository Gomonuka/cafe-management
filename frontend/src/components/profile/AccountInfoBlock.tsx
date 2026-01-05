//  frontend/src/components/profile/AccountInfoBlock.tsx
import { FiUser, FiMail } from "react-icons/fi";
import Card from "../ui/Card";
import Input from "../ui/Input";

export default function AccountInfoBlock(props: {
  username: string;
  setUsername: (v: string) => void;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  errors?: Partial<{ username: string; first_name: string; last_name: string; email: string }>;
}) {
  const e = props.errors || {};
  return (
    <Card>
      <div className="block-title">Konta informācija</div>

      <Input label="Lietotājvārds" leftIcon={<FiUser />} value={props.username} onChange={props.setUsername} />
      {e.username ? <div className="field-error">{e.username}</div> : null}
      <Input label="Vārds" leftIcon={<FiUser />} value={props.firstName} onChange={props.setFirstName} />
      {e.first_name ? <div className="field-error">{e.first_name}</div> : null}
      <Input label="Uzvārds" leftIcon={<FiUser />} value={props.lastName} onChange={props.setLastName} />
      {e.last_name ? <div className="field-error">{e.last_name}</div> : null}
      <Input label="E-pasts" leftIcon={<FiMail />} value={props.email} onChange={props.setEmail} />
      {e.email ? <div className="field-error">{e.email}</div> : null}
    </Card>
  );
}
