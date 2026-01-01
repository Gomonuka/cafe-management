import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { createCompany } from "../api/companies";
import { FiUploadCloud, FiBriefcase, FiMail, FiPhone, FiGlobe, FiMapPin, FiFileText } from "react-icons/fi";

const days = ["Pirmdiena", "Otrdiena", "Trešdiena", "Ceturtdiena", "Piektdiena", "Sestdiena", "Svētdiena"];

export default function CreateCompanyPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    address_line: "",
    description: "",
  });
  const [logo, setLogo] = useState<File | undefined>(undefined);
  const [workingHours, setWorkingHours] = useState(
    days.map((_, idx) => ({ weekday: idx, from_time: "00:00", to_time: "00:00" }))
  );
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("working_hours", JSON.stringify(workingHours));
    if (logo) fd.append("logo", logo);
    const res = await createCompany(fd);
    if (!res.ok) {
      setError(JSON.stringify(res.data));
      return;
    }
    setOk("Uzņēmums izveidots.");
    nav("/app/my-company");
  };

  const updateWH = (idx: number, field: "from_time" | "to_time", value: string) => {
    setWorkingHours((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], [field]: value };
      return arr;
    });
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
          Lūdzu, aizpildiet Jūsu uzņēmuma pamatinformāciju.
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

          <div style={{ marginTop: 6, fontWeight: 800, color: "#1e73d8" }}>Darba laiks</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {workingHours.map((wh, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 90, fontWeight: 700 }}>{days[idx]}</div>
                <input
                  type="time"
                  value={wh.from_time}
                  onChange={(e) => updateWH(idx, "from_time", e.target.value)}
                  style={{
                    flex: 1,
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid #cfd8e3",
                    background: "#f6f7fb url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%231e73d8\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><polyline points=\"12 6 12 12 16 14\"/></svg>') no-repeat right 10px center",
                    color: "#1b2f5e",
                  }}
                />
                <input
                  type="time"
                  value={wh.to_time}
                  onChange={(e) => updateWH(idx, "to_time", e.target.value)}
                  style={{
                    flex: 1,
                    borderRadius: 10,
                    padding: "10px 12px",
                    border: "1px solid #cfd8e3",
                    background: "#f6f7fb url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%231e73d8\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><polyline points=\"12 6 12 12 16 14\"/></svg>') no-repeat right 10px center",
                    color: "#1b2f5e",
                  }}
                />
              </div>
            ))}
          </div>

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

          {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
          {ok && <div style={{ color: "green", marginTop: 8 }}>{ok}</div>}
        </div>
      </div>
    </div>
  );
}
