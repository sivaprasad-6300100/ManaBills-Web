import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../../styles/business/business.css";

const NAV_ITEMS = [
  { to: "",               label: "Overview",       icon: "🏠", end: true },
  { to: "create-invoice", label: "Create Invoice", icon: "🧾" },
  { to: "products",       label: "Stock Entry",    icon: "📦" },
  { to: "default-items",  label: "Default Items",  icon: "📋" },
  { to: "customers",      label: "Customers",      icon: "👥" },
  { to: "invoices",       label: "Invoices",       icon: "📄" },
  { to: "gst",            label: "GST Reports",    icon: "📊" },
  { to: "shopqroder",     label: "Shop QR Order",  icon: "📱" },
  { to: "customerview",   label: "Customer View",  icon: "👁️" }
];  

const BusinessLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div>
      <style>{`

        /* ── Desktop: show horizontal nav, hide mobile elements ── */
        @media (min-width: 769px) {
          .biz-desktop-subnav  { display: flex !important; }
          .biz-mobile-topbar   { display: none !important; }
          .biz-sidebar-backdrop,
          .biz-sidebar-panel   { display: none !important; }
        }

        /* ── Mobile: hide desktop nav ── */
        @media (max-width: 768px) {
          .biz-desktop-subnav { display: none !important; }
        }

        /* ══════════════════════════════════════════
           MOBILE TOPBAR — glued right under main topbar
        ══════════════════════════════════════════ */
        .biz-mobile-topbar {
          display: flex;
          align-items: center;
          gap: 0;
          height: 46px;
          background: #0e1b2e;
          border-top: 2px solid rgba(201,150,58,0.55);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;          /* sits flush under the main topbar */
          z-index: 80;
          box-shadow: 0 3px 14px rgba(14,27,46,0.28);
          padding: 0 20px 0 4px;
        }

        /* ── Hamburger ── */
        .biz-hamburger-btn {
          width: 38px;
          height: 38px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 9px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4.5px;
          padding: 0;
          flex-shrink: 0;
          margin-right: 2px;
          transition: background 0.15s;
        }
        .biz-hamburger-btn:active { background: rgba(255,255,255,0.08); }
        .biz-hamburger-btn span {
          display: block;
          width: 18px;
          height: 2px;
          background: #c9963a;
          border-radius: 2px;
          transition: all 0.2s;
        }
        /* Animate middle bar on open */
        .biz-hamburger-btn.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .biz-hamburger-btn.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .biz-hamburger-btn.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

        /* ── Title area ── */
        .biz-topbar-center {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
          padding: 0 4px;
        }
        .biz-topbar-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #c9963a;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(201,150,58,0.6);
          animation: bizPulse 2s ease-in-out infinite;
        }
        @keyframes bizPulse {
          0%,100% { opacity:1; transform: scale(1); }
          50%      { opacity:0.6; transform: scale(0.85); }
        }
        .biz-topbar-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .biz-topbar-badge {
          font-size: 0.6rem;
          font-weight: 800;
          color: #c9963a;
          background: rgba(201,150,58,0.12);
          border: 1px solid rgba(201,150,58,0.3);
          border-radius: 100px;
          padding: 2px 7px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        /* ── Shop profile icon button ── */
        .biz-profile-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: rgba(201,150,58,0.10);
          border: 1.5px solid rgba(201,150,58,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          text-decoration: none;
          transition: all 0.18s;
          flex-shrink: 0;
          cursor: pointer;
        }
        .biz-profile-icon-btn:hover,
        .biz-profile-icon-btn.active-profile {
          background: rgba(201,150,58,0.22);
          border-color: rgba(201,150,58,0.55);
          transform: scale(1.06);
        }

        /* ══════════════════════════════════════════
           SIDEBAR BACKDROP
        ══════════════════════════════════════════ */
        .biz-sidebar-backdrop {
          position: fixed; inset: 0; z-index: 900;
          background: rgba(10,18,30,0.65);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: bizFadeIn 0.2s ease;
        }
        @keyframes bizFadeIn { from{opacity:0} to{opacity:1} }

        /* ══════════════════════════════════════════
           SIDEBAR PANEL
        ══════════════════════════════════════════ */
        .biz-sidebar-panel {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 268px;
          z-index: 910;
          background: #0e1b2e;
          box-shadow: 6px 0 40px rgba(10,18,30,0.55);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: bizSlideIn 0.26s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes bizSlideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }

        /* Gold top accent bar */
        .biz-sidebar-gold-bar {
          height: 3px;
          background: linear-gradient(90deg, #c9963a, #e8a020, #f4c542, #e8a020, #c9963a);
          flex-shrink: 0;
        }

        /* Sidebar header */
        .biz-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .biz-sidebar-logo {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.3rem; font-weight: 900;
          color: #fff; letter-spacing: -0.02em;
          cursor: pointer;
        }
        .biz-sidebar-logo span { color: #c9963a; }
        .biz-sidebar-close-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.65);
          font-size: 0.9rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .biz-sidebar-close-btn:active { background: rgba(255,255,255,0.14); }

        /* Module badge */
        .biz-module-badge {
          margin: 12px 14px 8px;
          padding: 9px 13px;
          background: rgba(201,150,58,0.10);
          border: 1px solid rgba(201,150,58,0.24);
          border-radius: 10px;
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0;
        }
        .biz-module-badge-sub {
          font-size: 0.62rem; font-weight: 700;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase; letter-spacing: 0.08em;
        }
        .biz-module-badge-name {
          font-size: 0.83rem; font-weight: 700; color: #c9963a;
        }

        /* Nav section label */
        .biz-nav-section-label {
          font-size: 0.58rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: rgba(255,255,255,0.20);
          padding: 10px 20px 5px;
          flex-shrink: 0;
        }

        /* Nav list */
        .biz-sidebar-nav {
          flex: 1; overflow-y: auto;
          padding: 4px 10px 10px;
          scrollbar-width: none;
        }
        .biz-sidebar-nav::-webkit-scrollbar { display: none; }

        .biz-sidebar-link {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 13px;
          border-radius: 9px; margin-bottom: 2px;
          text-decoration: none;
          color: rgba(255,255,255,0.48);
          border-left: 3px solid transparent;
          font-size: 0.875rem; font-weight: 500;
          transition: all 0.16s;
        }
        .biz-sidebar-link:hover {
          color: rgba(255,255,255,0.82);
          background: rgba(255,255,255,0.05);
        }
        .biz-sidebar-link.active {
          color: #fff;
          background: rgba(201,150,58,0.13);
          border-left-color: #c9963a;
          font-weight: 700;
        }
        .biz-sidebar-link-icon {
          font-size: 1rem; width: 20px;
          text-align: center; flex-shrink: 0;
        }

        /* Footer: Shop Profile */
        .biz-sidebar-footer {
          border-top: 1px solid rgba(255,255,255,0.07);
          padding: 12px 10px;
          flex-shrink: 0;
        }
        .biz-sidebar-profile-link {
          display: flex; align-items: center; gap: 11px;
          padding: 11px 13px; border-radius: 10px;
          text-decoration: none;
          color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 0.875rem; font-weight: 600;
          transition: all 0.18s;
        }
        .biz-sidebar-profile-link.active,
        .biz-sidebar-profile-link:hover {
          color: #fff;
          background: rgba(201,150,58,0.13);
          border-color: rgba(201,150,58,0.26);
        }
        .biz-profile-link-title { font-size: 0.82rem; font-weight: 700; color: inherit; }
        .biz-profile-link-sub   { font-size: 0.63rem; color: rgba(255,255,255,0.32); }

      `}</style>

      {/* ══════════════════════════════════════
          MOBILE SIDEBAR (renders when open)
      ══════════════════════════════════════ */}
      {sidebarOpen && (
        <>
          <div className="biz-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
          <div className="biz-sidebar-panel">

            <div className="biz-sidebar-gold-bar" />

            <div className="biz-sidebar-header">
              <div
                className="biz-sidebar-logo"
                onClick={() => { navigate("/dashboard"); setSidebarOpen(false); }}
              >
                Mana<span>Bills</span>
              </div>
              <button className="biz-sidebar-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
            </div>

            <div className="biz-module-badge">
              <span style={{ fontSize: "1.1rem" }}>🧾</span>
              <div>
                <div className="biz-module-badge-sub">Active Module</div>
                <div className="biz-module-badge-name">Business Billing</div>
              </div>
            </div>

            <div className="biz-nav-section-label">Navigation</div>

            <nav className="biz-sidebar-nav">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to + item.label}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    "biz-sidebar-link" + (isActive ? " active" : "")
                  }
                >
                  <span className="biz-sidebar-link-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="biz-sidebar-footer">
              <NavLink
                to="shop-profile"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  "biz-sidebar-profile-link" + (isActive ? " active" : "")
                }
              >
                <span style={{ fontSize: "1.1rem" }}>🏪</span>
                <div>
                  <div className="biz-profile-link-title">Shop Profile</div>
                  <div className="biz-profile-link-sub">Business settings &amp; info</div>
                </div>
              </NavLink>
            </div>

          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          MOBILE TOPBAR — sticky under main topbar
      ══════════════════════════════════════ */}
      <div className="biz-mobile-topbar">
        <button
          className={`biz-hamburger-btn${sidebarOpen ? " open" : ""}`}
          onClick={() => setSidebarOpen((p) => !p)}
          aria-label="Open navigation"
        >
          <span /><span /><span />
        </button>

        <div className="biz-topbar-center">
          <div className="biz-topbar-dot" />
          <span className="biz-topbar-title">Billing</span>
          <span className="biz-topbar-badge">Business</span>
        </div>

        <NavLink
          to="shop-profile"
          title="Shop Profile"
          className={({ isActive }) =>
            "biz-profile-icon-btn" + (isActive ? " active-profile" : "")
          }
        >
          🏪
        </NavLink>
      </div>

      {/* ══════════════════════════════════════
          DESKTOP Sub Navigation (unchanged)
      ══════════════════════════════════════ */}
      <div className="sub-nav biz-desktop-subnav">
        <NavLink to=""             end className="sub-link">Overview</NavLink>
        <NavLink to="shop-profile"     className="sub-link">Shop Profile</NavLink>
        <NavLink to="create-invoice"   className="sub-link">Create Invoice</NavLink>
        <NavLink to="products"         className="sub-link">Stock Entry</NavLink>
        <NavLink to="default-items"    className="sub-link">Default Items</NavLink>
        <NavLink to="customers"        className="sub-link">Customers</NavLink>
        <NavLink to="invoices"         className="sub-link">Invoices</NavLink>
        <NavLink to="gst"              className="sub-link">GST Reports</NavLink>
        <NavLink to="shopqroder"       className="sub-link">Shop QR Order</NavLink>
        <NavLink to="customerview"       className="sub-link">Customer View</NavLink>
         

      </div>

      <Outlet />
    </div>
  );
};

export default BusinessLayout;
