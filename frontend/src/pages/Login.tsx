import { useState } from "react";
import type { FormEvent } from "react";
import { login } from "../auth/auth.api";
import "../styles/auth.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await login({ username, password });
    if (!res.ok) {
      setError(res.data?.detail || "Login failed");
      return;
    }

    window.location.href = "/app";
  };

  return (
    <div className="auth-page">
      <div className="card">
        <div className="brand">CRMS</div>

        <form className="form" onSubmit={handleSubmit}>
          <input
            className="input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn" type="submit">
            Login
          </button>
        </form>

        {error && <div className="err">{error}</div>}

        <a className="link" href="/forgot">Aizmirsat paroli?</a>
        <a className="link" href="/register">Reģistrēties</a>
      </div>
    </div>
  );
};

export default Login;
