import { useEffect, useState } from "react";
import { FiTrash2, FiUserX } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import type { AdminUser } from "../api/accounts";
import { blockAdminUser, deleteAdminUser, fetchAdminUsers } from "../api/accounts";
import "../styles/profile.css";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetchAdminUsers();
    if (res.ok) setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const onBlock = async (id: number) => {
    await blockAdminUser(id);
    await load();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Dzēst lietotāju?")) return;
    await deleteAdminUser(id);
    await load();
  };

  return (
    <div className="profile-wrap">
      <div className="profile-title">Lietotāji</div>
      <Card>
        {loading ? (
          <div style={{ padding: 16 }}>Ielāde...</div>
        ) : (
          <div className="users-table">
            <div className="users-head">
              <span style={{ width: 40 }}>ID</span>
              <span style={{ flex: 1 }}>Lietotājvārds</span>
              <span style={{ width: 140 }}>Loma</span>
              <span style={{ width: 120, textAlign: "center" }}>Bloķēt</span>
              <span style={{ width: 120, textAlign: "center" }}>Dzēst</span>
            </div>
            {users.map((u, idx) => (
              <div className="users-row" key={u.id}>
                <span style={{ width: 40 }}>{idx + 1}.</span>
                <input className="users-input" value={u.username} readOnly />
                <input className="users-input" value={u.role} readOnly style={{ width: 140 }} />
                <span style={{ width: 120, textAlign: "center" }}>
                  <button className="icon-btn amber" onClick={() => onBlock(u.id)} title="Bloķēt">
                    <FiUserX />
                  </button>
                </span>
                <span style={{ width: 120, textAlign: "center" }}>
                  <button className="icon-btn danger" onClick={() => onDelete(u.id)} title="Dzēst">
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
