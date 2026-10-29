import React, { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import "../../styles/global/sidebar.css";

/* ════════════════════════════════════════
   OPTIONS — change these to restyle quickly
   THEME: "navy" (dark, default) | "light"
════════════════════════════════════════ */
const THEME = "navy";
const STORAGE_KEY = "sidebar_collapsed";

/* ════════════════════════════════════════
   ICONS (inline SVG — no emojis)
════════════════════════════════════════ */
const ICONS = {
  home:      ["M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z", "M9 21V12h6v9"],
  overview:  ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
  invoiceAdd:["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6", "M12 18v-6", "M9 15h6"],
  invoices:  ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"],
  stock:     ["M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z", "M3.27 6.96L12 12.01l8.73-5.05", "M12 22.08V12"],
  customers: ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", "M9 11a4 4 0 100-8 4 4 0 000 8z", "M23 21v-2a4 4 0 00-3-3.87", "M16 3.13a4 4 0 010 7.75"],
  orders:    ["M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z", "M3 6h18", "M16 10a4 4 0 01-8 0"],
  gst:       ["M18 20V10", "M12 20V4", "M6 20v-6"],
  shop:      ["M3 9l1-5h16l1 5", "M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0", "M5 21V12", "M19 21V12", "M5 21h14"],
  account:   ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8z"],
  logout:    ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  chevron:   ["M15 18l-6-6 6-6"],
  crown:     ["M2 20h20", "M4 20L2 8l5 4 5-8 5 8 5-4-2 12"],
};

const Icon = ({ name, size = 19 }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
  >
    {ICONS[name].map((d, i) => <path key={i} d={d} />)}
  </svg>
);

/* ════════════════════════════════════════
   NAV CONFIG — grouped sections
   (routes match AppRoutes.jsx)
════════════════════════════════════════ */
const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", icon: "home", label: "Home", end: true },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "/dashboard/business",                 icon: "overview",   label: "Overview",       end: true },
      { to: "/dashboard/business/create-invoice",  icon: "invoiceAdd", label: "Create Invoice" },
      { to: "/dashboard/business/invoices",        icon: "invoices",   label: "Invoices" },
      { to: "/dashboard/business/shopqroder",      icon: "orders",     label: "Orders" },
    ],
  },
  {
    label: "Manage",
    items: [
      { to: "/dashboard/business/products",  icon: "stock",     label: "Stock Entry" },
      { to: "/dashboard/business/customers", icon: "customers", label: "Customers" },
      { to: "/dashboard/business/gst",       icon: "gst",       label: "GST Reports" },
    ],
  },
  {
    label: "Settings",
    items: [
      { to: "/dashboard/business/shop-profile", icon: "shop",    label: "Shop Profile" },
      { to: "/dashboard/account",               icon: "account", label: "Account" },
    ],
  },
];

/* ── helpers ── */
const isPhoneNumber = (v) => /^\+?\d{8,}$/.test(String(v || "").replace(/\s/g, ""));

const formatPhone = (v) => {
  const d = String(v).replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : v;
};

/* ════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════ */
const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const subCtx = useContext(SubscriptionContext) || {};
  const hasPlan = subCtx.subscriptions?.business?.is_active === true;

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0"); } catch { /* ignore */ }
  }, [collapsed]);

  const rawName   = user?.full_name || user?.mobile_number || "User";
  const hasName   = !!user?.full_name;
  const display   = hasName ? rawName : isPhoneNumber(rawName) ? formatPhone(rawName) : rawName;
  const initials  = hasName
    ? rawName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : null; // phone-number users get a user icon instead of a digit

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <aside
      className={`sidebar${collapsed ? " collapsed" : ""}`}
      data-theme={THEME}
    >
      {/* ── Brand ── */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo" onClick={() => navigate("/dashboard")}>
            <span className="sidebar-logo-mark">M</span>
            <span className="sidebar-logo-text">Mana<span>Bills</span></span>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <Icon name="chevron" size={16} />
          </button>
        </div>

        {/* ── User card ── */}
        <div className="sidebar-user" title={collapsed ? display : undefined}>
          <div className="sidebar-avatar">
            {initials || <Icon name="account" size={16} />}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{display}</div>
            <div className={`sidebar-user-plan${hasPlan ? " is-active" : ""}`}>
              <span className="plan-dot" />
              {hasPlan ? "Business Plan" : "Free plan"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV_SECTIONS.map((section) => (
          <div className="sidebar-section" key={section.label}>
            <div className="sidebar-nav-label">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="nav-link"
                data-tip={item.label}
              >
                <span className="nav-link-icon"><Icon name={item.icon} /></span>
                <span className="nav-link-text">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        {!hasPlan && (
          <button
            type="button"
            className="sidebar-upgrade"
            onClick={() => navigate("/subscription")}
            data-tip="Upgrade"
          >
            <span className="sidebar-upgrade-icon"><Icon name="crown" size={17} /></span>
            <span className="sidebar-upgrade-text">
              <strong>Upgrade plan</strong>
              <small>Unlock all features</small>
            </span>
          </button>
        )}

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
          data-tip="Sign Out"
        >
          <span className="nav-link-icon"><Icon name="logout" /></span>
          <span className="nav-link-text">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;