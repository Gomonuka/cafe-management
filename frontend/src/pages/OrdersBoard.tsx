// OrdersBoard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { fetchCompanyOrders, changeOrderStatus, type CompanyOrder } from "../api/orders";
import { useMe } from "../auth/useMe";
import "../styles/menu.css";

const statusLabel: Record<CompanyOrder["status"], string> = {
  NEW: "Jauns",
  INP: "Tiek gatavots",
  RDY: "Gatavs",
  DON: "Pabeigts",
  CAN: "Atcelts",
};

const nextStatus: Partial<Record<CompanyOrder["status"], CompanyOrder["status"]>> = {
  NEW: "INP",
  INP: "RDY",
  RDY: "DON",
};
const allowedMoves: Record<CompanyOrder["status"], CompanyOrder["status"][]> = {
  NEW: ["INP"],
  INP: ["RDY"],
  RDY: ["DON"],
  DON: [],
  CAN: [],
};

type DragPayload = { id: number; status: CompanyOrder["status"] };

function OrderCard({
  order,
  onAdvance,
  onView,
  onDragStart,
}: {
  order: CompanyOrder;
  onAdvance: () => void;
  onView: () => void;
  onDragStart: (payload: DragPayload) => void;
}) {
  return (
    <div
      className="card order-card"
      draggable
      onDragStart={(e) => {
        onDragStart({ id: order.id, status: order.status });
        e.dataTransfer.setData("text/plain", String(order.id));
      }}
    >
      <div className="order-card-top">
        <div className="order-id">#{order.id}</div>
        <div className="order-date">{new Date(order.created_at).toLocaleString()}</div>
      </div>
      <div className="order-total">Kopsumma: {order.total_amount} €</div>
      <div className="order-tags">
        <span className="badge blue">{statusLabel[order.status]}</span>
        <span className="badge gray">{order.order_type === "ON" ? "Uz vietas" : "Līdzi ņemšanai"}</span>
      </div>
      <div className="order-actions">
        {nextStatus[order.status] ? (
          <Button variant="primary" onClick={onAdvance} className="order-btn">
            {statusLabel[nextStatus[order.status] as CompanyOrder["status"]]}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onView} className="order-btn ghost">
          Detaļas
        </Button>
      </div>
    </div>
  );
}

export default function OrdersBoard() {
  const nav = useNavigate();
  const { user } = useMe();
  const [tab, setTab] = useState<"active" | "finished">("active");
  const [active, setActive] = useState<CompanyOrder[]>([]);
  const [finished, setFinished] = useState<CompanyOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dragItem, setDragItem] = useState<DragPayload | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [doneSeenAt, setDoneSeenAt] = useState<Record<number, number>>({});
  const [nowTs, setNowTs] = useState<number>(Date.now());

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchCompanyOrders();
    if (res.ok) {
      const newMap = { ...doneSeenAt };
      res.data.active
        .filter((o) => o.status === "DON")
        .forEach((o) => {
          if (!newMap[o.id]) newMap[o.id] = Date.now();
        });
      setDoneSeenAt(newMap);
      setActive(res.data.active);
      setFinished(res.data.finished);
    } else {
      setError(res.data?.detail || "Neizdevās ielādēt pasūtījumus.");
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const advance = async (orderId: number, current: CompanyOrder["status"]) => {
    const next = nextStatus[current];
    if (!next) return;
    await changeOrderStatus(orderId, next);
    await load();
  };

  const handleDrop = async (targetStatus: CompanyOrder["status"]) => {
    if (!dragItem) return;
    if (dragItem.status === targetStatus) return;
    const allowed = allowedMoves[dragItem.status] || [];
    if (!allowed.includes(targetStatus)) {
      setStatusError("Statusa maiņa nav atļauta (P_010)");
      setTimeout(() => setStatusError(null), 1800);
      setDragItem(null);
      return;
    }
    await changeOrderStatus(dragItem.id, targetStatus);
    setDragItem(null);
    await load();
  };

  const renderColumn = (title: string, status: CompanyOrder["status"], items: CompanyOrder[]) => {
    const filtered = items.filter((o) => o.status === status);
    const canDrop = dragItem ? (allowedMoves[dragItem.status] || []).includes(status) : true;
    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleDrop(status);
        }}
        className={`kanban-column ${canDrop ? "" : "disabled"}`}
      >
        <div style={{ fontWeight: 800, color: "#1e73d8", display: "flex", alignItems: "center", gap: 6 }}>
          {title} <span className="badge gray">{filtered.length}</span>
        </div>
        {filtered.length === 0 && <div className="pill gray">Nav pasūtījumu</div>}
        {filtered.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onAdvance={() => advance(o.id, o.status)}
            onView={() => nav(`/app/company/orders/${o.id}`)}
            onDragStart={(payload) => setDragItem(payload)}
          />
        ))}
      </div>
    );
  };

  const isStaff = user?.role === "company_admin" || user?.role === "employee";
  if (!isStaff) return <div style={{ padding: 12 }}>Piekļuve ir liegta.</div>;

  const tabButtonBase = { minWidth: 140 };
  const tabButtonActive = { ...tabButtonBase, boxShadow: "0 14px 26px rgba(29,130,240,0.35)" };
  const tabButtonInactive = {
    ...tabButtonBase,
    background: "#fff",
    color: "var(--blue)",
    border: "2px solid var(--blue)",
    boxShadow: "none",
  };

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">Pasūtījumi</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <Button
          variant={tab === "active" ? "primary" : "ghost"}
          onClick={() => setTab("active")}
          style={tab === "active" ? tabButtonActive : tabButtonInactive}
        >
          Aktīvie
        </Button>
        <Button
          variant={tab === "finished" ? "primary" : "ghost"}
          onClick={() => setTab("finished")}
          style={tab === "finished" ? tabButtonActive : tabButtonInactive}
        >
          Pabeigtie
        </Button>
      </div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {loading && <div style={{ padding: 12 }}>Ielāde...</div>}
      {!loading && tab === "active" && (
        <div className="kanban-grid">
          {renderColumn(
            "Jauns",
            "NEW",
            active.filter((o) => o.status === "NEW")
          )}
          {renderColumn(
            "Tiek gatavots",
            "INP",
            active.filter((o) => o.status === "INP")
          )}
          {renderColumn(
            "Gatavs",
            "RDY",
            active.filter((o) => o.status === "RDY")
          )}
          {renderColumn(
            "Pabeigts",
            "DON",
            active.filter(
              (o) => o.status === "DON" && nowTs - (doneSeenAt[o.id] ?? nowTs) < 60_000
            )
          )}
        </div>
      )}
      {!loading && tab === "finished" && (
        <div className="kanban-grid">
          {renderColumn("Pabeigts", "DON", finished)}
          {renderColumn("Atcelts", "CAN", finished)}
        </div>
      )}
      {statusError && <div className="toast">{statusError}</div>}
    </div>
  );
}
