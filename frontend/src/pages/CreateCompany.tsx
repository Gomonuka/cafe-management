import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { createCompany } from "../api/companies";

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
        <div style={{ textAlign: "center", color: "#1e73d8", marginBottom: 14 }}>
          Lai sāktu izmantot sistēmu, lūdzu, aizpildiet Jūsu uzņēmuma pamatinformāciju.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Input label="Uzņēmuma nosaukums" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="E-pasts" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Input label="Tālrunis" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="Valsts" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
            <Input label="Pilsēta" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Input label="Adrese 1. līnija" value={form.address_line} onChange={(v) => setForm({ ...form, address_line: v })} />
            <Input
              label="Apraksts"
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
                  style={{ flex: 1, borderRadius: 10, padding: 8, border: "1px solid #cfd8e3" }}
                />
                <input
                  type="time"
                  value={wh.to_time}
                  onChange={(e) => updateWH(idx, "to_time", e.target.value)}
                  style={{ flex: 1, borderRadius: 10, padding: 8, border: "1px solid #cfd8e3" }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ fontWeight: 700, color: "#1e73d8" }}>Uzņēmuma logotips</label>
            <div style={{ marginTop: 6, border: "1px dashed #1e73d8", borderRadius: 12, padding: 12, textAlign: "center" }}>
              <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0])} />
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
