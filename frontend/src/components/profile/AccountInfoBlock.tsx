import { FiUser, FiMail } from "react-icons/fi";
import Card from "../ui/Card";
import Input from "../ui/Input";

export default function AccountInfoBlock(props: {
  username: string; setUsername: (v: string) => void;
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
}) {
  return (
    <Card>
      <div className="block-title">Konta informācija</div>

      <Input label="Lietotājvārds" leftIcon={<FiUser />} value={props.username} onChange={props.setUsername} />
      <Input label="Vārds" leftIcon={<FiUser />} value={props.firstName} onChange={props.setFirstName} />
      <Input label="Uzvārds" leftIcon={<FiUser />} value={props.lastName} onChange={props.setLastName} />
      <Input label="E-pasts" leftIcon={<FiMail />} value={props.email} onChange={props.setEmail} />
    </Card>
  );
}
