import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  fetchMenuAdmin,
  updateCategory,
  updateProduct,
  type ProductPayload,
} from "../api/menu";
import { fetchInventory, type InventoryItem } from "../api/inventory";
import { useMe } from "../auth/useMe";

type CategoryRow = { id: number; name: string };
type ProductRow = { id: number; name: string };

export default function MenuAdmin() {
  const { user } = useMe();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [catForm, setCatForm] = useState<{ id?: number; name: string; description: string; is_active: boolean }>({
    name: "",
    description: "",
    is_active: true,
  });
  const [prodForm, setProdForm] = useState<{
    id?: number;
    name: string;
    category: number | "";
    price: string;
    is_available: boolean;
    photo?: File;
    recipe: Array<{ inventory_item_id: number | ""; amount: number | "" }>;
  }>({
    name: "",
    category: "",
    price: "",
    is_available: true,
    recipe: [{ inventory_item_id: "", amount: "" }],
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    if (!user?.company) {
      setError("Nav piesaistits uznemums.");
      return;
    }
    const res = await fetchMenuAdmin(user.company);
    if (res.ok) {
      setCategories(res.data.categories);
      setProducts(res.data.products);
    } else {
      setError(res.data?.detail || "Neizdevas ieladet edienkarti.");
    }
    const inv = await fetchInventory();
    if (inv.ok) setInventory(inv.data);
  };

  useEffect(() => {
    void load();
  }, [user?.company]);

  const resetCat = () => setCatForm({ name: "", description: "", is_active: true, id: undefined });
  const resetProd = () =>
    setProdForm({ name: "", category: "", price: "", is_available: true, recipe: [{ inventory_item_id: "", amount: "" }] });

  const submitCategory = async () => {
    setMessage(null);
    if (catForm.id) await updateCategory(catForm.id, catForm);
    else await createCategory(catForm);
    resetCat();
    await load();
  };

  const submitProduct = async () => {
    setMessage(null);
    if (!prodForm.photo && !prodForm.id) {
      setError("Foto ir obligats jauna produkta izveidei.");
      return;
    }
    const payload: ProductPayload = {
      name: prodForm.name,
      category: Number(prodForm.category),
      is_available: prodForm.is_available,
      price: prodForm.price,
      photo: prodForm.photo as File,
      recipe: prodForm.recipe
        .filter((r) => r.inventory_item_id && r.amount)
        .map((r) => ({ inventory_item_id: Number(r.inventory_item_id), amount: Number(r.amount) })),
    };
    if (prodForm.id) await updateProduct(prodForm.id, payload);
    else await createProduct(payload);
    resetProd();
    setMessage("Saglabats");
    await load();
  };

  const recipeRows = useMemo(() => prodForm.recipe, [prodForm.recipe]);

  const canSubmitProd =
    prodForm.name &&
    prodForm.category !== "" &&
    prodForm.price &&
    recipeRows.every((r) => r.inventory_item_id && r.amount);

  const isAdmin = user?.role === "company_admin";
  if (!isAdmin) return <div style={{ padding: 12 }}>Piekļuve ir liegta.</div>;

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">Edienkartes parvalde</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {message && <div style={{ color: "green", padding: 12 }}>{message}</div>}

      <Card>
        <div className="profile-title" style={{ textAlign: "left" }}>
          Kategorijas
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <div
              key={c.id}
              style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #cfd8e3", display: "flex", gap: 6 }}
            >
              <span>{c.name}</span>
              <Button
                variant="ghost"
                onClick={() => setCatForm({ id: c.id, name: c.name, description: "", is_active: true })}
              >
                Rediget
              </Button>
              <Button variant="ghost" onClick={() => deleteCategory(c.id).then(load)}>
                Dzest
              </Button>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <Input label="Nosaukums" value={catForm.name} onChange={(v) => setCatForm((p) => ({ ...p, name: v }))} />
          <Input
            label="Apraksts"
            value={catForm.description}
            onChange={(v) => setCatForm((p) => ({ ...p, description: v }))}
            multiline
          />
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={catForm.is_active}
              onChange={(e) => setCatForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            Aktiva
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="primary" onClick={submitCategory}>
              {catForm.id ? "Atjauninat" : "Izveidot"} kategoriju
            </Button>
            <Button variant="ghost" onClick={resetCat}>
              Notirit
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="profile-title" style={{ textAlign: "left" }}>
          Produkti
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {products.map((p) => (
            <div
              key={p.id}
              style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #cfd8e3", display: "flex", gap: 6 }}
            >
              <span>{p.name}</span>
              <Button variant="ghost" onClick={() => setProdForm((prev) => ({ ...prev, id: p.id }))}>
                Rediget
              </Button>
              <Button variant="ghost" onClick={() => deleteProduct(p.id).then(load)}>
                Dzest
              </Button>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <Input label="Nosaukums" value={prodForm.name} onChange={(v) => setProdForm((p) => ({ ...p, name: v }))} />
          <Input
            label="Cena (€)"
            value={prodForm.price}
            onChange={(v) => setProdForm((p) => ({ ...p, price: v }))}
            placeholder="5.99"
          />
          <div>
            <label className="sb-role" style={{ color: "#1e73d8", fontWeight: 700 }}>
              Kategorija
            </label>
            <select
              value={prodForm.category}
              onChange={(e) => setProdForm((p) => ({ ...p, category: Number(e.target.value) }))}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #cfd8e3" }}
            >
              <option value="">Izveleties</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={prodForm.is_available}
              onChange={(e) => setProdForm((p) => ({ ...p, is_available: e.target.checked }))}
            />
            Pieejams
          </label>
          <div>
            <label className="sb-role" style={{ color: "#1e73d8", fontWeight: 700 }}>
              Foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProdForm((p) => ({ ...p, photo: e.target.files?.[0] }))}
            />
          </div>

          <div className="profile-section">
            <h4>Recepte (noliktavas sastavdalas)</h4>
            {recipeRows.map((r, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, marginBottom: 8 }}>
                <select
                  value={r.inventory_item_id}
                  onChange={(e) =>
                    setProdForm((p) => {
                      const next = [...p.recipe];
                      next[idx] = { ...next[idx], inventory_item_id: Number(e.target.value) };
                      return { ...p, recipe: next };
                    })
                  }
                  style={{ padding: 10, borderRadius: 10, border: "1px solid #cfd8e3" }}
                >
                  <option value="">Izveleties</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name}
                    </option>
                  ))}
                </select>
                <Input
                  label="Daudzums"
                  value={r.amount?.toString() || ""}
                  onChange={(v) =>
                    setProdForm((p) => {
                      const next = [...p.recipe];
                      next[idx] = { ...next[idx], amount: Number(v) };
                      return { ...p, recipe: next };
                    })
                  }
                />
                <Button
                  variant="ghost"
                  onClick={() =>
                    setProdForm((p) => ({
                      ...p,
                      recipe: p.recipe.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  Dzest
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              onClick={() =>
                setProdForm((p) => ({
                  ...p,
                  recipe: [...p.recipe, { inventory_item_id: "", amount: "" }],
                }))
              }
            >
              + Pievienot sastavdalu
            </Button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="primary" onClick={submitProduct} disabled={!canSubmitProd}>
              {prodForm.id ? "Atjauninat" : "Izveidot"} produktu
            </Button>
            <Button variant="ghost" onClick={resetProd}>
              Notirit
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
