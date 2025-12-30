import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiClock, FiSearch, FiFilter, FiChevronDown, FiCoffee } from "react-icons/fi";
import "../styles/companies.css";

type Company = {
    id: number;
    name: string;
    address: string;
    city: string;
    workingHoursText: string;
};

const mockCompanies: Company[] = [
    { id: 1, name: "Nosaukums", address: "Adrese", city: "Rīga", workingHoursText: "10:00–22:00" },
    { id: 2, name: "Nosaukums", address: "Adrese", city: "Rīga", workingHoursText: "09:00–21:00" },
    { id: 3, name: "Nosaukums", address: "Adrese", city: "Liepāja", workingHoursText: "11:00–23:00" },
    { id: 4, name: "Nosaukums", address: "Adrese", city: "Daugavpils", workingHoursText: "10:00–20:00" },
    { id: 5, name: "Nosaukums", address: "Adrese", city: "Rīga", workingHoursText: "12:00–00:00" },
    { id: 6, name: "Nosaukums", address: "Adrese", city: "Jelgava", workingHoursText: "10:00–19:00" },
];

type SortKey = "name_asc" | "name_desc";

export default function Companies() {
    const [city, setCity] = useState("");
    const [sort, setSort] = useState<SortKey>("name_asc");
    const [q, setQ] = useState("");
    const nav = useNavigate();
    const cities = useMemo(() => {
        const set = new Set(mockCompanies.map((c) => c.city));
        return ["", ...Array.from(set)];
    }, []);

  const list = useMemo(() => {
    let items = [...mockCompanies];

    if (city) items = items.filter((c) => c.city === city);
    if (q.trim()) items = items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

    items.sort((a, b) => {
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

    return items;
  }, [city, sort, q]);

  return (
    <div className="companies">
      <div className="companies-head card">
        <div className="companies-head-left">
          <div className="companies-head-title">Uzņēmumi</div>
          <div className="companies-head-sub">Pieejamo kafejnīcu un restorānu saraksts</div>
        </div>
      </div>

      <div className="companies-filters">
        <div className="filter-pill">
          <span className="pill-ic"><FiFilter /></span>
          <select className="pill-select" value={city} onChange={(e) => setCity(e.target.value)}>
            {cities.map((c) => (
              <option key={c || "all"} value={c}>
                {c ? c : "Pilsēta"}
              </option>
            ))}
          </select>
          <span className="pill-dd"><FiChevronDown /></span>
        </div>

        <div className="filter-pill">
          <span className="pill-ic"><FiCoffee /></span>
          <select className="pill-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="name_asc">Pēc nosaukuma (A-Z)</option>
            <option value="name_desc">Pēc nosaukuma (Z-A)</option>
          </select>
          <span className="pill-dd"><FiChevronDown /></span>
        </div>

        <div className="search-pill">
          <span className="pill-ic"><FiSearch /></span>
          <input
            className="pill-input"
            placeholder="Ievadiet nosaukumu"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="companies-grid">
        {list.map((c) => (
            <div className="company-card card" onClick={() => nav(`/app/companies/${c.id}`)} role="button" tabIndex={0}>

            <div className="company-img">
              <div className="company-img-ic"><FiCoffee /></div>
            </div>

            <div className="company-name">{c.name}</div>

            <div className="company-meta">
              <div className="meta-row">
                <span className="meta-ic"><FiMapPin /></span>
                <span>{c.address}</span>
              </div>
              <div className="meta-row">
                <span className="meta-ic"><FiClock /></span>
                <span>Darba laiks</span>
              </div>
            </div>

            <button className="btn btn-primary btn-full company-btn" type="button">
              Skatīt informāciju
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
