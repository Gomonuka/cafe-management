// frontend/src/pagesParts/company/CompanyInfo.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Globe, Building2, UploadCloud, X } from "lucide-react";

import {
  getCompanyDetail,
  updateCompany,
  deactivateCompany,
  deleteMyCompany,
} from "../../api/companies";

import "../../styles/companyInfo.css";

type Props = {
  companyId: string;
  editable: boolean;
  showMenuButton?: boolean;
};

export default function CompanyInfo({ companyId, editable, showMenuButton }: Props) {
  const nav = useNavigate();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [company, setCompany] = useState<any>(null);

  const title = useMemo(() => company?.name || company?.nosaukums || "Restorāns", [company]);

  const onChange = (key: string, value: any) => {
    setCompany((prev: any) => ({ ...(prev || {}), [key]: value }));
  };

  const onSave = async () => {
    if (!editable) return;
    try {
      setSaving(true);
      setErr(null);
      setOk(null);

      const fd = new FormData();
      fd.append("name", company?.name ?? company?.nosaukums ?? "");
      fd.append("email", company?.email ?? company?.e_pasts ?? "");
      fd.append("phone", company?.phone ?? company?.talrunis ?? "");
      fd.append("description", company?.description ?? company?.apraksts ?? "");
      fd.append("country", company?.address_country ?? company?.valsts ?? "");
      fd.append("city", company?.address_city ?? company?.pilseta ?? "");
      fd.append("address_line", company?.address_line1 ?? company?.adreses_1_linija ?? "");

      const updated = await updateCompany(fd);
      setCompany(updated.data);
      setOk("Saglabāts!");
    } catch (e: any) {
      setErr(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onDeactivate = async () => {
    if (!editable) return;
    if (!confirm("Deaktivizēt uzņēmumu?")) return;
    try {
      setSaving(true);
      const res = await deactivateCompany();
      setOk(res.data?.detail || "Uzņēmums deaktivizēts.");
      const c = await getCompanyDetail(Number(companyId));
      if (c.ok) setCompany(c.data);
    } catch (e: any) {
      setErr(e?.message || "Failed to deactivate");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!editable) return;
    if (!confirm("Dzēst uzņēmumu? Šo darbību nevar atsaukt.")) return;
    try {
      setSaving(true);
      await deleteMyCompany();
      nav("/app/create-company", { replace: true });
    } catch (e: any) {
      setErr(e?.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const onLogoPick = async (file: File | null) => {
    if (!file || !editable) return;
    setOk("Logo upload endpoint vēl nav pieslēgts.");
  };

  if (!company) return <div className="company-info">Not found</div>;

  return (
    <div className="company-info">
      {/* header */}
      <div className="ci-top">
        <button className="ci-back" type="button" onClick={() => nav(-1)} aria-label="Back">
          <ArrowLeft size={18} />
        </button>

        <div className="ci-title">
          <div className="ci-title-main">{title}</div>
        </div>

        {showMenuButton ? (
          <button className="btn btn-primary ci-menu" type="button" onClick={() => nav(`/app/companies/${companyId}/menu`)}>
            Skatīt ēdienkarti
          </button>
        ) : (
          <div />
        )}
      </div>
      {/* grid */}
      <div className="ci-grid">
        {/* logo card */}
        <div className="card ci-logo">
          <div className="ci-logo-box">
            <div className="ci-logo-placeholder">?</div>

            {editable ? (
              <button className="ci-logo-x" type="button" aria-label="Remove logo" onClick={() => setOk("Remove logo TODO.")}>
                <X size={18} />
              </button>
            ) : null}
          </div>

          {editable ? (
            <label className="ci-upload">
              <UploadCloud size={18} />
              <span>Augšupielādēt jauno logo</span>
              <input type="file" accept="image/*" onChange={(e) => onLogoPick(e.target.files?.[0] ?? null)} />
            </label>
          ) : null}
        </div>

        {/* main info */}
        <div className="card ci-main">
          <div className="ci-section-title">Pamatinformācija</div>

          <div className="ci-fields">
            <Field
              label="Uzņēmuma nosaukums"
              icon={<Building2 size={18} />}
              value={company.name ?? company.nosaukums ?? ""}
              disabled={!editable}
              onChange={(v) => onChange("name", v)}
            />
            <Field
              label="E-pasts"
              icon={<Mail size={18} />}
              value={company.email ?? company.e_pasts ?? ""}
              disabled={!editable}
              onChange={(v) => onChange("email", v)}
            />
            <Field
              label="Tālrunis"
              icon={<Phone size={18} />}
              value={company.phone ?? company.talrunis ?? ""}
              disabled={!editable}
              onChange={(v) => onChange("phone", v)}
            />

            <div className="ci-subtitle">Adrese</div>

            <Field
              label="Valsts"
              icon={<Globe size={18} />}
              value={company.address_country ?? company.valsts ?? ""}
              disabled={!editable}
              onChange={(v) => onChange("address_country", v)}
            />
            <Field
              label="Pilsēta"
              icon={<MapPin size={18} />}
              value={company.address_city ?? company.pilseta ?? ""}
              disabled={!editable}
              onChange={(v) => onChange("address_city", v)}
            />
            <Field
              label="Adreses 1. līnija"
              icon={<MapPin size={18} />}
              value={company.address_line1 ?? company.adreses_1_linija ?? ""}
              disabled={!editable}
              onChange={(v) => onChange("address_line1", v)}
            />
          </div>
        </div>

        {/* description */}
        <div className="card ci-desc">
          <div className="ci-section-title">Apraksts</div>
          <textarea
            className="ci-textarea"
            placeholder="20-100 vārdi..."
            value={company.description ?? company.apraksts ?? ""}
            disabled={!editable}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </div>
      </div>

      {/* actions */}
      {err ? <div className="err">{err}</div> : null}
      {ok ? <div className="ok">{ok}</div> : null}

      {editable ? (
        <div className="ci-actions">
          <button className="btn btn-primary btn-full" type="button" onClick={onSave} disabled={saving}>
            Atjaunot uzņēmuma informāciju
          </button>

          <button className="btn ci-warn btn-full" type="button" onClick={onDeactivate} disabled={saving}>
            Deaktivizēt uzņēmumu
          </button>

          <button className="btn btn-danger btn-full" type="button" onClick={onDelete} disabled={saving}>
            Dzēst uzņēmumu
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  icon: any;
}) {
  return (
    <div className="f">
      <div className="f-label">{label}</div>
      <div className="f-field">
        <span className="f-ic left">{icon}</span>
        <input className="f-input" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
