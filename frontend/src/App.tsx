import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Companies from "./pages/Companies";
import AppLayout from "./layouts/AppLayout";

export default function App() {
  return (
    <Routes>
      {/* auth */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/password-reset/confirm" element={<ResetPassword />} />

      {/* app */}
      <Route path="/app/profile" element={<Profile />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />

      <Route path="/app/companies" element={
        <AppLayout>
          <Companies />
        </AppLayout>
      } />    
    </Routes>
  );
}
