import { useState } from "react";
import AppLayout from "../layouts/AppLayout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";

import AvatarBlock from "../components/profile/AvatarBlock";
import AccountInfoBlock from "../components/profile/AccountInfoBlock";
import SecurityBlock from "../components/profile/SecurityBlock";
import SettingsBlock from "../components/profile/SettingsBlock";

import "../styles/profile.css";

export default function Profile() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [username, setUsername] = useState("Tests_testins93");
  const [firstName, setFirstName] = useState("Tests");
  const [lastName, setLastName] = useState("Testiņš");
  const [email, setEmail] = useState("tests@testins.lv");

  const [language, setLanguage] = useState("lv");

  const [pwdOpen, setPwdOpen] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  const onSave = () => {
    alert("Saved (mock)");
  };

  const onDelete = () => {
    if (confirm("Dzēst kontu?")) alert("Deleted (mock)");
  };

  const onUpload = () => {
    setAvatarUrl("https://i.pravatar.cc/200");
  };

  const onRemove = () => setAvatarUrl(null);

  const onChangePassword = () => {
    setP1("");
    setP2("");
    setPwdOpen(true);
  };

  const onSubmitPassword = () => {
    if (p1.length < 6) return alert("Parolei jābūt vismaz 6 simboli.");
    if (p1 !== p2) return alert("Paroles nesakrīt.");
    setPwdOpen(false);
    alert("Password changed (mock)");
  };

  return (
    <AppLayout>
      <div className="profile-wrap">
        <div className="profile-title">Lietotāja konts</div>

        <div className="profile-card">
          <AvatarBlock avatarUrl={avatarUrl} onUpload={onUpload} onRemove={onRemove} />

          <AccountInfoBlock
            username={username} setUsername={setUsername}
            firstName={firstName} setFirstName={setFirstName}
            lastName={lastName} setLastName={setLastName}
            email={email} setEmail={setEmail}
          />

          <SecurityBlock onChangePassword={onChangePassword} />

          <SettingsBlock
            language={language} setLanguage={setLanguage}
          />

          <Card>
            <div className="actions">
              <Button variant="primary" onClick={onSave}>Saglabāt</Button>
              <Button variant="danger" onClick={onDelete}>Dzēst kontu</Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={pwdOpen} title="Mainīt paroli" onClose={() => setPwdOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Jaunā parole" value={p1} onChange={setP1} type="password" />
          <Input label="Apstiprināt paroli" value={p2} onChange={setP2} type="password" />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <Button variant="ghost" onClick={() => setPwdOpen(false)}>Atcelt</Button>
            <Button variant="primary" onClick={onSubmitPassword}>Saglabāt</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
