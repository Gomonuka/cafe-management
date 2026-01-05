// Profile.tsx
import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import { FiKey } from "react-icons/fi";
import AvatarBlock from "../components/profile/AvatarBlock";
import AccountInfoBlock from "../components/profile/AccountInfoBlock";
import SecurityBlock from "../components/profile/SecurityBlock";
import { changePassword, deleteMe, fetchMe, updateMe, fetchSecretQuestions } from "../api/accounts";
import "../styles/profile.css";

type ErrorMap = Record<string, string>;

const translateError = (msg: string) => {
  if (msg === "Enter a valid email address.") return "Lūdzu ievadiet derīgu e-pasta adresi.";
  return msg;
};

export default function Profile() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<ErrorMap>({});
  const [hasAnswer, setHasAnswer] = useState(false);

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [questionId, setQuestionId] = useState<number | "">("");
  const [answer, setAnswer] = useState("");
  const [questions, setQuestions] = useState<Array<{ id: number; text: string }>>([]);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchSecretQuestions().then((res) => {
      if (res.ok && mounted) setQuestions(res.data);
    });
    fetchMe().then((res) => {
      if (!mounted) return;
      if (res.ok) {
        setUsername(res.data.username);
        setFirstName(res.data.first_name || "");
        setLastName(res.data.last_name || "");
        setEmail(res.data.email);
        setAvatarUrl(res.data.avatar || null);
        setQuestionId(res.data.secret_question || "");
        setHasAnswer(Boolean(res.data.has_secret_answer));
        if (res.data.requires_profile_completion) {
          setToast("Lūdzu aizpildi slepeno jautājumu un saglabā profilu.");
        }
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const refreshProfile = async () => {
    const res = await fetchMe();
    if (res.ok) {
      setAvatarUrl(res.data.avatar || null);
      setUsername(res.data.username);
      setFirstName(res.data.first_name || "");
      setLastName(res.data.last_name || "");
      setEmail(res.data.email);
      setQuestionId(res.data.secret_question || "");
    }
    return res;
  };

  const extractErrors = (data: any): ErrorMap => {
    const errObj: ErrorMap = {};
    if (data && typeof data === "object") {
      Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) errObj[k] = translateError(v.join(" "));
        else if (typeof v === "string") errObj[k] = translateError(v);
      });
    } else if (typeof data === "string") {
      errObj.general = translateError(data);
    }
    return errObj;
  };

  const onSave = async () => {
    setErrors({});
    const fd = new FormData();
    fd.append("username", username);
    fd.append("first_name", firstName);
    fd.append("last_name", lastName);
    fd.append("email", email);
    if (questionId) fd.append("secret_question", String(questionId));
    if (answer) fd.append("secret_answer", answer);
    const res = await updateMe(fd);
    if (!res.ok) {
      setErrors(extractErrors(res.data));
      return;
    }
    await refreshProfile();
    setToast("Profils saglabāts.");
  };

  const onDelete = async () => {
    if (!confirm("Dzēst kontu?")) return;
    await deleteMe();
    window.location.href = "/";
  };

  const onUpload = async (file?: File) => {
    if (!file) return;
    setErrors((prev) => ({ ...prev, avatar: "" }));
    const fd = new FormData();
    fd.append("avatar", file, file.name);
    fd.append("username", username);
    fd.append("first_name", firstName);
    fd.append("last_name", lastName);
    fd.append("email", email);
    const res = await updateMe(fd);
    if (res.ok) {
      if (answer) setHasAnswer(true);
      await refreshProfile();
    } else {
      setErrors((prev) => ({ ...prev, ...extractErrors(res.data) }));
    }
  };

  const onChangePassword = () => {
    setP1("");
    setP2("");
    setPwdOpen(true);
  };

  const onSubmitPassword = async () => {
    if (p1.length < 8) {
      setErrors({ password: "Parolei jābūt vismaz 8 simboliem." });
      return;
    }
    if (p1 !== p2) {
      setErrors({ password: "Paroles nesakrīt." });
      return;
    }
    const res = await changePassword(p1, p2);
    if (!res.ok) {
      setErrors(extractErrors(res.data));
      return;
    }
    setPwdOpen(false);
    setToast("Parole nomainīta.");
  };

  if (loading) return <div style={{ padding: 24 }}>Ielāde...</div>;

  return (
    <>
      <div className="profile-wrap">
        <div className="profile-title">Lietotāja konts</div>

        <div className="profile-card">
          <AvatarBlock avatarUrl={avatarUrl} error={errors.avatar} onUpload={onUpload} />

          <AccountInfoBlock
            username={username}
            setUsername={setUsername}
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            email={email}
            setEmail={setEmail}
            errors={{
              username: errors.username,
              first_name: errors.first_name,
              last_name: errors.last_name,
              email: errors.email,
            }}
          />

          <SecurityBlock onChangePassword={onChangePassword} />

          <Card>
            <div className="block-title">Slepenais jautājums</div>
            <div style={{ display: "grid", gap: 10 }}>
              <label className="sb-role" style={{ color: "#1e73d8", fontWeight: 700 }}>
                Jautājums
              </label>
              <select
                className="select-input"
                value={questionId}
                onChange={(e) => setQuestionId(Number(e.target.value))}
              >
                <option value="">Izvēlies</option>
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.text}
                  </option>
                ))}
              </select>
              <Input
                label="Slepenā atbilde"
                value={answer}
                onChange={setAnswer}
                type="password"
                leftIcon={<FiKey />}
              />
              {!answer && hasAnswer ? (
                <div className="field-error" style={{ background: "#e8f4ff", color: "#1e73d8" }}>
                  Atbilde ir saglabāta.
                </div>
              ) : null}
              {errors.secret_question ? <div className="field-error">{errors.secret_question}</div> : null}
              {errors.secret_answer ? <div className="field-error">{errors.secret_answer}</div> : null}
            </div>
          </Card>

          {errors.general ? <div className="field-error">{errors.general}</div> : null}

          <Card>
            <div className="actions actions-wide">
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
          {errors.password ? <div className="field-error">{errors.password}</div> : null}
          <div className="actions actions-wide" style={{ marginTop: 10, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setPwdOpen(false)}>
              Atcelt
            </Button>
            <Button variant="primary" onClick={onSubmitPassword}>
              Saglabāt
            </Button>
          </div>
        </div>
      </Modal>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
