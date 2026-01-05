// OrderDetail.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { fetchOrderDetail } from "../api/orders";
import "../styles/menu.css";

type OrderDetailPayload = {
  id: number;
  created_at: string;
  company_name: string;
  status: "NEW" | "INP" | "RDY" | "DON" | "CAN" | string;
  order_type: "ON" | "TA" | string;
  notes: string;
  total_amount: string;
  items: Array<{ product_name: string; quantity: number; unit_price: string }>;
};

const statusLabel: Record<string, string> = {
  NEW: "Jauns",
  INP: "Tiek gatavots",
  RDY: "Gatavs",
  DON: "Pabeigts",
  CAN: "Atcelts",
};

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<OrderDetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatMoney = (val: number) => `${val.toFixed(2)} €`;

  useEffect(() => {
    if (!id) return;
    fetchOrderDetail(Number(id)).then((res) => {
      if (res.ok) setData(res.data as OrderDetailPayload);
      else setError(res.data?.detail || "Neizdevās ielādēt pasūtījumu.");
    });
  }, [id]);

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch", gap: 12 }}>
      <div className="page-heading">Pasūtījums #{id}</div>
      <Button variant="ghost" onClick={() => nav(-1)} style={{ width: 140, marginBottom: 8 }}>
        Atpakaļ
      </Button>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {data && (
        <Card className="order-detail-card">
          <div className="order-detail-header">
            <div className="order-detail-meta">
              <div className="order-detail-title">{data.company_name}</div>
              <div className="order-detail-date">{new Date(data.created_at).toLocaleString()}</div>
            </div>
            <div className="badge blue">{statusLabel[data.status] || data.status}</div>
          </div>

          <div className="order-detail-row">
            <span className="order-detail-label">Veids</span>
            <span>{data.order_type === "ON" ? "Uz vietas" : "Līdzi ņemšanai"}</span>
          </div>

          <div className="order-detail-section">
            <div className="order-detail-section-title">Produkti</div>
            <div className="order-detail-items">
              {data.items.map((it, idx) => (
                <div key={idx} className="order-detail-item">
                  <span>{it.product_name}</span>
                  <div className="order-detail-item-price">
                    <span>
                      {it.quantity} x {Number(it.unit_price).toFixed(2)} €
                    </span>
                    <span className="order-detail-item-total">
                      {formatMoney(it.quantity * Number(it.unit_price))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-detail-section">
            <div className="order-detail-section-title">Piezīmes</div>
            <div className="order-detail-notes">{data.notes || "Nav piezīmju"}</div>
          </div>

          <div className="order-detail-summary">
            <div>
              PVN (21%):{" "}
              <strong>{formatMoney(Number(data.total_amount) * 0.21)}</strong>
            </div>
            <div className="order-detail-total">
              Kopsumma: {formatMoney(Number(data.total_amount))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
