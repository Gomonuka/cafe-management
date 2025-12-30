import { useEffect, useState } from "react";
import { api } from "../api/client";

export type MeUser = {
  id: number;
  username: string;
  email: string;
  role: "client" | "employee" | "company_admin" | "system_admin";
  language?: string;
  theme?: string;
  company?: number | null; // или объект — тогда поменяй проверку в RequireCompany
};

export function useMe() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const access = localStorage.getItem("access");
        if (!access) {
          if (mounted) setUser(null);
          return;
        }
        const me = await api.get<MeUser>("/api/me/");
        if (mounted) setUser(me);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  return { user, loading, setUser };
}
