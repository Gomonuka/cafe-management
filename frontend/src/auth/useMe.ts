import { useEffect, useState } from "react";
import { getMe } from "./auth.api";

export type MeUser = {
  id: number;
  username: string;
  email: string;
  role: "client" | "employee" | "company_admin" | "system_admin";
  company?: number | null;
  requires_profile_completion?: boolean;
  requires_company_creation?: boolean;
};

export function useMe() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function run() {
      const res = await getMe();
      if (!mounted) return;
      if (res.ok) setUser(res.data as MeUser);
      else setUser(null);
      setLoading(false);
    }
    run();
    return () => {
      mounted = false;
    };
  }, []);

  return { user, loading, setUser };
}
