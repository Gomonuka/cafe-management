import { useState } from "react";
import type { FormEvent } from "react";
import { FiMail } from "react-icons/fi";

import AuthCard from "../components/auth/AuthCard";
import AuthField from "../components/auth/AuthField";
import { ErrorBox, OkBox } from "../components/auth/AuthMessage";
import { requestPasswordReset } from "../auth/auth.api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    const res = await requestPasswordReset(email);
    if (!res.ok) {
      setError(JSON.stringify(res.data));
      return;
    }
    setOk("Ja e-pasts eksistē, saite ir nosūtīta.");
  };

  return (
    <AuthCard
      subtitle={
        <>
          Ievadiet savu e-pasta adresi, un<br />
          mēs nosūtīsim paroles<br />
          atiestatīšanas saiti.
        </>
      }
    >
      <form className="form" onSubmit={onSubmit}>
        <AuthField leftIcon={<FiMail />} placeholder="E-pasts" value={email} onChange={setEmail} />
        <button className="btn" type="submit">Nosūtīt saiti</button>
      </form>

      <OkBox text={ok} />
      <ErrorBox text={error} />

      <a className="link" href="/">Atpakaļ uz login</a>
    </AuthCard>
  );
}
