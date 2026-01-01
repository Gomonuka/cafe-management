import { FiCoffee, FiClipboard, FiUsers, FiHome, FiUser, FiArchive } from "react-icons/fi";

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
    { to: "/app/orders", label: "Mani pasūtījumi", icon: FiClipboard },
  ],
  company_admin: [
    { to: "/app/my-company", label: "Mans uzņēmums", icon: FiHome },
    { to: "/app/companies", label: "Uzņēmumi", icon: FiCoffee },
    { to: "/app/company/orders", label: "Pasūtījumi", icon: FiClipboard },
    { to: "/app/inventory", label: "Noliktava", icon: FiArchive },
    { to: "/app/company/menu", label: "Ēdienkarte", icon: FiCoffee },
    { to: "/app/company/orders/stats", label: "Statistika", icon: FiClipboard },
    { to: "/app/company/employees", label: "Darbinieki", icon: FiUsers },
  ],
  employee: [
    { to: "/app/companies", label: "Uzņēmumi", icon: FiCoffee },
    { to: "/app/company/orders", label: "Pasūtījumi", icon: FiClipboard },
    { to: "/app/inventory", label: "Noliktava", icon: FiArchive },
  ],
  system_admin: [
    { to: "/app/admin/companies", label: "Uzņēmumi", icon: FiHome },
    { to: "/app/admin/users", label: "Lietotāji", icon: FiUsers },
  ],
};
