import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { fetchCart, checkout } from "../api/orders";
import type { CartItem } from "../api/orders";

export default function CheckoutPage() {
  const { id } = useParams();
  const companyId = id ? Number(id) : 0;
  const nav = useNavigate();

  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<string>("0.00");
  const [orderType, setOrderType] = useState<"ON" | "TA">("ON");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    fetchCart(companyId).then((res) => {
      if (res.ok) {
        setItems(res.data.items);
        setTotal(res.data.total_amount);
      } else {
        setError(res.data?.detail || "Neizdevas ieladet grozu");
      }
    });
  }, [companyId]);

  const onCheckout = async () => {
    setError(null);
    const res = await checkout({ company_id: companyId, order_type: orderType, notes });
    if (!res.ok) {
      setError(res.data?.detail || JSON.stringify(res.data));
      return;
    }
    setMessage("Pasutijums izveidots");
    setTimeout(() => nav("/app/orders"), 400);
  };

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">Pasutijums</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      <div className="order-grid">
        <Card>
          <div className="profile-title" style={{ textAlign: "left", margin: "0 0 8px" }}>
            Pasutijuma saturs
          </div>
          {items.map((it) => (
            <div key={it.product_id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <div>{it.product_name}</div>
              <div>
                {it.quantity} x {it.unit_price} €
              </div>
            </div>
          ))}
          <div style={{ fontWeight: 800, marginTop: 8 }}>Kopsumma: {total} €</div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <div className="profile-title" style={{ textAlign: "left", margin: "0 0 8px" }}>
              Pasutijuma veids
            </div>
            <label>
              <input type="radio" checked={orderType === "ON"} onChange={() => setOrderType("ON")} /> Uz vietas
            </label>
            <label style={{ marginTop: 6 }}>
              <input type="radio" checked={orderType === "TA"} onChange={() => setOrderType("TA")} /> Lidznesanai
            </label>
          </Card>
          <Card>
            <div className="profile-title" style={{ textAlign: "left", margin: "0 0 8px" }}>
              Piezimes
            </div>
            <Input multiline value={notes} onChange={setNotes} placeholder="Var ludzu produktam 1 bez cukura" />
          </Card>
          <Button variant="primary" onClick={onCheckout}>
            Noformet pasutijumu
          </Button>
          {message && <div style={{ color: "green" }}>{message}</div>}
        </div>
      </div>
    </div>
  );
}
