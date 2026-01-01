import { request } from "./client";

export type InventoryItem = {
  id: number;
  name: string;
  quantity: string;
  unit: string;
};

export async function fetchInventory() {
  return request<InventoryItem[]>({
    url: "/inventory/",
    method: "GET",
  });
}

export async function createInventoryItem(payload: { name: string; quantity: number; unit: string }) {
  return request({
    url: "/inventory/create/",
    method: "POST",
    data: payload,
  });
}

export async function updateInventoryItem(
  itemId: number,
  payload: { name?: string; quantity: number; unit?: string },
) {
  return request({
    url: `/inventory/${itemId}/update/`,
    method: "PUT",
    data: payload,
  });
}

export async function deleteInventoryItem(itemId: number) {
  return request({
    url: `/inventory/${itemId}/delete/`,
    method: "POST",
  });
}
