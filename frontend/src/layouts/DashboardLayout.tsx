import React from "react";
import Sidebar from "../components/Sidebar";

type Props = {
  active: string;
  onChange: (key: string) => void;
  sections: { title: string; items: { key: string; label: string }[] }[];
  children: React.ReactNode;
};

const DashboardLayout: React.FC<Props> = ({ active, onChange, sections, children }) => {
  return (
    <div className="app-shell">
      <Sidebar sections={sections} active={active} onSelect={onChange} />
      <div className="content">
        <div className="topbar">
          <div>
            <strong>CRMS</strong>
            <span style={{ color: "#6b7280", marginLeft: 8 }}>Demo shell</span>
          </div>
          <div style={{ color: "#6b7280" }}>User • role</div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
