import { useEffect, useState } from "react";
import { FiTrash2, FiUserCheck, FiUserX } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import type { AdminUser } from "../api/accounts";
import { blockAdminUser, deleteAdminUser, fetchAdminUsers } from "../api/accounts";
import "../styles/profile.css";

const roleLabelLv: Record<AdminUser["role"], string> = {
  client: "Klients",
  employee: "Darbinieks",
  company_admin: "Uzņēmuma administrators",
  system_admin: "Sistēmas administrators",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; id: number | null; text: string }>({
    open: false,
    id: null,
    text: "",
  });

  const sorted = (list: AdminUser[]) => [...list].sort((a, b) => a.id - b.id);

  const load = async () => {
    setLoading(true);
    const res = await fetchAdminUsers();
    if (res.ok) setUsers(sorted(res.data));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onBlock = async (id: number) => {
    const resToggle = await blockAdminUser(id);
    const res = await fetchAdminUsers();
    if (res.ok) setUsers(sorted(res.data));
    if (resToggle.ok) {
      const blocked = (resToggle.data as any)?.is_blocked;
      setToast(blocked ? "Lietotājs bloķēts." : "Lietotājs atbloķēts.");
    } else {
      setToast("Neizdevās atjaunināt statusu.");
    }
  };

  const askDelete = (id: number) => {
    setConfirmState({ open: true, id, text: "Dzēst lietotāju?" });
  };

  const confirmDelete = async () => {
    if (!confirmState.id) return;
    await deleteAdminUser(confirmState.id);
    setConfirmState({ open: false, id: null, text: "" });
    await load();
  };

  return (
    <div className="profile-wrap admin-users-page">
      <div className="profile-title" style={{ color: "#1e73d8" }}>
        Lietotāji
      </div>
      <Card>
        {loading ? (
          <div style={{ padding: 16 }}>Ielāde...</div>
        ) : (
          <div className="users-card">
            <div className="users-head">
              <span>ID</span>
              <span>Lietotājvārds</span>
              <span>Loma</span>
              <span style={{ textAlign: "center" }}>Bloķēt</span>
              <span style={{ textAlign: "center" }}>Dzēst</span>
            </div>
            {users.length === 0 ? (
              <div className="users-empty">Nav neviena lietotāja.</div>
            ) : (
              <div className="users-body">
                {users.map((u, idx) => {
                  const blocked = Boolean(u.is_blocked);
                  const BlockIcon = blocked ? FiUserCheck : FiUserX;
                  const isSystemAdmin = u.role === "system_admin";
                  return (
                    <div className="users-row" key={u.id}>
                      <span className="users-id">{idx + 1}.</span>
                      <input className="users-pill-input" value={u.username} readOnly />
                      <input className="users-pill-input" value={roleLabelLv[u.role] || u.role} readOnly />
                      <div className="users-actions">
                        <button
                          className={`icon-btn ${blocked ? "danger" : "amber"}`}
                          onClick={() => onBlock(u.id)}
                          title={blocked ? "Atbloķēt" : "Bloķēt"}
                          disabled={isSystemAdmin}
                          style={isSystemAdmin ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                        >
                          <BlockIcon />
                        </button>
                      </div>
                      <div className="users-actions">
                        <button
                          className="icon-btn danger"
                          onClick={() => askDelete(u.id)}
                          title="Dzēst"
                          disabled={isSystemAdmin}
                          style={isSystemAdmin ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
