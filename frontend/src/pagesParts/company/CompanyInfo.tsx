import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  UploadCloud,
  X,
} from "lucide-react";

import {
  getCompany,
  updateCompany,
  deactivateCompany,
  deleteCompany,
  getCompanyWorkingHours,
  upsertCompanyWorkingHours,
} from "../../api/company.api";

import "../../styles/companyInfo.css";

type Props = {
  companyId: string;
  editable: boolean;
  // для клиента можно показывать кнопку "Skatīt ēdienkarti"
  showMenuButton?: boolean;
};

type WHRow = {
  weekday: number; // 1..7
  open_time: string; // "09:00"
  close_time: string; // "21:00"
  is_closed: boolean;
};

const WEEKDAYS = [
  { id: 1, label: "Pirmdiena" },
  { id: 2, label: "Otrdiena" },
  { id: 3, label: "Trešdiena" },
  { id: 4, label: "Ceturtdiena" },
  { id: 5, label: "Piektdiena" },
  { id: 6, label: "Sestdiena" },
  { id: 7, label: "Svētdiena" },
];

export default function CompanyInfo({ companyId, editable, showMenuButton }: Props) {
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [company, setCompany] = useState<any>(null);
  const [wh, setWh] = useState<WHRow[]>(
    WEEKDAYS.map((d) => ({
      weekday: d.id,
      open_time: "",
      close_time: "",
      is_closed: true,
    }))
  );

  const title = useMemo(() => company?.name || company?.nosaukums || "Restorāns", [company]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const c = await getCompany(companyId);
        setCompany(c);

        const hours = await getCompanyWorkingHours(companyId);
        // нормализуем
        const map = new Map<number, WHRow>();
        for (const row of hours || []) {
          map.set(row.weekday ?? row.nedelas_diena, {
            weekday: row.weekday ?? row.nedelas_diena,
            open_time: row.open_time ?? row.atversanas_laiks ?? "",
            close_time: row.close_time ?? row.slegsanas_laiks ?? "",
            is_closed: row.is_closed ?? row.vai_ir_slegts ?? false,
          });
        }
        setWh(
          WEEKDAYS.map((d) => map.get(d.id) ?? { weekday: d.id, open_time: "", close_time: "", is_closed: true })
        );
      } catch (e: any) {
        setErr(e?.message || "Failed to load company");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  const onChange = (key: string, value: any) => {
    setCompany((prev: any) => ({ ...(prev || {}), [key]: value }));
  };

  const onWHChange = (weekday: number, patch: Partial<WHRow>) => {
    setWh((prev) => prev.map((r) => (r.weekday === weekday ? { ...r, ...patch } : r)));
  };

  const onSave = async () => {
    if (!editable) return;
    try {
      setSaving(true);
      setErr(null);
      setOk(null);

      // 1) company
      const payload = {
        name: company?.name ?? company?.nosaukums,
        email: company?.email ?? company?.e_pasts,
        phone: company?.phone ?? company?.talrunis,
        description: company?.description ?? company?.apraksts,
        // address parts:
        address_country: company?.address_country ?? company?.valsts,
        address_city: company?.address_city ?? company?.pilseta,
        address_line1: company?.address_line1 ?? company?.adreses_1_linija,
      };

      const updated = await updateCompany(companyId, payload);
      setCompany(updated);

      // 2) working hours (upsert)
      await upsertCompanyWorkingHours(companyId, wh);

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
      await deactivateCompany(companyId);
      setOk("Uzņēmums deaktivizēts.");
      // можно перезагрузить
      const c = await getCompany(companyId);
      setCompany(c);
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
      await deleteCompany(companyId);
      // после удаления company_admin улетит на create-company
      nav("/app/create-company", { replace: true });
    } catch (e: any) {
      setErr(e?.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  // заглушка для лого — пока без реального upload endpoint
  const onLogoPick = async (file: File | null) => {
    if (!file || !editable) return;
    setOk("Logo upload endpoint vēl nav pieslēgts (izdarīsim nākamais solis).");
  };

  if (loading) return <div className="company-info">Loading...</div>;
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

      {/* layout like figma: left logo card + right form */}
      <div className="ci-grid">
        {/* logo card */}
        <div className="card ci-logo">
          <div className="ci-logo-box">
            <div className="ci-logo-placeholder">☕</div>

            {editable ? (
              <button className="ci-logo-x" type="button" aria-label="Remove logo" onClick={() => setOk("Remove logo позже.")}>
                <X size={18} />
              </button>
            ) : null}
          </div>

          {editable ? (
            <label className="ci-upload">
              <UploadCloud size={18} />
              <span>Augšupielādēt jauno logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onLogoPick(e.target.files?.[0] ?? null)}
              />
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

        {/* working hours */}
        <div className="card ci-hours">
          <div className="ci-section-title">Darba laiks</div>

          <div className="ci-hours-grid">
            {WEEKDAYS.map((d) => {
              const row = wh.find((x) => x.weekday === d.id)!;
              const closed = row.is_closed;

              return (
                <div key={d.id} className="ci-day">
                  <div className="ci-day-name">{d.label}</div>

                  <div className="ci-day-row">
                    <input
                      className="ci-mini"
                      placeholder={closed ? "Slēgts" : "No:"}
                      type="time"
                      value={closed ? "" : row.open_time}
                      disabled={!editable || closed}
                      onChange={(e) => onWHChange(d.id, { open_time: e.target.value })}
                    />
                    <input
                      className="ci-mini"
                      placeholder={closed ? "Slēgts" : "Līdz:"}
                      type="time"
                      value={closed ? "" : row.close_time}
                      disabled={!editable || closed}
                      onChange={(e) => onWHChange(d.id, { close_time: e.target.value })}
                    />

                    {editable ? (
                      <label className="ci-closed">
                        <input
                          type="checkbox"
                          checked={closed}
                          onChange={(e) =>
                            onWHChange(d.id, {
                              is_closed: e.target.checked,
                              open_time: e.target.checked ? "" : row.open_time,
                              close_time: e.target.checked ? "" : row.close_time,
                            })
                          }
                        />
                        <span>Slēgts</span>
                      </label>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
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
        <input
          className="f-input"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
