//  frontend/src/cart/CartContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import type { CartContextValue, CartItem, CartState } from "./cart.types";

const CartContext = createContext<CartContextValue | null>(null);

const empty: CartState = { companyId: null, items: {} };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(empty);

  const setCompany = (companyId: string) => {
    setCart((prev) => {
      // ja maina uzņēmumu — attīram, lai nesajauktu grozus
      if (prev.companyId && prev.companyId !== companyId) return { companyId, items: {} };
      return { ...prev, companyId };
    });
  };

  const clear = () => setCart(empty);

  const add: CartContextValue["add"] = (product, amount = 1) => {
    setCart((prev) => {
      const existing = prev.items[product.productId];
      const nextQty = (existing?.qty || 0) + amount;

      const nextItem: CartItem = {
        productId: product.productId,
        name: product.name,
        price: product.price,
        qty: nextQty,
      };

      return {
        ...prev,
        items: { ...prev.items, [product.productId]: nextItem },
      };
    });
  };

  const dec: CartContextValue["dec"] = (productId, amount = 1) => {
    setCart((prev) => {
      const existing = prev.items[productId];
      if (!existing) return prev;

      const nextQty = existing.qty - amount;
      const nextItems = { ...prev.items };

      if (nextQty <= 0) delete nextItems[productId];
      else nextItems[productId] = { ...existing, qty: nextQty };

      return { ...prev, items: nextItems };
    });
  };

  const remove: CartContextValue["remove"] = (productId) => {
    setCart((prev) => {
      if (!prev.items[productId]) return prev;
      const nextItems = { ...prev.items };
      delete nextItems[productId];
      return { ...prev, items: nextItems };
    });
  };

  const itemsArr = useMemo(() => Object.values(cart.items), [cart.items]);

  const totalQty = useMemo(() => itemsArr.reduce((s, it) => s + it.qty, 0), [itemsArr]);
  const subtotal = useMemo(() => itemsArr.reduce((s, it) => s + it.qty * it.price, 0), [itemsArr]);

  const value: CartContextValue = {
    cart,
    setCompany,
    clear,
    add,
    dec,
    remove,
    totalQty,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
