import React from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../../styles/global/dashboard.css";

const HomeIcon     = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);
const BusinessIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="2"/>
    <path d="M8 3v18M16 3v18M2 9h20M2 15h20"/>
  </svg>
);
const ExpenseIcon  = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);
const BuildIcon    = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M9 21V7l3-4 3 4v14M5 21V11l4-2M19 21V11l-4-2"/>
  </svg>
);
const AccountIcon  = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

const ICON_PATHS = {
  modules:   "M4 6h16M4 12h16M4 18h16",
  overview:  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  invoice:   "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  stock:     "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  customers: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  addexp:    "M12 4v16m8-8H4",
  summary:   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  reports:   "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z",
  budget:    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  workbills: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  payments:  "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  estimate:  "M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M16 5l2 2-5 5m0 0l-2-2",
  quotation: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
};

const DEFAULT_NAV = [
  { to: "/dashboard",              Icon: HomeIcon,     label: "Home",    end: true },
  { to: "/dashboard/business",     Icon: BusinessIcon, label: "Business"           },
  { to: "/dashboard/home-expense", Icon: ExpenseIcon,  label: "Expenses"           },
  { to: "/dashboard/construction", Icon: BuildIcon,    label: "construction"       },
  // { to: "/dashboard/account",      Icon: AccountIcon,  label: "Account"            },
  { to: "/dashboard/custom",       Icon: AccountIcon,  label: "custom"             },
];

const MODULE_NAVS = {
  business: [
    { to: null,                                   iconPath: "modules",   label: "Modules",  isBack: true },
    { to: "/dashboard/business",                  iconPath: "overview",  label: "Overview", end: true    },
    { to: "/dashboard/business/create-invoice",   iconPath: "invoice",   label: "Invoice"               },
    { to: "/dashboard/business/products",         iconPath: "stock",     label: "Stock"                 },
    { to: "/dashboard/business/customers",        iconPath: "customers", label: "Customers"             },
  ],
  "home-expense": [
    { to: null,                                   iconPath: "modules",  label: "Modules",  isBack: true },
    { to: "/dashboard/home-expense",              iconPath: "overview", label: "Overview", end: true    },
    { to: "/dashboard/home-expense/add-expense",  iconPath: "addexp",   label: "Add"                   },
    { to: "/dashboard/home-expense/summary",      iconPath: "summary",  label: "Summary"               },
    { to: "/dashboard/home-expense/reports",      iconPath: "reports",  label: "Reports"               },
  ],
  construction: [
    { to: null,                                   iconPath: "modules",   label: "Modules",  isBack: true },
    { to: "/dashboard/construction",              iconPath: "overview",  label: "Overview", end: true    },
    { to: "/dashboard/construction/Budget",       iconPath: "budget",    label: "Budget"                },
    { to: "/dashboard/construction/WorkBills",    iconPath: "workbills", label: "Bills"                 },
    { to: "/dashboard/construction/payments",     iconPath: "payments",  label: "Payments"              },
  ],
  custom: [
    { to: null,                                   iconPath: "modules",   label: "Modules",  isBack: true },
    { to: "/dashboard/custom",                    iconPath: "overview",  label: "Overview", end: true    },
    { to: "/dashboard/custom/create-estimate",    iconPath: "estimate",  label: "Estimate"              },
    { to: "/dashboard/custom/quotations",         iconPath: "quotation", label: "Quotes"                },
    { to: "/dashboard/custom/custom-bills",       iconPath: "invoice",   label: "Bills"                 },
  ],
};

const MODULE_COLORS = {
  business:       "#1e4fba",
  "home-expense": "#15803d",
  construction:   "#c2410c",
  custom:         "#7c3aed",
};

const getActiveModule = (pathname) => {
  if (pathname.startsWith("/dashboard/business"))     return "business";
  if (pathname.startsWith("/dashboard/home-expense")) return "home-expense";
  if (pathname.startsWith("/dashboard/construction")) return "construction";
  if (pathname.startsWith("/dashboard/custom"))       return "custom";
  return null;
};

/* ════════════════════════════════════════
   SMART BOTTOM NAV
════════════════════════════════════════ */
const SmartBottomNav = ({ activeModule, onGoHome }) => {
  const location = useLocation();
  const accent   = MODULE_COLORS[activeModule] || "#c9963a";

  /* ── MODULE-SPECIFIC bottom nav ── */
  if (activeModule && MODULE_NAVS[activeModule]) {
    const items = MODULE_NAVS[activeModule];

    return (
      <nav className="mobile-bottom-nav" style={{ "--module-accent": accent }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
        }} />
        <div className="mobile-nav-inner">
          {items.map((item) => {
            if (item.isBack) {
              return (
                <button
                  key="back"
                  onClick={onGoHome}
                  className="mobile-nav-item"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <div className="mobile-nav-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                      stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={ICON_PATHS.modules} />
                    </svg>
                  </div>
                  <span className="mobile-nav-label" style={{ color: "#94a3b8" }}>{item.label}</span>
                </button>
              );
            }
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={`mobile-nav-item${isActive ? " active" : ""}`}
                style={isActive ? { "--active-color": accent } : {}}
              >
                <div className="mobile-nav-icon" style={isActive ? { background: `${accent}18`, borderRadius: "8px" } : {}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke={isActive ? accent : "#94a3b8"}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICON_PATHS[item.iconPath]} />
                  </svg>
                </div>
                <span className="mobile-nav-label" style={{ color: isActive ? accent : "#94a3b8", fontWeight: isActive ? 700 : 500 }}>
                  {item.label}
                </span>
                {isActive && (
                  <span style={{
                    position: "absolute", top: "-1px",
                    left: "50%", transform: "translateX(-50%)",
                    width: "24px", height: "2.5px",
                    background: accent, borderRadius: "0 0 3px 3px",
                  }} />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    );
  }

  /* ── DEFAULT bottom nav ── */
  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-inner">
        {DEFAULT_NAV.map(({ to, Icon, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}
          >
            {({ isActive }) => (
              <>
                <div className="mobile-nav-icon"><Icon active={isActive} /></div>
                <span className={`mobile-nav-label${isActive ? " active-label" : ""}`}>{label}</span>
                {isActive && (
                  <span style={{
                    position: "absolute", top: "-1px",
                    left: "50%", transform: "translateX(-50%)",
                    width: "24px", height: "2.5px",
                    background: "#c9963a", borderRadius: "0 0 3px 3px",
                  }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

/* ════════════════════════════════════════
   MAIN LAYOUT
════════════════════════════════════════ */
const DashboardLayout = () => {
  const navigate     = useNavigate();
  const location     = useLocation();
  const activeModule = getActiveModule(location.pathname);
  const handleGoHome = () => navigate("/dashboard");

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar />
        {/* ── "← All Modules | Business Billing" breadcrumb REMOVED ── */}
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
      <SmartBottomNav activeModule={activeModule} onGoHome={handleGoHome} />
    </div>
  );
};

export default DashboardLayout;
