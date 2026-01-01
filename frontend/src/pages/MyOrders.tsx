import { useEffect, useState } from "react";
import { cancelOrder, fetchMyOrders, type ClientOrder } from "../api/orders";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

function OrderBlock({ order, onCancel }: { order: ClientOrder; onCancel?: (id: number) => void }) {
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          Pasutijums #{order.id} — {order.company_name}
        </div>
        <div className={order.status === "NEW" ? "badge blue" : order.status === "CANCELLED" ? "badge red" : "badge gray"}>
          {order.status}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {order.items.map((it, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{it.product_name}</span>
            <span>
              {it.quantity} x {it.unit_price} €
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
        <span>Piezimes: {order.notes || "—"}</span>
        <span>Kopsumma: {order.total_amount} €</span>
      </div>
      {onCancel && order.status === "NEW" && (
        <div style={{ marginTop: 8 }}>
          <Button variant="ghost" onClick={() => onCancel(order.id)}>
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
      setError(res.data?.detail || "Neizdevas ieladet pasutijumus");
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
      <div className="page-heading">Mani pasutijumi</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}

      <div className="order-grid">
        <Card>
          <div className="profile-title" style={{ textAlign: "left", margin: "0 0 8px" }}>
            Aktivie pasutijumi
          </div>
          {active.length === 0 && <div style={{ padding: 8 }}>Nav aktivu pasutijumu.</div>}
          {active.map((o) => (
            <OrderBlock key={o.id} order={o} onCancel={onCancel} />
          ))}
        </Card>

        <Card>
          <div className="profile-title" style={{ textAlign: "left", margin: "0 0 8px" }}>
            Pabeigtie pasutijumi
          </div>
          {finished.length === 0 && <div style={{ padding: 8 }}>Nav pabeigtu pasutijumu.</div>}
          {finished.map((o) => (
            <OrderBlock key={o.id} order={o} />
          ))}
        </Card>
      </div>
    </div>
  );
}
