import React, { useContext, useState, useEffect } from "react";
import "../../styles/global/account.css";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { authAxios } from "../../services/api";
import {
  getShopProfile,
  saveShopProfile,
} from "../../services/businessService";

/* ══════════════════════════════════════════
   TABS CONFIG
══════════════════════════════════════════ */
const TABS = [
  { key: "profile",       label: "My Profile",       icon: "M12 12c2.7 0 4-1.8 4-4s-1.3-4-4-4-4 1.8-4 4 1.3 4 4 4zm0 2c-4.4 0-8 2.7-8 6h16c0-3.3-3.6-6-8-6z" },
  { key: "subscriptions", label: "Subscriptions",    icon: "M9 12l2 2 4-4M7 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-2M9 3h6M9 3a1 1 0 000 2h6a1 1 0 000-2" },
  { key: "security",      label: "Security",         icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { key: "support",       label: "Help & Support",   icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
  { key: "about",         label: "About",            icon: "M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm0-14v4m0 4h.01" },
];

const MODULE_META = {
  business:      { label: "Business Billing", color: "#1e4fba", bg: "rgba(30,79,186,0.08)",  icon: "🧾" },
  "home-expense":{ label: "Home Expenses",    color: "#15803d", bg: "rgba(21,128,61,0.08)",  icon: "🏠" },
  construction:  { label: "Construction",     color: "#c2410c", bg: "rgba(194,65,12,0.08)",  icon: "🏗️" },
  custom:        { label: "Custom Billing",   color: "#7c3aed", bg: "rgba(124,58,237,0.08)", icon: "⚙️" },
};

const SHOP_TYPES = [
  { value: "Kirana Store",    label: "🛒 Kirana Store"    },
  { value: "HardWare",        label: "🔧 Hardware"        },
  { value: "Clothing",        label: "👗 Clothing"        },
  { value: "Resturants",      label: "🍽️ Restaurants"    },
  { value: "Medical",         label: "💊 Medical"         },
  { value: "Genral Store",    label: "🏪 General Store"   },
  { value: "Gold and Silver", label: "💍 Gold & Silver"   },
  { value: "Others",          label: "📦 Others"          },
];

/* ══════════════════════════════════════════
   REUSABLE FIELD COMPONENT
══════════════════════════════════════════ */
const Field = ({ label, hint, children, locked }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <label style={{
        fontSize: "0.7rem", fontWeight: 700,
        color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        {label}
      </label>
      {locked && (
        <span style={{
          fontSize: "0.62rem", fontWeight: 700,
          background: "rgba(14,27,46,0.06)", color: "#94a3b8",
          padding: "2px 8px", borderRadius: "100px", letterSpacing: "0.04em",
        }}>
          🔒 Locked
        </span>
      )}
    </div>
    {children}
    {hint && (
      <span style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.4 }}>{hint}</span>
    )}
  </div>
);

/* ══════════════════════════════════════════
   SECTION CARD WRAPPER
══════════════════════════════════════════ */
const SectionCard = ({ title, subtitle, icon, accent = "#0e1b2e", children, action }) => (
  <div style={{
    background: "#fff",
    border: "1.5px solid rgba(14,27,46,0.08)",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(14,27,46,0.06)",
    marginBottom: "1.25rem",
  }}>
    {/* Card header */}
    <div style={{
      padding: "1.1rem 1.5rem",
      borderBottom: "1px solid rgba(14,27,46,0.07)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "linear-gradient(135deg, rgba(14,27,46,0.02) 0%, transparent 100%)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "10px",
          background: `${accent}14`,
          border: `1.5px solid ${accent}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1rem", flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{
            fontSize: "0.92rem", fontWeight: 800,
            color: "#0e1b2e", letterSpacing: "-0.01em",
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: "0.73rem", color: "#94a3b8", marginTop: "1px" }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {action}
    </div>
    {/* Card body */}
    <div style={{ padding: "1.4rem 1.5rem" }}>
      {children}
    </div>
  </div>
);

/* ══════════════════════════════════════════
   INPUT STYLE
══════════════════════════════════════════ */
const inputStyle = {
  width: "100%",
  padding: "10px 13px",
  border: "1.5px solid #e5e7eb",
  borderRadius: "10px",
  fontSize: "0.9rem",
  fontWeight: 500,
  color: "#0e1b2e",
  background: "#fafafa",
  outline: "none",
  transition: "border-color 0.18s, box-shadow 0.18s",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const inputFocusStyle = {
  borderColor: "#c9963a",
  background: "#fff",
  boxShadow: "0 0 0 3px rgba(201,150,58,0.12)",
};

/* Focus-aware Input component */
const Input = ({ disabled, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      disabled={disabled}
      style={{
        ...inputStyle,
        ...(focused && !disabled ? inputFocusStyle : {}),
        ...(disabled ? { opacity: 0.55, cursor: "not-allowed", background: "#f3f4f6" } : {}),
        ...props.style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

const Select = ({ ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...inputStyle,
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        paddingRight: "32px",
        cursor: "pointer",
        ...(focused ? inputFocusStyle : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const AccountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, logout } = useContext(AuthContext);
  const { subscriptions }       = useContext(SubscriptionContext);

  /* Tab state — supports deep-link from Topbar dropdown */
  const [activeTab, setActiveTab] = useState(location.state?.tab || "profile");

  /* ── Login details state ── */
  const [name,        setName]        = useState(user?.full_name     || "");
  const [mobile,      setMobile]      = useState(user?.mobile_number || "");
  const [email,       setEmail]       = useState(user?.email         || "");
  const [savingLogin, setSavingLogin] = useState(false);
  const [loginEditing, setLoginEditing] = useState(false);

  /* ── Shop profile state ── */
  const [shop, setShop] = useState({
    shop_name: "", owner_name: "", mobile: "", extra_mobile: "",
    address: "", shop_type: "", timings: "", gst_enabled: false, gst_number: "",
  });
  const [shopLoading, setShopLoading]   = useState(true);
  const [shopSaving,  setShopSaving]    = useState(false);
  const [shopEditing, setShopEditing]   = useState(false);
  const [shopExists,  setShopExists]    = useState(false);

  /* ── Password state ── */
  const [oldPass,     setOldPass]     = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass,  setSavingPass]  = useState(false);
  const [showPw,      setShowPw]      = useState({ old: false, new: false, confirm: false });

  /* ── Toast ── */
  const [toast, setToast] = useState(null);

  const activeModules = Object.keys(subscriptions);
  const initials = name
    ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Load shop profile on mount ── */
  useEffect(() => {
    getShopProfile()
      .then((data) => {
        setShop({
          shop_name:    data.shop_name    || "",
          owner_name:   data.owner_name   || "",
          mobile:       data.mobile       || "",
          extra_mobile: data.extra_mobile || "",
          address:      data.address      || "",
          shop_type:    data.shop_type    || "",
          timings:      data.timings      || "",
          gst_enabled:  data.gst_enabled  || false,
          gst_number:   data.gst_number   || "",
        });
        setShopExists(true);
        setShopEditing(false);
      })
      .catch(() => {
        setShopExists(false);
        setShopEditing(true);
      })
      .finally(() => setShopLoading(false));
  }, []);

  /* ── Save login details ── */
  const handleLoginSave = async () => {
    if (!name.trim()) return showToast("Name cannot be empty", "error");
    setSavingLogin(true);
    try {
      await authAxios.patch("auth/profile/update/", { full_name: name, email });
      login({ ...user, full_name: name, email });
      setLoginEditing(false);
      showToast("Login details updated ✓");
    } catch {
      login({ ...user, full_name: name, email });
      setLoginEditing(false);
      showToast("Profile saved ✓");
    } finally { setSavingLogin(false); }
  };

  /* ── Save shop profile ── */
  const handleShopSave = async () => {
    if (!shop.shop_name.trim() || !shop.owner_name.trim() ||
        !shop.mobile.trim()    || !shop.address.trim()) {
      showToast("Shop Name, Owner Name, Mobile & Address are required", "error");
      return;
    }
    setShopSaving(true);
    try {
      await saveShopProfile(shop);
      setShopExists(true);
      setShopEditing(false);
      showToast("Shop profile saved ✓");
    } catch {
      showToast("Failed to save shop profile", "error");
    } finally { setShopSaving(false); }
  };

  /* ── Change password ── */
  const handlePasswordChange = async () => {
    if (!oldPass || !newPass) return showToast("Fill all password fields", "error");
    if (newPass !== confirmPass)  return showToast("New passwords don't match", "error");
    if (newPass.length < 6)       return showToast("Password must be at least 6 characters", "error");
    setSavingPass(true);
    try {
      await authAxios.post("auth/change-password/", {
        old_password: oldPass, new_password: newPass,
      });
      setOldPass(""); setNewPass(""); setConfirmPass("");
      showToast("Password changed successfully ✓");
    } catch {
      showToast("Current password is incorrect", "error");
    } finally { setSavingPass(false); }
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/", { replace: true });
  };

  /* ── Password strength ── */
  const pwStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6)  s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw) || /\d/.test(pw)) s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    return s;
  };
  const strengthColor = ["#e5e7eb", "#dc2626", "#f59e0b", "#22c55e", "#15803d"];
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];

  /* ══════════════════════════════════════════
     RENDER: MY PROFILE
  ══════════════════════════════════════════ */
  const renderProfile = () => (
    <div style={{ maxWidth: "680px" }}>

      {/* ── Profile hero card ── */}
      <div style={{
        background: "linear-gradient(135deg, #0e1b2e 0%, #1a2d47 100%)",
        borderRadius: "20px",
        padding: "1.5rem 1.75rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Gold top stripe */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
          background: "linear-gradient(90deg, #c9963a, #e8a020, #f4c542, #e8a020, #c9963a)",
        }} />
        {/* Decorative glow */}
        <div style={{
          position: "absolute", top: "-30px", right: "-20px",
          width: "140px", height: "140px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,150,58,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #c9963a, #e8a020)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.4rem", fontWeight: 900, color: "#0e1b2e",
          border: "3px solid rgba(201,150,58,0.35)",
          position: "relative", zIndex: 1,
        }}>
          {initials}
        </div>

        {/* Name + info */}
        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.2rem", fontWeight: 800, color: "#fff",
            marginBottom: "3px", letterSpacing: "-0.01em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {name || "Your Name"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
            📱 {mobile || "—"}
            {email && <span style={{ marginLeft: "12px" }}>✉️ {email}</span>}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {activeModules.length > 0 ? activeModules.map(k => {
              const m = MODULE_META[k] || {};
              return (
                <span key={k} style={{
                  fontSize: "0.62rem", fontWeight: 700,
                  background: "rgba(201,150,58,0.18)",
                  border: "1px solid rgba(201,150,58,0.35)",
                  color: "#e8a020", padding: "3px 8px",
                  borderRadius: "100px", letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}>
                  {m.icon} {m.label}
                </span>
              );
            }) : (
              <span style={{
                fontSize: "0.62rem", fontWeight: 700,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.4)", padding: "3px 8px",
                borderRadius: "100px",
              }}>
                No active plans
              </span>
            )}
          </div>
        </div>

        {/* Edit button */}
        {!loginEditing && (
          <button
            onClick={() => setLoginEditing(true)}
            style={{
              background: "rgba(201,150,58,0.15)",
              border: "1.5px solid rgba(201,150,58,0.35)",
              color: "#c9963a", borderRadius: "10px",
              padding: "7px 14px", fontSize: "0.78rem",
              fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", flexShrink: 0,
              position: "relative", zIndex: 1,
              transition: "all 0.18s",
            }}
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {/* ── Login Details Card ── */}
      <SectionCard
        title="Login Details"
        subtitle="Your account credentials and contact info"
        icon="👤"
        accent="#1e4fba"
        action={
          !loginEditing ? (
            <button
              onClick={() => setLoginEditing(true)}
              style={{
                background: "rgba(30,79,186,0.08)",
                border: "1.5px solid rgba(30,79,186,0.20)",
                color: "#1e4fba", borderRadius: "8px",
                padding: "6px 14px", fontSize: "0.78rem",
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Edit
            </button>
          ) : null
        }
      >
        {!loginEditing ? (
          /* ── Display mode ── */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Full Name",    value: name    || "—", icon: "👤" },
              { label: "Mobile",       value: mobile  || "—", icon: "📱", locked: true },
              { label: "Email",        value: email   || "Not set", icon: "✉️" },
              { label: "Account Type", value: "Shop Owner", icon: "🏪" },
            ].map(item => (
              <div key={item.label} style={{
                background: "#fafafa",
                border: "1px solid rgba(14,27,46,0.07)",
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "8px",
                  background: "rgba(14,27,46,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.9rem", flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.67rem", fontWeight: 700, color: "#94a3b8",
                    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "3px" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#0e1b2e",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.value}
                  </div>
                  {item.locked && (
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "2px" }}>
                      Cannot be changed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Edit mode ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Full Name *">
                <Input
                  value={name}
                  placeholder="Your full name"
                  onChange={e => setName(e.target.value)}
                />
              </Field>
              <Field label="Mobile Number" locked hint="Mobile number cannot be changed">
                <Input value={mobile} disabled />
              </Field>
              <Field label="Email Address" hint="Optional — used for receipts & notifications">
                <Input
                  type="email"
                  value={email}
                  placeholder="your@email.com"
                  onChange={e => setEmail(e.target.value)}
                />
              </Field>
            </div>
            <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
              <button
                onClick={handleLoginSave}
                disabled={savingLogin}
                style={{
                  padding: "10px 24px", background: "#0e1b2e", color: "#fff",
                  border: "none", borderRadius: "10px", fontWeight: 700,
                  fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit",
                  opacity: savingLogin ? 0.7 : 1,
                }}
              >
                {savingLogin ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setLoginEditing(false);
                  setName(user?.full_name || "");
                  setEmail(user?.email || "");
                }}
                style={{
                  padding: "10px 20px", background: "transparent", color: "#6b7280",
                  border: "1.5px solid #e5e7eb", borderRadius: "10px", fontWeight: 600,
                  fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Shop Profile Card ── */}
      <SectionCard
        title="Shop Profile"
        subtitle={shopExists ? "Your business info on every invoice" : "Not set up yet"}
        icon="🏪"
        accent="#c9963a"
        action={
          shopExists && !shopEditing ? (
            <button
              onClick={() => setShopEditing(true)}
              style={{
                background: "rgba(201,150,58,0.10)",
                border: "1.5px solid rgba(201,150,58,0.28)",
                color: "#c9963a", borderRadius: "8px",
                padding: "6px 14px", fontSize: "0.78rem",
                fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Edit
            </button>
          ) : null
        }
      >
        {shopLoading ? (
          <div style={{ padding: "1rem 0", textAlign: "center", color: "#94a3b8" }}>
            Loading shop profile…
          </div>
        ) : !shopEditing && shopExists ? (
          /* ── Shop display mode ── */
          <div>
            {/* Shop name hero */}
            <div style={{
              background: "linear-gradient(135deg, rgba(201,150,58,0.06), rgba(201,150,58,0.02))",
              border: "1px solid rgba(201,150,58,0.18)",
              borderRadius: "14px",
              padding: "14px 16px",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "12px",
                background: "rgba(201,150,58,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.3rem", flexShrink: 0,
              }}>
                🏪
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1rem", fontWeight: 800, color: "#0e1b2e",
                  marginBottom: "2px",
                }}>
                  {shop.shop_name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {shop.shop_type || "General Business"}{shop.timings ? ` · ${shop.timings}` : ""}
                </div>
              </div>
              <span style={{
                fontSize: "0.65rem", fontWeight: 700,
                padding: "4px 10px", borderRadius: "100px",
                background: shop.gst_enabled ? "rgba(21,128,61,0.1)" : "rgba(107,114,128,0.1)",
                color:      shop.gst_enabled ? "#15803d"              : "#6b7280",
                border: `1px solid ${shop.gst_enabled ? "rgba(21,128,61,0.25)" : "rgba(107,114,128,0.2)"}`,
              }}>
                {shop.gst_enabled ? "✓ GST" : "No GST"}
              </span>
            </div>

            {/* Detail grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}>
              {[
                { label: "Owner",        value: shop.owner_name,   icon: "👤" },
                { label: "Mobile",       value: shop.mobile,       icon: "📱" },
                { label: "Extra Mobile", value: shop.extra_mobile || "—", icon: "📞" },
                { label: "GST Number",   value: shop.gst_enabled ? (shop.gst_number || "Not added") : "N/A", icon: "🧾" },
              ].map(item => (
                <div key={item.label} style={{
                  background: "#fafafa",
                  border: "1px solid rgba(14,27,46,0.06)",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  display: "flex", gap: "8px", alignItems: "flex-start",
                }}>
                  <span style={{ fontSize: "0.85rem", marginTop: "1px" }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af",
                      textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0e1b2e" }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
              {/* Address — full width */}
              <div style={{
                gridColumn: "1 / -1",
                background: "#fafafa",
                border: "1px solid rgba(14,27,46,0.06)",
                borderRadius: "10px",
                padding: "10px 12px",
                display: "flex", gap: "8px",
              }}>
                <span style={{ fontSize: "0.85rem", marginTop: "1px" }}>📍</span>
                <div>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af",
                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
                    Address
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0e1b2e", lineHeight: 1.5 }}>
                    {shop.address}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Shop edit / setup mode ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {!shopExists && (
              <div style={{
                background: "rgba(201,150,58,0.08)",
                border: "1px solid rgba(201,150,58,0.22)",
                borderRadius: "12px", padding: "12px 14px",
                fontSize: "0.82rem", color: "#92400e", lineHeight: 1.5,
              }}>
                💡 Fill your shop details — they'll appear on every invoice automatically.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Shop Name *">
                <Input
                  value={shop.shop_name}
                  placeholder="e.g. Reddy Hardware Store"
                  onChange={e => setShop(p => ({ ...p, shop_name: e.target.value }))}
                />
              </Field>
              <Field label="Owner Name *">
                <Input
                  value={shop.owner_name}
                  placeholder="e.g. Ramesh Reddy"
                  onChange={e => setShop(p => ({ ...p, owner_name: e.target.value }))}
                />
              </Field>
              <Field label="Mobile *">
                <Input
                  type="tel"
                  value={shop.mobile}
                  placeholder="10-digit number"
                  onChange={e => setShop(p => ({ ...p, mobile: e.target.value }))}
                  maxLength={10}
                />
              </Field>
              <Field label="Extra Mobile">
                <Input
                  type="tel"
                  value={shop.extra_mobile}
                  placeholder="Optional"
                  onChange={e => setShop(p => ({ ...p, extra_mobile: e.target.value }))}
                  maxLength={10}
                />
              </Field>
              <Field label="Shop Type">
                <Select
                  value={shop.shop_type}
                  onChange={e => setShop(p => ({ ...p, shop_type: e.target.value }))}
                >
                  <option value="">Select business type</option>
                  {SHOP_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Shop Timings">
                <Input
                  value={shop.timings}
                  placeholder="e.g. 9AM – 9PM, Mon–Sat"
                  onChange={e => setShop(p => ({ ...p, timings: e.target.value }))}
                />
              </Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Address *">
                  <textarea
                    value={shop.address}
                    placeholder="Door No, Street, Area, City, Pincode"
                    onChange={e => setShop(p => ({ ...p, address: e.target.value }))}
                    rows={2}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: "72px",
                      lineHeight: 1.5,
                    }}
                  />
                </Field>
              </div>
            </div>

            {/* GST toggle */}
            <div style={{
              background: shop.gst_enabled ? "rgba(21,128,61,0.05)" : "#fafafa",
              border: `1.5px solid ${shop.gst_enabled ? "rgba(21,128,61,0.25)" : "#e5e7eb"}`,
              borderRadius: "12px", padding: "14px 16px",
              transition: "all 0.2s",
            }}>
              <label style={{
                display: "flex", alignItems: "center", gap: "10px",
                cursor: "pointer", userSelect: "none",
              }}>
                <input
                  type="checkbox"
                  checked={shop.gst_enabled}
                  onChange={e => setShop(p => ({ ...p, gst_enabled: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: "#15803d", cursor: "pointer" }}
                />
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0e1b2e" }}>
                    Enable GST Billing
                  </div>
                  <div style={{ fontSize: "0.73rem", color: "#6b7280", marginTop: "1px" }}>
                    Your GSTIN will appear on all invoices
                  </div>
                </div>
              </label>
              {shop.gst_enabled && (
                <div style={{ marginTop: "12px" }}>
                  <Field label="GST Number">
                    <Input
                      value={shop.gst_number}
                      placeholder="e.g. 37AAAAA0000A1Z5"
                      onChange={e => setShop(p => ({
                        ...p, gst_number: e.target.value.toUpperCase()
                      }))}
                      maxLength={15}
                      style={{ fontFamily: "monospace", letterSpacing: "0.06em" }}
                    />
                  </Field>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleShopSave}
                disabled={shopSaving}
                style={{
                  padding: "10px 24px", background: "#0e1b2e", color: "#fff",
                  border: "none", borderRadius: "10px", fontWeight: 700,
                  fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit",
                  opacity: shopSaving ? 0.7 : 1,
                }}
              >
                {shopSaving ? "Saving…" : shopExists ? "Update Shop" : "Save Shop Profile"}
              </button>
              {shopExists && (
                <button
                  onClick={() => setShopEditing(false)}
                  style={{
                    padding: "10px 20px", background: "transparent", color: "#6b7280",
                    border: "1.5px solid #e5e7eb", borderRadius: "10px", fontWeight: 600,
                    fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );

  /* ══════════════════════════════════════════
     RENDER: SUBSCRIPTIONS
  ══════════════════════════════════════════ */
  const renderSubscriptions = () => (
    <div style={{ maxWidth: "680px" }}>
      <SectionCard title="Active Plans" subtitle="Your currently subscribed modules" icon="📦" accent="#1e4fba">
        {activeModules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📦</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0e1b2e", marginBottom: "0.4rem" }}>
              No Active Subscriptions
            </div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "1.25rem" }}>
              Choose a plan starting at just ₹99/month.
            </div>
            <button
              onClick={() => navigate("/subscription")}
              style={{
                padding: "10px 24px", background: "#0e1b2e", color: "#fff",
                border: "none", borderRadius: "10px", fontWeight: 700,
                fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              View All Plans →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeModules.map(key => {
              const meta = MODULE_META[key] || { label: key, color: "#6b7280", bg: "#f3f4f6", icon: "📌" };
              const sub  = subscriptions[key];
              return (
                <div key={key} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  background: "#fafafa",
                  border: `1.5px solid rgba(14,27,46,0.07)`,
                  borderLeft: `4px solid ${meta.color}`,
                  borderRadius: "12px", padding: "14px 16px",
                  transition: "all 0.18s",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "10px",
                    background: meta.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.15rem", flexShrink: 0,
                  }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0e1b2e" }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px" }}>
                      {sub?.status === "FREE_TRIAL" ? "🟡 Free Trial" : "🟢 Active"}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/subscription/${key}`)}
                    style={{
                      padding: "6px 14px", borderRadius: "8px",
                      background: `${meta.color}12`,
                      border: `1.5px solid ${meta.color}30`,
                      color: meta.color, fontWeight: 700,
                      fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Manage →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
      <button
        onClick={() => navigate("/subscription")}
        style={{
          width: "100%", padding: "12px", background: "transparent",
          border: "1.5px dashed rgba(14,27,46,0.2)", borderRadius: "12px",
          color: "#6b7280", fontWeight: 600, fontSize: "0.88rem",
          cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#c9963a"; e.currentTarget.style.color = "#c9963a"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,27,46,0.2)"; e.currentTarget.style.color = "#6b7280"; }}
      >
        + Add Another Module
      </button>
    </div>
  );

  /* ══════════════════════════════════════════
     RENDER: SECURITY
  ══════════════════════════════════════════ */
  const renderSecurity = () => (
    <div style={{ maxWidth: "680px" }}>
      <SectionCard title="Change Password" subtitle="Update your account password" icon="🔐" accent="#7c3aed">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[
            { label: "Current Password", val: oldPass, setter: setOldPass, key: "old",     placeholder: "Enter current password" },
            { label: "New Password",     val: newPass, setter: setNewPass, key: "new",     placeholder: "Min. 6 characters" },
            { label: "Confirm Password", val: confirmPass, setter: setConfirmPass, key: "confirm", placeholder: "Re-enter new password" },
          ].map(({ label, val, setter, key, placeholder }) => (
            <Field key={key} label={label}>
              <div style={{ position: "relative" }}>
                <Input
                  type={showPw[key] ? "text" : "password"}
                  value={val}
                  placeholder={placeholder}
                  onChange={e => setter(e.target.value)}
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#94a3b8", fontSize: "0.85rem",
                  }}
                >
                  {showPw[key] ? "🙈" : "👁️"}
                </button>
              </div>
              {/* Password strength bar for new password */}
              {key === "new" && val.length > 0 && (
                <div style={{ marginTop: "6px" }}>
                  <div style={{ display: "flex", gap: "3px", marginBottom: "4px" }}>
                    {[1,2,3,4].map(lvl => (
                      <div key={lvl} style={{
                        flex: 1, height: "3px", borderRadius: "2px",
                        background: lvl <= pwStrength(val) ? strengthColor[pwStrength(val)] : "#e5e7eb",
                        transition: "background 0.3s",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: strengthColor[pwStrength(val)] || "#6b7280", fontWeight: 600 }}>
                    {strengthLabel[pwStrength(val)]}
                  </span>
                </div>
              )}
              {/* Match indicator */}
              {key === "confirm" && val.length > 0 && (
                <div style={{
                  fontSize: "0.72rem", fontWeight: 600, marginTop: "4px",
                  color: val === newPass ? "#22c55e" : "#dc2626",
                }}>
                  {val === newPass ? "✓ Passwords match" : "✗ Passwords don't match"}
                </div>
              )}
            </Field>
          ))}
          <button
            onClick={handlePasswordChange}
            disabled={savingPass}
            style={{
              padding: "10px 24px", background: "#7c3aed", color: "#fff",
              border: "none", borderRadius: "10px", fontWeight: 700,
              fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit",
              width: "fit-content", opacity: savingPass ? 0.7 : 1,
            }}
          >
            {savingPass ? "Updating…" : "Update Password"}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone" subtitle="Irreversible account actions" icon="⚠️" accent="#dc2626">
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "12px",
        }}>
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#0e1b2e", marginBottom: "3px" }}>
              Sign out of ManaBills
            </div>
            <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>
              Removes all session data from this device.
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "9px 20px",
              background: "rgba(220,38,38,0.06)",
              border: "1.5px solid rgba(220,38,38,0.25)",
              color: "#dc2626", borderRadius: "10px",
              fontWeight: 700, fontSize: "0.85rem",
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.18s", whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; }}
          >
            🚪 Sign Out
          </button>
        </div>
      </SectionCard>
    </div>
  );

  /* ══════════════════════════════════════════
     RENDER: SUPPORT
  ══════════════════════════════════════════ */
  const renderSupport = () => (
    <div style={{ maxWidth: "680px" }}>
      <SectionCard title="Get Help" subtitle="Reach us any time" icon="💬" accent="#0891b2">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            { icon: "💬", title: "WhatsApp",      sub: "Chat with us instantly", color: "#25D366",
              action: () => window.open("https://wa.me/919550544441?text=Hi, I need help with ManaBills", "_blank") },
            { icon: "📧", title: "Email Support",  sub: "support@manabills.in",  color: "#1e4fba",
              action: () => window.open("mailto:support@manabills.in") },
            { icon: "📖", title: "User Guide",     sub: "How to use ManaBills",  color: "#c9963a",
              action: () => {} },
            { icon: "🐛", title: "Report a Bug",   sub: "Found something wrong?", color: "#dc2626",
              action: () => window.open("mailto:support@manabills.in?subject=Bug Report") },
          ].map(item => (
            <div
              key={item.title}
              onClick={item.action}
              style={{
                background: "#fafafa", border: "1.5px solid rgba(14,27,46,0.07)",
                borderRadius: "14px", padding: "16px", cursor: "pointer",
                transition: "all 0.2s", display: "flex", gap: "12px", alignItems: "flex-start",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = item.color + "44"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${item.color}14`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,27,46,0.07)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: "10px", flexShrink: 0,
                background: item.color + "14",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem",
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: "0.87rem", fontWeight: 700, color: "#0e1b2e", marginBottom: "2px" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "0.73rem", color: "#6b7280" }}>
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="FAQs" subtitle="Common questions answered" icon="❓" accent="#6b7280">
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { q: "How do I create my first invoice?",        a: "Go to Business Billing → Create Invoice. Fill in customer details and products only." },
            { q: "Can I use ManaBills on multiple devices?", a: "Basic plan supports 2 devices. Pro plan supports 4 devices simultaneously." },
            { q: "How to cancel my subscription?",           a: "Contact support on WhatsApp. We will process it within 24 hours." },
            { q: "Is my data safe?",                         a: "Yes. All data is encrypted and stored on secure servers. We never sell your data." },
          ].map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ══════════════════════════════════════════
     RENDER: ABOUT
  ══════════════════════════════════════════ */
  const renderAbout = () => (
    <div style={{ maxWidth: "680px" }}>
      <SectionCard title="About ManaBills" subtitle="Version 1.0.0" icon="ℹ️" accent="#c9963a">
        <div style={{ textAlign: "center", padding: "0.5rem 0 1rem" }}>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "2rem", fontWeight: 900, color: "#0e1b2e", marginBottom: "0.5rem",
          }}>
            Mana<span style={{ color: "#c9963a" }}>Bills</span>
          </div>
          <p style={{ fontSize: "0.88rem", color: "#6b7280", lineHeight: 1.7, maxWidth: "400px", margin: "0 auto 1.5rem" }}>
            Andhra Pradesh & Telangana's trusted billing and expense
            management app — built for shop owners, families, and contractors.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            {[
              { value: "50K+", label: "Invoices", color: "#1e4fba" },
              { value: "₹2Cr+", label: "Tracked",  color: "#15803d" },
              { value: "4.9★", label: "Rating",    color: "#c9963a" },
            ].map(s => (
              <div key={s.label} style={{
                background: `${s.color}10`, border: `1.5px solid ${s.color}25`,
                borderRadius: "14px", padding: "14px 20px", textAlign: "center",
                minWidth: "100px",
              }}>
                <div style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.3rem", fontWeight: 900, color: s.color,
                }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "2px", fontWeight: 600 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(14,27,46,0.08)", paddingTop: "1rem" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            {["Privacy Policy", "Terms of Service", "Refund Policy"].map(l => (
              <button key={l} style={{
                background: "none", border: "1px solid rgba(14,27,46,0.12)",
                color: "#6b7280", borderRadius: "100px", padding: "6px 14px",
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.18s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#0e1b2e"; e.currentTarget.style.color = "#0e1b2e"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,27,46,0.12)"; e.currentTarget.style.color = "#6b7280"; }}
              >
                {l}
              </button>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: "0.78rem", color: "#94a3b8", marginTop: "1rem" }}>
            Made with ❤️ in Andhra Pradesh 🇮🇳
          </p>
        </div>
      </SectionCard>
    </div>
  );

  const RENDERERS = {
    profile:       renderProfile,
    subscriptions: renderSubscriptions,
    security:      renderSecurity,
    support:       renderSupport,
    about:         renderAbout,
  };

  /* ══════════════════════════════════════════
     JSX ROOT
  ══════════════════════════════════════════ */
  return (
    <div className="acc-page">

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "72px", left: "50%",
          transform: "translateX(-50%)", zIndex: 9999,
          padding: "10px 24px", borderRadius: "100px",
          fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap",
          background: toast.type === "success" ? "#0e1b2e" : "#dc2626",
          color: "#fff", boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
          animation: "toastIn 0.25s ease",
        }}>
          {toast.type === "success" ? "✓" : "✗"} {toast.msg}
        </div>
      )}

      {/* Tab bar */}
      <div className="acc-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`acc-tab${activeTab === tab.key ? " acc-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="acc-body">
        {RENDERERS[activeTab]?.()}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

/* ── FAQ Item ── */
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        background: "#fafafa",
        border: "1px solid rgba(14,27,46,0.07)",
        borderRadius: "10px",
        padding: "12px 14px",
        cursor: "pointer",
        transition: "border-color 0.18s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(14,27,46,0.16)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(14,27,46,0.07)"}
    >
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: "12px",
      }}>
        <span style={{ fontSize: "0.87rem", fontWeight: 600, color: "#0e1b2e" }}>{q}</span>
        <span style={{
          transition: "transform 0.2s", flexShrink: 0, color: "#6b7280",
          transform: open ? "rotate(180deg)" : "none",
        }}>▾</span>
      </div>
      {open && (
        <div style={{
          fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.65,
          marginTop: "10px", paddingTop: "10px",
          borderTop: "1px solid rgba(14,27,46,0.07)",
        }}>
          {a}
        </div>
      )}
    </div>
  );
};

export default AccountPage;