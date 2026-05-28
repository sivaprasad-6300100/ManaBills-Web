import React, { useContext, useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { SubscriptionContext } from "../../context/SubscriptionContext"; // ← ADD THIS
import "../../styles/global/dashboard.css";

/* ════════════════════════════════════════
   ICONS  (unchanged)
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
const ExpenseIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);
const BuildIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M9 21V7l3-4 3 4v14M5 21V11l4-2M19 21V11l-4-2"/>
  </svg>
);
const AccountIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

const ICON_PATHS = {
  modules:      "M4 6h16M4 12h16M4 18h16",
  overview:     "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  invoice:      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  stock:        "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  customers:    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  addexp:       "M12 4v16m8-8H4",
  summary:      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  reports:      "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z",
  budget:       "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  workbills:    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  payments:     "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  estimate:     "M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M16 5l2 2-5 5m0 0l-2-2",
  quotation:    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  defaultitems: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M5 12h14M5 16h6",
  gst:          "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  qrorder:      "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z",
  customerview: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  shopprofile:  "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
};

/* ════════════════════════════════════════
   NAV CONFIG  (unchanged)
════════════════════════════════════════ */
// NOTE: `locked` here means "requires subscription" — actual lock state
// is resolved at render time by checking SubscriptionContext.
const DEFAULT_NAV = [
  { to: "/dashboard",              Icon: HomeIcon,     label: "Home",     end: true },
  { to: "/dashboard/business",     Icon: BusinessIcon, label: "Business", moduleKey: "business"     },
  { to: "/dashboard/home-expense", Icon: ExpenseIcon,  label: "Expenses", moduleKey: "home-expense" },
  { to: "/dashboard/construction", Icon: BuildIcon,    label: "Build",    moduleKey: "construction" },
  { to: "/dashboard/custom",       Icon: AccountIcon,  label: "Custom",   moduleKey: "custom"       },
];

const MODULE_NAVS = {
  business: [
    { to: "/dashboard",                              iconPath: "overview",  label: "Home",    end: true },
    { to: "/dashboard/business/create-invoice",      iconPath: "invoice",   label: "Invoice"            },
    { to: "/dashboard/business/products",            iconPath: "stock",     label: "Stock"              },
    { to: "/dashboard/business/shopqroder",          iconPath: "quotation", label: "Orders"             },
    { to: "/dashboard/business/invoices",            iconPath: "invoice",   label: "Invoices"           },
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

const MODULE_COLORS = {
  business:       "#1e4fba",
  "home-expense": "#15803d",
  construction:   "#c2410c",
  custom:         "#7c3aed",
};

const MODULE_META = {
  "home-expense": { emoji: "💸", label: "Expenses",     desc: "Smart expense tracking & reports" },
  construction:   { emoji: "🏗️", label: "Construction", desc: "Budget, bills & site payments"    },
  custom:         { emoji: "✨", label: "Custom",       desc: "Estimates, quotes & custom bills"  },
};

// ── business module doesn't need a "coming soon" modal — it's always accessible.
// Only the other three show the modal when unsubscribed.
const LOCKED_MODULE_KEYS = ["home-expense", "construction", "custom"];

const STORAGE_KEY = "app_active_module";

const getActiveModule = (pathname) => {
  if (pathname.startsWith("/dashboard/business"))     return "business";
  if (pathname.startsWith("/dashboard/home-expense")) return "home-expense";
  if (pathname.startsWith("/dashboard/construction")) return "construction";
  if (pathname.startsWith("/dashboard/custom"))       return "custom";
  return null;
};

/* ════════════════════════════════════════
   COMING SOON MODAL  (unchanged)
════════════════════════════════════════ */
const ComingSoonModal = ({ moduleKey, onClose }) => {
  const meta  = MODULE_META[moduleKey]   || {};
  const color = MODULE_COLORS[moduleKey] || "#c9963a";

  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes cs-bd  { from{opacity:0} to{opacity:1} }
        @keyframes cs-up  { from{opacity:0;transform:translateY(30px) scale(.93)} to{opacity:1;transform:none} }
        @keyframes cs-flt { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes cs-dot { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes cs-glw { 0%,100%{opacity:.28;transform:scale(1)} 50%{opacity:.1;transform:scale(1.18)} }
      `}</style>

      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:9998,
        background:"rgba(5,8,16,0.78)", backdropFilter:"blur(7px)",
        animation:"cs-bd .2s ease",
      }}/>

      <div style={{
        position:"fixed", inset:0, zIndex:9999,
        display:"flex", alignItems:"center", justifyContent:"center",
        pointerEvents:"none",
      }}>
        <div style={{
          pointerEvents:"all",
          width:"min(340px,86vw)",
          background:"linear-gradient(145deg,#0f1320 0%,#141927 60%,#0c1018 100%)",
          border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:"22px", padding:"44px 30px 36px",
          textAlign:"center", position:"relative", overflow:"hidden",
          boxShadow:`0 36px 90px rgba(0,0,0,0.65),inset 0 1px 0 rgba(255,255,255,0.06)`,
          animation:"cs-up .3s cubic-bezier(.34,1.56,.64,1)",
        }}>
          <div style={{
            position:"absolute", top:"-50px", left:"50%", transform:"translateX(-50%)",
            width:"200px", height:"200px", borderRadius:"50%",
            background:`radial-gradient(circle,${color}2e 0%,transparent 70%)`,
            animation:"cs-glw 3s ease-in-out infinite", pointerEvents:"none",
          }}/>
          <div style={{
            position:"absolute", top:0, left:"15%", right:"15%", height:"2px",
            background:`linear-gradient(90deg,transparent,${color},transparent)`,
          }}/>
          <button onClick={onClose} style={{
            position:"absolute", top:"13px", right:"13px",
            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)",
            borderRadius:"50%", width:"28px", height:"28px",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:"#64748b", fontSize:"15px", lineHeight:1,
          }}>×</button>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:"5px",
            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)",
            borderRadius:"20px", padding:"3px 12px",
            fontSize:"10px", fontWeight:700, letterSpacing:"0.1em",
            color:"#64748b", textTransform:"uppercase", marginBottom:"18px",
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            LOCKED
          </div>
          <div style={{ fontSize:"48px", lineHeight:1, marginBottom:"14px", animation:"cs-flt 2.8s ease-in-out infinite" }}>
            {meta.emoji}
          </div>
          <h2 style={{
            margin:"0 0 7px", fontSize:"26px", fontWeight:800, letterSpacing:"-0.4px",
            background:`linear-gradient(130deg,#fff 35%,${color})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
          }}>{meta.label}</h2>
          <p style={{ margin:"0 0 26px", fontSize:"13px", color:"#64748b", lineHeight:1.6 }}>
            {meta.desc}
          </p>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:"8px",
            background:`${color}18`, border:`1.5px solid ${color}40`,
            borderRadius:"12px", padding:"11px 22px",
            fontSize:"13px", fontWeight:700, color, letterSpacing:"0.04em",
          }}>
            Coming Soon
            <span style={{ display:"flex", gap:"3px", alignItems:"center" }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  width:"5px", height:"5px", borderRadius:"50%",
                  background:color, display:"inline-block",
                  animation:`cs-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
                }}/>
              ))}
            </span>
          </div>
          <div style={{ marginTop:"26px", height:"1px", background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.07) 50%,transparent)" }}/>
          <p style={{ margin:"12px 0 0", fontSize:"10px", color:"#1e293b", letterSpacing:"0.06em" }}>
            TAP ANYWHERE OUTSIDE TO CLOSE
          </p>
        </div>
      </div>
    </>
  );
};

/* ════════════════════════════════════════
   SMART BOTTOM NAV
   ─────────────────────────────────────
   FIX: Now reads isSubscribed() from SubscriptionContext.
   A module is only "locked" if it's in LOCKED_MODULE_KEYS
   AND the user has no active subscription for it.
════════════════════════════════════════ */
const SmartBottomNav = ({ activeModule, onLockedTap }) => {
  const location = useLocation();

  // ── FIX: pull subscription state ──────────────────────────
  const { isSubscribed } = useContext(SubscriptionContext);

  // ── FIX: determine which module nav to show ───────────────
  // Show a module's sub-nav if:
  //   (a) the user is currently inside that module's routes, OR
  //   (b) the user has subscribed and the URL is within that module
  // We use `activeModule` (derived from pathname in parent) as the source of truth.
  const { subscriptions } = useContext(SubscriptionContext);

const subscribedModule = (() => {
  if (activeModule && isSubscribed(activeModule)) return activeModule;
  // On /dashboard home, show the first active subscribed module's nav
  const firstActive = ["business", "home-expense", "construction", "custom"]
    .find(k => subscriptions[k]?.is_active === true);
  return firstActive || null;
})();


  // Show module-specific nav when inside a subscribed module
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
                key={item.to}
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

  /* ── Default nav ──────────────────────────────────────────── */
  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-inner">
        {DEFAULT_NAV.map(({ to, Icon, label, end, moduleKey }) => {

          // ── FIX: A nav item needs a lock only if:
          //         1. it has a moduleKey (i.e. it's a module entry)
          //         2. that module is in LOCKED_MODULE_KEYS
          //         3. the user has NOT subscribed to it
          const requiresSubscription = moduleKey && LOCKED_MODULE_KEYS.includes(moduleKey);
          const userHasAccess        = moduleKey ? isSubscribed(moduleKey) : true;
          const isLocked             = requiresSubscription && !userHasAccess;

          /* ── LOCKED: show Coming Soon modal on tap ── */
          if (isLocked) {
            return (
              <button
                key={to}
                type="button"
                onClick={() => onLockedTap(moduleKey)}
                style={{
                  position:"relative",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center",
                  gap:"3px", padding:"10px 8px 8px",
                  flex:1, minWidth:0,
                  background:"none", border:"none", cursor:"pointer",
                  opacity:0.55,
                  WebkitTapHighlightColor:"transparent",
                }}
              >
                <div className="mobile-nav-icon" style={{ position:"relative" }}>
                  <Icon active={false} />
                  <span style={{
                    position:"absolute", top:"-4px", right:"-5px",
                    background:"#1e293b",
                    border:"1px solid rgba(255,255,255,0.12)",
                    borderRadius:"5px", padding:"1px 3px",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                      stroke="#94a3b8" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </span>
                </div>
                <span className="mobile-nav-label" style={{ color:"#94a3b8", fontWeight:500 }}>
                  {label}
                </span>
              </button>
            );
          }

          /* ── UNLOCKED (subscribed or no subscription required): NavLink ── */
          return (
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
          );
        })}
      </div>
    </nav>
  );
};

/* ════════════════════════════════════════
   MAIN LAYOUT
   ─────────────────────────────────────
   FIX: lockedModule state removed — it was conflating
   "last visited module" with "which nav to show".
   Now we pass activeModule (from URL) directly to
   SmartBottomNav so it can check subscription status
   and render the correct nav reactively.
════════════════════════════════════════ */
const DashboardLayout = () => {
  const location     = useLocation();
  const activeModule = getActiveModule(location.pathname);

  // ── FIX: removed lockedModule state + its useEffect entirely.
  //    That logic was persisting the last module to localStorage and
  //    feeding it as the "which module nav to show" signal — but it
  //    never checked subscriptions, so it was always wrong after login.
  //
  //    The single source of truth is now:
  //      activeModule  (derived from pathname — always fresh)
  //      isSubscribed  (from SubscriptionContext — always fresh)
  //    SmartBottomNav combines both to decide what to render.

  const [overlayKey, setOverlayKey] = useState(null);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar />
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>

      {/* FIX: pass activeModule instead of lockedModule */}
      <SmartBottomNav
        activeModule={activeModule}
        onLockedTap={(key) => setOverlayKey(key)}
      />

      {overlayKey && (
        <ComingSoonModal
          moduleKey={overlayKey}
          onClose={() => setOverlayKey(null)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
