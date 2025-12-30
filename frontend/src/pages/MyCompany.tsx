import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CompanyInfo from "../pagesParts/company/CompanyInfo";

export default function MyCompany() {
  const nav = useNavigate();
  const role = (localStorage.getItem("role") || "client") as
    | "client"
    | "employee"
    | "company_admin"
    | "system_admin";

  // у тебя это хранится где-то — если нет, добавим позже в me()
  const companyId = localStorage.getItem("companyId");

  const canEdit = useMemo(
    () => role === "company_admin" || role === "system_admin",
    [role]
  );

  useEffect(() => {
    // если нет companyId — пусть RequireCompany редиректит,
    // но на всякий случай:
    if (!companyId && role === "company_admin") nav("/app/create-company", { replace: true });
  }, [companyId, role, nav]);

  if (!companyId) return null;

  return <CompanyInfo companyId={companyId} editable={canEdit} />;
}
