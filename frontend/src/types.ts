export type Role = "client" | "employee" | "company_admin" | "system_admin";

export type User = {
  id: number;
  username: string;
  email: string;
  role: Role;
  is_blocked: boolean;
  language?: string;
  theme?: string;
  company?: number | null;
};
