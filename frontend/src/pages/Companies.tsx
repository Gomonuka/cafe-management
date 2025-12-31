import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiSearch } from "react-icons/fi";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { listCities, listCompanies, filterByCity, type PublicCompany } from "../api/companies";

const weekdays = ["Pr-Pk", "Se", "Sv", ""]; // not used in detail list, but placeholders

function WorkingHours({ company }: { company: PublicCompany }) {
  if (!company.working_hours?.length) return null;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0 0", color: "#0f4e9c", fontSize: 13 }}>
      {company.working_hours.map((wh) => (
        <li key={wh.weekday}>
          {wh.from_time} - {wh.to_time}
        </li>
      ))}
    </ul>
  );
}

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
      city && city !== "all"
        ? await filterByCity(city)
        : await listCompanies({ search: search || undefined, sort });
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

  const filtered = useMemo(() => companies, [companies]);

  return (
    <div className="profile-wrap" style={{ alignItems: "stretch" }}>
      <div className="profile-title" style={{ textAlign: "left" }}>
        Uzņēmumi
      </div>

      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ minWidth: 180 }}>
            <label className="sb-role" style={{ color: "#1e73d8", fontWeight: 700 }}>
              Pilsēta
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #cfd8e3" }}
            >
              <option value="">Visas</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 180 }}>
            <label className="sb-role" style={{ color: "#1e73d8", fontWeight: 700 }}>
              Pēc nosaukuma
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "asc" | "desc")}
              style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #cfd8e3" }}
            >
              <option value="asc">A–Ž</option>
              <option value="desc">Ž–A</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <Input
              label="Meklēt"
              leftIcon={<FiSearch />}
              value={search}
              onChange={setSearch}
              onBlur={() => loadCompanies()}
              placeholder="Ievadiet nosaukumu"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ padding: 20 }}>Ielāde...</div>
      ) : error ? (
        <div style={{ padding: 20, color: "red" }}>{error}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {filtered.map((c) => (
            <Card key={c.id} style={{ minHeight: 240 }}>
              <div style={{ fontWeight: 800, color: "#1e73d8", marginBottom: 6 }}>{c.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#0f4e9c" }}>
                <FiMapPin /> {c.address_line}, {c.city}
              </div>
              <WorkingHours company={c} />
              <div style={{ marginTop: 12 }}>
                <Button variant="primary" onClick={() => nav(`/app/companies/${c.id}`)}>
                  Skatīt informāciju
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
