import { request } from "./client";

export type MenuCategoryPublic = {
  id: number;
  name: string;
  description: string;
  products: Array<{
    id: number;
    name: string;
    price: string;
    is_available: boolean;
    available_quantity?: number;
  }>;
};

export type MenuPublicResponse = {
  categories: MenuCategoryPublic[];
};

export async function fetchMenu(companyId: number) {
  return request<MenuPublicResponse>({
    url: `/menu/${companyId}/`,
    method: "GET",
  });
}

// Admin endpoints
export async function fetchMenuAdmin(companyId: number) {
  return request<{
    categories: Array<{ id: number; name: string }>;
    products: Array<{ id: number; name: string; price: string; is_available: boolean; available_quantity?: number; category_id: number }>;
  }>({
    url: `/menu/${companyId}/`,
    method: "GET",
  });
}

export async function createCategory(payload: { name: string; description?: string; is_active: boolean }) {
  return request({
    url: "/menu/categories/create/",
    method: "POST",
    data: payload,
  });
}

export async function updateCategory(category_id: number, payload: { name: string; description?: string; is_active: boolean }) {
  return request({
    url: `/menu/categories/${category_id}/update/`,
    method: "PUT",
    data: payload,
  });
}

export async function deleteCategory(category_id: number) {
  return request({
    url: `/menu/categories/${category_id}/delete/`,
    method: "POST",
  });
}

export type ProductPayload = {
  name: string;
  category: number;
  is_available: boolean;
  price: string;
  photo: File;
  recipe: Array<{ inventory_item_id: number; amount: number }>;
};

export async function createProduct(payload: ProductPayload) {
  const fd = new FormData();
  fd.append("name", payload.name);
  fd.append("category", String(payload.category));
  fd.append("is_available", String(payload.is_available));
  fd.append("price", payload.price);
  fd.append("photo", payload.photo);
  // Primary: send recipe as JSON string
  fd.append("recipe", JSON.stringify(payload.recipe));
  // Fallback: also send flat keys to satisfy parsers that ignore JSON field in multipart
  payload.recipe.forEach((r, idx) => {
    fd.append(`recipe[${idx}][inventory_item_id]`, String(r.inventory_item_id));
    fd.append(`recipe[${idx}][amount]`, String(r.amount));
  });
  return request({
    url: "/menu/products/create/",
    method: "POST",
    data: fd,
  });
}

export async function updateProduct(product_id: number, payload: Omit<ProductPayload, "photo"> & { photo?: File }) {
  const fd = new FormData();
  fd.append("name", payload.name);
  fd.append("category", String(payload.category));
  fd.append("is_available", String(payload.is_available));
  fd.append("price", payload.price);
  if (payload.photo) fd.append("photo", payload.photo);
  fd.append("recipe", JSON.stringify(payload.recipe));
  payload.recipe.forEach((r, idx) => {
    fd.append(`recipe[${idx}][inventory_item_id]`, String(r.inventory_item_id));
    fd.append(`recipe[${idx}][amount]`, String(r.amount));
  });
  return request({
    url: `/menu/products/${product_id}/update/`,
    method: "PUT",
    data: fd,
  });
}

export async function deleteProduct(product_id: number) {
  return request({
    url: `/menu/products/${product_id}/delete/`,
    method: "POST",
  });
}

export async function fetchProductRecipe(productId: number) {
  return request<{ product_id: number; recipe: Array<{ inventory_item_id: number; inventory_item_name: string; amount: string }> }>({
    url: `/menu/products/${productId}/recipe/`,
    method: "GET",
  });
}

export async function updateProductRecipe(product_id: number, recipe: Array<{ inventory_item_id: number; amount: number }>) {
  return request({
    url: `/menu/products/${product_id}/recipe/`,
    method: "PUT",
    data: { recipe },
  });
}
