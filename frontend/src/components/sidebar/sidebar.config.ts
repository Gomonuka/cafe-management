import {
  FiCoffee,
  FiClipboard,
  FiBookOpen,
  FiBox,
  FiBarChart2,
  FiUsers,
  FiMail,
  FiHome,
} from "react-icons/fi";

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
    { to: "/app/my-orders", label: "Mani pasūtījumi", icon: FiClipboard },
  ],
  company_admin: [
    { to: "/app/company", label: "Mans uzņēmums", icon: FiHome },
    { to: "/app/orders", label: "Pasūtījumi", icon: FiClipboard },
    { to: "/app/menu", label: "Ēdienkarte", icon: FiBookOpen },
    { to: "/app/inventory", label: "Noliktava", icon: FiBox },
    { to: "/app/analytics", label: "Statistika", icon: FiBarChart2 },
    { to: "/app/employees", label: "Darbinieki", icon: FiUsers },
    { to: "/app/email-log", label: "E-pastu žurnāls", icon: FiMail },
  ],
  employee: [
    { to: "/app/orders", label: "Pasūtījumi", icon: FiClipboard },
    { to: "/app/inventory", label: "Noliktava", icon: FiBox },
  ],
  system_admin: [
    { to: "/app/companies", label: "Uzņēmumi", icon: FiCoffee },
    { to: "/app/users", label: "Lietotāji", icon: FiUsers },
    { to: "/app/emails", label: "E-pasti", icon: FiMail },
  ],
};
