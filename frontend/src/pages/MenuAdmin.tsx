import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  fetchMenuAdmin,
  fetchProductRecipe,
  updateCategory,
  updateProduct,
  updateProductRecipe,
  type ProductPayload,
} from "../api/menu";
import { fetchInventory, type InventoryItem } from "../api/inventory";
import { useMe } from "../auth/useMe";
import "../styles/menu.css";
import { FiEdit2, FiTrash2, FiBookOpen } from "react-icons/fi";

type CategoryRow = { id: number; name: string };
type ProductRow = {
  id: number;
  name: string;
  price?: string;
  is_available?: boolean;
  available_quantity?: number;
  category_id?: number;
};

export default function MenuAdmin() {
  const { user } = useMe();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<
    Record<number, { loading: boolean; rows: Array<{ inventory_item_id: number; inventory_item_name: string; amount: string }> }>
  >({});
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
  });
  const [recipeForm, setRecipeForm] = useState<{ productId: number | ""; recipe: Array<{ inventory_item_id: number | ""; amount: number | "" }> }>({
    productId: "",
    recipe: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    if (!user?.company) {
      setError("Nav piesaistīts uzņēmums.");
      return;
    }
    const res = await fetchMenuAdmin(user.company);
    if (res.ok) {
      setCategories(res.data.categories);
      setProducts(res.data.products);
    } else {
      setError(res.data?.detail || "Neizdevās ielādēt ēdienkarti.");
    }
    const inv = await fetchInventory();
    if (inv.ok) setInventory(inv.data);
  };

  useEffect(() => {
    void load();
  }, [user?.company]);

  const resetCat = () => setCatForm({ name: "", description: "", is_active: true, id: undefined });
  const resetProd = () => setProdForm({ name: "", category: "", price: "", is_available: true });
  const resetRecipe = () => setRecipeForm({ productId: "", recipe: [] });

  const showRecipe = async (productId: number) => {
    setRecipes((p) => ({ ...p, [productId]: { loading: true, rows: p[productId]?.rows ?? [] } }));
    const res = await fetchProductRecipe(productId);
    if (res.ok) {
      setRecipes((p) => ({ ...p, [productId]: { loading: false, rows: res.data.recipe } }));
    } else {
      setRecipes((p) => ({ ...p, [productId]: { loading: false, rows: [] } }));
      setError(res.data?.detail || JSON.stringify(res.data));
    }
  };

  const submitCategory = async () => {
    setMessage(null);
    if (catForm.id) await updateCategory(catForm.id, catForm);
    else await createCategory(catForm);
    resetCat();
    await load();
  };

  const submitProduct = async () => {
    setMessage(null);
    setError(null);
    if (!prodForm.photo && !prodForm.id) {
      setError("Foto ir obligāts jaunam produktam.");
      return;
    }

    const cleanedRecipe: Array<{ inventory_item_id: number; amount: number }> = [];

    const payload: ProductPayload = {
      name: prodForm.name,
      category: Number(prodForm.category),
      is_available: prodForm.is_available,
      price: prodForm.price,
      photo: prodForm.photo as File,
      recipe: cleanedRecipe,
    };
    const res = prodForm.id ? await updateProduct(prodForm.id, payload) : await createProduct(payload);
    if (!res.ok) {
      setError(res.data?.detail || JSON.stringify(res.data));
      return;
    }
    resetProd();
    setMessage("Saglabāts");
    await load();
  };

  const canSubmitProd = prodForm.name && prodForm.category !== "" && prodForm.price;

  const canSubmitRecipe =
    recipeForm.productId !== "" &&
    recipeForm.recipe.length > 0 &&
    recipeForm.recipe.every((r) => r.inventory_item_id && r.amount);

  const isAdmin = user?.role === "company_admin";
  if (!isAdmin) return <div style={{ padding: 12 }}>Piekļuve ir liegta.</div>;

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="page-heading">Ēdienkartes pārvalde</div>
      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {message && <div style={{ color: "green", padding: 12 }}>{message}</div>}

      <Card>
        <div className="profile-title" style={{ textAlign: "left" }}>
          Kategorijas
        </div>
        <div className="admin-cat-head">
          <div>ID</div>
          <div>Nosaukums</div>
          <div className="admin-cat-head-actions">
            <span>Rediģēt</span>
            <span>Dzēst</span>
          </div>
        </div>
        <div className="admin-cat-list">
          {categories.map((c, idx) => (
            <div key={c.id} className="admin-cat-row">
              <div className="admin-cat-id">{idx + 1}.</div>
              <input value={c.name} disabled />
              <div className="admin-cat-actions">
                <Button
                  variant="ghost"
                  className="admin-icon-btn admin-icon-edit"
                  onClick={() => setCatForm({ id: c.id, name: c.name, description: "", is_active: true })}
                >
                  <FiEdit2 />
                </Button>
                <Button
                  variant="ghost"
                  className="admin-icon-btn admin-icon-delete"
                  onClick={() => deleteCategory(c.id).then(load)}
                >
                  <FiTrash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-form-grid">
          <Input label="Nosaukums" value={catForm.name} onChange={(v) => setCatForm((p) => ({ ...p, name: v }))} />
          <Input
            label="Apraksts"
            value={catForm.description}
            onChange={(v) => setCatForm((p) => ({ ...p, description: v }))}
            multiline
          />
          <label className="admin-check">
            <input
              type="checkbox"
              checked={catForm.is_active}
              onChange={(e) => setCatForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            Aktīva
          </label>
          <div className="admin-actions">
            <Button variant="primary" onClick={submitCategory} className="admin-btn">
              {catForm.id ? "Atjaunināt kategoriju" : "Izveidot kategoriju"}
            </Button>
            <Button variant="ghost" onClick={resetCat} className="admin-btn">
              Notīrīt
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="profile-title" style={{ textAlign: "left" }}>
          Produkti
        </div>
        {products.length === 0 ? (
          <div style={{ padding: 12, color: "#6b7280" }}>Nav produktu.</div>
        ) : (
          <div className="admin-product-list">
            <div className="admin-product-head">
              <div></div>
              <div></div>
              <div className="admin-product-head-actions">
                <span>Rediģēt</span>
                <span>Recepte</span>
                <span>Dzēst</span>
              </div>
            </div>
            {products.map((p) => (
              <div key={p.id} className="admin-product">
                <div>
                  <div className="admin-product-name">{p.name}</div>
                  <div className="admin-product-meta">Pieejams: {p.available_quantity ?? 0}</div>
                </div>
                <div className="admin-product-price">{p.price} €</div>
                <div className="admin-product-badges">
                  <span className={`badge ${p.is_available ? "green" : "red"}`}>{p.is_available ? "Pieejams" : "Nav pieejams"}</span>
                </div>
                <div className="admin-product-actions">
                  <Button
                    variant="ghost"
                    className="admin-icon-btn admin-icon-edit"
                    onClick={() =>
                      setProdForm({
                        id: p.id,
                        name: p.name,
                        price: p.price || "",
                        category: p.category_id ?? "",
                        is_available: p.is_available ?? true,
                      })
                    }
                    aria-label="Rediģēt"
                  >
                    <FiEdit2 />
                  </Button>
                  <Button
                    variant="ghost"
                    className="admin-icon-btn admin-icon-recipe"
                    onClick={() => showRecipe(p.id)}
                    aria-label="Recepte"
                  >
                    <FiBookOpen />
                  </Button>
                  <Button
                    variant="ghost"
                    className="admin-icon-btn admin-icon-delete"
                    onClick={() => deleteProduct(p.id).then(load)}
                    aria-label="Dzēst"
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="admin-form-grid">
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
              <option value="">Izvēlēties</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <label className="admin-check">
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
              className="file-input"
              type="file"
              accept="image/*"
              onChange={(e) => setProdForm((p) => ({ ...p, photo: e.target.files?.[0] }))}
            />
          </div>

          <div className="admin-actions">
            <Button variant="primary" onClick={submitProduct} disabled={!canSubmitProd} className="admin-btn">
              {prodForm.id ? "Atjaunināt produktu" : "Izveidot produktu"}
            </Button>
            <Button variant="ghost" onClick={resetProd} className="admin-btn">
              Notīrīt
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="profile-title" style={{ textAlign: "left" }}>
          Produkta recepte
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <label className="sb-role" style={{ color: "#1e73d8", fontWeight: 700 }}>
              Produkts
            </label>
            <select
              value={recipeForm.productId}
              onChange={async (e) => {
                const val = e.target.value;
                if (!val) {
                  resetRecipe();
                  return;
                }
                const pid = Number(val);
                setRecipeForm((p) => ({ ...p, productId: pid }));
                const res = await fetchProductRecipe(pid);
                if (res.ok) {
                  setRecipeForm({
                    productId: pid,
                    recipe: res.data.recipe.map((r) => ({
                      inventory_item_id: r.inventory_item_id,
                      amount: Number(r.amount),
                    })),
                  });
                }
              }}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #cfd8e3" }}
            >
              <option value="">Izvēlēties produktu</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {recipeForm.productId && (
            <div className="profile-section">
              <h4>Recepte (noliktavas sastāvdaļas)</h4>
              {recipeForm.recipe.map((r, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8, marginBottom: 8 }}>
                  <select
                    value={r.inventory_item_id}
                    onChange={(e) =>
                      setRecipeForm((p) => {
                        const next = [...p.recipe];
                        next[idx] = { ...next[idx], inventory_item_id: Number(e.target.value) };
                        return { ...p, recipe: next };
                      })
                    }
                    style={{ padding: 10, borderRadius: 10, border: "1px solid #cfd8e3" }}
                  >
                    <option value="">Izvēlēties</option>
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
                      setRecipeForm((p) => {
                        const next = [...p.recipe];
                        next[idx] = { ...next[idx], amount: Number(v) };
                        return { ...p, recipe: next };
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setRecipeForm((p) => ({
                        ...p,
                        recipe: p.recipe.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    Dzēst
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                onClick={() =>
                  setRecipeForm((p) => ({
                    ...p,
                    recipe: [...p.recipe, { inventory_item_id: "", amount: "" }],
                  }))
                }
              >
                + Pievienot sastāvdaļu
              </Button>
            </div>
          )}

          <div className="admin-actions">
            <Button
              variant="primary"
              onClick={async () => {
                setError(null);
                setMessage(null);
                if (!recipeForm.productId) {
                  setError("Izvēlies produktu receptei.");
                  return;
                }
                const cleaned = recipeForm.recipe
                  .map((r) => ({ inventory_item_id: Number(r.inventory_item_id), amount: Number(r.amount) }))
                  .filter((r) => Number.isFinite(r.inventory_item_id) && r.inventory_item_id > 0 && Number.isFinite(r.amount) && r.amount > 0);
                if (cleaned.length === 0) {
                  setError("Recepte ir obligāta: izvēlies sastāvdaļas un daudzumu.");
                  return;
                }
                const res = await updateProductRecipe(recipeForm.productId as number, cleaned);
                if (!res.ok) {
                  setError(res.data?.detail || JSON.stringify(res.data));
                  return;
                }
                setMessage("Recepte saglabāta");
                await load();
              }}
              disabled={!canSubmitRecipe}
              className="admin-btn"
            >
              Saglabāt recepti
            </Button>
            <Button variant="ghost" onClick={resetRecipe} className="admin-btn">
              Notīrīt
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
