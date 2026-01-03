import { useEffect, useState } from "react";
import { cancelOrder, fetchMyOrders, type ClientOrder } from "../api/orders";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const statusLabel: Record<string, string> = {
  NEW: "Jauns",
  IN_PROGRESS: "Tiek gatavots",
  READY: "Gatavs",
  DONE: "Pabeigts",
  DON: "Pabeigts",
  CANCELLED: "Atcelts",
  CAN: "Atcelts",
};

const orderTypeLabel: Record<string, string> = {
  ON: "Uz vietas",
  TA: "Līdzņemšanai",
};

function formatDate(d: string) {
  const date = new Date(d);
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const time = date.toLocaleTimeString("lv-LV", opts);
  const day = date.toLocaleDateString("lv-LV");
  return `${time}, ${day}`;
}

function OrderBlock({ order, onCancel }: { order: ClientOrder; onCancel?: (id: number) => void }) {
  const badgeClass =
    order.status === "NEW"
      ? "badge blue"
      : order.status === "CANCELLED"
      ? "badge red"
      : order.status === "DONE" || order.status === "DON"
      ? "badge gray"
      : "badge gray";

  return (
    <Card style={{ marginBottom: 14, boxShadow: "0 18px 32px rgba(30,115,216,0.12)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontWeight: 700, color: "#0f172a" }}>
          <span>Pasūtījums #{order.id}</span>
          <span>{formatDate(order.created_at)}</span>
          <span>Restorāns “{order.company_name}”</span>
        </div>
        <div className={badgeClass}>{statusLabel[order.status] || order.status}</div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "linear-gradient(135deg, #f7f9ff, #eef3ff)",
          borderRadius: 14,
          padding: "12px 14px",
          border: "1px solid #d8e2f2",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontWeight: 800, color: "#1e73d8" }}>Produkti:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {order.items.map((it, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  background: "#fff",
                  borderRadius: 10,
                  border: "1px solid #e1e8f5",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.03)",
                }}
              >
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {it.product_name} x {it.quantity}
                </span>
                <span style={{ fontWeight: 800, color: "#1e73d8" }}>{Number(it.unit_price).toFixed(2)} €</span>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 800, color: "#0f172a", marginTop: 6 }}>
            Kopsumma: {Number(order.total_amount).toFixed(2)} €
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontWeight: 800, color: "#1e73d8" }}>
            Pasūtījuma veids: <span style={{ color: "#0f172a" }}>{orderTypeLabel[order.order_type] || order.order_type}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontWeight: 800, color: "#1e73d8" }}>Piezīmes</div>
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e1e8f5",
                padding: "10px 12px",
                color: "#0f172a",
                minHeight: 48,
                boxShadow: "inset 0 1px 0 rgba(0,0,0,0.02)",
              }}
            >
              {order.notes || "—"}
            </div>
          </div>
        </div>
      </div>

      {onCancel && order.status === "NEW" && (
        <div style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={() => onCancel(order.id)} className="btn-full">
            Atcelt
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function MyOrders() {
  const [active, setActive] = useState<ClientOrder[]>([]);
  const [finished, setFinished] = useState<ClientOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const res = await fetchMyOrders();
    if (res.ok) {
      setActive(res.data.active);
      setFinished(res.data.finished);
    } else {
      setError(res.data?.detail || "Neizdevās ielādēt pasūtījumus");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCancel = async (id: number) => {
    await cancelOrder(id);
    await load();
  };

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">Mani pasūtījumi</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}

      <div className="order-grid">
        <Card>
          <div className="profile-title" style={{ textAlign: "left", margin: "0 0 8px" }}>
            Aktīvie pasūtījumi
          </div>
          {active.length === 0 && <div style={{ padding: 8 }}>Nav aktīvu pasūtījumu.</div>}
          {active.map((o) => (
            <OrderBlock key={o.id} order={o} onCancel={onCancel} />
          ))}
        </Card>

        <Card>
          <div className="profile-title" style={{ textAlign: "left", margin: "0 0 8px" }}>
            Pabeigtie pasūtījumi
          </div>
          {finished.length === 0 && <div style={{ padding: 8 }}>Nav pabeigtu pasūtījumu.</div>}
          {finished.map((o) => (
            <OrderBlock key={o.id} order={o} />
          ))}
        </Card>
      </div>
    </div>
  );
}
