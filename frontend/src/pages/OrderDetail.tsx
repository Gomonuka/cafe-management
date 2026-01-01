import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { fetchOrderDetail } from "../api/orders";

type OrderDetailPayload = {
  id: number;
  created_at: string;
  company_name: string;
  status: string;
  order_type: string;
  notes: string;
  total_amount: string;
  items: Array<{ product_name: string; quantity: number; unit_price: string }>;
};

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<OrderDetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchOrderDetail(Number(id)).then((res) => {
      if (res.ok) setData(res.data as OrderDetailPayload);
      else setError(res.data?.detail || "Neizdevas ieladet pasutijumu.");
    });
  }, [id]);

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">Pasutijums #{id}</div>
      <Button variant="ghost" onClick={() => nav(-1)} style={{ width: "fit-content", marginBottom: 8 }}>
        Atpakal
      </Button>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {data && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 800, color: "#1e73d8" }}>{data.company_name}</div>
              <div style={{ color: "#4b5563", fontSize: 13 }}>{new Date(data.created_at).toLocaleString()}</div>
            </div>
            <div className="badge blue">{data.status}</div>
          </div>
          <div style={{ marginBottom: 8 }}>
            Veids: {data.order_type === "ON" ? "Uz vietas" : "Lidznesanai"}
          </div>
          <div className="profile-section">
            <h4>Produkti</h4>
            {data.items.map((it, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span>{it.product_name}</span>
                <span>
                  {it.quantity} x {it.unit_price} €
                </span>
              </div>
            ))}
          </div>
          <div className="profile-section">
            <h4>Piezimes</h4>
            <div>{data.notes || "—"}</div>
          </div>
          <div style={{ marginTop: 10, fontWeight: 800 }}>Kopsumma: {data.total_amount} €</div>
        </Card>
      )}
    </div>
  );
}
