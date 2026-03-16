import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const NAV_MODULES = [
  { to: "/dashboard",              icon: "🏠", label: "Home" },
  { to: "/dashboard/business",     icon: "🧾", label: "Business Billing" },
  { to: "/dashboard/home-expense", icon: "💰", label: "Home Expenses" },
  { to: "/dashboard/construction", icon: "🏗️", label: "Construction" },
];

const NAV_COMING = [
  { icon: "🎓", label: "School Management" },
  { icon: "📦", label: "Inventory Manager" },
];

const Sidebar = () => {
  const navigate = useNavigate();

  /* Get user initials from localStorage */
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const name     = user.full_name || user.mobile_number || "User";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return (
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
        {NAV_MODULES.slice(1).map((item) => (
          <NavLink key={item.to} to={item.to} className="nav-link">
            <span className="nav-link-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-nav-label">Coming Soon</div>
        {NAV_COMING.map((item, i) => (
          <div key={i} className="nav-link nav-link-coming">
            <span className="nav-link-icon">{item.icon}</span>
            {item.label}
            <span className="nav-soon">Soon</span>
          </div>
        ))}

        <div className="sidebar-nav-label">Account</div>
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
  );
};

export default Sidebar;