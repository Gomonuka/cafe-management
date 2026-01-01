import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { createCompany } from "../api/companies";
import { FiUploadCloud, FiBriefcase, FiMail, FiPhone, FiGlobe, FiMapPin, FiFileText } from "react-icons/fi";

type FormState = {
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address_line: string;
  description: string;
  is_active: boolean;
};

const fieldLabels: Record<string, string> = {
  name: "Uzņēmuma nosaukums",
  email: "E-pasts",
  phone: "Tālrunis",
  country: "Valsts",
  city: "Pilsēta",
  address_line: "Adrese 1. līnija",
  description: "Apraksts",
  logo: "Logotips",
  is_active: "Aktīvs",
};

const translateMsg = (msg: string) => {
  switch (msg) {
    case "This field may not be blank.":
    case "This field is required.":
      return "Lauks ir obligāts.";
    default:
      return msg;
  }
};

const formatError = (data: any): string => {
  if (!data) return "Nezināma kļūda.";
  if (typeof data === "string") return translateMsg(data);
  if (typeof data === "object") {
    const parts: string[] = [];
    Object.entries(data).forEach(([field, msgs]) => {
      const label = fieldLabels[field] ?? field;
      const txtRaw = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
      parts.push(`${label}: ${translateMsg(txtRaw)}`);
    });
    return parts.join("\n");
  }
  return "Nezināma kļūda.";
};

export default function CreateCompanyPage() {
  const nav = useNavigate();
  const [form, setForm] = useState<FormState>({
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
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, typeof v === "boolean" ? String(v) : v));
    if (logo) fd.append("logo", logo);

    const res = await createCompany(fd);
    if (!res.ok) {
      const err = formatError(res.data);
      setError(err);
      return;
    }
    setOk("Uzņēmums izveidots.");
    nav("/app/my-company");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", padding: "24px 12px" }}>
      <div
        style={{
          width: "min(520px, 100%)",
          background: "white",
          borderRadius: 18,
          boxShadow: "0 12px 22px rgba(0,0,0,0.18)",
          padding: 18,
        }}
      >
        <div style={{ textAlign: "center", fontWeight: 800, color: "#1e73d8", fontSize: 20, marginBottom: 6 }}>
          Izveidojiet savu uzņēmumu
        </div>
        <div style={{ textAlign: "center", color: "#1e73d8", marginBottom: 14, fontWeight: 700 }}>
          Sistēmas izmantošanai uzņēmums ir obligāti jāizveido.
          <br />
          Lūdzu, aizpildiet jūsu uzņēmuma pamatinformāciju.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
              label="Adrese 1. līnija"
              leftIcon={<FiMapPin />}
              value={form.address_line}
              onChange={(v) => setForm({ ...form, address_line: v })}
            />
            <Input
              label="Apraksts"
              leftIcon={<FiFileText />}
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
              multiline
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1.5px solid #1e73d8",
              background: "#f6f7fb",
              color: "#1e73d8",
              fontWeight: 700,
              cursor: "pointer",
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
                background: form.is_active ? "#1e73d8" : "#fff",
                boxShadow: form.is_active ? "inset 0 0 0 3px #f6f7fb" : "none",
                cursor: "pointer",
              }}
            />
            <span>Uzņēmums aktīvs</span>
          </label>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontWeight: 700, color: "#1e73d8" }}>Uzņēmuma logotips</label>
            <div
              style={{
                marginTop: 8,
                border: "1.5px dashed #1e73d8",
                borderRadius: 14,
                padding: 14,
                textAlign: "center",
                background: "#f6f7fb",
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

          <Button variant="primary" onClick={onSubmit} style={{ width: "100%", marginTop: 8 }}>
            Izveidot uzņēmumu
          </Button>

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
          {ok && (
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
              {ok}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
