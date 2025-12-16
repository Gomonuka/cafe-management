import { useState } from "react";
import type { FormEvent } from "react";
import { register } from "../auth/auth.api";
import "../styles/auth.css";

type Role = "client" | "company_admin";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const res = await register({ username, email, password, role });
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
          <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="client">Client</option>
            <option value="company_admin">Company admin</option>
          </select>

          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <button className="btn" type="submit">Create account</button>
        </form>

        {success && <div className="ok">Account created. You can login now.</div>}
        {error && <div className="err">{error}</div>}

        <a className="link" href="/">Back to login</a>
      </div>
    </div>
  );
};

export default Register;
