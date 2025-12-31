import { request } from "../api/client";

export async function register(payload: {
  username: string;
  email: string;
  password: string;
  role: "client" | "company_admin";
  auto_login?: boolean;
}) {
  return request({
    url: "/accounts/auth/register/",
    method: "POST",
    data: payload,
  });
}

export async function login(payload: { email: string; password: string }) {
  return request({
    url: "/accounts/auth/login/",
    method: "POST",
    data: payload,
  });
}

export async function logout() {
  return request({
    url: "/accounts/auth/logout/",
    method: "POST",
  });
}

export async function getMe() {
  return request({
    url: "/accounts/me/",
    method: "GET",
  });
}

export async function requestPasswordReset(email: string, frontend_url?: string) {
  return request({
    url: "/accounts/auth/password-reset/request/",
    method: "POST",
    data: { email, frontend_url },
  });
}

export async function confirmPasswordReset(payload: {
  uid: string;
  token: string;
  new_password: string;
  repeat_password: string;
}) {
  return request({
    url: "/accounts/auth/password-reset/confirm/",
    method: "POST",
    data: payload,
  });
}
