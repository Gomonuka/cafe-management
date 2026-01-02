import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

// Backend URL bez papildu /api prefiksa (Django ceļi sākas ar /accounts/, /companies/ u.c.)
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL.replace(/\/$/, ""),
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isRefreshCall = original?.url?.includes("/accounts/auth/refresh/");
    if (error.response?.status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true;
      try {
        await api.post("/accounts/auth/refresh/");
        return api(original);
      } catch {
        // fall through
      }
    }
    return Promise.reject(error);
  }
);

export type ApiResult<T> = { ok: true; data: T; status: number } | { ok: false; data: any; status: number };

export async function request<T = any>(config: Parameters<typeof api.request>[0]): Promise<ApiResult<T>> {
  try {
    const res = await api.request<T>(config);
    return { ok: true, data: res.data, status: res.status };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return { ok: false, data: err.response.data, status: err.response.status };
    }
    // вместо проглатывания — вернуть понятную ошибку, чтобы отрисовать её
    return { ok: false, data: "Nezināma kļūda.", status: 0 };
  }
}
