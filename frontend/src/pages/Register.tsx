import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiKey,
  FiEye,
  FiEyeOff,
  FiChevronDown,
  FiShield,
  FiLock,
} from "react-icons/fi";

import AuthCard from "../components/auth/AuthCard";
import AuthField from "../components/auth/AuthField";
import { ErrorBox, OkBox } from "../components/auth/AuthMessage";
import { register } from "../auth/auth.api";
import { fetchSecretQuestions } from "../api/accounts";

type Role = "client" | "company_admin";

export default function Register() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true);
  const [questions, setQuestions] = useState<Array<{ id: number; text: string }>>([]);
  const [questionId, setQuestionId] = useState<number | "">("");
  const [answer, setAnswer] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    fetchSecretQuestions().then((res) => {
      if (res.ok) setQuestions(res.data);
    });
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (password.length < 8) {
      setError("Parolei jābūt vismaz 8 simboliem.");
      return;
    }
    if (!questionId || !answer) {
      setError("Izvēlies slepeno jautājumu un atbildi.");
      return;
    }

    const res = await register({
      username,
      email,
      password,
      role,
      auto_login: autoLogin,
      secret_question: questionId as number,
      secret_answer: answer,
    });
    if (!res.ok) {
      setError(JSON.stringify(res.data));
      return;
    }

    if (autoLogin) {
      nav("/app/profile");
      return;
    }

    setOk("Konts izveidots. Tagad vari ieiet.");
  };

  return (
    <AuthCard title="Reģistrēties">
      <form className="form" onSubmit={onSubmit}>
        <AuthField leftIcon={<FiUser />} placeholder="Lietotājvārds" value={username} onChange={setUsername} />
        <AuthField leftIcon={<FiMail />} placeholder="E-pasts" value={email} onChange={setEmail} />

        <AuthField
          kind="select"
          leftIcon={<FiShield />}
          value={role}
          onChange={(v) => setRole(v as Role)}
          options={[
            { value: "client", label: "Klients" },
            { value: "company_admin", label: "Uzņēmuma administrators" },
          ]}
          rightIcon={<FiChevronDown />}
        />

        <AuthField
          leftIcon={<FiKey />}
          placeholder="Parole"
          inputType={show ? "text" : "password"}
          value={password}
          onChange={setPassword}
          rightIcon={show ? <FiEyeOff /> : <FiEye />}
          onRightIconClick={() => setShow((s) => !s)}
        />

        <AuthField
          kind="select"
          leftIcon={<FiLock />}
          value={questionId}
          onChange={(v) => setQuestionId(Number(v))}
          options={[{ value: "", label: "Izvēlies slepeno jautājumu" }, ...questions.map((q) => ({ value: q.id, label: q.text }))]}
          rightIcon={<FiChevronDown />}
        />
        <AuthField leftIcon={<FiLock />} placeholder="Slepenā atbilde" value={answer} onChange={setAnswer} />

        <button className="btn" type="submit">
          Reģistrēties
        </button>
      </form>

      <div className="row">
        <label className="check">
          <input type="checkbox" checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} />
          <span className="box" />
          Ienākt uzreiz?
        </label>
      </div>

      <OkBox text={ok} />
      <ErrorBox text={error} />

      <a className="link" href="/">
        Ir konts? Ienākt
      </a>
    </AuthCard>
  );
}
