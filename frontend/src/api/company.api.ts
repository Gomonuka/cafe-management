import { apiGet, apiPatch, apiPost, apiDelete } from "./client";

export async function getCompany(companyId: string) {
  return apiGet(`/companies/${companyId}/`);
}

export async function updateCompany(companyId: string, payload: any) {
  return apiPatch(`/companies/${companyId}/`, payload);
}

export async function deactivateCompany(companyId: string) {
  return apiPost(`/companies/${companyId}/deactivate/`, {});
}

export async function deleteCompany(companyId: string) {
  return apiDelete(`/companies/${companyId}/`);
}

export async function getCompanyWorkingHours(companyId: string) {
  // если у тебя другой endpoint — скажешь, поменяем
  return apiGet(`/company-working-hours/?company=${companyId}`);
}

// делаем “upsert”: если есть id — patch, иначе post
export async function upsertCompanyWorkingHours(companyId: string, rows: any[]) {
  // если бэк у тебя не умеет так — сделаем позже пачку на бэке
  // пока просто отправим на кастомный endpoint, который ты добавишь
  return apiPost(`/company-working-hours/upsert/`, { company: companyId, rows });
}
