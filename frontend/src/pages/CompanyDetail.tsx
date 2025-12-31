import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getCompanyDetail, type CompanyDetail } from "../api/companies";

const weekdayLabels = ["Pr-Pk", "Se", "Sv", "", "", "", ""];

export default function CompanyDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getCompanyDetail(Number(id)).then((res) => {
      if (res.ok) setCompany(res.data);
      else setError(res.data?.detail || "Neizdevās ielādēt uzņēmumu");
    });
  }, [id]);

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="profile-title" style={{ textAlign: "left" }}>
        <button onClick={() => nav(-1)} style={{ marginRight: 8 }}>←</button>
        {company ? company.name : "Uzņēmums"}
      </div>

      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {!company && !error && <div style={{ padding: 12 }}>Ielāde...</div>}
      {company && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          <Card>
            <div style={{ fontWeight: 700, color: "#1e73d8", marginBottom: 10 }}>Apraksts</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{company.description || "Nav apraksta"}</div>

            <div style={{ marginTop: 16, fontWeight: 700, color: "#1e73d8" }}>Darba laiks</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 6 }}>
              {company.working_hours.map((wh) => (
                <li key={wh.weekday}>
                  {wh.from_time} - {wh.to_time}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div style={{ fontWeight: 700, color: "#1e73d8", marginBottom: 10 }}>Pamatinformācija</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <FiMapPin /> {company.address_line}, {company.city}, {company.country}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <FiPhone /> {company.phone}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <FiMail /> {company.email}
            </div>
            <Button variant="primary" onClick={() => nav(`/app/companies/${company.id}/menu`)}>
              Skatīt ēdienkarti
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
