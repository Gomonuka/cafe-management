import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import AvatarBlock from "../components/profile/AvatarBlock";
import AccountInfoBlock from "../components/profile/AccountInfoBlock";
import SecurityBlock from "../components/profile/SecurityBlock";
import SettingsBlock from "../components/profile/SettingsBlock";
import { changePassword, deleteMe, fetchMe, updateMe } from "../api/accounts";
import "../styles/profile.css";

export default function Profile() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [language, setLanguage] = useState("lv");

  const [pwdOpen, setPwdOpen] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchMe().then((res) => {
      if (!mounted) return;
      if (res.ok) {
        setUsername(res.data.username);
        setFirstName(res.data.first_name || "");
        setLastName(res.data.last_name || "");
        setEmail(res.data.email);
        setAvatarUrl(res.data.avatar || null);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async () => {
    const fd = new FormData();
    fd.append("username", username);
    fd.append("first_name", firstName);
    fd.append("last_name", lastName);
    fd.append("email", email);
    const res = await updateMe(fd);
    if (!res.ok) {
      alert(JSON.stringify(res.data));
      return;
    }
    alert("Saglabāts");
  };

  const onDelete = async () => {
    if (!confirm("Dzēst kontu?")) return;
    await deleteMe();
    window.location.href = "/";
  };

  const onUpload = async (file?: File) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await updateMe(fd);
    if (res.ok) setAvatarUrl(res.data.avatar || null);
  };

  const onRemove = async () => {
    const fd = new FormData();
    fd.append("avatar", "");
    const res = await updateMe(fd);
    if (res.ok) setAvatarUrl(null);
  };

  const onChangePassword = () => {
    setP1("");
    setP2("");
    setPwdOpen(true);
  };

  const onSubmitPassword = async () => {
    if (p1.length < 8) {
      alert("Parolei jābūt vismaz 8 simboliem.");
      return;
    }
    if (p1 !== p2) {
      alert("Paroles nesakrīt.");
      return;
    }
    const res = await changePassword(p1, p2);
    if (!res.ok) {
      alert(JSON.stringify(res.data));
      return;
    }
    setPwdOpen(false);
    alert("Parole nomainīta");
  };

  if (loading) return <div style={{ padding: 24 }}>Ielāde...</div>;

  return (
    <>
      <div className="profile-wrap">
        <div className="profile-title">Lietotāja konts</div>

        <div className="profile-card">
          <AvatarBlock avatarUrl={avatarUrl} onUpload={onUpload} onRemove={onRemove} />

          <AccountInfoBlock
            username={username}
            setUsername={setUsername}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            email={email}
            setEmail={setEmail}
          />

          <SecurityBlock onChangePassword={onChangePassword} />

          <SettingsBlock language={language} setLanguage={setLanguage} />

          <Card>
            <div className="actions">
              <Button variant="primary" onClick={onSave}>
                Saglabāt
              </Button>
              <Button variant="danger" onClick={onDelete}>
                Dzēst kontu
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={pwdOpen} title="Mainīt paroli" onClose={() => setPwdOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Jaunā parole" value={p1} onChange={setP1} type="password" />
          <Input label="Apstiprināt paroli" value={p2} onChange={setP2} type="password" />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <Button variant="ghost" onClick={() => setPwdOpen(false)}>
              Atcelt
            </Button>
            <Button variant="primary" onClick={onSubmitPassword}>
              Saglabāt
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
