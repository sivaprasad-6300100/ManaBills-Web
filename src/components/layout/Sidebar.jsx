import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/* ── Module meta (same as DashboardLayout) ── */
const MODULE_META = {
  "home-expense": { emoji: "💸", label: "Expenses",     desc: "Smart expense tracking & reports" },
  construction:   { emoji: "🏗️", label: "Construction", desc: "Budget, bills & site payments"    },
  custom:         { emoji: "✨", label: "Custom",       desc: "Estimates, quotes & custom bills"  },
};

const MODULE_COLORS = {
  "home-expense": "#15803d",
  construction:   "#c2410c",
  custom:         "#7c3aed",
};

/* ════════════════════════════════════════
   COMING SOON MODAL (same design as mobile)
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

      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:9998,
        background:"rgba(5,8,16,0.78)", backdropFilter:"blur(7px)",
        animation:"cs-bd .2s ease",
      }}/>

      {/* Card */}
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

          {/* Glow blob */}
          <div style={{
            position:"absolute", top:"-50px", left:"50%", transform:"translateX(-50%)",
            width:"200px", height:"200px", borderRadius:"50%",
            background:`radial-gradient(circle,${color}2e 0%,transparent 70%)`,
            animation:"cs-glw 3s ease-in-out infinite", pointerEvents:"none",
          }}/>

          {/* Top stripe */}
          <div style={{
            position:"absolute", top:0, left:"15%", right:"15%", height:"2px",
            background:`linear-gradient(90deg,transparent,${color},transparent)`,
          }}/>

          {/* Close */}
          <button onClick={onClose} style={{
            position:"absolute", top:"13px", right:"13px",
            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)",
            borderRadius:"50%", width:"28px", height:"28px",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", color:"#64748b", fontSize:"15px", lineHeight:1,
          }}>×</button>

          {/* LOCKED badge */}
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

          {/* Emoji */}
          <div style={{ fontSize:"48px", lineHeight:1, marginBottom:"14px", animation:"cs-flt 2.8s ease-in-out infinite" }}>
            {meta.emoji}
          </div>

          {/* Title */}
          <h2 style={{
            margin:"0 0 7px", fontSize:"26px", fontWeight:800, letterSpacing:"-0.4px",
            background:`linear-gradient(130deg,#fff 35%,${color})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
          }}>{meta.label}</h2>

          {/* Desc */}
          <p style={{ margin:"0 0 26px", fontSize:"13px", color:"#64748b", lineHeight:1.6 }}>
            {meta.desc}
          </p>

          {/* Coming Soon pill */}
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
   LOCK ICON (inline svg)
════════════════════════════════════════ */
const LockBadge = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

/* ════════════════════════════════════════
   NAV CONFIG
════════════════════════════════════════ */
const NAV_MODULES = [
  { to: "/dashboard/business",     icon: "🧾", label: "Business Billing", locked: false },
  { to: "/dashboard/home-expense", icon: "💰", label: "Home Expenses",    locked: true,  moduleKey: "home-expense" },
  { to: "/dashboard/construction", icon: "🏗️", label: "Construction",    locked: true,  moduleKey: "construction" },
  { to: "/dashboard/custom",       icon: "⚙️", label: "Custom",           locked: true,  moduleKey: "custom"       },
];

/* ════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════ */
const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [overlayKey, setOverlayKey] = useState(null);

  const name     = user?.full_name || user?.mobile_number || "User";
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      <aside className="sidebar">

        {/* ── Logo + User ── */}
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => navigate("/dashboard")}>
            Mana<span>Bills</span>
          </div>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-user-name">{name}</div>
              <div className="sidebar-user-plan">Active Plan ✦</div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="sidebar-nav">

          <div className="sidebar-nav-label">Overview</div>
          <NavLink to="/dashboard" end className="nav-link">
            <span className="nav-link-icon">🏠</span>
            Home
          </NavLink>

          <div className="sidebar-nav-label">Modules</div>

          {NAV_MODULES.map((item) => {
            /* ── LOCKED: button with lock badge ── */
            if (item.locked) {
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => setOverlayKey(item.moduleKey)}
                  style={{
                    display:"flex", alignItems:"center", gap:"10px",
                    width:"100%", padding:"10px 12px",
                    background:"none", border:"none", cursor:"pointer",
                    borderRadius:"8px", textAlign:"left",
                    opacity: 0.5,
                    color:"#94a3b8", fontSize:"14px", fontWeight:500,
                    transition:"opacity .15s, background .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "0.5";  e.currentTarget.style.background = "none"; }}
                >
                  <span className="nav-link-icon">{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <LockBadge />
                </button>
              );
            }

            /* ── UNLOCKED: normal NavLink ── */
            return (
              <NavLink key={item.to} to={item.to} className="nav-link">
                <span className="nav-link-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}

          <NavLink to="/dashboard/account" className="nav-link">
            <span className="nav-link-icon">👤</span>
            Account / Settings
          </NavLink>

        </nav>

        {/* ── Logout ── */}
        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <span>🚪</span>
            Sign Out
          </button>
        </div>

      </aside>

      {/* ── Coming Soon Modal ── */}
      {overlayKey && (
        <ComingSoonModal
          moduleKey={overlayKey}
          onClose={() => setOverlayKey(null)}
        />
      )}
    </>
  );
};

export default Sidebar;