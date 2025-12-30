import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiCoffee, FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import "../styles/companyPublic.css";

type WorkingRow = { label: string; value: string };
type Company = {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  working: WorkingRow[];
};

const mockCompany: Company = {
  id: 1,
  name: 'Restorāns "Tests"',
  address: "Adrese",
  phone: "Tālrunis",
  email: "E-pasts",
  description: "Mājīgs restorāns ar eksperimentālo ēdienkarti.",
  working: [
    { label: "Pr-Pk", value: "9:00 - 21:00" },
    { label: "Se", value: "12:00 - 00:00" },
    { label: "Sv", value: "12:00 - 20:00" },
  ],
};

export default function CompanyPublic() {
  const nav = useNavigate();
  const { id } = useParams();

  const c = useMemo(() => ({ ...mockCompany, id: Number(id || 1) }), [id]);

  return (
    <div className="cp">
      <div className="cp-top card">
        <button className="cp-back" onClick={() => nav(-1)} type="button" aria-label="Back">
          <FiArrowLeft />
        </button>

        <div className="cp-title">{c.name}</div>

        <button
          className="btn btn-primary cp-menu-btn"
          type="button"
          onClick={() => nav(`/app/companies/${c.id}/menu`)}
        >
          Skatīt ēdienkarti
        </button>
      </div>

      <div className="cp-grid">
        <div className="cp-left card">
          <div className="cp-image">
            <div className="cp-image-ic">
              <FiCoffee />
            </div>
          </div>
        </div>

        <div className="cp-right card">
          <div className="cp-block-title">Pamatinformācija</div>

          <div className="cp-info">
            <div className="cp-row">
              <span className="cp-ic"><FiMapPin /></span>
              <span>{c.address}</span>
            </div>
            <div className="cp-row">
              <span className="cp-ic"><FiPhone /></span>
              <span>{c.phone}</span>
            </div>
            <div className="cp-row">
              <span className="cp-ic"><FiMail /></span>
              <span>{c.email}</span>
            </div>
          </div>
        </div>

        <div className="cp-desc card">
          <div className="cp-block-title">Apraksts</div>
          <div className="cp-desc-text">{c.description}</div>
        </div>

        <div className="cp-hours card">
          <div className="cp-block-title">Darba laiks</div>
          <div className="cp-hours-list">
            {c.working.map((r) => (
              <div key={r.label} className="cp-hours-row">
                <span className="cp-hours-label">{r.label}:</span>
                <span className="cp-hours-val">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
