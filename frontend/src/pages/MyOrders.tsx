import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import "../styles/myOrders.css";

type OrderStatus = "processing" | "done";

type OrderItem = {
  name: string;
  qty: number;
  price: number; // price for this row or unit? (как на фигме справа 2€ / 1€ — сделаем row price)
};

type Order = {
  id: number;
  time: string; // "8:37, 10/12/2025"
  companyName: string;
  orderType: "takeaway" | "on_site";
  note?: string;
  status: OrderStatus;
  items: OrderItem[];
};

const mockOrders: Order[] = [
  {
    id: 6767,
    time: "8:37, 10/12/2025",
    companyName: 'Restorāns "Tests"',
    orderType: "takeaway",
    note: "Var lūdzu produktu 1 pagatavot bez cukura!",
    status: "processing",
    items: [
      { name: "Produkts 1", qty: 2, price: 2 },
      { name: "Produkts 2", qty: 4, price: 1 },
    ],
  },
  {
    id: 6667,
    time: "8:35, 09/12/2025",
    companyName: 'Restorāns "Tests"',
    orderType: "on_site",
    note: "Var lūdzu produktu 1 pagatavot bez cukura!",
    status: "done",
    items: [
      { name: "Produkts 1", qty: 1, price: 1 },
      { name: "Produkts 2", qty: 4, price: 1 },
    ],
  },
];

function orderTypeLabel(t: Order["orderType"]) {
  return t === "takeaway" ? "Līdzņemšanai" : "Uz vietas";
}

export default function MyOrders() {
  const nav = useNavigate();

  const { active, done } = useMemo(() => {
    const active = mockOrders.filter((o) => o.status !== "done");
    const done = mockOrders.filter((o) => o.status === "done");
    return { active, done };
  }, []);

  return (
    <div className="mo">
      <div className="mo-top card">
        <button className="mo-back" type="button" onClick={() => nav(-1)} aria-label="Back">
          <FiArrowLeft />
        </button>
        <div className="mo-top-title">Mani pasūtījumi</div>
      </div>

      <section className="mo-section card">
        <div className="mo-section-title">Aktīvie pasūtījumi</div>

        <div className="mo-list">
          {active.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}

          {active.length === 0 && <div className="mo-empty">Nav aktīvu pasūtījumu</div>}
        </div>
      </section>

      <section className="mo-section card">
        <div className="mo-section-title">Pabeigtie pasūtījumi</div>

        <div className="mo-list">
          {done.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}

          {done.length === 0 && <div className="mo-empty">Nav pabeigtu pasūtījumu</div>}
        </div>
      </section>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const sum = order.items.reduce((s, it) => s + it.price, 0);

  return (
    <article className="mo-order">
      <div className={`mo-status ${order.status === "done" ? "done" : "processing"}`}>
        {order.status === "done" ? "Pabeigts" : "Apstrādē"}
      </div>

      <div className="mo-order-head">
        <div className="mo-order-id">Pasūtījums #{order.id}</div>
        <div className="mo-order-time">{order.time}</div>
        <div className="mo-order-company">{order.companyName}</div>
      </div>

      <div className="mo-order-body">
        <div className="mo-left">
          <div className="mo-label">Produkti:</div>

          <div className="mo-items">
            {order.items.map((it, idx) => (
              <div key={`${it.name}-${idx}`} className="mo-item">
                <div className="mo-item-name">
                  {it.name} x {it.qty}
                </div>
                <div className="mo-item-price">{it.price} €</div>
              </div>
            ))}
          </div>

          <div className="mo-sum">Kopsumma: {sum} €</div>
        </div>

        <div className="mo-right">
          <div className="mo-meta">
            <div className="mo-meta-row">
              <span className="mo-meta-k">Pasūtījuma veids:</span>
              <span className="mo-meta-v">{orderTypeLabel(order.orderType)}</span>
            </div>
          </div>

          <div className="mo-note">
            <div className="mo-label">Piezīmes</div>
            <div className="mo-note-box">{order.note || "-"}</div>
          </div>
        </div>
      </div>
    </article>
  );
}
