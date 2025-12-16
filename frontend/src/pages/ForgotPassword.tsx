import { useState } from "react";
import type { FormEvent } from "react";
import { requestPasswordReset } from "../auth/auth.api";
import "../styles/auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const res = await requestPasswordReset(email);
    if (!res.ok) {
      setError(JSON.stringify(res.data));
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="auth-page">
      <div className="card">
        <div className="brand">CRMS</div>

        <form className="form" onSubmit={handleSubmit}>
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn" type="submit">Send reset link</button>
        </form>

        {success && <div className="ok">If this email exists, reset link was sent.</div>}
        {error && <div className="err">{error}</div>}

        <a className="link" href="/">Back to login</a>
      </div>
    </div>
  );
};

export default ForgotPassword;
