import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import CompanyEmployees from "./pages/CompanyEmployees";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import CreateCompany from "./pages/CreateCompany";
import MyCompany from "./pages/MyCompany";
import AdminCompanies from "./pages/AdminCompanies";
import CompanyMenu from "./pages/CompanyMenu";
import CheckoutPage from "./pages/CheckoutPage";
import MyOrders from "./pages/MyOrders";
import OrdersBoard from "./pages/OrdersBoard";
import OrderDetail from "./pages/OrderDetail";
import OrderStats from "./pages/OrderStats";
import MenuAdmin from "./pages/MenuAdmin";
import Inventory from "./pages/Inventory";

import AppLayout from "./layouts/AppLayout";
import RequireAuth from "./routes/RequireAuth";
import RequireCompany from "./routes/RequireCompany";
import RequireRoles from "./routes/RequireRoles";

function AppHomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  switch (user.role) {
    case "system_admin":
      return <Navigate to="/app/profile" replace />;
    case "employee":
      return <Navigate to="/app/orders" replace />;
    case "company_admin":
      return <Navigate to="/app/admin" replace />;
    case "client":
    default:
      return <Navigate to="/app/companies" replace />;
  }
}

export default function App() {
  return (
    <Routes>
      {/* ---------- PUBLIC ---------- */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />

      {/* ---------- PROTECTED ---------- */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          {/* Admin area (only system admins) */}
          <Route element={<RequireRoles allowed={["system_admin"]} />}>
            <Route path="/app/admin/users" element={<AdminUsers />} />
            <Route path="/app/admin/companies" element={<AdminCompanies />} />
          </Route>

          {/* Companies browsing */}
          <Route element={<RequireRoles allowed={["client"]} />}>
            <Route path="/app/companies" element={<Companies />} />
            <Route path="/app/companies/:id" element={<CompanyDetail />} />
            <Route path="/app/companies/:id/menu" element={<CompanyMenu />} />
            <Route path="/app/companies/:id/checkout" element={<CheckoutPage />} />
            <Route path="/app/create-company" element={<CreateCompany />} />
            <Route path="/app/orders" element={<MyOrders />} />
          </Route>
          {/* Profile accessible to all */}
          <Route path="/app/profile" element={<Profile />} />
          {/* Company-bound area */}
          <Route element={<RequireCompany />}>
            <Route path="/app/my-company" element={<MyCompany />} />
            <Route path="/app/company/employees" element={<CompanyEmployees />} />
            <Route path="/app/company/orders" element={<OrdersBoard />} />
            <Route path="/app/company/orders/:id" element={<OrderDetail />} />
            <Route path="/app/company/orders/stats" element={<OrderStats />} />
            <Route path="/app/company/menu" element={<MenuAdmin />} />
            <Route path="/app/inventory" element={<Inventory />} />
          </Route>

          {/* Default redirect */}
          <Route path="/app" element={<AppHomeRedirect />} />
        </Route>
      </Route>

      {/* ---------- FALLBACK ---------- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
