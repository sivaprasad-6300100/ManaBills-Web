import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/business/business.css"

const NAV_ITEMS = [
  { to: "",               label: "Overview",       icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", end: true },
  { to: "create-invoice", label: "Create Invoice", icon: "M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { to: "products",       label: "Stock Entry",    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  // { to: "default-items",  label: "Default Items",  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { to: "customers",      label: "Customers",      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { to: "invoices",       label: "Invoices",       icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { to: "gst",            label: "GST Reports",    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { to: "shopqroder",     label: "Shop QR Order",  icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  :root {
    --navy:     #0e1b2e;
    --gold:     #c9963a;
    --gold-2:   #e8a020;
    --gold-t:   rgba(201,150,58,0.10);
    --text-dim: #6b7a90;
    --text-mid: #3d4f63;
    --border:   #e8edf3;
    --hover-bg: #f4f6f9;
  }

  .mnb-shell {
    position: sticky;
    top: 0;
    z-index: 80;
    background: #ffffff;
    border-bottom: 1.5px solid var(--border);
    box-shadow: 0 1px 0 rgba(14,27,46,0.04), 0 2px 8px rgba(14,27,46,0.05);
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 20px;
    height: 52px;
    overflow-x: auto;
    scrollbar-width: none;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    position: relative;
  }
  .mnb-shell::-webkit-scrollbar { display: none; }

  .mnb-shell::before {
    content: '';
    position: absolute;
    left: 0; top: 10px; bottom: 10px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: linear-gradient(180deg, var(--gold), var(--gold-2));
  }

  .mnb-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 13px;
    height: 36px;
    border-radius: 8px;
    border: 1.5px solid transparent;
    background: transparent;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-dim);
    text-decoration: none;
    white-space: nowrap;
    flex-shrink: 0;
    cursor: pointer;
    position: relative;
    transition: color 0.15s, background 0.15s, border-color 0.15s, box-shadow 0.15s,
                transform 0.14s cubic-bezier(0.34,1.56,0.64,1);
    letter-spacing: 0.005em;
  }
  .mnb-item svg {
    width: 14px; height: 14px;
    stroke: currentColor; fill: none;
    stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
    flex-shrink: 0; opacity: 0.7;
    transition: opacity 0.15s, transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
  }
  .mnb-item:hover {
    color: var(--text-mid);
    background: var(--hover-bg);
    border-color: #dde3eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(14,27,46,0.06);
  }
  .mnb-item:hover svg { opacity: 1; transform: scale(1.1); }

  .mnb-item.active {
    color: #ffffff;
    background: var(--navy);
    border-color: var(--navy);
    font-weight: 600;
    transform: translateY(-1px);
    box-shadow: 0 3px 12px rgba(14,27,46,0.22), 0 1px 4px rgba(14,27,46,0.15);
  }
  .mnb-item.active svg { opacity: 1; }
  .mnb-item.active::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 22%; right: 22%;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--gold-2), var(--gold));
    border-radius: 2px 2px 0 0;
    animation: mnbBarIn 0.2s ease both;
  }
  @keyframes mnbBarIn {
    from { left: 50%; right: 50%; opacity: 0; }
    to   { left: 22%; right: 22%; opacity: 1; }
  }

  .mnb-sep {
    width: 1px; height: 20px;
    background: var(--border);
    margin: 0 6px; flex-shrink: 0;
  }
  .mnb-spacer { flex: 1 1 auto; }

  .mnb-profile {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px 5px 7px;
    height: 36px;
    border-radius: 8px;
    border: 1.5px solid var(--border);
    background: #f8fafc;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-mid);
    text-decoration: none;
    white-space: nowrap;
    flex-shrink: 0;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .mnb-profile-dot {
    width: 26px; height: 26px; border-radius: 6px;
    background: linear-gradient(135deg, #1e3a5a, #0e1b2e);
    border: 1.5px solid rgba(201,150,58,0.25);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .mnb-profile-dot svg {
    width: 13px; height: 13px;
    stroke: rgba(201,150,58,0.9); fill: none;
    stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round;
  }
  .mnb-profile:hover {
    background: var(--hover-bg); border-color: #c8d0da;
    color: var(--navy); transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(14,27,46,0.07);
  }
  .mnb-profile.active {
    background: var(--gold-t); border-color: rgba(201,150,58,0.35);
    color: #92400e; font-weight: 600;
  }
  .mnb-profile.active .mnb-profile-dot {
    background: rgba(201,150,58,0.15);
    border-color: rgba(201,150,58,0.45);
  }
  .mnb-profile.active .mnb-profile-dot svg { stroke: var(--gold); }

  @media (max-width: 768px) { .mnb-shell { display: none !important; } }
`;

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24"><path d={d} /></svg>
);

const BusinessLayout = () => (
  <div>
    <style>{CSS}</style>
    <nav className="mnb-shell" role="navigation" aria-label="Business navigation">

      {NAV_ITEMS.map((item) => (
        <React.Fragment key={item.to + item.label}>
          {item.to === "gst" && <div className="mnb-sep" />}
          <NavLink
            to={item.to}
            end={item.end}
            className={({ isActive }) => "mnb-item" + (isActive ? " active" : "")}
          >
            <Icon d={item.icon} />
            {item.label}
          </NavLink>
        </React.Fragment>
      ))}

      <div className="mnb-spacer" />

      <NavLink
        to="shop-profile"
        className={({ isActive }) => "mnb-profile" + (isActive ? " active" : "")}
      >
        <div className="mnb-profile-dot">
          <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </div>
        Shop Profile
      </NavLink>

    </nav>
    <Outlet />
  </div>
);

export default BusinessLayout;
