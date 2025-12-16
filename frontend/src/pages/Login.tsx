import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

import AuthCard from "../components/auth/AuthCard";
import AuthField from "../components/auth/AuthField";
import { ErrorBox } from "../components/auth/AuthMessage";
import { login } from "../auth/auth.api";

export default function Login() {
  const nav = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await login({ username: emailOrUsername, password });
    if (!res.ok) {
      setError(res.data?.detail || "Login failed");
      return;
    }
    nav("/app");
  };

  return (
    <AuthCard
      title="Pierakstīties"
      bottom={
        <>
          <span style={{ fontWeight: 700, color: "#1E73D8" }}>Nav konta?</span>{" "}
          <a className="link" href="/register" style={{ marginTop: 0 }}>
            Reģistrēties
          </a>
        </>
      }
    >
      <form className="form" onSubmit={onSubmit}>
        <AuthField
          leftIcon={<FiMail />}
          placeholder="E-pasts"
          value={emailOrUsername}
          onChange={setEmailOrUsername}
          autoComplete="username"
        />

        <AuthField
          leftIcon={<FiLock />}
          placeholder="Parole"
          inputType={show ? "text" : "password"}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          rightIcon={show ? <FiEyeOff /> : <FiEye />}
          onRightIconClick={() => setShow((s) => !s)}
        />

        <button className="btn" type="submit">
          Pierakstīties
        </button>
      </form>

      <ErrorBox text={error} />

      <a className="link" href="/forgot">
        Aizmirsat paroli?
      </a>
    </AuthCard>
  );
}
