import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiMapPin, FiPhone, FiMail, FiImage, FiArrowLeft, FiBookOpen } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getCompanyDetail, type CompanyDetail } from "../api/companies";
import "../styles/profile.css";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getCompanyDetail(Number(id)).then((res) => {
      if (res.ok) setCompany(res.data);
      else setError(res.data?.detail || "Neizdevās ielādēt uzņēmumu.");
    });
  }, [id]);

  const logoNode = (c: CompanyDetail) => {
    if (c.logo) {
      return <img src={c.logo} alt={c.name} className="company-detail-logo-img" />;
    }
    const initials = c.name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
    return (
      <div className="company-detail-logo-placeholder">
        <FiImage size={32} />
        <span>{initials || "?"}</span>
      </div>
    );
  };

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="company-detail-topbar">
        <button className="link-btn circle" onClick={() => nav(-1)} aria-label="Atpakaļ">
          <FiArrowLeft />
        </button>
        <div className="company-detail-top-title">{company ? company.name : "Uzņēmums"}</div>
        {company && (
          <Button variant="primary" onClick={() => nav(`/app/companies/${company.id}/menu`)} className="topbar-btn">
            <FiBookOpen style={{ marginRight: 8 }} />
            Skatīt ēdienkarti
          </Button>
        )}
      </div>

      {error && <div style={{ color: "red", padding: 12 }}>{error}</div>}
      {!company && !error && <div style={{ padding: 12 }}>Ielāde...</div>}

      {company && (
        <>
          <div className="company-detail-grid">
            <Card className="company-detail-card logo">
              {logoNode(company)}
            </Card>
            <Card className="company-detail-card info">
              <div className="company-detail-title">Pamatinformācija</div>
              <div className="company-detail-line">
                <FiMapPin /> {company.address_line}, {company.city}, {company.country}
              </div>
              <div className="company-detail-line">
                <FiPhone /> {company.phone || "Nav norādīts"}
              </div>
              <div className="company-detail-line">
                <FiMail /> {company.email || "Nav norādīts"}
              </div>
            </Card>
          </div>

          <Card className="company-detail-card desc">
            <div className="company-detail-title">Apraksts</div>
            <div className="company-detail-text">
              {company.description || "Nav apraksta"}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
