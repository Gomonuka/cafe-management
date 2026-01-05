//  frontend/src/pages/AdminCompanies.tsx
import { useEffect, useState } from "react";
import { FiTrash2, FiUserCheck, FiUserX } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import type { AdminCompany } from "../api/companies";
import { adminListCompanies, adminBlockCompany, adminDeleteCompany } from "../api/companies";
import "../styles/profile.css";

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; id: number | null; text: string }>({
    open: false,
    id: null,
    text: "",
  });

  const sorted = (list: AdminCompany[]) => [...list].sort((a, b) => a.id - b.id);

  const load = async () => {
    setLoading(true);
    const res = await adminListCompanies();
    if (res.ok) setCompanies(sorted(res.data));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onBlock = async (id: number) => {
    const resToggle = await adminBlockCompany(id);
    const res = await adminListCompanies();
    if (res.ok) setCompanies(sorted(res.data));
    if ((resToggle as any).ok) {
      const blocked = (resToggle as any).data?.is_blocked;
      setToast(blocked ? "Uzņēmums bloķēts." : "Uzņēmums atbloķēts.");
    } else {
      setToast("Neizdevās atjaunināt statusu.");
    }
  };

  const askDelete = (id: number) => {
    setConfirmState({ open: true, id, text: "Dzēst uzņēmumu?" });
  };

  const confirmDelete = async () => {
    if (!confirmState.id) return;
    await adminDeleteCompany(confirmState.id);
    setConfirmState({ open: false, id: null, text: "" });
    await load();
  };

  return (
    <div className="profile-wrap admin-users-page">
      <div className="profile-title" style={{ color: "#1e73d8" }}>
        Sistēmas uzņēmumi
      </div>
      <Card>
        {loading ? (
          <div style={{ padding: 16 }}>Ielāde...</div>
        ) : (
          <div className="users-card">
            <div className="users-grid">
              <div className="users-head">
                <span>ID</span>
                <span>Nosaukums</span>
                <span>Statuss</span>
                <span style={{ textAlign: "center" }}>Bloķēt</span>
                <span style={{ textAlign: "center" }}>Dzēst</span>
              </div>
              {companies.length === 0 ? (
                <div className="users-empty">Nav neviena uzņēmuma.</div>
              ) : (
                <div className="users-body">
                  {companies.map((c, idx) => {
                    const blocked = Boolean(c.is_blocked || c.status === "blocked");
                    const BlockIcon = blocked ? FiUserCheck : FiUserX;
                    return (
                      <div className="users-row" key={c.id}>
                        <span className="users-id">{idx + 1}.</span>
                        <input className="users-pill-input" value={c.name} readOnly />
                        <input className="users-pill-input" value={c.status} readOnly />
                        <div className="users-actions">
                          <button
                            className={`icon-btn ${blocked ? "danger" : "amber"}`}
                            onClick={() => onBlock(c.id)}
                            title={blocked ? "Atbloķēt" : "Bloķēt"}
                          >
                            <BlockIcon />
                          </button>
                        </div>
                        <div className="users-actions">
                          <button className="icon-btn danger" onClick={() => askDelete(c.id)} title="Dzēst">
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={confirmState.open}
        title="Apstiprināt"
        onClose={() => setConfirmState({ open: false, id: null, text: "" })}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 700, color: "#1b2f5e" }}>{confirmState.text}</div>
          <div className="actions actions-wide" style={{ marginTop: 6, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setConfirmState({ open: false, id: null, text: "" })}>
              Atcelt
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Dzēst
            </Button>
          </div>
        </div>
      </Modal>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
