import { request } from "./client";

export type CartItem = {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

export type CartResponse = {
  items: CartItem[];
  total_amount: string;
};

export async function fetchCart(companyId: number) {
  return request<CartResponse>({
    url: `/orders/cart/${companyId}/`,
    method: "GET",
  });
}

export async function setCartItem(companyId: number, product_id: number, quantity: number) {
  return request({
    url: `/orders/cart/${companyId}/`,
    method: "POST",
    data: { product_id, quantity },
  });
}

export async function removeCartItem(companyId: number, product_id: number) {
  return request({
    url: `/orders/cart/${companyId}/`,
    method: "DELETE",
    params: { product_id },
  });
}

export async function checkout(data: { company_id: number; order_type: "ON" | "TA"; notes?: string }) {
  return request({
    url: "/orders/orders/checkout/",
    method: "POST",
    data,
  });
}

export type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

export type ClientOrder = {
  id: number;
  status: string;
  order_type: string;
  notes: string;
  total_amount: string;
  created_at: string;
  company_name: string;
  items: OrderItem[];
};

export async function fetchMyOrders() {
  return request<{ active: ClientOrder[]; finished: ClientOrder[] }>({
    url: "/orders/orders/my/",
    method: "GET",
  });
}

export async function cancelOrder(orderId: number) {
  return request({
    url: `/orders/orders/${orderId}/cancel/`,
    method: "POST",
  });
}

// Company admin/employee: kanban
export type CompanyOrder = {
  id: number;
  created_at: string;
  order_type: "ON" | "TA";
  total_amount: string;
  status: "NEW" | "INP" | "RDY" | "DON" | "CAN";
};

export async function fetchCompanyOrders() {
  return request<{ active: CompanyOrder[]; finished: CompanyOrder[] }>({
    url: "/orders/company/orders/",
    method: "GET",
  });
}

export async function changeOrderStatus(orderId: number, new_status: CompanyOrder["status"]) {
  return request({
    url: `/orders/company/orders/${orderId}/status/`,
    method: "POST",
    data: { new_status },
  });
}

export async function fetchOrderDetail(orderId: number) {
  return request({
    url: `/orders/company/orders/${orderId}/`,
    method: "GET",
  });
}

export type OrderStats = {
  total_orders: number;
  avg_order_amount: string;
  most_popular_product: { product_id: number; product__name: string; total_qty: string } | null;
  top_products: Array<{ product_id: number; product__name: string; total_qty: string }>;
  sales_by_day: Array<{ d: string; total: string }>;
};

export async function fetchOrderStats() {
  return request<OrderStats>({
    url: "/orders/company/orders/stats/",
    method: "GET",
  });
}
