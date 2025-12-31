import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import AvatarBlock from "../components/profile/AvatarBlock";
import type { Employee } from "../api/accounts";
import { createEmployee, deleteEmployee, fetchEmployees, updateEmployee } from "../api/accounts";
import "../styles/profile.css";

export default function CompanyEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [loading, setLoading] = useState(true);

  const selected = useMemo(
    () => employees.find((e) => e.id === selectedId) || null,
    [employees, selectedId]
  );

  const load = async () => {
    setLoading(true);
    const res = await fetchEmployees();
    if (res.ok) {
      setEmployees(res.data);
      if (res.data.length && selectedId === null) setSelectedId(res.data[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (selected) {
      setForm({
        username: selected.username,
        first_name: selected.first_name || "",
        last_name: selected.last_name || "",
        email: selected.email,
        password: "",
      });
      setAvatarUrl(selected.avatar || null);
      setAvatarFile(undefined);
      setMode("view");
    }
  }, [selected]);

  const startCreate = () => {
    setSelectedId(null);
    setForm({ username: "", first_name: "", last_name: "", email: "", password: "" });
    setAvatarUrl(null);
    setAvatarFile(undefined);
    setMode("create");
  };

  const startEdit = (id: number) => {
    setSelectedId(id);
    setMode("edit");
  };

  const onSave = async () => {
    const fd = new FormData();
    fd.append("username", form.username);
    fd.append("first_name", form.first_name);
    fd.append("last_name", form.last_name);
    fd.append("email", form.email);
    if (avatarFile) fd.append("avatar", avatarFile);
    if (mode === "create") fd.append("password", form.password);
    if (form.password && mode === "edit") fd.append("new_password", form.password);

    const res =
      mode === "create"
        ? await createEmployee(fd)
        : selectedId
          ? await updateEmployee(selectedId, fd)
          : null;

    if (!res || !res.ok) {
      alert(res ? JSON.stringify(res.data) : "Neizdevās saglabāt");
      return;
    }
    await load();
    setMode("view");
  };

  const onDelete = async (id: number) => {
    if (!confirm("Dzēst darbinieku?")) return;
    await deleteEmployee(id);
    await load();
    setSelectedId(null);
  };

  const onAvatarUpload = (file?: File) => {
    setAvatarFile(file);
    if (file) setAvatarUrl(URL.createObjectURL(file));
  };

  const onAvatarRemove = () => {
    setAvatarFile(undefined);
    setAvatarUrl(null);
  };

  return (
    <div className="profile-wrap">
      <div className="profile-title">Uzņēmuma darbinieki</div>

      <div className="employees-layout">
        <Card className="employees-list">
          <div className="employees-header">
            <div>ID</div>
            <div>Lietotājvārds</div>
            <div style={{ textAlign: "right" }}>
              <Button variant="primary" onClick={startCreate}>
                <FiPlus /> Pievienot darbinieku
              </Button>
            </div>
          </div>
          {loading ? (
            <div style={{ padding: 12 }}>Ielāde...</div>
          ) : (
            employees.map((e, idx) => (
              <div className="employees-row" key={e.id}>
                <span>{idx + 1}.</span>
                <input className="users-input" value={e.username} readOnly />
                <div className="row-actions">
                  <button className="icon-btn" onClick={() => startEdit(e.id)} title="Rediģēt">
                    <FiEdit2 />
                  </button>
                  <button className="icon-btn danger" onClick={() => onDelete(e.id)} title="Dzēst">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </Card>

        <div className="profile-card" style={{ flex: 1 }}>
          <AvatarBlock avatarUrl={avatarUrl} onUpload={onAvatarUpload} onRemove={onAvatarRemove} />

          <Card>
            <Input
              label="Lietotājvārds"
              value={form.username}
              onChange={(v) => setForm((s) => ({ ...s, username: v }))}
            />
            <Input label="Vārds" value={form.first_name} onChange={(v) => setForm((s) => ({ ...s, first_name: v }))} />
            <Input
              label="Uzvārds"
              value={form.last_name}
              onChange={(v) => setForm((s) => ({ ...s, last_name: v }))}
            />
            <Input label="E-pasts" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} />
            <Input
              label="Parole"
              type="password"
              value={form.password}
              onChange={(v) => setForm((s) => ({ ...s, password: v }))}
            />
          </Card>

          <Card>
            <div className="actions">
              <Button variant="primary" onClick={onSave}>
                Saglabāt izmaiņas
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
