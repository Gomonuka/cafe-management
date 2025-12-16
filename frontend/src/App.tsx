import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { getMe, logout } from "./auth/auth.api";

function AppHome() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await getMe();
      if (res.ok) setUsername(res.data?.username ?? "user");
      else setUsername(null);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!username) return <Navigate to="/" replace />;

  return (
    <div style={{ padding: 24 }}>
      <h2>✅ Logged in</h2>
      <p>Hello, {username}</p>
      <button
        onClick={async () => {
          await logout();
          window.location.href = "/";
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/app" element={<AppHome />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
