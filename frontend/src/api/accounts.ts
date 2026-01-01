import { request } from "./client";

export type UserRole = "client" | "employee" | "company_admin" | "system_admin";

export type MeResponse = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  company?: number | null;
  secret_question?: number | null;
  secret_question_text?: string | null;
  requires_profile_completion?: boolean;
  requires_company_creation?: boolean;
  has_secret_answer?: boolean;
};

export async function fetchMe() {
  return request<MeResponse>({ url: "/accounts/me/", method: "GET" });
}

export async function updateMe(data: FormData) {
  return request<MeResponse>({
    url: "/accounts/me/",
    method: "PATCH",
    data,
  });
}

export async function deleteMe() {
  return request({ url: "/accounts/me/delete/", method: "POST" });
}

export async function changePassword(new_password: string, repeat_password: string) {
  const fd = new FormData();
  fd.append("new_password", new_password);
  fd.append("repeat_password", repeat_password);
  return request({ url: "/accounts/me/", method: "PATCH", data: fd });
}

export async function fetchSecretQuestions() {
  return request<Array<{ id: number; text: string }>>({
    url: "/accounts/auth/secret-questions/",
    method: "GET",
  });
}

export type AdminUser = { id: number; username: string; role: UserRole; is_blocked?: boolean };

export async function fetchAdminUsers() {
  return request<AdminUser[]>({ url: "/accounts/admin/users/", method: "GET" });
}

export async function blockAdminUser(userId: number) {
  return request({ url: `/accounts/admin/users/${userId}/block/`, method: "POST" });
}

export async function deleteAdminUser(userId: number) {
  return request({ url: `/accounts/admin/users/${userId}/delete/`, method: "POST" });
}

export type Employee = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar?: string | null;
};

export async function fetchEmployees() {
  return request<Employee[]>({ url: "/accounts/company/employees/", method: "GET" });
}

export async function createEmployee(data: FormData) {
  return request<Employee>({
    url: "/accounts/company/employees/create/",
    method: "POST",
    data,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function updateEmployee(employeeId: number, data: FormData) {
  return request<Employee>({
    url: `/accounts/company/employees/${employeeId}/update/`,
    method: "PATCH",
    data,
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function deleteEmployee(employeeId: number) {
  return request({ url: `/accounts/company/employees/${employeeId}/delete/`, method: "POST" });
}
