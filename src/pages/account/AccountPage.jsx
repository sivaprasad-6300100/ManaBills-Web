import React, { useContext, useState } from "react";
import "../../styles/global/account.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { authAxios } from "../../services/api";

/* ══════════════════════════════════════════
   ICONS
══════════════════════════════════════════ */
const Icon = ({ d, size = 20, color = "currentColor", fill = "none", sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/* ══════════════════════════════════════════
   SECTION TABS CONFIG
══════════════════════════════════════════ */
const TABS = [
  { key: "profile",       label: "My Profile",          icon: "M12 12c2.7 0 4-1.8 4-4s-1.3-4-4-4-4 1.8-4 4 1.3 4 4 4zm0 2c-4.4 0-8 2.7-8 6h16c0-3.3-3.6-6-8-6z" },
  { key: "subscriptions", label: "My Subscriptions",    icon: "M9 12l2 2 4-4M7 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-2M9 3h6M9 3a1 1 0 000 2h6a1 1 0 000-2" },
  { key: "security",      label: "Security",            icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { key: "support",       label: "Help & Support",      icon: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
  { key: "about",         label: "About ManaBills",     icon: "M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm0-14v4m0 4h.01" },
];

const MODULE_META = {
  business:     { label: "Business Billing",  color: "#1e4fba", bg: "rgba(30,79,186,0.08)",   icon: "🧾" },
  "home-expense":{ label: "Home Expenses",    color: "#15803d", bg: "rgba(21,128,61,0.08)",   icon: "🏠" },
  construction: { label: "Construction",      color: "#c2410c", bg: "rgba(194,65,12,0.08)",   icon: "🏗️" },
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const AccountPage = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useContext(AuthContext);
  const { subscriptions }       = useContext(SubscriptionContext);

  const [activeTab,     setActiveTab]     = useState("profile");
  const [name,          setName]          = useState(user?.full_name        || "");
  const [mobile,        setMobile]        = useState(user?.mobile_number    || "");
  const [email,         setEmail]         = useState(user?.email            || "");
  const [oldPass,       setOldPass]       = useState("");
  const [newPass,       setNewPass]       = useState("");
  const [confirmPass,   setConfirmPass]   = useState("");
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState(null);

  const activeModules = Object.keys(subscriptions);

  /* user initials */
  const initials = name
    ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  /* toast helper */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── PROFILE SAVE ── */
  const handleProfileSave = async () => {
    if (!name.trim()) return showToast("Name cannot be empty", "error");
    setSaving(true);
    try {
      await authAxios.patch("auth/profile/update/", { full_name: name, email });
      const updated = { ...user, full_name: name, email };
      login(updated);
      showToast("Profile updated successfully ✓");
    } catch {
      /* fallback: update localStorage only */
      const updated = { ...user, full_name: name, email };
      login(updated);
      showToast("Profile saved locally ✓");
    } finally { setSaving(false); }
  };

  /* ── PASSWORD CHANGE ── */
  const handlePasswordChange = async () => {
    if (!oldPass || !newPass) return showToast("Fill all password fields", "error");
    if (newPass !== confirmPass)  return showToast("New passwords don't match", "error");
    if (newPass.length < 6)       return showToast("Password must be at least 6 characters", "error");
    setSaving(true);
    try {
      await authAxios.post("auth/change-password/", {
        old_password: oldPass,
        new_password: newPass,
      });
      setOldPass(""); setNewPass(""); setConfirmPass("");
      showToast("Password changed successfully ✓");
    } catch {
      showToast("Current password is incorrect", "error");
    } finally { setSaving(false); }
  };

  /* ── LOGOUT ── */
  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/", { replace: true });
  };

  /* ══════════════════════════════════════════
     RENDER SECTIONS
  ══════════════════════════════════════════ */

  const renderProfile = () => (
    <div className="acc-section">
      {/* Avatar row */}
      <div className="acc-avatar-row">
        <div className="acc-avatar-big">{initials}</div>
        <div>
          <div className="acc-avatar-name">{name || "Your Name"}</div>
          <div className="acc-avatar-mobile">{mobile || "Mobile Number"}</div>
          <div className="acc-avatar-badge">
            {activeModules.length > 0
              ? `${activeModules.length} Active Plan${activeModules.length > 1 ? "s" : ""}`
              : "No Active Plan"}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="acc-form-group">
        <label className="acc-label">Full Name</label>
        <input
          className="acc-input"
          placeholder="Enter your full name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>
      <div className="acc-form-group">
        <label className="acc-label">Mobile Number</label>
        <input
          className="acc-input"
          placeholder="Mobile number"
          value={mobile}
          disabled
          style={{ opacity: 0.6, cursor: "not-allowed" }}
        />
        <span className="acc-hint">Mobile number cannot be changed</span>
      </div>
      <div className="acc-form-group">
        <label className="acc-label">Email (Optional)</label>
        <input
          className="acc-input"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <button className="acc-btn-primary" onClick={handleProfileSave} disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="acc-section">
      <p className="acc-section-desc">
        Your currently active modules. Click any module to manage it.
      </p>

      {activeModules.length === 0 ? (
        <div className="acc-empty">
          <div className="acc-empty-icon">📦</div>
          <div className="acc-empty-title">No Active Subscriptions</div>
          <div className="acc-empty-sub">Start by choosing a plan that fits you only.</div>
          <button
            className="acc-btn-primary"
            style={{ marginTop: "1rem" }}
            onClick={() => navigate("/subscription")}
          >
            View Plans →
          </button>
        </div>
      ) : (
        <div className="acc-sub-list">
          {activeModules.map(key => {
            const meta = MODULE_META[key] || { label: key, color: "#6b7280", bg: "#f3f4f6", icon: "📌" };
            const sub  = subscriptions[key];
            return (
              <div key={key} className="acc-sub-card" style={{ borderLeftColor: meta.color }}>
                <div className="acc-sub-left">
                  <div className="acc-sub-icon" style={{ background: meta.bg }}>{meta.icon}</div>
                  <div>
                    <div className="acc-sub-name">{meta.label}</div>
                    <div className="acc-sub-status">
                      {sub?.status === "FREE_TRIAL" ? "🟡 Free Trial" : "🟢 Active"}
                    </div>
                  </div>
                </div>
                <button
                  className="acc-sub-manage"
                  onClick={() => navigate(`/subscription/${key}`)}
                >
                  Manage →
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="acc-divider" />
      <button
        className="acc-btn-outline"
        onClick={() => navigate("/subscription")}
      >
        + Add Another Module
      </button>
    </div>
  );

  const renderSecurity = () => (
    <div className="acc-section">
      <div className="acc-security-info">
        <div className="acc-security-icon">🔐</div>
        <div>
          <div className="acc-security-title">Change your password</div>
          <div className="acc-security-sub">Use a strong password. Minimum 6 characters.</div>
        </div>
      </div>

      <div className="acc-form-group">
        <label className="acc-label">Current Password</label>
        <input className="acc-input" type="password"
          placeholder="Enter current password"
          value={oldPass} onChange={e => setOldPass(e.target.value)} />
      </div>
      <div className="acc-form-group">
        <label className="acc-label">New Password</label>
        <input className="acc-input" type="password"
          placeholder="Enter new password"
          value={newPass} onChange={e => setNewPass(e.target.value)} />
      </div>
      <div className="acc-form-group">
        <label className="acc-label">Confirm New Password</label>
        <input className="acc-input" type="password"
          placeholder="Re-enter new password"
          value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
      </div>
      <button className="acc-btn-primary" onClick={handlePasswordChange} disabled={saving}>
        {saving ? "Updating…" : "Update Password"}
      </button>

      <div className="acc-divider" />

      {/* Danger zone */}
      <div className="acc-danger-zone">
        <div className="acc-danger-title">⚠️ Danger Zone</div>
        <p className="acc-danger-desc">
          Signing out will remove all session data from this device.
        </p>
        <button className="acc-btn-danger" onClick={handleLogout}>
          Sign Out of ManaBills
        </button>
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="acc-section">
      <div className="acc-support-grid">
        {[
          { icon: "💬", title: "WhatsApp Support",    sub: "Chat with us on WhatsApp",      action: () => window.open("https://wa.me/919550544441?text=Hi, I need help with ManaBills", "_blank") },
          { icon: "📧", title: "Email Support",       sub: "support@manabills.in",           action: () => window.open("mailto:support@manabills.in") },
          { icon: "📖", title: "User Guide",          sub: "How to use ManaBills",           action: () => {} },
          { icon: "🐛", title: "Report a Bug",        sub: "Found something broken?",        action: () => window.open("mailto:support@manabills.in?subject=Bug Report") },
        ].map(item => (
          <div key={item.title} className="acc-support-card" onClick={item.action}>
            <div className="acc-support-icon">{item.icon}</div>
            <div className="acc-support-title">{item.title}</div>
            <div className="acc-support-sub">{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="acc-divider" />
      <div className="acc-faq-title">Frequently Asked Questions</div>
      {[
        { q: "How do I create my first invoice?",       a: "Go to Business Billing → Create Invoice. Fill in customer details and products only." },
        { q: "Can I use ManaBills on multiple devices?", a: "Basic plan supports 2 devices. Pro plan supports 4 devices simultaneously." },
        { q: "How to cancel my subscription?",          a: "Contact support on WhatsApp. We will process it within 24 hours itself." },
        { q: "Is my data safe?",                        a: "Yes. All data is encrypted and stored on secure servers only. We never sell your data." },
      ].map((faq, i) => (
        <FaqItem key={i} q={faq.q} a={faq.a} />
      ))}
    </div>
  );

  const renderAbout = () => (
    <div className="acc-section">
      <div className="acc-about-logo">
        <span>Mana</span><span style={{ color: "#c9963a" }}>Bills</span>
      </div>
      <div className="acc-about-version">Version 1.0.0</div>
      <p className="acc-about-desc">
        ManaBills is Andhra Pradesh & Telangana's trusted billing and expense
        management app — built for shop owners, families, and contractors.
        All in one place only.
      </p>

      <div className="acc-about-stats">
        {[
          { value: "50K+",  label: "Invoices Created" },
          { value: "₹2Cr+", label: "Amount Tracked"   },
          { value: "4.9★",  label: "User Rating"      },
        ].map(s => (
          <div key={s.label} className="acc-about-stat">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="acc-divider" />
      <div className="acc-legal-links">
        <button className="acc-legal-btn">Privacy Policy</button>
        <button className="acc-legal-btn">Terms of Service</button>
        <button className="acc-legal-btn">Refund Policy</button>
      </div>
      <p className="acc-made-in">Made with ❤️ in Andhra Pradesh 🇮🇳</p>
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
     JSX
  ══════════════════════════════════════════ */
  return (
    <div className="acc-page">

      {/* Toast */}
      {toast && (
        <div className={`acc-toast acc-toast-${toast.type}`}>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active section */}
      <div className="acc-body">
        {RENDERERS[activeTab]?.()}
      </div>

    </div>
  );
};

/* ── FAQ accordion item ── */
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="acc-faq-item" onClick={() => setOpen(o => !o)}>
      <div className="acc-faq-q">
        <span>{q}</span>
        <span className="acc-faq-arrow" style={{ transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </div>
      {open && <div className="acc-faq-a">{a}</div>}
    </div>
  );
};

export default AccountPage;
