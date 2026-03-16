import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

/* ── Route → Page Title map ── */
const ROUTE_LABELS = {
  "/dashboard":              "Home",
  "/dashboard/business":     "Business Billing",
  "/dashboard/home-expense": "Home Expenses",
  "/dashboard/construction": "Construction",
  "/dashboard/account":      "Account & Settings",
};

const Topbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = ROUTE_LABELS[location.pathname] || "Dashboard";

  /* User info from localStorage */
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const rawName  = user.full_name || "";
  const mobile   = user.mobile_number || "";
  /* Show name if available, else show "User" — never show mobile in greeting */
  const initials = rawName
    ? rawName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className="topbar">

      {/* LEFT — Logo + page title */}
      <div className="topbar-left">
        {/* ManaBills logo — always visible */}
        <div
          className="topbar-logo"
          onClick={() => navigate("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          Mana<span>Bills</span>
        </div>

        {/* Divider */}
        <div className="topbar-divider" />

        {/* Current page name */}
        <span className="topbar-title">{pageTitle}</span>
      </div>

      {/* RIGHT — Bell + User */}
      <div className="topbar-actions">

        {/* Notification bell */}
        <div className="topbar-notif" title="Notifications">
          🔔
          <span className="topbar-notif-dot" />
        </div>

        {/* User avatar pill */}
        <div className="topbar-user" onClick={handleLogout} title="Click to sign out">
          <div className="topbar-user-av">{initials}</div>
          <span className="topbar-user-arrow">↓</span>
        </div>

      </div>
    </header>
  );
};

export default Topbar;