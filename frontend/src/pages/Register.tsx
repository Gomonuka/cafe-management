import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiChevronDown } from "react-icons/fi";

import AuthCard from "../components/auth/AuthCard";
import AuthField from "../components/auth/AuthField";
import { ErrorBox, OkBox } from "../components/auth/AuthMessage";
import { register, login } from "../auth/auth.api";

type Role = "client" | "company_admin";

export default function Register() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    const res = await register({ username, email, password, role });
    if (!res.ok) {
      setError(JSON.stringify(res.data));
      return;
    }

    if (autoLogin) {
      const res2 = await login({ username, password });
      if (res2.ok) {
        nav("/app");
        return;
      }
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
          leftIcon={<FiUser />}
          value={role}
          onChange={(v) => setRole(v as Role)}
          options={[
            { value: "client", label: "Klients" },
            { value: "company_admin", label: "Uzņēmuma administrators" },
          ]}
          rightIcon={<FiChevronDown />}
        />

        <AuthField
          leftIcon={<FiLock />}
          placeholder="Parole"
          inputType={show ? "text" : "password"}
          value={password}
          onChange={setPassword}
          rightIcon={show ? <FiEyeOff /> : <FiEye />}
          onRightIconClick={() => setShow((s) => !s)}
        />

        <button className="btn" type="submit">Pierakstīties</button>
      </form>

      <div className="row">
        <label className="check">
            <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
            />
            <span className="box" />
            Ienākt uzreiz?
        </label>
      </div>

      <OkBox text={ok} />
      <ErrorBox text={error} />

      <a className="link" href="/">Atgriezties pie pierakstīšanās</a>
    </AuthCard>
  );
}
