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
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const loadMenu = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    const res = await fetchMenu(companyId);
    if (res.ok) setCategories(res.data.categories);
    else setError(res.data?.detail || "Neizdevās ielādēt ēdienkarti");
    setLoading(false);
  };

  const loadCart = async () => {
    if (!companyId) return;
    const res = await fetchCart(companyId);
    if (res.ok) {
      const map: Record<number, number> = {};
      res.data.items.forEach((i) => (map[i.product_id] = i.quantity));
      setQty(map);
      setTotalAmount(Number(res.data.total_amount));
    }
  };

  useEffect(() => {
    void loadMenu();
    void loadCart();
  }, [companyId]);

  const totalItems = useMemo(() => Object.values(qty).reduce((a, b) => a + b, 0), [qty]);

  const changeQty = async (product: { id: number; available_quantity?: number }, delta: number) => {
    const current = qty[product.id] || 0;
    const max = product.available_quantity ?? Number.MAX_SAFE_INTEGER;
    if (max <= 0) {
      setError("Šim produktam nepietiek noliktavas atlikuma.");
      return;
    }
    const next = Math.max(0, Math.min(max, current + delta));
    if (next === current) return;
    if (!companyId) return;
    try {
      if (next === 0) {
        await removeCartItem(companyId, product.id);
        setToast("Produkts noņemts (P_016)");
      } else {
        await setCartItem(companyId, product.id, next);
        setToast("Produkts pievienots (P_015)");
      }
      await loadCart();
      setTimeout(() => setToast(null), 1800);
    } catch (e) {
      setError("Neizdevās atjaunināt grozu");
    }
  };

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">Ēdienkarte</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {loading && <div style={{ padding: 12 }}>Ielāde...</div>}

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

            {cat.products.length === 0 ? (
              <div style={{ padding: 12, color: "#6b7280" }}>Šajā kategorijā nav pieejamu produktu.</div>
            ) : (
              <div className="products-grid">
                {cat.products.map((p) => {
                  const count = qty[p.id] || 0;
                  const available = p.available_quantity ?? 0;
                  const canAdd = p.is_available && available > 0;
                  return (
                    <div key={p.id} className="product-card">
                      <div className="product-thumb" />
                      <div className="product-name">{p.name}</div>
                      <div className="pill">{Number(p.price).toFixed(2)} €</div>
                      <div className="pill gray">Pieejams: {available}</div>
                      {!canAdd ? (
                        <div className="pill gray" style={{ width: "fit-content" }}>
                          Nav pieejams
                        </div>
                      ) : (
                        <div className="product-actions">
                          <div className="qty-chip">
                            <button className="icon-btn" onClick={() => changeQty(p, -1)}>
                              <FiMinus />
                            </button>
                            <span style={{ fontWeight: 700 }}>{count}</span>
                            <button className="icon-btn" onClick={() => changeQty(p, +1)} disabled={count >= available}>
                              <FiPlus />
                            </button>
                          </div>
                          <Button variant="primary" onClick={() => changeQty(p, +1)} disabled={count >= available}>
                            Pievienot
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ))}

      <div className="bottom-bar">
        <div className="pill gray bottom-pill">
          <FiInfo />
          Groza daudzums: {totalItems}
        </div>
        <div className="pill gray bottom-pill">Summa: {totalAmount.toFixed(2)} €</div>
        <Button variant="primary" onClick={() => nav(`/app/companies/${companyId}/checkout`)}>
          Izveidot pasūtījumu
        </Button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
