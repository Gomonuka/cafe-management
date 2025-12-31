import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import CompanyEmployees from "./pages/CompanyEmployees";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import CreateCompany from "./pages/CreateCompany";
import MyCompany from "./pages/MyCompany";
import AdminCompanies from "./pages/AdminCompanies";

import AppLayout from "./layouts/AppLayout";
import RequireAuth from "./routes/RequireAuth";
import RequireCompany from "./routes/RequireCompany";

export default function App() {
  return (
    <Routes>
      {/* ---------- PUBLIC ---------- */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/password-reset/confirm" element={<ResetPassword />} />

      {/* ---------- PROTECTED ---------- */}
      <Route element={<RequireAuth />}>
        {/* System admin (no company guard) */}
        <Route element={<AppLayout />}>
          <Route path="/app/admin/users" element={<AdminUsers />} />
          <Route path="/app/admin/companies" element={<AdminCompanies />} />
        </Route>

        {/* Companies browsing (client/system admin) */}
        <Route element={<AppLayout />}>
          <Route path="/app/companies" element={<Companies />} />
          <Route path="/app/companies/:id" element={<CompanyDetail />} />
          <Route path="/app/create-company" element={<CreateCompany />} />
        </Route>

        {/* Company-bound area */}
        <Route element={<RequireCompany />}>
          <Route element={<AppLayout />}>
            <Route path="/app/profile" element={<Profile />} />
            <Route path="/app/my-company" element={<MyCompany />} />
            <Route path="/app/company/employees" element={<CompanyEmployees />} />

            <Route path="/app" element={<Navigate to="/app/companies" replace />} />
          </Route>
        </Route>
      </Route>

      {/* ---------- FALLBACK ---------- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
