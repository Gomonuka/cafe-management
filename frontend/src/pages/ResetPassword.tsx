import { useState, useMemo } from "react";
import type { FormEvent } from "react";
import { confirmPasswordReset } from "../auth/auth.api";
import "../styles/auth.css";

const ResetPassword = () => {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const uid = query.get("uid") ?? "";
  const token = query.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const res = await confirmPasswordReset({
      uid,
      token,
      new_password: password,
    });

    if (!res.ok) {
      setError(res.data?.detail || JSON.stringify(res.data));
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="auth-page">
      <div className="card">
        <div className="brand">CRMS</div>

        <form className="form" onSubmit={handleSubmit}>
          <input className="input" type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn" type="submit">Set new password</button>
        </form>

        {success && <div className="ok">Password changed. You can login now.</div>}
        {error && <div className="err">{error}</div>}

        <a className="link" href="/">Back to login</a>
      </div>
    </div>
  );
};

export default ResetPassword;
