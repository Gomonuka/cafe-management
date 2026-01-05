//  frontend/src/cart/cart.types.ts
export type CartItem = {
  productId: number;
  name: string;
  price: number; // par 1 vienību
  qty: number;
};

export type CartState = {
  companyId: string | null;
  items: Record<number, CartItem>; // productId -> item
};

export type CartContextValue = {
  cart: CartState;

  setCompany: (companyId: string) => void;
  clear: () => void;

  add: (product: { productId: number; name: string; price: number }, amount?: number) => void;
  dec: (productId: number, amount?: number) => void;
  remove: (productId: number) => void;

  totalQty: number;
  subtotal: number;
};
