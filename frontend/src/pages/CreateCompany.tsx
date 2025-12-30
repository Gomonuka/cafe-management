import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCoffee,
  FiMail,
  FiPhone,
  FiCompass,
  FiMap,
  FiMapPin,
  FiUploadCloud,
  FiArrowLeft,
} from "react-icons/fi";
import "../styles/createCompany.css";

/**
 * ВАЖНО предупреждение:
 * Сейчас тут "mock submit". Дальше подключим реальный API:
 * - POST /api/companies/
 * - затем POST /api/company-working-hours/
 * - затем upload logo (multipart)
 */

type DayKey =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Pirmdiena",
  tue: "Otrdiena",
  wed: "Trešdiena",
  thu: "Ceturtdiena",
  fri: "Piektdiena",
  sat: "Sestdiena",
  sun: "Svētdiena",
};

type DayHours = {
  closed: boolean;
  from: string; // "09:00"
  to: string;   // "21:00"
};

export default function CreateCompany() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [addressLine1, setAddressLine1] = useState("");

  const [description, setDescription] = useState("");

  const [hours, setHours] = useState<Record<DayKey, DayHours>>({
    mon: { closed: false, from: "", to: "" },
    tue: { closed: false, from: "", to: "" },
    wed: { closed: false, from: "", to: "" },
    thu: { closed: false, from: "", to: "" },
    fri: { closed: false, from: "", to: "" },
    sat: { closed: false, from: "", to: "" },
    sun: { closed: true, from: "", to: "" },
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!email.trim()) return false;
    if (!phone.trim()) return false;
    if (!country.trim()) return false;
    if (!city.trim()) return false;
    if (!addressLine1.trim()) return false;
    if (!description.trim()) return false;
    return true;
  }, [name, email, phone, country, city, addressLine1, description]);

  function onPickLogo(file: File | null) {
    setLogoFile(file);
    if (!file) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  }

  function setDay(d: DayKey, patch: Partial<DayHours>) {
    setHours((prev) => ({
      ...prev,
      [d]: { ...prev[d], ...patch },
    }));
  }

  function toggleClosed(d: DayKey) {
    setHours((prev) => {
      const cur = prev[d];
      const closed = !cur.closed;
      return {
        ...prev,
        [d]: {
          closed,
          from: closed ? "" : cur.from,
          to: closed ? "" : cur.to,
        },
      };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    // TODO: тут будет реальный API вызов
    // Сейчас просто имитация успешного сохранения:
    console.log("Create company payload:", {
      name,
      email,
      phone,
      address: { country, city, addressLine1 },
      description,
      hours,
      logoFile,
    });

    // после успеха обычно редирект на "Мой бизнес" / "Mans uzņēmums"
    nav("/app/company");
  }

  return (
    <div className="cc-page">
      <div className="cc-shell">
        <div className="cc-card">
          <img className="cc-logo" src="/logo.png" alt="CRMS" />

          <div className="cc-title">Izveidojiet savu uzņēmumu</div>
          <div className="cc-subtitle">
            Lai sāktu izmantot sistēmu, lūdzu, aizpildiet Jūsu uzņēmuma
            pamatinformāciju.
          </div>

          <form className="cc-form" onSubmit={onSubmit}>
            {/* Pamatinformācija */}
            <div className="cc-section-title">Pamatinformācija</div>

            <div className="cc-box">
              <Field
                label="Uzņēmuma nosaukums"
                iconLeft={<FiCoffee />}
                value={name}
                onChange={setName}
                placeholder='Restorāns "Tests"'
              />
              <Field
                label="E-pasts"
                iconLeft={<FiMail />}
                value={email}
                onChange={setEmail}
                placeholder="tests@resto.com"
              />
              <Field
                label="Tālrunis"
                iconLeft={<FiPhone />}
                value={phone}
                onChange={setPhone}
                placeholder="+371 24043698"
              />

              <div className="cc-label">Adrese</div>

              <Field
                label="Valsts"
                iconLeft={<FiCompass />}
                value={country}
                onChange={setCountry}
                placeholder="Latvija"
              />
              <Field
                label="Pilsēta"
                iconLeft={<FiMap />}
                value={city}
                onChange={setCity}
                placeholder="Rīga"
              />
              <Field
                label="Adreses 1. līnija"
                iconLeft={<FiMapPin />}
                value={addressLine1}
                onChange={setAddressLine1}
                placeholder="Testa iela 24-6k"
              />

              <div className="cc-label">Apraksts</div>
              <div className="cc-field">
                <div className="cc-ic left">
                  <span className="cc-ic-square" />
                </div>
                <textarea
                  className="cc-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="20-100 vārdi..."
                  rows={4}
                />
              </div>
            </div>

            {/* Darba laiks */}
            <div className="cc-section-title">Darba laiks</div>

            <div className="cc-box">
              <div className="cc-hours-head">{DAY_LABELS.mon}</div>
              <HoursRow
                day={hours.mon}
                onToggleClosed={() => toggleClosed("mon")}
                onFrom={(v) => setDay("mon", { from: v })}
                onTo={(v) => setDay("mon", { to: v })}
              />

              <div className="cc-hours-head">{DAY_LABELS.tue}</div>
              <HoursRow
                day={hours.tue}
                onToggleClosed={() => toggleClosed("tue")}
                onFrom={(v) => setDay("tue", { from: v })}
                onTo={(v) => setDay("tue", { to: v })}
              />

              <div className="cc-hours-head">{DAY_LABELS.wed}</div>
              <HoursRow
                day={hours.wed}
                onToggleClosed={() => toggleClosed("wed")}
                onFrom={(v) => setDay("wed", { from: v })}
                onTo={(v) => setDay("wed", { to: v })}
              />

              <div className="cc-hours-head">{DAY_LABELS.thu}</div>
              <HoursRow
                day={hours.thu}
                onToggleClosed={() => toggleClosed("thu")}
                onFrom={(v) => setDay("thu", { from: v })}
                onTo={(v) => setDay("thu", { to: v })}
              />

              <div className="cc-hours-head">{DAY_LABELS.fri}</div>
              <HoursRow
                day={hours.fri}
                onToggleClosed={() => toggleClosed("fri")}
                onFrom={(v) => setDay("fri", { from: v })}
                onTo={(v) => setDay("fri", { to: v })}
              />

              <div className="cc-hours-head">{DAY_LABELS.sat}</div>
              <HoursRow
                day={hours.sat}
                onToggleClosed={() => toggleClosed("sat")}
                onFrom={(v) => setDay("sat", { from: v })}
                onTo={(v) => setDay("sat", { to: v })}
              />

              <div className="cc-hours-head">{DAY_LABELS.sun}</div>
              <HoursRow
                day={hours.sun}
                onToggleClosed={() => toggleClosed("sun")}
                onFrom={(v) => setDay("sun", { from: v })}
                onTo={(v) => setDay("sun", { to: v })}
                defaultClosed
              />
            </div>

            {/* Logo */}
            <div className="cc-section-title">Uzņēmuma logotips</div>

            <div className="cc-logo-box">
              <label className="cc-upload">
                <FiUploadCloud />
                <span>Augšupielādēt jauno logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickLogo(e.target.files?.[0] ?? null)}
                />
              </label>

              <div className="cc-logo-preview">
                {logoPreview ? (
                  <img src={logoPreview} alt="logo preview" />
                ) : (
                  <FiCoffee />
                )}
              </div>
            </div>

            <button className="btn cc-submit" type="submit" disabled={!canSubmit}>
              Izveidot uzņēmumu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  iconLeft: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="cc-field-wrap">
      <div className="cc-label">{props.label}</div>
      <div className="cc-field">
        <div className="cc-ic left">{props.iconLeft}</div>
        <input
          className="cc-input"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
        />
      </div>
    </div>
  );
}

function HoursRow(props: {
  day: DayHours;
  onToggleClosed: () => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  defaultClosed?: boolean;
}) {
  const closed = props.day.closed;

  return (
    <div className="cc-hours-row">
      <div className="cc-hours-col">
        <div className="cc-field">
          <input
            className="cc-input cc-input-small"
            value={closed ? "Slēgts" : props.day.from}
            onChange={(e) => props.onFrom(e.target.value)}
            placeholder="No:"
            disabled={closed}
          />
        </div>
      </div>

      <div className="cc-hours-col">
        <div className="cc-field">
          <input
            className="cc-input cc-input-small"
            value={closed ? "Slēgts" : props.day.to}
            onChange={(e) => props.onTo(e.target.value)}
            placeholder="Līdz:"
            disabled={closed}
          />
        </div>
      </div>

      <button
        type="button"
        className={`cc-closed-btn ${closed ? "on" : ""}`}
        onClick={props.onToggleClosed}
        aria-label="Toggle closed"
        title="Slēgts"
      >
        Slēgts
      </button>
    </div>
  );
}
