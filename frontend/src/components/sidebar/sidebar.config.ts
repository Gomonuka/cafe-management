import { FiCoffee, FiClipboard, FiUsers, FiHome, FiUser } from "react-icons/fi";

export type Role = "client" | "employee" | "company_admin" | "system_admin";

export const roleLabel: Record<Role, string> = {
  client: "Klients",
  employee: "Darbinieks",
  company_admin: "Uzņēmuma administrators",
  system_admin: "Sistēmas administrators",
};

export const menuByRole: Record<Role, Array<{ to: string; label: string; icon: any }>> = {
  client: [
    { to: "/app/companies", label: "Uzņēmumi", icon: FiCoffee },
  ],
  company_admin: [
    { to: "/app/my-company", label: "Mans uzņēmums", icon: FiHome },
    { to: "/app/company/employees", label: "Darbinieki", icon: FiUsers },
  ],
  employee: [
  ],
  system_admin: [
    { to: "/app/admin/companies", label: "Uzņēmumi", icon: FiHome },
    { to: "/app/admin/users", label: "Lietotāji", icon: FiUsers },
  ],
};
