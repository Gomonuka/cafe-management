import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiMinus, FiPlus, FiTrash2, FiEdit3 } from "react-icons/fi";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { fetchCart, checkout, setCartItem, removeCartItem, type CartItem } from "../api/orders";

export default function CheckoutPage() {
  const { id } = useParams();
  const companyId = id ? Number(id) : 0;
  const nav = useNavigate();

  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [orderType, setOrderType] = useState<"ON" | "TA">("ON");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!companyId) return;
    void loadCart();
  }, [companyId]);

  const loadCart = async () => {
    setLoading(true);
    const res = await fetchCart(companyId);
    if (res.ok) {
      setItems(res.data.items);
      setTotal(Number(res.data.total_amount));
    } else {
      setError(res.data?.detail || "Neizdevās ielādēt grozu");
    }
    setLoading(false);
  };

  const changeQty = async (item: CartItem, delta: number) => {
    setError(null);
    const next = Math.max(0, item.quantity + delta);
    if (next === item.quantity) return;
    if (next === 0) {
      await removeCartItem(companyId, item.product_id);
    } else {
      await setCartItem(companyId, item.product_id, next);
    }
    await loadCart();
  };

  const deleteItem = async (item: CartItem) => {
    await removeCartItem(companyId, item.product_id);
    await loadCart();
  };

  const subtotal = useMemo(() => items.reduce((sum, it) => sum + Number(it.unit_price) * it.quantity, 0), [items]);
  const vat = subtotal * 0.21;
  const totalDisplay = total || subtotal + vat;

  const onCheckout = async () => {
    setError(null);
    const res = await checkout({ company_id: companyId, order_type: orderType, notes });
    if (!res.ok) {
      setError(res.data?.detail || JSON.stringify(res.data));
      return;
    }
    setMessage("Pasūtījums izveidots");
    setTimeout(() => nav("/app/orders"), 400);
  };

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">Pasūtījums</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      <div className="order-grid">
        <Card>
          <div className="profile-title" style={{ textAlign: "left", margin: "0 0 8px" }}>
            Pasūtījuma saturs
          </div>
          {loading ? (
            <div style={{ padding: 12 }}>Ielāde...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 12, color: "#6b7280" }}>Groza saturs ir tukšs.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((it) => (
                <div
                  key={it.product_id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto auto",
                    gap: 10,
                    alignItems: "center",
                    padding: "6px 8px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#1e73d8" }}>{it.product_name}</div>
                  <div style={{ color: "#0f4e9c" }}>{Number(it.unit_price).toFixed(2)} €</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button className="icon-btn" onClick={() => changeQty(it, -1)}>
                      <FiMinus />
                    </button>
                    <span style={{ fontWeight: 700 }}>{it.quantity}</span>
                    <button className="icon-btn" onClick={() => changeQty(it, +1)}>
                      <FiPlus />
                    </button>
                  </div>
                  <button className="icon-btn danger" onClick={() => deleteItem(it)} title="Dzēst">
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <div className="profile-title" style={{ textAlign: "left", margin: "0 0 8px" }}>
              Pasūtījuma veids
            </div>
            <div className="order-radio">
              <label>
                <input type="radio" checked={orderType === "ON"} onChange={() => setOrderType("ON")} /> Uz vietas
              </label>
              <label>
                <input type="radio" checked={orderType === "TA"} onChange={() => setOrderType("TA")} /> Līdzņemšanai
              </label>
            </div>
          </Card>
          <Card>
            <div className="profile-title" style={{ textAlign: "left", margin: "0 0 8px" }}>
              Piezīmes
            </div>
            <Input
              multiline
              leftIcon={<FiEdit3 />}
              value={notes}
              onChange={setNotes}
              placeholder="Var lūdzu produktam 1 bez cukura"
            />
          </Card>
          <Card>
            <div className="profile-title" style={{ textAlign: "left", margin: "0 0 8px" }}>
              Kopsavilkums
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", lineHeight: 1.9 }}>
              <span>Starpsumma:</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", lineHeight: 1.9 }}>
              <span>PVN (21%):</span>
              <span>{vat.toFixed(2)} €</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, marginTop: 8, lineHeight: 1.9 }}>
              <span>Kopā:</span>
              <span>{totalDisplay.toFixed(2)} €</span>
            </div>
          </Card>
          <Button variant="primary" onClick={onCheckout}>
            Noformēt pasūtījumu
          </Button>
          {message && <div style={{ color: "green" }}>{message}</div>}
        </div>
      </div>
    </div>
  );
}
