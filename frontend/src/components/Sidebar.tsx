import React from "react";

type Item = {
  key: string;
  label: string;
};

type Section = {
  title: string;
  items: Item[];
};

type Props = {
  sections: Section[];
  active: string;
  onSelect: (key: string) => void;
};

const Sidebar: React.FC<Props> = ({ sections, active, onSelect }) => (
  <aside className="sidebar">
    <h1>CRMS Admin</h1>
    {sections.map((section) => (
      <div key={section.title} className="nav-section">
        <div className="nav-title">{section.title}</div>
        {section.items.map((item) => (
          <div
            key={item.key}
            className={`nav-item ${active === item.key ? "active" : ""}`}
            onClick={() => onSelect(item.key)}
          >
            {item.label}
          </div>
        ))}
      </div>
    ))}
  </aside>
);

export default Sidebar;
