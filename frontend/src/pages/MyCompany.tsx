import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { deactivateCompany, deleteMyCompany, getCompanyDetail, updateCompany } from "../api/companies";
import { getMe } from "../auth/auth.api";
import {
  FiBriefcase,
  FiMail,
  FiPhone,
  FiGlobe,
  FiMapPin,
  FiFileText,
  FiUploadCloud,
} from "react-icons/fi";

export default function MyCompanyPage() {
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    address_line: "",
    description: "",
    is_active: true,
  });
  const [logo, setLogo] = useState<File | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    getMe().then((res) => {
      if (res.ok && mounted) {
        if (res.data.company) setCompanyId(res.data.company);
        else setError("Nav piesaistīts uzņēmums.");
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!companyId) return;
    getCompanyDetail(companyId).then((res) => {
      if (!res.ok) {
        setError(res.data?.detail || "Neizdevās ielādēt uzņēmumu");
        return;
      }
      const c = res.data;
      setForm({
        name: c.name,
        email: c.email,
        phone: c.phone,
        country: c.country,
        city: c.city,
        address_line: c.address_line,
        description: c.description || "",
        is_active: c.is_active,
      });
    });
  }, [companyId]);

  const onSave = async () => {
    setMessage(null);
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === "boolean" ? String(v) : v));
    if (logo) fd.append("logo", logo);
    const res = await updateCompany(fd);
    if (!res.ok) {
      const data = res.data;
      if (typeof data === "string") {
        setError(data);
      } else if (typeof data === "object") {
        const list = Object.entries(data)
          .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(" ") : m}`)
          .join("\n");
        setError(list);
      } else setError("Nezināma kļūda.");
      return;
    }
    setMessage("Uzņēmums atjaunināts");
  };

  const onDelete = async () => {
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setConfirmDeleteOpen(false);
    const res = await deleteMyCompany();
    if (res.ok) setMessage("Uzņēmums dzēsts");
  };

  if (loading) return <div style={{ padding: 20 }}>Ielāde...</div>;

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="profile-title" style={{ textAlign: "left" }}>
        Mans uzņēmums
      </div>

      {error && <div style={{ color: "red", padding: 12, whiteSpace: "pre-wrap" }}>{error}</div>}
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input
            label="Uzņēmuma nosaukums"
            leftIcon={<FiBriefcase />}
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <Input label="E-pasts" leftIcon={<FiMail />} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Tālrunis" leftIcon={<FiPhone />} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Input label="Valsts" leftIcon={<FiGlobe />} value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          <Input label="Pilsēta" leftIcon={<FiMapPin />} value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Input
            label="Adrese"
            leftIcon={<FiMapPin />}
            value={form.address_line}
            onChange={(v) => setForm({ ...form, address_line: v })}
          />
        </div>
        <Input
          label="Apraksts"
          leftIcon={<FiFileText />}
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
          multiline
        />

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1.5px solid #1e73d8",
            background: "var(--bg-input, #f6f7fb)",
            color: "#1e73d8",
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 10,
          }}
        >
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              width: 18,
              height: 18,
              borderRadius: 6,
              border: "2px solid #1e73d8",
              background: form.is_active ? "#1e73d8" : "var(--bg-input, #f6f7fb)",
              boxShadow: form.is_active ? "inset 0 0 0 3px var(--bg-input, #f6f7fb)" : "none",
              cursor: "pointer",
            }}
          />
          <span>Uzņēmums aktīvs</span>
        </label>

        <div style={{ marginTop: 12 }}>
          <label style={{ fontWeight: 700, color: "#1e73d8" }}>Uzņēmuma logotips</label>
          <div
            style={{
              marginTop: 8,
              border: "1.5px dashed #1e73d8",
              borderRadius: 14,
              padding: 14,
              textAlign: "center",
              background: "var(--bg-input, #f6f7fb)",
              color: "#1b2f5e",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "center",
            }}
          >
            <FiUploadCloud color="#1e73d8" size={20} />
            <label
              style={{
                cursor: "pointer",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #1e73d8",
                color: "#1e73d8",
                fontWeight: 700,
                background: "#fff",
              }}
            >
              Augšupielādēt logo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogo(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </label>
            {logo ? <div style={{ fontSize: 13 }}>Izvēlēts: {logo.name}</div> : <div style={{ fontSize: 13 }}>Nav izvēlēts fails</div>}
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "stretch",
            alignItems: "stretch",
          }}
        >
          <Button variant="primary" onClick={onSave} style={{ flex: 1 }}>
            Atjaunot uzņēmuma informāciju
          </Button>
          <Button variant="danger" onClick={onDelete} style={{ flex: 1 }}>
            Dzēst uzņēmumu
          </Button>
        </div>

        {message && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: "rgba(34,197,94,0.12)",
              color: "#166534",
              fontWeight: 800,
            }}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: "rgba(226,59,59,0.12)",
              color: "#c0392b",
              whiteSpace: "pre-wrap",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}
      </Card>

      {confirmDeleteOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">Dzēst uzņēmumu?</div>
              <button className="modal-x" onClick={() => setConfirmDeleteOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body" style={{ paddingBottom: 14 }}>
              <div style={{ marginBottom: 12, fontWeight: 600, color: "#1e73d8" }}>
                Apstipriniet, ka vēlaties dzēst uzņēmuma profilu.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "stretch" }}>
                <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)} style={{ flex: 1 }}>
                  Atcelt
                </Button>
                <Button variant="danger" onClick={confirmDelete} style={{ flex: 1 }}>
                  Dzēst
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
