import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Profile from "./pages/Profile";
import Companies from "./pages/Companies";
import CompanyPublic from "./pages/CompanyPublic";
import CompanyMenu from "./pages/CompanyMenu";
import CreateOrder from "./pages/CreateOrder";
import MyOrders from "./pages/MyOrders";
import CreateCompany from "./pages/CreateCompany";
import MyCompany from "./pages/MyCompany";

import AppLayout from "./layouts/AppLayout";
import RequireAuth from "./routes/RequireAuth";
import RequireCompany from "./routes/RequireCompany";

export default function App() {
  return (
    <Routes>
      {/* ---------- PUBLIC (без сайдбара) ---------- */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/password-reset/confirm" element={<ResetPassword />} />

      {/* ---------- PROTECTED ---------- */}
      <Route element={<RequireAuth />}>
        {/* CreateCompany доступен авторизованному админу компании (и только ему нужно без company) */}
        <Route path="/app/create-company" element={<CreateCompany />} />

        {/* Всё остальное в /app требует: если company_admin -> должна быть company */}
        <Route element={<RequireCompany />}>
          {/* Layout один раз на все страницы приложения */}
          <Route element={<AppLayout />}>
            <Route path="/app/profile" element={<Profile />} />
            <Route path="/app/companies" element={<Companies />} />
            <Route path="/app/companies/:id" element={<CompanyPublic />} />
            <Route path="/app/companies/:id/menu" element={<CompanyMenu />} />
            <Route path="/app/companies/:id/checkout" element={<CreateOrder />} />
            <Route path="/app/my-orders" element={<MyOrders />} />
            <Route path="/app/my-company" element={<MyCompany />} />

            {/* опционально: /app ведёт куда-нибудь */}
            <Route path="/app" element={<Navigate to="/app/companies" replace />} />
          </Route>
        </Route>
      </Route>

      {/* ---------- FALLBACK ---------- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

