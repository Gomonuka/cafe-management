import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

import AuthCard from "../components/auth/AuthCard";
import AuthField from "../components/auth/AuthField";
import { ErrorBox, OkBox } from "../components/auth/AuthMessage";
import { confirmPasswordReset } from "../auth/auth.api";

export default function ResetPassword() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const uid = query.get("uid") ?? "";
  const token = query.get("token") ?? "";

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!uid || !token) {
      setError("Invalid reset link.");
      return;
    }
    if (p1.length < 6) {
      setError("Parolei jābūt vismaz 6 simboli.");
      return;
    }
    if (p1 !== p2) {
      setError("Paroles nesakrīt.");
      return;
    }

    const res = await confirmPasswordReset({ uid, token, new_password: p1 });
    if (!res.ok) {
      setError(res.data?.detail || JSON.stringify(res.data));
      return;
    }

    setOk("Parole nomainīta. Vari ieiet sistēmā.");
  };

  return (
    <AuthCard
      subtitle={
        <>
          Lūdzu, ievadiet jauno paroli savam<br />
          kontam.
        </>
      }
    >
      <form className="form" onSubmit={onSubmit}>
        <AuthField
          leftIcon={<FiLock />}
          placeholder="Jaunā parole"
          inputType={show1 ? "text" : "password"}
          value={p1}
          onChange={setP1}
          rightIcon={show1 ? <FiEyeOff /> : <FiEye />}
          onRightIconClick={() => setShow1((s) => !s)}
        />

        <AuthField
          leftIcon={<FiLock />}
          placeholder="Apstiprināt paroli"
          inputType={show2 ? "text" : "password"}
          value={p2}
          onChange={setP2}
          rightIcon={show2 ? <FiEyeOff /> : <FiEye />}
          onRightIconClick={() => setShow2((s) => !s)}
        />

        <button className="btn" type="submit">Atiestatīt paroli</button>
      </form>

      <OkBox text={ok} />
      <ErrorBox text={error} />

      <a className="link" href="/">Atpakaļ uz login</a>
    </AuthCard>
  );
}
