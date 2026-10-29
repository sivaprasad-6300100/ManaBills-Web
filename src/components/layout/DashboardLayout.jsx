import React, { useContext, useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import "../../styles/global/dashboard.css";

/* ════════════════════════════════════════
   ICONS
════════════════════════════════════════ */
const HomeIcon = ({ active }) => (
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
const PlansIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const ICON_PATHS = {
  overview:  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  invoice:   "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  stock:     "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  addexp:    "M12 4v16m8-8H4",
  summary:   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  reports:   "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z",
  budget:    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  workbills: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  payments:  "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  estimate:  "M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M16 5l2 2-5 5m0 0l-2-2",
  quotation: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
};

/* ════════════════════════════════════════
   NAV CONFIG
════════════════════════════════════════ */
// Shown BEFORE the user has any plan. Only what they can actually use:
// Home, Business (the one available module) and Plans.
// Locked "coming soon" modules are intentionally not listed here —
// they already appear on the Home screen.
const DEFAULT_NAV = [
  { to: "/dashboard",          Icon: HomeIcon,     label: "Home",     end: true },
  { to: "/dashboard/business", Icon: BusinessIcon, label: "Business"             },
  { to: "/subscription",       Icon: PlansIcon,    label: "Plans"                },
];

// Shown AFTER the user has a plan (active or expired) for a module.
const MODULE_NAVS = {
  business: [
    { to: "/dashboard",                         iconPath: "overview",  label: "Home",    end: true },
    { to: "/dashboard/business/create-invoice", iconPath: "invoice",   label: "Invoice"            },
    { to: "/dashboard/business/products",       iconPath: "stock",     label: "Stock"              },
    { to: "/dashboard/business/shopqroder",     iconPath: "quotation", label: "Orders"             },
    { to: "/dashboard/business/invoices",       iconPath: "invoice",   label: "Invoices"           },
  ],
  "home-expense": [
    { to: "/dashboard/home-expense",             iconPath: "overview", label: "Home",    end: true },
    { to: "/dashboard/home-expense/add-expense", iconPath: "addexp",   label: "Add"                },
    { to: "/dashboard/home-expense/summary",     iconPath: "summary",  label: "Summary"            },
    { to: "/dashboard/home-expense/reports",     iconPath: "reports",  label: "Reports"            },
  ],
  construction: [
    { to: "/dashboard/construction",           iconPath: "overview",  label: "Home",    end: true },
    { to: "/dashboard/construction/Budget",    iconPath: "budget",    label: "Budget"             },
    { to: "/dashboard/construction/WorkBills", iconPath: "workbills", label: "Bills"              },
    { to: "/dashboard/construction/payments",  iconPath: "payments",  label: "Payments"           },
  ],
  custom: [
    { to: "/dashboard/custom",                 iconPath: "overview",  label: "Home",    end: true },
    { to: "/dashboard/custom/create-estimate", iconPath: "estimate",  label: "Estimate"           },
    { to: "/dashboard/custom/quotations",      iconPath: "quotation", label: "Quotes"             },
    { to: "/dashboard/custom/custom-bills",    iconPath: "invoice",   label: "Bills"              },
  ],
};

const MODULE_KEYS = ["business", "home-expense", "construction", "custom"];

const MODULE_COLORS = {
  business:       "#1e4fba",
  "home-expense": "#15803d",
  construction:   "#c2410c",
  custom:         "#7c3aed",
};

const MODULE_LABELS = {
  business:       "Business Billing",
  "home-expense": "Home Expenses",
  construction:   "Construction",
  custom:         "Custom",
};

const getActiveModule = (pathname) => {
  if (pathname.startsWith("/dashboard/business"))     return "business";
  if (pathname.startsWith("/dashboard/home-expense")) return "home-expense";
  if (pathname.startsWith("/dashboard/construction")) return "construction";
  if (pathname.startsWith("/dashboard/custom"))       return "custom";
  return null;
};

/* ════════════════════════════════════════
   SUBSCRIPTION BANNER
════════════════════════════════════════ */
const SubscriptionBanner = ({ subscriptions, activeModule, navigate }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !activeModule) return null;

  const sub = subscriptions?.[activeModule];
  if (sub?.is_active === true) return null;

  const wasExpired = sub?.status === "expired";
  const label = MODULE_LABELS[activeModule] || activeModule;

  return (
    <>
      <style>{`
        @keyframes banner-slide {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sub-banner {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; padding: 10px 18px; flex-wrap: wrap;
          background: ${wasExpired ? "linear-gradient(90deg,#fef2f2,#fff7f7)" : "linear-gradient(90deg,#fffbeb,#fffdf5)"};
          border-bottom: 1.5px solid ${wasExpired ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.25)"};
          animation: banner-slide 0.3s ease; position: relative; z-index: 100;
        }
        .sub-banner-left { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
        .sub-banner-icon {
          width:32px; height:32px; border-radius:8px; font-size:16px;
          background:${wasExpired ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.12)"};
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .sub-banner-title { font-size:0.80rem; font-weight:700; color:${wasExpired ? "#dc2626" : "#92400e"}; line-height:1.3; }
        .sub-banner-sub   { font-size:0.70rem; font-weight:500; margin-top:1px; color:${wasExpired ? "#ef4444" : "#b45309"}; }
        .sub-banner-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .sub-banner-btn {
          padding:6px 14px; border-radius:8px; font-size:0.75rem; font-weight:700;
          cursor:pointer; border:none; font-family:inherit; transition:all 0.15s; white-space:nowrap;
          background:${wasExpired ? "#dc2626" : "#d97706"}; color:#fff;
          box-shadow:0 2px 8px ${wasExpired ? "rgba(220,38,38,0.3)" : "rgba(217,119,6,0.3)"};
        }
        .sub-banner-btn:hover { opacity:0.88; transform:translateY(-1px); }
        .sub-banner-dismiss {
          background:none; border:none; cursor:pointer; color:#9ca3af;
          font-size:16px; padding:2px 4px; line-height:1; flex-shrink:0; transition:color 0.15s;
        }
        .sub-banner-dismiss:hover { color:#6b7280; }
        @media (max-width:480px) {
          .sub-banner { padding:9px 14px; }
          .sub-banner-btn { padding:5px 12px; font-size:0.72rem; }
        }
      `}</style>
      <div className="sub-banner">
        <div className="sub-banner-left">
          <div className="sub-banner-icon">{wasExpired ? "⏰" : "🔒"}</div>
          <div>
            <div className="sub-banner-title">
              {wasExpired ? `Your ${label} plan has expired` : `Subscribe to access ${label}`}
            </div>
            <div className="sub-banner-sub">
              {wasExpired
                ? "Renew your plan to continue using all features without interruption."
                : "Get full access to invoices, stock, customers and more."}
            </div>
          </div>
        </div>
        <div className="sub-banner-actions">
          <button className="sub-banner-btn" onClick={() => navigate("/subscription")}>
            {wasExpired ? "Renew Now →" : "View Plans →"}
          </button>
          <button className="sub-banner-dismiss" onClick={() => setDismissed(true)} title="Dismiss">×</button>
        </div>
      </div>
    </>
  );
};

/* ════════════════════════════════════════
   SMART BOTTOM NAV
   ─────────────────────────────────────
   • Has a plan (active or expired) → module-specific nav
   • No plan at all               → simple Home / Business / Plans nav
════════════════════════════════════════ */
const ActiveBar = ({ color }) => (
  <span style={{
    position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)",
    width: "24px", height: "2.5px", background: color, borderRadius: "0 0 3px 3px",
  }} />
);

