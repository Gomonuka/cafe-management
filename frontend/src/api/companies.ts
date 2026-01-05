//  frontend/src/api/companies.ts
import { request } from "./client";

export type PublicCompany = {
  id: number;
  logo: string | null;
  name: string;
  address_line: string;
  city: string;
  country: string;
  working_hours: { weekday: number; from_time: string; to_time: string }[];
  open_now: boolean;
};

export type CompanyDetail = {
  id: number;
  name: string;
  logo: string | null;
  address_line: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  description: string;
  working_hours: { weekday: number; from_time: string; to_time: string }[];
  is_active: boolean;
  is_blocked: boolean;
  deleted_at: string | null;
};

export type AdminCompany = { id: number; name: string; status: string; is_blocked?: boolean };

export async function listCompanies(params?: { search?: string; sort?: "asc" | "desc" }) {
  return request<PublicCompany[]>({
    url: "/companies/",
    method: "GET",
    params,
  });
}

export async function listCities() {
  return request<{ cities: string[] }>({
    url: "/companies/cities/",
    method: "GET",
  });
}

export async function filterByCity(city: string) {
  return request<PublicCompany[]>({
    url: "/companies/filter/",
    method: "GET",
    params: { city },
  });
}

export async function getCompanyDetail(id: number) {
  return request<CompanyDetail>({
    url: `/companies/${id}/`,
    method: "GET",
  });
}

export async function createCompany(data: FormData) {
  return request({
    url: "/companies/me/create/",
    method: "POST",
    data,
  });
}

export async function updateCompany(data: FormData) {
  return request({
    url: "/companies/me/update/",
    method: "PUT",
    data,
  });
}

export async function deactivateCompany() {
  return request({
    url: "/companies/me/deactivate/",
    method: "POST",
  });
}

export async function deleteMyCompany() {
  return request({
    url: "/companies/me/delete/",
    method: "POST",
  });
}

export async function adminListCompanies() {
  return request<AdminCompany[]>({
    url: "/companies/",
    method: "GET",
  });
}

export async function adminBlockCompany(id: number) {
  return request({
    url: `/admin/companies/${id}/block/`,
    method: "POST",
  });
}

export async function adminDeleteCompany(id: number) {
  return request({
    url: `/admin/companies/${id}/delete/`,
    method: "POST",
  });
}
