import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getShopProfile } from "../../services/businessService";

const ROUTE_LABELS = {
  "/dashboard":              "Home",
  "/dashboard/business":     "Business Billing",
  "/dashboard/home-expense": "Home Expenses",
  "/dashboard/construction": "Construction",
  "/dashboard/custom":       "Custom",
  "/dashboard/account":      "Account & Settings",
};

const MENU_ITEMS = [
  { icon: "👤", label: "My Profile",        tab: "profile"       },
  { icon: "📦", label: "My Subscriptions",  tab: "subscriptions" },
  { icon: "🔐", label: "Security",          tab: "security"      },
  { icon: "💬", label: "Help & Support",    tab: "support"       },
  { icon: "ℹ️", label: "About ManaBills",   tab: "about"         },
];

const Topbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen]   = useState(false);
  const [shop, setShop]   = useState(null);
  const dropRef = useRef(null);

  const pageTitle = ROUTE_LABELS[location.pathname] || "Dashboard";

  // ── Login details from localStorage ──────────────────────────
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const loginDetails = {
    fullName:     user.full_name     || "",
    mobileNumber: user.mobile_number || "",
    email:        user.email         || "",   // placeholder — add field later
  };

  // ── Shop profile details from API ─────────────────────────────
  const shopDetails = {
    shopName:    shop?.shop_name    || "",
    ownerName:   shop?.owner_name   || "",
    mobile1:     shop?.mobile       || "",
    mobile2:     shop?.extra_mobile || "",
    gstNumber:   shop?.gst_number   || "",
    address:     shop?.address      || "",
    logoUrl:     shop?.logo_url     || "",
  };

  useEffect(() => {
    getShopProfile()
      .then(setShop)
      .catch(() => console.log("No shop profile found"));
  }, []);

  // ── Avatar initials: prefer shop owner name, fallback to login name ──
  const rawName  = shopDetails.ownerName || loginDetails.fullName || "";
  const mobile   = shopDetails.mobile1   || loginDetails.mobileNumber || "";

  const initials    = rawName
    ? rawName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";
  const displayName = rawName.trim().split(" ")[0] || "User";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (tab) => {
    setOpen(false);
    navigate("/dashboard/account", { state: { tab } });
  };

  const handleLogout = () => {
    setOpen(false);
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className="topbar">

      {/* LEFT */}
      <div className="topbar-left">
        <div
          className="topbar-logo"
          onClick={() => navigate("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          Mana<span>Bills</span>
        </div>
        <div className="topbar-divider" />
        <span className="topbar-title">{pageTitle}</span>
      </div>

      {/* RIGHT */}
      <div className="topbar-actions">

        {/* Notification bell */}
        <div className="topbar-notif" title="Notifications">
          🔔
          <span className="topbar-notif-dot" />
        </div>

        {/* Avatar pill with dropdown */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <div
            className="topbar-user"
            onClick={() => setOpen((prev) => !prev)}
            title="Account"
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            {/* Show logo if available, else initials */}
            <div className="topbar-user-av">
              {shopDetails.logoUrl
                ? <img
                    src={shopDetails.logoUrl}
                    alt="shop logo"
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                : initials
              }
            </div>
            <span
              className="topbar-user-arrow"
              style={{
                display: "inline-block",
                transition: "transform 0.2s",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              ↓
            </span>
          </div>

          {/* Dropdown */}
          {open && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "228px",
              background: "var(--db-white, #ffffff)",
              border: "1.5px solid rgba(14,27,46,0.09)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(14,27,46,0.14)",
              zIndex: 9999,
              overflow: "hidden",
              animation: "dropIn 0.15s ease both",
            }}>

              {/* ── User info header ── */}
              <div style={{
                padding: "14px 16px",
                borderBottom: "1px solid rgba(14,27,46,0.08)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "linear-gradient(135deg, #0e1b2e, #1a2d47)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.75rem", fontWeight: 700, color: "#fff",
                  flexShrink: 0, overflow: "hidden",
                }}>
                  {shopDetails.logoUrl
                    ? <img
                        src={shopDetails.logoUrl}
                        alt="logo"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    : initials
                  }
                </div>

                <div style={{ minWidth: 0 }}>
                  {/* Shop name (bold) if available, else login full name */}
                  <div style={{
                    fontSize: "0.88rem", fontWeight: 700,
                    color: "#0e1b2e", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {shopDetails.shopName || loginDetails.fullName || "User"}
                  </div>

                  {/* Owner name (secondary) */}
                  {shopDetails.ownerName && (
                    <div style={{ fontSize: "0.72rem", color: "#374151", fontWeight: 500 }}>
                      {shopDetails.ownerName}
                    </div>
                  )}

                  {/* Mobile */}
                  <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                    {mobile}
                  </div>

                  {/* Email — shown when available (add email to User model later) */}
                  {loginDetails.email && (
                    <div style={{ fontSize: "0.70rem", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {loginDetails.email}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Shop detail pills (only if shop profile exists) ── */}
              {shop && (
                <div style={{
                  padding: "8px 16px",
                  borderBottom: "1px solid rgba(14,27,46,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                }}>
                  {shopDetails.gstNumber && (
                    <div style={{ fontSize: "0.70rem", color: "#6b7280" }}>
                      GST: <span style={{ color: "#0e1b2e", fontWeight: 600 }}>{shopDetails.gstNumber}</span>
                    </div>
                  )}
                  {shopDetails.mobile2 && (
                    <div style={{ fontSize: "0.70rem", color: "#6b7280" }}>
                      Alt: <span style={{ color: "#0e1b2e" }}>{shopDetails.mobile2}</span>
                    </div>
                  )}
                  {shopDetails.address && (
                    <div style={{
                      fontSize: "0.68rem", color: "#9ca3af",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {shopDetails.address}
                    </div>
                  )}
                </div>
              )}

              {/* Menu items */}
              <div style={{ padding: "6px 0" }}>
                {MENU_ITEMS.map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => handleMenuClick(item.tab)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 16px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "#0e1b2e",
                      textAlign: "left",
                      transition: "background 0.15s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(14,27,46,0.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    <span style={{ fontSize: "15px", width: "18px", textAlign: "center" }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}

                <div style={{ height: "1px", background: "rgba(14,27,46,0.08)", margin: "4px 0" }} />

                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "#dc2626",
                    textAlign: "left",
                    transition: "background 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(220,38,38,0.06)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  <span style={{ fontSize: "15px", width: "18px", textAlign: "center" }}>🚪</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
};

export default Topbar;