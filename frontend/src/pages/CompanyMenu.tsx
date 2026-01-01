import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiInfo, FiMinus, FiPlus } from "react-icons/fi";
import Button from "../components/ui/Button";
import { fetchMenu, type MenuCategoryPublic } from "../api/menu";
import { fetchCart, removeCartItem, setCartItem } from "../api/orders";
import "../styles/profile.css";

export default function CompanyMenu() {
  const { id } = useParams();
  const companyId = id ? Number(id) : 0;
  const nav = useNavigate();

  const [categories, setCategories] = useState<MenuCategoryPublic[]>([]);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadMenu = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    const res = await fetchMenu(companyId);
    if (res.ok) setCategories(res.data.categories);
    else setError(res.data?.detail || "Neizdevas ieladet edienkarti");
    setLoading(false);
  };

  const loadCart = async () => {
    if (!companyId) return;
    const res = await fetchCart(companyId);
    if (res.ok) {
      const map: Record<number, number> = {};
      res.data.items.forEach((i) => (map[i.product_id] = i.quantity));
      setQty(map);
    }
  };

  useEffect(() => {
    void loadMenu();
    void loadCart();
  }, [companyId]);

  const totalItems = useMemo(() => Object.values(qty).reduce((a, b) => a + b, 0), [qty]);

  const changeQty = async (productId: number, delta: number) => {
    const current = qty[productId] || 0;
    const next = Math.max(0, current + delta);
    if (!companyId) return;
    try {
      if (next === 0) {
        await removeCartItem(companyId, productId);
        setToast("Produkts nonemts (P_016)");
      } else {
        await setCartItem(companyId, productId, next);
        setToast("Produkts pievienots (P_015)");
      }
      setQty((prev) => ({ ...prev, [productId]: next }));
      setTimeout(() => setToast(null), 1800);
    } catch (e) {
      setError("Neizdevas atjauninat grozu");
    }
  };

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">Edienkarte</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {loading && <div style={{ padding: 12 }}>Ielade...</div>}

      {!loading &&
        categories.map((cat) => (
          <section key={cat.id} className="section">
            <div className="section-header">
              <div>
                <div className="profile-title" style={{ margin: 0, textAlign: "left" }}>
                  {cat.name}
                </div>
                {cat.description && <div style={{ color: "#4b5563", fontSize: 13 }}>{cat.description}</div>}
              </div>
            </div>

            <div className="category-grid">
              {cat.products.map((p) => {
                const count = qty[p.id] || 0;
                return (
                  <div key={p.id} className="product-card">
                    <div className="product-thumb" />
                    <div style={{ fontWeight: 800, color: "#1e73d8" }}>{p.name}</div>
                    <div className="pill">{p.price} €</div>
                    {!p.is_available ? (
                      <div className="pill gray" style={{ width: "fit-content" }}>
                        Nav pieejams
                      </div>
                    ) : (
                      <div className="product-actions">
                        <div className="qty-chip">
                          <button className="icon-btn" onClick={() => changeQty(p.id, -1)}>
                            <FiMinus />
                          </button>
                          <span style={{ fontWeight: 700 }}>{count}</span>
                          <button className="icon-btn" onClick={() => changeQty(p.id, +1)}>
                            <FiPlus />
                          </button>
                        </div>
                        <Button variant="primary" onClick={() => changeQty(p.id, +1)}>
                          Pievienot
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

      <div className="bottom-bar">
        <div className="pill gray">
          <FiInfo />
          Groza daudzums: {totalItems}
        </div>
        <Button variant="primary" onClick={() => nav(`/app/companies/${companyId}/checkout`)}>
          Izveidot pasutijumu
        </Button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
