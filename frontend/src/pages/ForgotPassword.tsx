//  frontend/src/pages/ForgotPassword.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import AuthField from "../components/auth/AuthField";
import { ErrorBox, OkBox } from "../components/auth/AuthMessage";
import { requestPasswordReset, confirmPasswordReset } from "../auth/auth.api";
import { FiMail, FiLock } from "react-icons/fi";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<"email" | "answer" | "done">("email");
  const [question, setQuestion] = useState("");
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPass, setNewPass] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const translateError = (msg: unknown) => {
    if (typeof msg === "string") {
      if (msg.includes("Enter a valid email address")) return "Lūdzu ievadiet derīgu e-pasta adresi.";
      if (msg.toLowerCase().includes("not found")) return "Lietotājs ar šādu e-pastu nav atrasts.";
      return msg;
    }
    return JSON.stringify(msg);
  };

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await requestPasswordReset(email);
    if (!res.ok) {
      setError(translateError(res.data?.detail || res.data));
      return;
    }
    setQuestion(res.data.question);
    setUid(res.data.uid);
    setToken(res.data.token);
    setStage("answer");
  };

  const submitAnswer = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPass.length < 8 || newPass !== repeat) {
      setError("Parolei jābūt vismaz 8 simboliem un jāsakrīt.");
      return;
    }
    const res = await confirmPasswordReset({
      uid,
      token,
      answer,
      new_password: newPass,
      repeat_password: repeat,
    });
    if (!res.ok) {
      setError(translateError(res.data?.detail || res.data));
      return;
    }
    setOk("Parole atjaunota.");
    setStage("done");
    setTimeout(() => nav("/"), 800);
  };

  return (
    <AuthCard title="Paroles atjaunošana">
      {stage === "email" && (
        <form className="form" onSubmit={submitEmail}>
          <AuthField leftIcon={<FiMail />} placeholder="E-pasts" value={email} onChange={setEmail} />
          <button className="btn" type="submit">
            Apstiprināt
          </button>
        </form>
      )}

      {stage === "answer" && (
        <form className="form" onSubmit={submitAnswer}>
          <div style={{ marginBottom: 8, color: "#1e73d8", fontWeight: 700 }}>{question}</div>
          <AuthField leftIcon={<FiLock />} placeholder="Atbilde" value={answer} onChange={setAnswer} />
          <AuthField leftIcon={<FiLock />} placeholder="Jauna parole" value={newPass} onChange={setNewPass} inputType="password" />
          <AuthField leftIcon={<FiLock />} placeholder="Atkārtota parole" value={repeat} onChange={setRepeat} inputType="password" />
          <button className="btn" type="submit">
            Apstiprināt
          </button>
        </form>
      )}

      <OkBox text={ok} />
      <ErrorBox text={error} />
    </AuthCard>
  );
}
