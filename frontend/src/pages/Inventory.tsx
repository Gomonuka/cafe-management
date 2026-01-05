//  frontend/src/pages/Inventory.tsx
import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
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
  const [createForm, setCreateForm] = useState<{ name: string; quantity: string; unit: string }>({
    name: "",
    quantity: "",
    unit: "",
  });
  const [editForm, setEditForm] = useState<{ name: string; quantity: string; unit: string }>({
    name: "",
    quantity: "",
    unit: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

   const formatError = (data: any): string => {
    if (!data) return "Nezināma kļūda.";
    if (typeof data === "string") return data;
    if (typeof data.detail === "string") return data.detail;
    if (typeof data === "object") {
      const parts: string[] = [];
      Object.entries(data).forEach(([k, v]) => {
        const humanKey =
          k === "name" ? "Nosaukums" : k === "quantity" ? "Daudzums" : k === "unit" ? "Mērvienība" : k;
        if (Array.isArray(v)) parts.push(`${humanKey}: ${v.join(" ")}`);
        else if (typeof v === "string") parts.push(`${humanKey}: ${v}`);
      });
      if (parts.length) return parts.join("; ");
    }
    return "Nezināma kļūda.";
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchInventory();
    if (res.ok && Array.isArray(res.data)) {
      setItems(res.data);
      if (res.data.length > 0) {
        setSelected(res.data[0]);
        setEditForm({
          name: res.data[0].name,
          quantity: res.data[0].quantity.toString(),
          unit: res.data[0].unit,
        });
      }
    } else {
      setError(res.data?.detail || "Neizdevās ielādēt noliktavu");
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSelect = (item: InventoryItem) => {
    setSelected(item);
    setEditForm({ name: item.name, quantity: item.quantity.toString(), unit: item.unit });
  };

  const onCreate = async () => {
    if (!isAdmin) return;
    setError(null);
    const res = await createInventoryItem({
      name: createForm.name,
      quantity: Number(createForm.quantity),
      unit: createForm.unit,
    });
    if (!res.ok) {
      setError(res.data?.detail || JSON.stringify(res.data));
      return;
    }
    setCreateForm({ name: "", quantity: "", unit: "" });
    await load();
  };

  const onUpdate = async () => {
    if (!selected) return;
    setError(null);
    const payload: any = { quantity: Number(editForm.quantity) };
    if (isAdmin) {
      payload.name = editForm.name;
      payload.unit = editForm.unit;
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
  const title = "Noliktavas vienības";

  const list = useMemo(() => items, [items]);

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">{title}</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {loading && <div style={{ padding: 12 }}>Ielāde...</div>}

      <Card className="inventory-shell">
        <div className="inventory-head">
          <div>ID</div>
          <div>Nosaukums</div>
          <div>Daudzums</div>
          <div className="inventory-action-head">
            <span>Rediģēt</span>
            {isAdmin && <span>Dzēst</span>}
          </div>
        </div>
        <div className="inventory-list">
          {list.length === 0 && <div className="pill gray">P_006: Noliktavā nav vienību.</div>}
          {list.map((it, idx) => (
            <div
              key={it.id}
              className={`inventory-row ${selected?.id === it.id ? "active" : ""}`}
              onClick={() => onSelect(it)}
            >
              <div className="inventory-id">{idx + 1}.</div>
              <input value={it.name} disabled />
              <div className="inventory-qty">
                <input value={it.quantity} disabled />
                <span>{it.unit}</span>
              </div>
              <div className="inventory-actions">
                <Button variant="ghost" onClick={() => onSelect(it)} className="icon-btn icon-edit" aria-label="Rediģēt">
                  <FiEdit2 />
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    onClick={() => onDelete(it.id)}
                    className="icon-btn icon-delete"
                    aria-label="Dzēst"
                  >
                    <FiTrash2 />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {isAdmin && (
        <Card className="inventory-shell">
          <div className="block-title">Pievienot jaunu vienību</div>
          <div className="inventory-form">
            <Input label="Nosaukums" value={createForm.name} onChange={(v) => setCreateForm((p) => ({ ...p, name: v }))} />
            <Input
              label="Daudzums"
              value={createForm.quantity}
              onChange={(v) => setCreateForm((p) => ({ ...p, quantity: v }))}
              placeholder="0"
            />
            <Input label="Mērvienība" value={createForm.unit} onChange={(v) => setCreateForm((p) => ({ ...p, unit: v }))} />
            <div className="inventory-form-actions">
              <Button variant="primary" onClick={onCreate}>
                Pievienot vienību
              </Button>
            </div>
          </div>
        </Card>
      )}

      {canEdit && selected && (
        <Card className="inventory-shell">
          <div className="block-title">{isAdmin ? "Rediģēt vienību" : "Rediģēt atlikumu"}</div>
          <div className="inventory-form">
            <Input
              label="Nosaukums"
              value={editForm.name}
              onChange={(v) => setEditForm((p) => ({ ...p, name: v }))}
              disabled={!isAdmin}
            />
            <Input
              label="Daudzums"
              value={editForm.quantity}
              onChange={(v) => setEditForm((p) => ({ ...p, quantity: v }))}
              placeholder="0"
            />
            <Input
              label="Mērvienība"
              value={editForm.unit}
              onChange={(v) => setEditForm((p) => ({ ...p, unit: v }))}
              disabled={!isAdmin}
            />
            <div className="inventory-form-actions">
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
