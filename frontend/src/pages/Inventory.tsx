import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  fetchInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  type InventoryItem,
} from "../api/inventory";
import { useMe } from "../auth/useMe";
import "../styles/menu.css";

export default function Inventory() {
  const { user } = useMe();
  const isAdmin = user?.role === "company_admin";
  const isEmployee = user?.role === "employee";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<{ name: string; quantity: string; unit: string }>({
    name: "",
    quantity: "",
    unit: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const load = async () => {
    setLoading(true);
    const res = await fetchInventory();
    if (res.ok) {
      setItems(res.data);
      if (res.data.length > 0) {
        setSelected(res.data[0]);
        setForm({
          name: res.data[0].name,
          quantity: res.data[0].quantity.toString(),
          unit: res.data[0].unit,
        });
      }
    } else {
      setError(res.data?.detail || "Neizdevas ieladet noliktavu");
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSelect = (item: InventoryItem) => {
    setSelected(item);
    setForm({ name: item.name, quantity: item.quantity.toString(), unit: item.unit });
  };

  const onCreate = async () => {
    if (!isAdmin) return;
    const res = await createInventoryItem({
      name: form.name,
      quantity: Number(form.quantity),
      unit: form.unit,
    });
    if (!res.ok) {
      setError(res.data?.detail || JSON.stringify(res.data));
      return;
    }
    await load();
  };

  const onUpdate = async () => {
    if (!selected) return;
    const payload: any = { quantity: Number(form.quantity) };
    if (isAdmin) {
      payload.name = form.name;
      payload.unit = form.unit;
    }
    const res = await updateInventoryItem(selected.id, payload);
    if (!res.ok) {
      setError(res.data?.detail || JSON.stringify(res.data));
      return;
    }
    await load();
  };

  const onDelete = async (id: number) => {
    if (!isAdmin) return;
    await deleteInventoryItem(id);
    await load();
  };

  const canEdit = isAdmin || isEmployee;
  const title = isAdmin ? "Noliktavas vienības (UA)" : "Noliktavas vienības";

  const list = useMemo(() => items, [items]);

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">{title}</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {loading && <div style={{ padding: 12 }}>Ielāde...</div>}

      <Card>
        <div className="inventory-head">
          <div>ID</div>
          <div>Nosaukums</div>
          <div>Daudzums</div>
          <div>Darbības</div>
        </div>
        <div className="inventory-list">
          {list.length === 0 && <div>P_006: Noliktavā nav vienību.</div>}
          {list.map((it, idx) => (
            <div
              key={it.id}
              className={`inventory-row ${selected?.id === it.id ? "active" : ""}`}
              onClick={() => onSelect(it)}
            >
              <div>{idx + 1}.</div>
              <input value={it.name} disabled />
              <div className="inventory-qty">
                <input value={it.quantity} disabled />
                <span>{it.unit}</span>
              </div>
              <div className="inventory-actions">
                <Button variant="ghost" onClick={() => onSelect(it)}>
                  Rediģēt
                </Button>
                {isAdmin && (
                  <Button variant="ghost" onClick={() => onDelete(it.id)}>
                    Dzēst
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {canEdit && (
        <Card style={{ marginTop: 12 }}>
          <div className="block-title">{isAdmin ? "Pievienot / Rediģēt vienību" : "Rediģēt atlikumu"}</div>
          <div className="inventory-form">
            <Input label="Nosaukums" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} disabled={!isAdmin} />
            <Input
              label="Daudzums"
              value={form.quantity}
              onChange={(v) => setForm((p) => ({ ...p, quantity: v }))}
              placeholder="0"
            />
            <Input
              label="Mērvienība"
              value={form.unit}
              onChange={(v) => setForm((p) => ({ ...p, unit: v }))}
              disabled={!isAdmin}
            />
            <div className="inventory-form-actions">
              {isAdmin && (
                <Button variant="primary" onClick={onCreate}>
                  Pievienot vienību
                </Button>
              )}
              <Button variant="primary" onClick={onUpdate}>
                Atjaunot informāciju
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
