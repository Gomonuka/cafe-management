const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ACCESS_KEY = "crms_access";
const REFRESH_KEY = "crms_refresh";

export const tokenStorage = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  setTokens(tokens: { access?: string; refresh?: string }) {
    if (tokens.access) localStorage.setItem(ACCESS_KEY, tokens.access);
    if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

async function rawRequest(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: unknown } = {}
) {
  const { body, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(rest.headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return { ok: true, status: 204, data: null };
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  return { ok: res.ok, status: res.status, data };
}

async function refreshAccess(): Promise<boolean> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return false;

  const res = await rawRequest("/api/auth/refresh/", {
    method: "POST",
    body: { refresh },
  });

  if (!res.ok || !res.data?.access) return false;

  tokenStorage.setTokens({ access: res.data.access });
  return true;
}

export async function apiRequest(
  path: string,
  options: { method?: string; body?: any; auth?: boolean } = {}
) {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};

  if (auth) {
    const access = tokenStorage.getAccess();
    if (access) headers.Authorization = `Bearer ${access}`;
  }

  let res = await rawRequest(path, { method, body, headers });

  if (auth && (res.status === 401 || res.status === 403)) {
    const refreshed = await refreshAccess();
    if (refreshed) {
      const access = tokenStorage.getAccess();
      res = await rawRequest(path, {
        method,
        body,
        headers: { Authorization: `Bearer ${access}` },
      });
    }
  }

  return res;
}

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function raw<T>(path: string, init: RequestInit = {}): Promise<T> {
  const access = localStorage.getItem("access");

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw data ?? { detail: "Request failed" };
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => raw<T>(path),
  post: <T>(path: string, body?: unknown) =>
    raw<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    raw<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => raw<T>(path, { method: "DELETE" }),
};