const SmartBottomNav = ({ activeModule }) => {
  const location = useLocation();
  const { subscriptions } = useContext(SubscriptionContext);
  const subs = subscriptions || {};

  // Prefer the module the user is currently in; otherwise the first module
  // they have ever subscribed to. null → user has no plan yet.
  const subscribedModule =
    activeModule && subs[activeModule] != null
      ? activeModule
      : MODULE_KEYS.find((k) => subs[k] != null) || null;

  /* ── Module nav (user has a plan) ── */
  if (subscribedModule && MODULE_NAVS[subscribedModule]) {
    const items  = MODULE_NAVS[subscribedModule];
    const accent = MODULE_COLORS[subscribedModule] || "#c9963a";

    return (
      <nav className="mobile-bottom-nav" style={{ "--module-accent": accent }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
        }} />
        <div className="mobile-nav-inner" style={{ position: "relative" }}>
          {items.map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.end}
                className={`mobile-nav-item${isActive ? " active" : ""}`}
                style={isActive ? { "--active-color": accent } : {}}
              >
                <div className="mobile-nav-icon"
                  style={isActive ? { background: `${accent}18`, borderRadius: "8px" } : {}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke={isActive ? accent : "#94a3b8"}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICON_PATHS[item.iconPath]} />
                  </svg>
                </div>
                <span className="mobile-nav-label"
                  style={{ color: isActive ? accent : "#94a3b8", fontWeight: isActive ? 700 : 500 }}>
                  {item.label}
                </span>
                {isActive && <ActiveBar color={accent} />}
              </NavLink>
            );
          })}
        </div>
      </nav>
    );
  }

  /* ── Default nav (no plan yet) ── */
  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-inner">
        {DEFAULT_NAV.map(({ to, Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}
          >
            {({ isActive }) => (
              <>
                <div className="mobile-nav-icon"><Icon active={isActive} /></div>
                <span className={`mobile-nav-label${isActive ? " active-label" : ""}`}>{label}</span>
                {isActive && <ActiveBar color="#c9963a" />}
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
  const location     = useLocation();
  const navigate     = useNavigate();
  const activeModule = getActiveModule(location.pathname);
  const { subscriptions } = useContext(SubscriptionContext);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const hideTopbar = location.pathname === "/dashboard/account" && isMobile;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        {!hideTopbar && (
          <>
            <Topbar />
            <SubscriptionBanner
              subscriptions={subscriptions}
              activeModule={activeModule}
              navigate={navigate}
            />
          </>
        )}
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>

      <SmartBottomNav activeModule={activeModule} />
    </div>
  );
};

export default DashboardLayout;