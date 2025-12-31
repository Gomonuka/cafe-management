import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { deactivateCompany, deleteMyCompany, getCompanyDetail, updateCompany } from "../api/companies";
import { getMe } from "../auth/auth.api";

const days = ["Pirmdiena", "Otrdiena", "Trešdiena", "Ceturtdiena", "Piektdiena", "Sestdiena", "Svētdiena"];

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
  });
  const [logo, setLogo] = useState<File | undefined>(undefined);
  const [workingHours, setWorkingHours] = useState(
    days.map((_, idx) => ({ weekday: idx, from_time: "00:00", to_time: "00:00" }))
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getMe().then((res) => {
      if (res.ok && mounted) {
        if (res.data.company) setCompanyId(res.data.company);
        else setError("Nav piesaistīts uzņēmums.");
      }
      setLoading(false);
    });
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
      });
      setWorkingHours(
        c.working_hours.map((wh) => ({
          weekday: wh.weekday,
          from_time: wh.from_time,
          to_time: wh.to_time,
        }))
      );
    });
  }, [companyId]);

  const updateWH = (idx: number, field: "from_time" | "to_time", value: string) => {
    setWorkingHours((prev) => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], [field]: value };
      return arr;
    });
  };

  const onSave = async () => {
    setMessage(null);
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("working_hours", JSON.stringify(workingHours));
    if (logo) fd.append("logo", logo);
    const res = await updateCompany(fd);
    if (!res.ok) {
      setError(JSON.stringify(res.data));
      return;
    }
    setMessage("Uzņēmums atjaunināts");
  };

  const onDeactivate = async () => {
    const res = await deactivateCompany();
    if (res.ok) setMessage("Uzņēmums deaktivizēts");
  };

  const onDelete = async () => {
    if (!confirm("Dzēst uzņēmumu?")) return;
    const res = await deleteMyCompany();
    if (res.ok) setMessage("Uzņēmums dzēsts");
  };

  if (loading) return <div style={{ padding: 20 }}>Ielāde...</div>;

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="profile-title" style={{ textAlign: "left" }}>
        Mans uzņēmums
      </div>

      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Uzņēmuma nosaukums" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="E-pasts" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Tālrunis" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Input label="Valsts" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          <Input label="Pilsēta" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Input label="Adrese" value={form.address_line} onChange={(v) => setForm({ ...form, address_line: v })} />
        </div>
        <Input
          label="Apraksts"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
          multiline
        />

        <div style={{ marginTop: 12, fontWeight: 700, color: "#1e73d8" }}>Darba laiks</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 8 }}>
          {workingHours.map((wh, idx) => (
            <div key={idx} style={{ border: "1px solid #cfd8e3", borderRadius: 10, padding: 8 }}>
              <div style={{ fontWeight: 700 }}>{days[idx]}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input
                  type="time"
                  value={wh.from_time}
                  onChange={(e) => updateWH(idx, "from_time", e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="time"
                  value={wh.to_time}
                  onChange={(e) => updateWH(idx, "to_time", e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Uzņēmuma logotips</label>
          <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0])} />
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <Button variant="primary" onClick={onSave}>Atjaunot uzņēmuma informāciju</Button>
          <Button variant="ghost" onClick={onDeactivate}>Deaktivizēt uzņēmumu</Button>
          <Button variant="danger" onClick={onDelete}>Dzēst uzņēmumu</Button>
        </div>

        {message && <div style={{ color: "green", marginTop: 8 }}>{message}</div>}
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </Card>
    </div>
  );
}
