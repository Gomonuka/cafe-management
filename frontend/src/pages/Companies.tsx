//  frontend/src/pages/Companies.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiSearch, FiImage, FiType } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { listCities, listCompanies, filterByCity, type PublicCompany } from "../api/companies";
import "../styles/menu.css";

export default function Companies() {
  const nav = useNavigate();
  const [companies, setCompanies] = useState<PublicCompany[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCities = async () => {
    const res = await listCities();
    if (res.ok) setCities(res.data.cities);
  };

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    const res =
      city && city !== "all" ? await filterByCity(city) : await listCompanies({ search: search || undefined, sort });
    if (res.ok) setCompanies(res.data);
    else setError(res.data?.detail || "Neizdevās ielādēt uzņēmumus.");
    setLoading(false);
  };

  useEffect(() => {
    void loadCities();
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [city, sort]);

  const filtered = useMemo(() => (Array.isArray(companies) ? companies : []), [companies]);

  const logoNode = (c: PublicCompany) => {
    if (c.logo) {
      return <img src={c.logo} alt={c.name} className="company-logo-img large" />;
    }
    const initials = c.name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
    return (
      <div className="company-logo-placeholder large">
        <FiImage size={28} />
        <span>{initials || "?"}</span>
      </div>
    );
  };

  return (
    <div className="profile-wrap companies-page" style={{ alignItems: "stretch" }}>
      <div className="profile-title" style={{ textAlign: "left" }}>
        Uzņēmumi
      </div>

      <Card className="companies-filters">
        <div className="companies-filter-row">
          <div className="companies-filter">
            <label className="sb-role" style={{ color: "#1e73d8", fontWeight: 700 }}>
              Pilsēta
            </label>
            <div className="select-with-icon">
              <FiMapPin className="select-icon" />
              <select value={city} onChange={(e) => setCity(e.target.value)} className="select-input has-icon">
                <option value="">Visas</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="companies-filter">
            <label className="sb-role" style={{ color: "#1e73d8", fontWeight: 700 }}>
              Pēc nosaukuma
            </label>
            <div className="select-with-icon">
              <FiType className="select-icon" />
              <select value={sort} onChange={(e) => setSort(e.target.value as "asc" | "desc")} className="select-input has-icon">
                <option value="asc">A-Ž</option>
                <option value="desc">Ž-A</option>
              </select>
            </div>
          </div>

          <div className="companies-search">
            <label className="sb-role" style={{ color: "#1e73d8", fontWeight: 700 }}>
              Meklēt
            </label>
            <div className="companies-search-row">
              <Input leftIcon={<FiSearch />} value={search} onChange={setSearch} placeholder="Nosaukums" />
              <Button variant="primary" onClick={() => loadCompanies()} className="btn-full">
                Meklēt
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ padding: 20 }}>Ielāde...</div>
      ) : error ? (
        <div style={{ padding: 20, color: "red" }}>{error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 20, color: "#d9534f", fontWeight: 700 }}>Nav atrastu uzņēmumu pēc šī vaicājuma.</div>
      ) : (
        <div className="companies-grid">
          {filtered.map((c) => (
            <Card key={c.id} className="company-card">
              <div className="company-card-top">
                <div className="company-logo">{logoNode(c)}</div>
                <div className="company-info">
                  <div className="company-name">{c.name}</div>
                  <div className="company-location">
                    <FiMapPin /> {c.address_line}, {c.city}
                  </div>
                </div>
              </div>
              <Button variant="primary" className="btn-full" onClick={() => nav(`/app/companies/${c.id}`)}>
                Skatīt informāciju
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
