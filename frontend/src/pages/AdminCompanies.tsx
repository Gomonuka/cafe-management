import { useEffect, useState } from "react";
import { FiTrash2, FiUserX } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import type { AdminCompany } from "../api/companies";
import { adminListCompanies, adminBlockCompany, adminDeleteCompany } from "../api/companies";
import "../styles/profile.css";

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await adminListCompanies();
    if (res.ok) setCompanies(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onBlock = async (id: number) => {
    await adminBlockCompany(id);
    await load();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Dzēst uzņēmumu?")) return;
    await adminDeleteCompany(id);
    await load();
  };

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="profile-title" style={{ textAlign: "left" }}>Sistēmas uzņēmumi</div>
      <Card>
        {loading ? (
          <div style={{ padding: 12 }}>Ielāde...</div>
        ) : (
          <div className="users-table">
            <div className="users-head">
              <span style={{ width: 40 }}>ID</span>
              <span style={{ flex: 1 }}>Nosaukums</span>
              <span style={{ width: 120, textAlign: "center" }}>Statuss</span>
              <span style={{ width: 120, textAlign: "center" }}>Bloķēt</span>
              <span style={{ width: 120, textAlign: "center" }}>Dzēst</span>
            </div>
            {companies.map((c, idx) => (
              <div className="users-row" key={c.id}>
                <span style={{ width: 40 }}>{idx + 1}.</span>
                <input className="users-input" value={c.name} readOnly />
                <input className="users-input" value={c.status} readOnly style={{ width: 120 }} />
                <span style={{ width: 120, textAlign: "center" }}>
                  <button className="icon-btn amber" onClick={() => onBlock(c.id)} title="Bloķēt">
                    <FiUserX />
                  </button>
                </span>
                <span style={{ width: 120, textAlign: "center" }}>
                  <button className="icon-btn danger" onClick={() => onDelete(c.id)} title="Dzēst">
                    <FiTrash2 />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
