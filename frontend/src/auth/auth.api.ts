import { apiRequest, tokenStorage } from "../api/client";

export async function register(payload: {
  username: string;
  email: string;
  password: string;
  role: "client" | "company_admin";
}) {
  return apiRequest("/api/auth/register/", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export async function login(payload: { username: string; password: string }) {
  const res = await apiRequest("/api/auth/login/", {
    method: "POST",
    body: payload,
    auth: false,
  });

  if (res.ok && res.data?.access && res.data?.refresh) {
    tokenStorage.setTokens(res.data);
  }

  return res;
}

export async function logout() {
  const refresh = tokenStorage.getRefresh();
  tokenStorage.clear();

  if (refresh) {
    await apiRequest("/api/auth/logout/", {
      method: "POST",
      body: { refresh },
      auth: false,
    });
  }
}

export async function getMe() {
  return apiRequest("/api/me/");
}

export async function requestPasswordReset(email: string) {
  return apiRequest("/api/auth/password-reset/", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export async function confirmPasswordReset(payload: {
  uid: string;
  token: string;
  new_password: string;
}) {
  return apiRequest("/api/auth/password-reset/confirm/", {
    method: "POST",
    body: payload,
    auth: false,
  });
}
