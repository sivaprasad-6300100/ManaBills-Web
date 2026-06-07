import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { authAxios } from "../../services/api";
import { getShopProfile, saveShopProfile } from "../../services/businessService";

/* ══════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════ */
const T = {
  navy:    "#0B1829",
  navyMid: "#162438",
  gold:    "#C8923A",
  goldLight:"#E4A94A",
  goldPale: "rgba(200,146,58,0.10)",
  goldBorder:"rgba(200,146,58,0.22)",
  blue:    "#1A4FBF",
  bluePale:"rgba(26,79,191,0.09)",
  green:   "#16803C",
  greenPale:"rgba(22,128,60,0.09)",
  red:     "#DC2626",
  redPale: "rgba(220,38,38,0.08)",
  violet:  "#7C3AED",
  violetPale:"rgba(124,58,237,0.08)",
  teal:    "#0891B2",
  tealPale:"rgba(8,145,178,0.08)",
  border:  "rgba(11,24,41,0.09)",
  borderMid:"rgba(11,24,41,0.14)",
  bg:      "#F7F8FA",
  white:   "#FFFFFF",
  text1:   "#0B1829",
  text2:   "#4B5563",
  text3:   "#94A3B8",
  radius:  "16px",
  radiusSm:"10px",
};

/* ══════════════════════════════════════════
   TABS
══════════════════════════════════════════ */
const TABS = [
  { key: "profile",       label: "My Profile",     icon: "M12 12c2.7 0 4-1.8 4-4s-1.3-4-4-4-4 1.8-4 4 1.3 4 4 4zm0 2c-4.4 0-8 2.7-8 6h16c0-3.3-3.6-6-8-6z" },
  { key: "subscriptions", label: "Subscriptions",  icon: "M9 12l2 2 4-4M7 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2h-2M9 3h6M9 3a1 1 0 000 2h6a1 1 0 000-2" },
  { key: "security",      label: "Security",       icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { key: "support",       label: "Help & Support", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
  { key: "about",         label: "About",          icon: "M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm0-14v4m0 4h.01" },
];

const MODULE_META = {
  business:       { label: "Business Billing", color: T.blue,   bg: T.bluePale,   icon: "🧾" },
  "home-expense": { label: "Home Expenses",    color: T.green,  bg: T.greenPale,  icon: "🏠" },
  construction:   { label: "Construction",     color: "#C2410C",bg: "rgba(194,65,12,0.08)", icon: "🏗️" },
  custom:         { label: "Custom Billing",   color: T.violet, bg: T.violetPale, icon: "⚙️" },
};

const SHOP_TYPES = [
  { value: "Kirana Store",    label: "🛒 Kirana Store"   },
  { value: "HardWare",        label: "🔧 Hardware"       },
  { value: "Clothing",        label: "👗 Clothing"       },
  { value: "Resturants",      label: "🍽️ Restaurants"   },
  { value: "Medical",         label: "💊 Medical"        },
  { value: "Genral Store",    label: "🏪 General Store"  },
  { value: "Gold and Silver", label: "💍 Gold & Silver"  },
  { value: "Others",          label: "📦 Others"         },
];

/* ══════════════════════════════════════════
   LEGAL PAGE CONTENT
══════════════════════════════════════════ */
const LEGAL_PAGES = {
  privacy: {
    title: "Privacy Policy",
    icon: "🔒",
    lastUpdated: "January 1, 2025",
    sections: [
      {
        heading: "Information We Collect",
        content: `We collect information you provide directly to us when you create an account, such as your name, mobile number, email address, and shop details. We also collect business information including shop name, GST number, and address that you enter into the app. Additionally, we collect usage data such as invoice records, expense entries, and billing history that you create within ManaBills.`,
      },
      {
        heading: "How We Use Your Information",
        content: `We use the information we collect to:\n• Provide, maintain, and improve our billing and expense management services\n• Generate invoices and financial reports on your behalf\n• Send you transactional notifications related to your account\n• Respond to your support queries and feedback\n• Ensure the security and integrity of our platform`,
      },
      {
        heading: "Data Storage & Security",
        content: `Your data is stored on secure, encrypted servers hosted in India. We implement industry-standard security measures including SSL/TLS encryption for data transmission and AES-256 encryption at rest. We perform regular security audits and maintain strict access controls to ensure your business data remains private and protected.`,
      },
      {
        heading: "Data Sharing",
        content: `We do not sell, trade, or rent your personal information to third parties. We may share anonymized, aggregated data for analytics purposes. We will only disclose your information when required by law or with your explicit consent.`,
      },
      {
        heading: "Data Retention",
        content: `We retain your account and business data for as long as your account is active. If you delete your account, we will permanently delete your data within 30 days, except where retention is required by law (such as GST billing records which must be retained for 7 years as per Indian tax law).`,
      },
      {
        heading: "Your Rights",
        content: `You have the right to access, correct, or delete your personal data at any time by contacting us at support@manabills.in. You may also request a copy of all data we hold about you. We will respond to all such requests within 15 business days.`,
      },
      {
        heading: "Contact Us",
        content: `If you have any questions about this Privacy Policy, please contact us at:\n📧 support@manabills.in\n💬 WhatsApp: +91 95505 44441`,
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    icon: "📋",
    lastUpdated: "January 1, 2025",
    sections: [
      {
        heading: "Acceptance of Terms",
        content: `By accessing or using ManaBills, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our application. These terms apply to all users of ManaBills, including shop owners, individuals, and businesses.`,
      },
      {
        heading: "Use of Service",
        content: `ManaBills is a billing and expense management application intended for lawful business use in India. You agree to:\n• Use the app only for legitimate business purposes\n• Provide accurate and truthful information\n• Comply with all applicable Indian laws and regulations including GST\n• Not attempt to reverse engineer, hack, or misuse the platform`,
      },
      {
        heading: "Subscription & Payments",
        content: `ManaBills offers both free and paid subscription plans. Paid plans are billed monthly or annually. All payments are processed securely through our payment partners. Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date. Prices are subject to change with 30 days advance notice.`,
      },
      {
        heading: "Intellectual Property",
        content: `All content, features, and functionality of ManaBills — including the software, design, text, and graphics — are owned by ManaBills and protected by Indian and international copyright laws. You retain ownership of all data you enter into the application.`,
      },
      {
        heading: "Limitation of Liability",
        content: `ManaBills is provided "as is" without warranty of any kind. We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability to you shall not exceed the amount you paid for the service in the last 3 months.`,
      },
      {
        heading: "Account Termination",
        content: `We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or misuse the platform. You may delete your account at any time by contacting support. Upon termination, your right to use the service ceases immediately.`,
      },
      {
        heading: "Governing Law",
        content: `These Terms shall be governed by the laws of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in Andhra Pradesh, India.`,
      },
      {
        heading: "Contact",
        content: `For questions about these Terms, contact us at:\n📧 support@manabills.in\n💬 WhatsApp: +91 95505 44441`,
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    icon: "💰",
    lastUpdated: "January 1, 2025",
    sections: [
      {
        heading: "Free Trial",
        content: `ManaBills offers a free trial period for all new users so you can evaluate the service before committing to a paid plan. We encourage you to fully explore the features during the trial period before subscribing.`,
      },
      {
        heading: "Eligibility for Refund",
        content: `We offer refunds under the following conditions:\n• Within 7 days of your initial subscription payment if you have not extensively used the service\n• In case of technical issues caused by our platform that we are unable to resolve within 72 hours\n• Duplicate charges or billing errors\n\nRefunds are not provided for:\n• Partial months of service\n• Accounts suspended for Terms of Service violations\n• Change of mind after 7 days`,
      },
      {
        heading: "Refund Process",
        content: `To request a refund:\n1. Contact us via WhatsApp at +91 95505 44441 or email support@manabills.in\n2. Provide your registered mobile number and reason for refund\n3. Our team will review your request within 2 business days\n4. Approved refunds will be processed within 5–7 business days to your original payment method`,
      },
      {
        heading: "Annual Plans",
        content: `For annual subscriptions, refunds are prorated based on the unused months if cancelled within the first 30 days. After 30 days, annual plan refunds are evaluated on a case-by-case basis. Please contact our support team to discuss your situation.`,
      },
      {
        heading: "Cancellation",
        content: `You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. You will continue to have access to paid features until the billing period ends. No further charges will be made after cancellation.`,
      },
      {
        heading: "Contact for Refunds",
        content: `For all refund requests and billing queries:\n📧 support@manabills.in\n💬 WhatsApp: +91 95505 44441\n🕐 Support hours: Mon–Sat, 9AM–8PM IST`,
      },
    ],
  },
};

/* ══════════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════════ */
const inputBase = {
  width: "100%", padding: "11px 14px",
  border: `1.5px solid ${T.border}`,
  borderRadius: T.radiusSm, fontSize: "0.875rem",
  fontWeight: 500, color: T.text1, background: "#FAFBFC",
  outline: "none", transition: "all 0.18s",
  fontFamily: "inherit", boxSizing: "border-box",
};

const FocusInput = ({ disabled, style: extra, ...props }) => {
  const [f, setF] = useState(false);
  return (
    <input
      {...props}
      disabled={disabled}
      style={{
        ...inputBase,
        ...(f && !disabled ? { borderColor: T.gold, background: T.white, boxShadow: `0 0 0 3px ${T.goldPale}` } : {}),
        ...(disabled ? { opacity: 0.5, cursor: "not-allowed", background: "#F3F4F6" } : {}),
        ...extra,
      }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    />
  );
};

const FocusSelect = ({ style: extra, ...props }) => {
  const [f, setF] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...inputBase,
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 13px center",
        paddingRight: "34px",
        cursor: "pointer",
        ...(f ? { borderColor: T.gold, background: T.white, boxShadow: `0 0 0 3px ${T.goldPale}` } : {}),
        ...extra,
      }}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
    />
  );
};

const FieldLabel = ({ children }) => (
  <label style={{ fontSize: "0.68rem", fontWeight: 700, color: T.text3,
    textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>
    {children}
  </label>
);

const Field = ({ label, hint, children, locked }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
      <FieldLabel>{label}</FieldLabel>
      {locked && (
        <span style={{ fontSize: "0.6rem", fontWeight: 700, background: "rgba(11,24,41,0.06)",
          color: T.text3, padding: "2px 8px", borderRadius: "100px", letterSpacing: "0.04em" }}>
          🔒 Locked
        </span>
      )}
    </div>
    {children}
    {hint && <span style={{ fontSize: "0.7rem", color: T.text3, lineHeight: 1.4, marginTop: 4 }}>{hint}</span>}
  </div>
);

const Card = ({ title, subtitle, icon, accent = T.navy, children, action, noPad }) => (
  <div style={{
    background: T.white, border: `1px solid ${T.border}`,
    borderRadius: T.radius, overflow: "hidden",
    boxShadow: "0 2px 12px rgba(11,24,41,0.05)", marginBottom: "1.25rem",
  }}>
    <div style={{
      padding: "1rem 1.4rem", borderBottom: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#FAFBFC",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
        <div style={{
          width: 34, height: 34, borderRadius: "9px",
          background: `${accent}14`, border: `1.5px solid ${accent}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1rem", flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: T.text1, letterSpacing: "-0.01em" }}>{title}</div>
          {subtitle && <div style={{ fontSize: "0.7rem", color: T.text3, marginTop: "1px" }}>{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
    <div style={noPad ? {} : { padding: "1.3rem 1.4rem" }}>{children}</div>
  </div>
);

const GhostBtn = ({ children, color = T.navy, bg, border, onClick, disabled, style: extra }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: "8px 18px", background: bg || `${color}0D`,
    border: `1.5px solid ${border || color + "28"}`, color,
    borderRadius: T.radiusSm, fontWeight: 700, fontSize: "0.78rem",
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
    opacity: disabled ? 0.6 : 1, ...(extra || {}),
  }}>
    {children}
  </button>
);

const SolidBtn = ({ children, color = T.navy, onClick, disabled, style: extra }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: "10px 22px", background: color, color: "#fff",
    border: "none", borderRadius: T.radiusSm, fontWeight: 700,
    fontSize: "0.86rem", cursor: "pointer", fontFamily: "inherit",
    transition: "opacity 0.15s", opacity: disabled ? 0.6 : 1, ...(extra || {}),
  }}>
    {children}
  </button>
);

const Tile = ({ icon, label, value, sub }) => (
  <div style={{
    background: T.bg, border: `1px solid ${T.border}`,
    borderRadius: T.radiusSm, padding: "11px 13px",
    display: "flex", alignItems: "flex-start", gap: "9px",
  }}>
    <div style={{
      width: 30, height: 30, borderRadius: "8px", background: "rgba(11,24,41,0.06)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.85rem", flexShrink: 0, marginTop: "1px",
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "0.63rem", fontWeight: 700, color: T.text3,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "3px" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: T.text1,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.63rem", color: T.text3, marginTop: "2px" }}>{sub}</div>}
    </div>
  </div>
);

/* ══════════════════════════════════════════
   LEGAL PAGE COMPONENT
══════════════════════════════════════════ */
const LegalPage = ({ pageKey, onBack }) => {
  const page = LEGAL_PAGES[pageKey];
  if (!page) return null;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(130deg, ${T.navy} 0%, ${T.navyMid} 100%)`,
        position: "sticky", top: 0, zIndex: 100,
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: "linear-gradient(90deg,#C8923A,#E4A94A,#F4C542,#E4A94A,#C8923A)" }} />
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "1rem 1.25rem",
          display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={onBack} style={{
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", borderRadius: T.radiusSm, padding: "7px 12px",
            fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
          }}>
            ← Back
          </button>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff",
              fontFamily: "'Georgia',serif" }}>
              {page.icon} {page.title}
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)" }}>
              Last updated: {page.lastUpdated}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "1.5rem 1.25rem" }}>
        <div style={{
          background: T.white, border: `1px solid ${T.border}`,
          borderRadius: T.radius, overflow: "hidden",
          boxShadow: "0 2px 12px rgba(11,24,41,0.05)",
        }}>
          {/* Intro strip */}
          <div style={{
            background: `linear-gradient(135deg, ${T.goldPale}, rgba(200,146,58,0.04))`,
            border: `1px solid ${T.goldBorder}`,
            borderRadius: 0,
            padding: "1rem 1.4rem",
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: "0.82rem", color: "#92400E", lineHeight: 1.6 }}>
              💡 This document governs your use of ManaBills. By using our service, you agree to the terms outlined below. If you have questions, contact <strong>support@manabills.in</strong>.
            </div>
          </div>

          {/* Sections */}
          <div style={{ padding: "1.4rem" }}>
            {page.sections.map((section, i) => (
              <div key={i} style={{
                marginBottom: i < page.sections.length - 1 ? "1.5rem" : 0,
                paddingBottom: i < page.sections.length - 1 ? "1.5rem" : 0,
                borderBottom: i < page.sections.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: T.goldPale, border: `1px solid ${T.goldBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.65rem", fontWeight: 800, color: T.gold, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, color: T.text1,
                    letterSpacing: "-0.01em" }}>
                    {section.heading}
                  </div>
                </div>
                <div style={{
                  fontSize: "0.83rem", color: T.text2, lineHeight: 1.75,
                  paddingLeft: "1.8rem", whiteSpace: "pre-line",
                }}>
                  {section.content}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: "1rem 1.4rem",
            background: T.bg,
            borderTop: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 8,
          }}>
            <span style={{ fontSize: "0.72rem", color: T.text3 }}>
              © 2025 ManaBills. All rights reserved.
            </span>
            <span style={{ fontSize: "0.72rem", color: T.text3 }}>
              Made with ❤️ in Andhra Pradesh 🇮🇳
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   MOBILE BOTTOM NAV TAB BAR
══════════════════════════════════════════ */
const MobileTabBar = ({ activeTab, setActiveTab }) => {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
  if (!isMobile) return null;
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: T.white, borderTop: `1px solid ${T.border}`,
      display: "flex", boxShadow: "0 -4px 20px rgba(11,24,41,0.08)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: "8px 4px 10px",
              border: "none", background: "transparent",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: "9px",
              background: isActive ? T.goldPale : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={isActive ? T.gold : T.text3} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon} />
              </svg>
            </div>
            <span style={{
              fontSize: "0.6rem", fontWeight: isActive ? 700 : 500,
              color: isActive ? T.gold : T.text3, letterSpacing: "0.01em",
              lineHeight: 1,
            }}>
              {tab.label.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN
══════════════════════════════════════════ */
const AccountPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, logout, accessToken } = useContext(AuthContext);
  const { subscriptions }       = useContext(SubscriptionContext);

  const [activeTab, setActiveTab] = useState(location.state?.tab || "profile");
  const [legalPage, setLegalPage] = useState(null); // "privacy" | "terms" | "refund" | null
  const [isMobile, setIsMobile]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [name,        setName]        = useState(user?.full_name     || "");
  const [mobile,      setMobile]      = useState(user?.mobile_number || "");
  const [email,       setEmail]       = useState(user?.email         || "");
  const [savingLogin, setSavingLogin] = useState(false);
  const [loginEditing,setLoginEditing]= useState(false);

  const [shop,       setShop]       = useState({ shop_name:"", owner_name:"", mobile:"", extra_mobile:"", address:"", shop_type:"", timings:"", gst_enabled:false, gst_number:"" });
  const [shopLoading,setShopLoading]= useState(true);
  const [shopSaving, setShopSaving] = useState(false);
  const [shopEditing,setShopEditing]= useState(false);
  const [shopExists, setShopExists] = useState(false);

  const [oldPass,    setOldPass]    = useState("");
  const [newPass,    setNewPass]    = useState("");
  const [confirmPass,setConfirmPass]= useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [showPw,     setShowPw]     = useState({ old:false, new:false, confirm:false });

  const [toast, setToast] = useState(null);

  const activeModules = Object.keys(subscriptions);
  const initials = name ? name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "U";

  /* ── Responsive detection ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!accessToken) {
    setShopLoading(false);
    return;
  }

    getShopProfile()
      .then(data => {
        setShop({ shop_name:data.shop_name||"", owner_name:data.owner_name||"", mobile:data.mobile||"", extra_mobile:data.extra_mobile||"", address:data.address||"", shop_type:data.shop_type||"", timings:data.timings||"", gst_enabled:data.gst_enabled||false, gst_number:data.gst_number||"" });
        setShopExists(true); setShopEditing(false);
      })
      .catch(() => { setShopExists(false); setShopEditing(true); })
      .finally(() => setShopLoading(false));
  }, [accessToken]);

  const handleLoginSave = async () => {
    if (!name.trim()) return showToast("Name cannot be empty","error");
    setSavingLogin(true);
    try {
      await authAxios.patch("auth/profile/update/", { full_name:name, email });
      login({ ...user, full_name:name, email });
      setLoginEditing(false); showToast("Login details updated ✓");
    } catch {
      login({ ...user, full_name:name, email });
      setLoginEditing(false); showToast("Profile saved ✓");
    } finally { setSavingLogin(false); }
  };

  const handleShopSave = async () => {
    if (!shop.shop_name.trim()||!shop.owner_name.trim()||!shop.mobile.trim()||!shop.address.trim())
      return showToast("Shop Name, Owner Name, Mobile & Address are required","error");
    setShopSaving(true);
    try {
      await saveShopProfile(shop);
      setShopExists(true); setShopEditing(false); showToast("Shop profile saved ✓");
    } catch { showToast("Failed to save shop profile","error"); }
    finally { setShopSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (!oldPass||!newPass) return showToast("Fill all password fields","error");
    if (newPass!==confirmPass) return showToast("New passwords don't match","error");
    if (newPass.length<6)     return showToast("Password must be at least 6 characters","error");
    setSavingPass(true);
    try {
      await authAxios.post("auth/change-password/", { old_password:oldPass, new_password:newPass });
      setOldPass(""); setNewPass(""); setConfirmPass("");
      showToast("Password changed successfully ✓");
    } catch { showToast("Current password is incorrect","error"); }
    finally { setSavingPass(false); }
  };

  const handleLogout = () => { logout(); localStorage.clear(); navigate("/",{replace:true}); };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  const pwStrength = pw => {
    if (!pw) return 0;
    let s=0;
    if (pw.length>=6) s++;
    if (pw.length>=10) s++;
    if (/[A-Z]/.test(pw)||/\d/.test(pw)) s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    return s;
  };
  const strengthColor=["#e5e7eb","#dc2626","#f59e0b","#22c55e","#15803d"];
  const strengthLabel=["","Weak","Fair","Good","Strong"];

  /* ── If a legal page is open, render it ── */
  if (legalPage) {
    return <LegalPage pageKey={legalPage} onBack={() => setLegalPage(null)} />;
  }

  /* ══════════════════════════════════════════
     TAB: MY PROFILE
  ══════════════════════════════════════════ */
  const renderProfile = () => (
    <div style={{ maxWidth: isMobile ? "100%" : 700 }}>
      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(130deg, ${T.navy} 0%, ${T.navyMid} 100%)`,
        borderRadius: T.radius, padding: isMobile ? "1.2rem 1.1rem" : "1.5rem 1.75rem",
        marginBottom: "1.25rem", position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", gap: isMobile ? "0.9rem" : "1.25rem",
        border: `1px solid rgba(255,255,255,0.06)`,
      }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
          background:"linear-gradient(90deg,#C8923A,#E4A94A,#F4C542,#E4A94A,#C8923A)" }} />
        <div style={{ position:"absolute", top:-40, right:-30, width:180, height:180,
          borderRadius:"50%", background:"radial-gradient(circle,rgba(200,146,58,0.18) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{
          width: isMobile ? 56 : 68, height: isMobile ? 56 : 68, borderRadius:"50%", flexShrink:0,
          background:"linear-gradient(135deg,#C8923A,#E4A94A)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize: isMobile ? "1.1rem" : "1.45rem", fontWeight:900, color:T.navy,
          border:"3px solid rgba(200,146,58,0.35)", position:"relative", zIndex:1,
          fontFamily:"'Georgia',serif",
        }}>
          {initials}
        </div>
        <div style={{ flex:1, minWidth:0, position:"relative", zIndex:1 }}>
          <div style={{ fontSize: isMobile ? "1rem" : "1.15rem", fontWeight:800, color:"#fff",
            fontFamily:"'Georgia',serif", marginBottom:4, letterSpacing:"-0.01em",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {name||"Your Name"}
          </div>
          <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.5)", marginBottom: isMobile ? 6 : 9 }}>
            📱 {mobile||"—"}
            {email && !isMobile && <span style={{ marginLeft:12 }}>✉️ {email}</span>}
          </div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {activeModules.length>0 ? activeModules.map(k=>{
              const m=MODULE_META[k]||{};
              return (
                <span key={k} style={{
                  fontSize:"0.58rem", fontWeight:700,
                  background:"rgba(200,146,58,0.18)", border:"1px solid rgba(200,146,58,0.32)",
                  color:"#E4A94A", padding:"2px 7px", borderRadius:"100px",
                  letterSpacing:"0.04em", textTransform:"uppercase",
                }}>
                  {m.icon} {m.label}
                </span>
              );
            }) : (
              <span style={{ fontSize:"0.58rem", fontWeight:700,
                background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)",
                color:"rgba(255,255,255,0.4)", padding:"2px 8px", borderRadius:"100px" }}>
                No active plans
              </span>
            )}
          </div>
        </div>
        {!loginEditing && (
          <button onClick={()=>setLoginEditing(true)} style={{
            background:"rgba(200,146,58,0.14)", border:"1.5px solid rgba(200,146,58,0.32)",
            color:"#E4A94A", borderRadius:T.radiusSm, padding: isMobile ? "6px 12px" : "7px 16px",
            fontSize:"0.75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            flexShrink:0, position:"relative", zIndex:1,
          }}>
            ✏️ Edit
          </button>
        )}
      </div>

      {/* ── Login Details ── */}
      <Card title="Login Details" subtitle="Account credentials & contact info" icon="👤" accent={T.blue}
        action={!loginEditing ? (
          <GhostBtn color={T.blue} onClick={()=>setLoginEditing(true)}>Edit</GhostBtn>
        ) : null}
      >
        {!loginEditing ? (
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"0.75rem" }}>
            <Tile icon="👤" label="Full Name"    value={name||"—"} />
            <Tile icon="📱" label="Mobile"       value={mobile||"—"} sub="Cannot be changed" />
            <Tile icon="✉️" label="Email"         value={email||"Not set"} />
            <Tile icon="🏪" label="Account Type" value="Shop Owner" />
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"1rem" }}>
              <Field label="Full Name *">
                <FocusInput value={name} placeholder="Your full name" onChange={e=>setName(e.target.value)} />
              </Field>
              <Field label="Mobile Number" locked hint="Mobile number cannot be changed">
                <FocusInput value={mobile} disabled />
              </Field>
              <Field label="Email Address" hint="Optional — for receipts & notifications">
                <FocusInput type="email" value={email} placeholder="your@email.com" onChange={e=>setEmail(e.target.value)} />
              </Field>
            </div>
            <div style={{ display:"flex", gap:10, paddingTop:2 }}>
              <SolidBtn onClick={handleLoginSave} disabled={savingLogin}>
                {savingLogin?"Saving…":"Save Changes"}
              </SolidBtn>
              <GhostBtn color={T.text2} onClick={()=>{ setLoginEditing(false); setName(user?.full_name||""); setEmail(user?.email||""); }}>
                Cancel
              </GhostBtn>
            </div>
          </div>
        )}
      </Card>

      {/* ── Shop Profile ── */}
      <Card title="Shop Profile" subtitle={shopExists?"Business info on every invoice":"Not set up yet"} icon="🏪" accent={T.gold}
        action={shopExists&&!shopEditing ? (
          <GhostBtn color={T.gold} onClick={()=>setShopEditing(true)}>Edit</GhostBtn>
        ) : null}
      >
        {shopLoading ? (
          <div style={{ padding:"1.2rem 0", textAlign:"center", color:T.text3 }}>Loading shop profile…</div>
        ) : !shopEditing&&shopExists ? (
          <div>
            <div style={{
              background:`linear-gradient(135deg, ${T.goldPale}, rgba(200,146,58,0.04))`,
              border:`1px solid ${T.goldBorder}`,
              borderRadius:T.radiusSm, padding:"13px 15px", marginBottom:"1rem",
              display:"flex", alignItems:"center", gap:"11px",
            }}>
              <div style={{ width:42, height:42, borderRadius:"10px",
                background:"rgba(200,146,58,0.12)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.25rem", flexShrink:0 }}>
                🏪
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"0.98rem", fontWeight:800, color:T.text1,
                  fontFamily:"'Georgia',serif", marginBottom:2 }}>
                  {shop.shop_name}
                </div>
                <div style={{ fontSize:"0.72rem", color:T.text2 }}>
                  {shop.shop_type||"General Business"}{shop.timings?` · ${shop.timings}`:""}
                </div>
              </div>
              <span style={{
                fontSize:"0.62rem", fontWeight:700, padding:"4px 10px", borderRadius:"100px",
                background: shop.gst_enabled?"rgba(22,128,60,0.1)":"rgba(107,114,128,0.1)",
                color: shop.gst_enabled?T.green:"#6b7280",
                border:`1px solid ${shop.gst_enabled?"rgba(22,128,60,0.25)":"rgba(107,114,128,0.2)"}`,
              }}>
                {shop.gst_enabled?"✓ GST":"No GST"}
              </span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"0.75rem" }}>
              <Tile icon="👤" label="Owner"        value={shop.owner_name} />
              <Tile icon="📱" label="Mobile"       value={shop.mobile} />
              <Tile icon="📞" label="Extra Mobile" value={shop.extra_mobile||"—"} />
              <Tile icon="🧾" label="GST Number"   value={shop.gst_enabled?(shop.gst_number||"Not added"):"N/A"} />
              <div style={{ gridColumn:"1/-1" }}>
                <Tile icon="📍" label="Address" value={shop.address} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {!shopExists && (
              <div style={{
                background:"rgba(200,146,58,0.08)", border:`1px solid ${T.goldBorder}`,
                borderRadius:T.radiusSm, padding:"11px 13px",
                fontSize:"0.8rem", color:"#92400E", lineHeight:1.55,
              }}>
                💡 Fill your shop details — they'll appear on every invoice automatically.
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"1rem" }}>
              <Field label="Shop Name *">
                <FocusInput value={shop.shop_name} placeholder="e.g. Reddy Hardware Store" onChange={e=>setShop(p=>({...p,shop_name:e.target.value}))} />
              </Field>
              <Field label="Owner Name *">
                <FocusInput value={shop.owner_name} placeholder="e.g. Ramesh Reddy" onChange={e=>setShop(p=>({...p,owner_name:e.target.value}))} />
              </Field>
              <Field label="Mobile *">
                <FocusInput type="tel" value={shop.mobile} placeholder="10-digit number" maxLength={10} onChange={e=>setShop(p=>({...p,mobile:e.target.value}))} />
              </Field>
              <Field label="Extra Mobile">
                <FocusInput type="tel" value={shop.extra_mobile} placeholder="Optional" maxLength={10} onChange={e=>setShop(p=>({...p,extra_mobile:e.target.value}))} />
              </Field>
              <Field label="Shop Type">
                <FocusSelect value={shop.shop_type} onChange={e=>setShop(p=>({...p,shop_type:e.target.value}))}>
                  <option value="">Select business type</option>
                  {SHOP_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </FocusSelect>
              </Field>
              <Field label="Shop Timings">
                <FocusInput value={shop.timings} placeholder="e.g. 9AM – 9PM, Mon–Sat" onChange={e=>setShop(p=>({...p,timings:e.target.value}))} />
              </Field>
              <div style={{ gridColumn:"1/-1" }}>
                <Field label="Address *">
                  <textarea
                    value={shop.address}
                    placeholder="Door No, Street, Area, City, Pincode"
                    onChange={e=>setShop(p=>({...p,address:e.target.value}))}
                    rows={2}
                    style={{ ...inputBase, resize:"vertical", minHeight:72, lineHeight:1.55 }}
                  />
                </Field>
              </div>
            </div>
            <div style={{
              background: shop.gst_enabled?"rgba(22,128,60,0.05)":"#FAFBFC",
              border:`1.5px solid ${shop.gst_enabled?"rgba(22,128,60,0.25)":T.border}`,
              borderRadius:T.radiusSm, padding:"13px 15px", transition:"all 0.2s",
            }}>
              <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", userSelect:"none" }}>
                <input type="checkbox" checked={shop.gst_enabled}
                  onChange={e=>setShop(p=>({...p,gst_enabled:e.target.checked}))}
                  style={{ width:17, height:17, accentColor:T.green, cursor:"pointer" }} />
                <div>
                  <div style={{ fontSize:"0.87rem", fontWeight:700, color:T.text1 }}>Enable GST Billing</div>
                  <div style={{ fontSize:"0.71rem", color:T.text2, marginTop:1 }}>Your GSTIN will appear on all invoices</div>
                </div>
              </label>
              {shop.gst_enabled && (
                <div style={{ marginTop:11 }}>
                  <Field label="GST Number">
                    <FocusInput value={shop.gst_number} placeholder="e.g. 37AAAAA0000A1Z5" maxLength={15}
                      onChange={e=>setShop(p=>({...p,gst_number:e.target.value.toUpperCase()}))}
                      style={{ fontFamily:"monospace", letterSpacing:"0.06em" }} />
                  </Field>
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <SolidBtn onClick={handleShopSave} disabled={shopSaving}>
                {shopSaving?"Saving…":shopExists?"Update Shop":"Save Shop Profile"}
              </SolidBtn>
              {shopExists && (
                <GhostBtn color={T.text2} onClick={()=>setShopEditing(false)}>Cancel</GhostBtn>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  /* ══════════════════════════════════════════
     TAB: SUBSCRIPTIONS
  ══════════════════════════════════════════ */
  const renderSubscriptions = () => (
    <div style={{ maxWidth: isMobile ? "100%" : 700 }}>
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(3,1fr)",
        gap: isMobile ? "0.6rem" : "0.85rem", marginBottom:"1.5rem",
      }}>
        {[
          { label:"Active Plans",  value: activeModules.length.toString(), accent:T.blue,   bg:T.bluePale,   icon:"📦" },
          { label:"Free Trials",   value: activeModules.filter(k=>subscriptions[k]?.status==="FREE_TRIAL").length.toString(), accent:T.gold, bg:T.goldPale, icon:"🎁" },
          { label:"Paid Modules",  value: activeModules.filter(k=>subscriptions[k]?.status!=="FREE_TRIAL").length.toString(), accent:T.green, bg:T.greenPale, icon:"✅" },
        ].map(s=>(
          <div key={s.label} style={{
            background:T.white, border:`1px solid ${T.border}`,
            borderRadius:T.radius, padding: isMobile ? "0.8rem 0.7rem" : "1rem 1.1rem",
            boxShadow:"0 2px 10px rgba(11,24,41,0.04)",
            display:"flex", flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "center" : "center", gap: isMobile ? "0.4rem" : "0.75rem",
            textAlign: isMobile ? "center" : "left",
          }}>
            <div style={{ width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius:"10px", background:s.bg,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize: isMobile ? "1rem" : "1.1rem", flexShrink:0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: isMobile ? "0.58rem" : "0.65rem", fontWeight:700, color:T.text3,
                textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>
                {isMobile ? s.label.split(" ")[0] : s.label}
              </div>
              <div style={{ fontSize: isMobile ? "1.3rem" : "1.5rem", fontWeight:900, color:s.accent, lineHeight:1 }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Card title="Active Plans" subtitle="Your subscribed modules" icon="📦" accent={T.blue}>
        {activeModules.length===0 ? (
          <div style={{ textAlign:"center", padding:"2rem 1rem" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📦</div>
            <div style={{ fontSize:"0.98rem", fontWeight:700, color:T.text1, marginBottom:"0.4rem" }}>No Active Subscriptions</div>
            <div style={{ fontSize:"0.83rem", color:T.text2, marginBottom:"1.25rem" }}>
              Choose a plan starting at just ₹99/month.
            </div>
            <SolidBtn onClick={()=>navigate("/subscription")}>View All Plans →</SolidBtn>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem" }}>
            {activeModules.map(key=>{
              const meta=MODULE_META[key]||{ label:key, color:T.text2, bg:"#f3f4f6", icon:"📌" };
              const sub=subscriptions[key];
              const isTrial = sub?.status==="FREE_TRIAL";
              return (
                <div key={key} style={{
                  display:"flex", alignItems:"center", gap:"11px",
                  background:T.bg, border:`1px solid ${T.border}`,
                  borderLeft:`4px solid ${meta.color}`,
                  borderRadius:T.radiusSm, padding:"13px 15px",
                }}>
                  <div style={{ width:38, height:38, borderRadius:"9px", background:meta.bg,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"1.05rem", flexShrink:0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"0.88rem", fontWeight:700, color:T.text1, marginBottom:3 }}>{meta.label}</div>
                    <span style={{
                      fontSize:"0.65rem", fontWeight:700, padding:"2px 8px", borderRadius:"100px",
                      background: isTrial?"rgba(234,179,8,0.1)":"rgba(22,128,60,0.1)",
                      color: isTrial?"#92400E":T.green,
                      border:`1px solid ${isTrial?"rgba(234,179,8,0.3)":"rgba(22,128,60,0.25)"}`,
                    }}>
                      {isTrial?"🟡 Free Trial":"🟢 Active"}
                    </span>
                  </div>
                  <GhostBtn color={meta.color} onClick={()=>navigate(`/subscription/${key}`)}>
                    Manage →
                  </GhostBtn>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <div style={{
        background:`linear-gradient(130deg,${T.navy} 0%,${T.navyMid} 100%)`,
        borderRadius:T.radius, padding: isMobile ? "1.1rem 1.2rem" : "1.4rem 1.6rem",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:"1rem", flexWrap:"wrap",
        position:"relative", overflow:"hidden",
        border:`1px solid rgba(255,255,255,0.05)`,
      }}>
        <div style={{ position:"absolute", top:-30, right:-20, width:150, height:150,
          borderRadius:"50%", background:"radial-gradient(circle,rgba(200,146,58,0.15) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize: isMobile ? "0.88rem" : "0.95rem", fontWeight:800, color:"#fff", marginBottom:4, fontFamily:"'Georgia',serif" }}>
            Unlock More Modules
          </div>
          <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.5)" }}>
            Business, Home, Construction & more
          </div>
        </div>
        <button onClick={()=>navigate("/subscription")} style={{
          background:"linear-gradient(135deg,#C8923A,#E4A94A)", color:T.navy,
          border:"none", borderRadius:T.radiusSm, padding:"10px 20px",
          fontWeight:800, fontSize:"0.82rem", cursor:"pointer", fontFamily:"inherit",
          flexShrink:0, position:"relative", zIndex:1,
        }}>
          + Add Module
        </button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════
     TAB: SECURITY
  ══════════════════════════════════════════ */
  const renderSecurity = () => (
    <div style={{ maxWidth: isMobile ? "100%" : 700 }}>
      <div style={{
        background:T.white, border:`1px solid ${T.border}`,
        borderRadius:T.radius, padding:"1.25rem 1.5rem",
        marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:"1rem",
        boxShadow:"0 2px 12px rgba(11,24,41,0.05)",
      }}>
        <div style={{ width:56, height:56, borderRadius:"50%", flexShrink:0,
          background:"rgba(22,128,60,0.1)", border:"2.5px solid rgba(22,128,60,0.3)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem" }}>
          🔐
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"0.88rem", fontWeight:800, color:T.text1, marginBottom:4 }}>Account Security</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ flex:1, height:6, background:T.bg, borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:"70%", height:"100%", background:`linear-gradient(90deg,${T.green},#22c55e)`, borderRadius:3 }} />
            </div>
            <span style={{ fontSize:"0.72rem", fontWeight:700, color:T.green }}>Good</span>
          </div>
          <div style={{ fontSize:"0.7rem", color:T.text3, marginTop:3 }}>Tip: Enable 2FA for stronger protection.</div>
        </div>
      </div>

      <Card title="Change Password" subtitle="Update your account password" icon="🔐" accent={T.violet}>
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {[
            { label:"Current Password", val:oldPass, setter:setOldPass, key:"old",     ph:"Enter current password" },
            { label:"New Password",     val:newPass, setter:setNewPass, key:"new",     ph:"Min. 6 characters"      },
            { label:"Confirm Password", val:confirmPass, setter:setConfirmPass, key:"confirm", ph:"Re-enter new password" },
          ].map(({ label, val, setter, key, ph })=>(
            <Field key={key} label={label}>
              <div style={{ position:"relative" }}>
                <FocusInput
                  type={showPw[key]?"text":"password"}
                  value={val} placeholder={ph}
                  onChange={e=>setter(e.target.value)}
                  style={{ paddingRight:44 }}
                />
                <button type="button" onClick={()=>setShowPw(p=>({...p,[key]:!p[key]}))}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                    background:"none", border:"none", cursor:"pointer", color:T.text3, fontSize:"0.85rem" }}>
                  {showPw[key]?"🙈":"👁️"}
                </button>
              </div>
              {key==="new"&&val.length>0&&(
                <div style={{ marginTop:6 }}>
                  <div style={{ display:"flex", gap:3, marginBottom:4 }}>
                    {[1,2,3,4].map(lvl=>(
                      <div key={lvl} style={{
                        flex:1, height:3, borderRadius:2,
                        background: lvl<=pwStrength(val)?strengthColor[pwStrength(val)]:"#E5E7EB",
                        transition:"background 0.3s",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize:"0.68rem", color:strengthColor[pwStrength(val)]||T.text2, fontWeight:600 }}>
                    {strengthLabel[pwStrength(val)]}
                  </span>
                </div>
              )}
              {key==="confirm"&&val.length>0&&(
                <div style={{ fontSize:"0.7rem", fontWeight:600, marginTop:4,
                  color: val===newPass?"#22c55e":T.red }}>
                  {val===newPass?"✓ Passwords match":"✗ Passwords don't match"}
                </div>
              )}
            </Field>
          ))}
          <SolidBtn color={T.violet} onClick={handlePasswordChange} disabled={savingPass} style={{ width:"fit-content" }}>
            {savingPass?"Updating…":"Update Password"}
          </SolidBtn>
        </div>
      </Card>

      <Card title="Danger Zone" subtitle="Irreversible account actions" icon="⚠️" accent={T.red}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:"0.87rem", fontWeight:700, color:T.text1, marginBottom:3 }}>Sign out of ManaBills</div>
            <div style={{ fontSize:"0.76rem", color:T.text2 }}>Removes all session data from this device.</div>
          </div>
          <button onClick={handleLogout} style={{
            padding:"9px 20px", background:T.redPale,
            border:`1.5px solid rgba(220,38,38,0.25)`, color:T.red,
            borderRadius:T.radiusSm, fontWeight:700, fontSize:"0.83rem",
            cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
          }}>
            🚪 Sign Out
          </button>
        </div>
      </Card>
    </div>
  );

  /* ══════════════════════════════════════════
     TAB: HELP & SUPPORT
  ══════════════════════════════════════════ */
  const renderSupport = () => (
    <div style={{ maxWidth: isMobile ? "100%" : 700 }}>
      <Card title="Get Help" subtitle="Reach us any time — we respond fast" icon="💬" accent={T.teal}>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"0.75rem" }}>
          {[
            { icon:"💬", title:"WhatsApp",     sub:"Chat with us instantly",   color:"#25D366",
              action:()=>window.open("https://wa.me/919550544441?text=Hi, I need help with ManaBills","_blank") },
            { icon:"📧", title:"Email Support", sub:"support@manabills.in",     color:T.blue,
              action:()=>window.open("mailto:support@manabills.in") },
            { icon:"📖", title:"User Guide",    sub:"How to use ManaBills",     color:T.gold,
              action:()=>{} },
            { icon:"🐛", title:"Report a Bug",  sub:"Found something wrong?",   color:T.red,
              action:()=>window.open("mailto:support@manabills.in?subject=Bug Report") },
          ].map(item=>(
            <div key={item.title} onClick={item.action} style={{
              background:T.bg, border:`1px solid ${T.border}`,
              borderRadius:T.radiusSm, padding:"14px 15px", cursor:"pointer",
              transition:"all 0.2s", display:"flex", gap:"11px", alignItems:"flex-start",
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.borderColor=item.color+"44";
              e.currentTarget.style.background=T.white;
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.boxShadow=`0 6px 18px ${item.color}16`;
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.borderColor=T.border;
              e.currentTarget.style.background=T.bg;
              e.currentTarget.style.transform="none";
              e.currentTarget.style.boxShadow="none";
            }}>
              <div style={{ width:36, height:36, borderRadius:"9px", background:`${item.color}14`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.05rem", flexShrink:0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize:"0.85rem", fontWeight:700, color:T.text1, marginBottom:2 }}>{item.title}</div>
                <div style={{ fontSize:"0.7rem", color:T.text2 }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Support Hours" subtitle="When we're available" icon="🕐" accent={T.gold}>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"0.75rem" }}>
          {[
            { day:"Monday – Saturday", time:"9:00 AM – 8:00 PM", status:"open" },
            { day:"Sunday",            time:"10:00 AM – 5:00 PM", status:"limited" },
          ].map(h=>(
            <div key={h.day} style={{
              background:T.bg, border:`1px solid ${T.border}`,
              borderRadius:T.radiusSm, padding:"13px 15px",
              display:"flex", alignItems:"center", gap:10,
            }}>
              <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0,
                background: h.status==="open"?T.green:"#F59E0B" }} />
              <div>
                <div style={{ fontSize:"0.8rem", fontWeight:700, color:T.text1, marginBottom:2 }}>{h.day}</div>
                <div style={{ fontSize:"0.72rem", color:T.text2 }}>{h.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:"0.75rem", padding:"11px 13px",
          background:"rgba(8,145,178,0.06)", border:`1px solid rgba(8,145,178,0.18)`,
          borderRadius:T.radiusSm, fontSize:"0.78rem", color:"#0C5B72" }}>
          💡 For urgent billing issues, WhatsApp is the fastest channel.
        </div>
      </Card>

      <Card title="Frequently Asked Questions" subtitle="Common questions answered" icon="❓" accent="#6b7280">
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
          {[
            { q:"How do I create my first invoice?",        a:"Go to Business Billing → Create Invoice. Fill in customer details and products only." },
            { q:"Can I use ManaBills on multiple devices?", a:"Basic plan supports 2 devices. Pro plan supports 4 devices simultaneously." },
            { q:"How to cancel my subscription?",           a:"Contact support on WhatsApp. We'll process it within 24 hours." },
            { q:"Is my data safe?",                         a:"Yes. All data is encrypted and stored on secure servers. We never sell your data." },
            { q:"Can I export invoices as PDF?",             a:"Yes — open any invoice and tap the Share/Download button to export as PDF." },
          ].map((faq,i)=><FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </Card>
    </div>
  );

  /* ══════════════════════════════════════════
     TAB: ABOUT
  ══════════════════════════════════════════ */
  const renderAbout = () => (
    <div style={{ maxWidth: isMobile ? "100%" : 700 }}>
      <div style={{
        background:`linear-gradient(130deg,${T.navy} 0%,${T.navyMid} 100%)`,
        borderRadius:T.radius, padding: isMobile ? "1.5rem 1.25rem" : "2rem 2rem",
        marginBottom:"1.25rem", textAlign:"center", position:"relative", overflow:"hidden",
        border:`1px solid rgba(255,255,255,0.05)`,
      }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
          background:"linear-gradient(90deg,#C8923A,#E4A94A,#F4C542,#E4A94A,#C8923A)" }} />
        <div style={{ position:"absolute", top:"-40px", left:"50%", transform:"translateX(-50%)",
          width:220, height:220, borderRadius:"50%",
          background:"radial-gradient(circle,rgba(200,146,58,0.15) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize: isMobile ? "1.8rem" : "2.2rem", fontWeight:900, color:"#fff",
            fontFamily:"'Georgia',serif", letterSpacing:"-0.02em", marginBottom:6 }}>
            Mana<span style={{ color:T.goldLight }}>Bills</span>
          </div>
          <div style={{ fontSize:"0.72rem", fontWeight:600, color:"rgba(255,255,255,0.35)",
            letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:"1.25rem" }}>
            Version 1.0.0
          </div>
          <p style={{ fontSize:"0.82rem", color:"rgba(255,255,255,0.55)", lineHeight:1.75,
            maxWidth:380, margin:"0 auto", marginBottom:"1.5rem" }}>
            Andhra Pradesh & Telangana's trusted billing and expense management app —
            built for shop owners, families, and contractors.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap: isMobile ? "0.6rem" : "0.85rem", flexWrap:"wrap" }}>
            {[
              { value:"50K+",   label:"Invoices",  color:"#93C5FD" },
              { value:"₹2Cr+",  label:"Tracked",   color:"#86EFAC" },
              { value:"4.9★",   label:"Rating",    color:T.goldLight },
            ].map(s=>(
              <div key={s.label} style={{
                background:"rgba(255,255,255,0.06)",
                border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:T.radiusSm, padding: isMobile ? "10px 16px" : "12px 20px", textAlign:"center",
                minWidth: isMobile ? 75 : 90,
              }}>
                <div style={{ fontSize: isMobile ? "1.1rem" : "1.3rem", fontWeight:900, color:s.color,
                  fontFamily:"'Georgia',serif", marginBottom:2 }}>
                  {s.value}
                </div>
                <div style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.4)", fontWeight:600,
                  textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card title="What ManaBills Offers" subtitle="Everything you get with your account" icon="✨" accent={T.gold}>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"0.75rem" }}>
          {[
            { icon:"🧾", title:"Smart Invoicing",       desc:"GST-ready, professional invoices in seconds" },
            { icon:"📊", title:"Expense Tracking",       desc:"Monitor every rupee across categories" },
            { icon:"🏗️", title:"Construction Billing",  desc:"Material and labour bill management" },
            { icon:"🏠", title:"Home Expenses",          desc:"Track household spending effortlessly" },
            { icon:"📤", title:"PDF Export",             desc:"Share invoices instantly via WhatsApp" },
            { icon:"☁️", title:"Cloud Sync",             desc:"Access your data on any device, anytime" },
          ].map(f=>(
            <div key={f.title} style={{
              background:T.bg, border:`1px solid ${T.border}`,
              borderRadius:T.radiusSm, padding:"12px 14px",
              display:"flex", gap:10, alignItems:"flex-start",
            }}>
              <div style={{ width:34, height:34, borderRadius:"8px", background:T.goldPale,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"0.95rem", flexShrink:0 }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize:"0.82rem", fontWeight:700, color:T.text1, marginBottom:2 }}>{f.title}</div>
                <div style={{ fontSize:"0.7rem", color:T.text2, lineHeight:1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>


      {/* ── The Team ── */}
      <Card title="The Team" subtitle="People behind ManaBills" icon="👥" accent={T.gold}>
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"0.75rem" }}>
          {[
            { icon:"💻", role:"Founder & Developer", name:"Siva Prasad", desc:"Architected and built ManaBills from the ground up" },
            { icon:"💼", role:"Investment & Support", name:"Saranya",     desc:"Backed the vision and made ManaBills possible" },
          ].map(p => (
            <div key={p.name} style={{
              background:`linear-gradient(135deg, ${T.goldPale}, rgba(200,146,58,0.04))`,
              border:`1.5px solid ${T.goldBorder}`,
              borderRadius:T.radiusSm, padding:"14px 15px",
              display:"flex", gap:11, alignItems:"flex-start",
            }}>
              <div style={{
                width:40, height:40, borderRadius:"50%",
                background:"linear-gradient(135deg,#C8923A,#E4A94A)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1rem", flexShrink:0,
                border:"2px solid rgba(200,146,58,0.3)",
              }}>
                {p.icon}
              </div>
              <div>
                <div style={{ fontSize:"0.62rem", fontWeight:700, color:T.gold,
                  textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:2 }}>
                  {p.role}
                </div>
                <div style={{ fontSize:"0.9rem", fontWeight:800, color:T.text1,
                  fontFamily:"'Georgia',serif", marginBottom:3 }}>
                  {p.name}
                </div>
                <div style={{ fontSize:"0.7rem", color:T.text2, lineHeight:1.5 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Legal — NOW WORKING */}
      <Card title="Legal & Info" subtitle="Tap to read full documents" icon="📄" accent="#6b7280">
        <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginBottom:"1rem" }}>
          {[
            { key:"privacy", label:"🔒 Privacy Policy",      desc:"How we collect and protect your data" },
            { key:"terms",   label:"📋 Terms of Service",     desc:"Rules governing your use of ManaBills" },
            { key:"refund",  label:"💰 Refund Policy",        desc:"Cancellation and money-back terms" },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setLegalPage(item.key)}
              style={{
                width:"100%", background:T.bg, border:`1px solid ${T.border}`,
                borderRadius:T.radiusSm, padding:"12px 14px",
                cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                transition:"all 0.18s",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.borderMid; e.currentTarget.style.background=T.white; e.currentTarget.style.transform="translateX(2px)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.bg; e.currentTarget.style.transform="none"; }}
            >
              <div>
                <div style={{ fontSize:"0.85rem", fontWeight:700, color:T.text1, marginBottom:2 }}>{item.label}</div>
                <div style={{ fontSize:"0.7rem", color:T.text2 }}>{item.desc}</div>
              </div>
              <span style={{ color:T.text3, fontSize:"0.9rem", flexShrink:0 }}>›</span>
            </button>
          ))}
        </div>
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:8,
          padding:"11px 13px", background:T.bg, border:`1px solid ${T.border}`,
          borderRadius:T.radiusSm,
        }}>
          <span style={{ fontSize:"0.78rem", color:T.text3 }}>© 2025 ManaBills. All rights reserved.</span>
          <span style={{ fontSize:"0.78rem", color:T.text3 }}>Made with ❤️ in Andhra Pradesh 🇮🇳</span>
        </div>
      </Card>
    </div>
  );

  const RENDERERS = {
    profile: renderProfile, subscriptions: renderSubscriptions,
    security: renderSecurity, support: renderSupport, about: renderAbout,
  };

  /* ══════════════════════════════════════════
     ROOT JSX
  ══════════════════════════════════════════ */
  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top:68, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, padding:"10px 22px", borderRadius:"100px",
          fontWeight:600, fontSize:"0.83rem", whiteSpace:"nowrap",
          background: toast.type==="success"?T.navy:T.red,
          color:"#fff", boxShadow:"0 6px 24px rgba(0,0,0,0.18)",
          animation:"toastIn 0.22s ease",
        }}>
          {toast.type==="success"?"✓":"✗"} {toast.msg}
        </div>
      )}

      {/* ── Mobile overlay backdrop ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position:"fixed", inset:0, background:"rgba(11,24,41,0.5)",
            zIndex:299, backdropFilter:"blur(2px)",
          }}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      {isMobile && (
        <div style={{
          position:"fixed", left:0, top:0, bottom:0, width:260,
          background:T.white, zIndex:300,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: sidebarOpen ? "4px 0 24px rgba(11,24,41,0.15)" : "none",
          display:"flex", flexDirection:"column",
        }}>
          {/* Drawer header */}
          <div style={{
            background:`linear-gradient(130deg,${T.navy} 0%,${T.navyMid} 100%)`,
            padding:"1.2rem 1rem 1rem", position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
              background:"linear-gradient(90deg,#C8923A,#E4A94A,#C8923A)" }} />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.65rem" }}>
                <div style={{
                  width:40, height:40, borderRadius:"50%",
                  background:"linear-gradient(135deg,#C8923A,#E4A94A)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"0.95rem", fontWeight:900, color:T.navy, fontFamily:"'Georgia',serif",
                  border:"2px solid rgba(200,146,58,0.3)",
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize:"0.85rem", fontWeight:700, color:"#fff",
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:130 }}>
                    {name||"Your Account"}
                  </div>
                  <div style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.45)" }}>Shop Owner</div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)",
                  color:"#fff", borderRadius:"50%", width:28, height:28, cursor:"pointer",
                  fontSize:"0.9rem", display:"flex", alignItems:"center", justifyContent:"center" }}>
                ✕
              </button>
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ padding:"0.5rem 0", flex:1, overflowY:"auto" }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  style={{
                    width:"100%", display:"flex", alignItems:"center", gap:"0.65rem",
                    padding:"0.7rem 1rem", border:"none", background:"transparent",
                    cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                    color: isActive ? T.navy : T.text2,
                    fontWeight: isActive ? 700 : 500,
                    fontSize:"0.85rem",
                    borderRight: isActive ? `3px solid ${T.gold}` : "3px solid transparent",
                    backgroundColor: isActive ? T.goldPale : "transparent",
                  }}
                >
                  <div style={{
                    width:30, height:30, borderRadius:"8px",
                    background: isActive ? T.goldPale : "rgba(11,24,41,0.04)",
                    border: isActive ? `1px solid ${T.goldBorder}` : "1px solid transparent",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke={isActive ? T.gold : T.text3} strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d={tab.icon} />
                    </svg>
                  </div>
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Drawer footer */}
          <div style={{ padding:"0.75rem", borderTop:`1px solid ${T.border}` }}>
            <button onClick={handleLogout} style={{
              width:"100%", display:"flex", alignItems:"center", gap:"0.6rem",
              padding:"0.65rem 0.75rem", border:`1px solid rgba(220,38,38,0.2)`,
              borderRadius:T.radiusSm, background:T.redPale,
              cursor:"pointer", fontFamily:"inherit",
              color:T.red, fontWeight:600, fontSize:"0.82rem",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={T.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile top header bar ── */}
      {isMobile && (
        <div style={{
          position:"sticky", top:0, zIndex:100,
          background:`linear-gradient(130deg,${T.navy} 0%,${T.navyMid} 100%)`,
          borderBottom:`1px solid rgba(255,255,255,0.06)`,
        }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
            background:"linear-gradient(90deg,#C8923A,#E4A94A,#F4C542,#E4A94A,#C8923A)" }} />
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"0.9rem 1rem",
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)",
                color:"#fff", borderRadius:T.radiusSm, padding:"7px 10px",
                cursor:"pointer", display:"flex", alignItems:"center", gap:6,
                fontSize:"0.78rem", fontWeight:700, fontFamily:"inherit" }}>
              <span style={{ fontSize:"1rem" }}>☰</span>
              <span>{TABS.find(t=>t.key===activeTab)?.label}</span>
            </button>
            <div style={{ fontSize:"1rem", fontWeight:900, color:"#fff",
              fontFamily:"'Georgia',serif", letterSpacing:"-0.01em" }}>
              Mana<span style={{ color:T.goldLight }}>Bills</span>
            </div>
            <div style={{
              width:36, height:36, borderRadius:"50%",
              background:"linear-gradient(135deg,#C8923A,#E4A94A)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"0.8rem", fontWeight:900, color:T.navy,
              border:"2px solid rgba(200,146,58,0.3)", fontFamily:"'Georgia',serif",
            }}>
              {initials}
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop: Sidebar + Content layout ── */}
      {!isMobile ? (
        <div style={{ display:"flex", maxWidth:1100, margin:"0 auto", padding:"1.5rem 1.25rem", gap:"1.25rem" }}>
          {/* Desktop Sidebar */}
          <aside style={{ width:220, flexShrink:0, position:"sticky", top:80, alignSelf:"flex-start" }}>
            <div style={{
              background:T.white, border:`1px solid ${T.border}`,
              borderRadius:T.radius, overflow:"hidden",
              boxShadow:"0 2px 12px rgba(11,24,41,0.05)",
            }}>
              <div style={{
                padding:"1rem 1.1rem",
                background:`linear-gradient(130deg,${T.navy} 0%,${T.navyMid} 100%)`,
                position:"relative", overflow:"hidden",
              }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
                  background:"linear-gradient(90deg,#C8923A,#E4A94A,#C8923A)" }} />
                <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", position:"relative", zIndex:1 }}>
                  <div style={{
                    width:38, height:38, borderRadius:"50%",
                    background:"linear-gradient(135deg,#C8923A,#E4A94A)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"0.9rem", fontWeight:900, color:T.navy, fontFamily:"'Georgia',serif",
                    border:"2px solid rgba(200,146,58,0.3)",
                  }}>
                    {initials}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#fff",
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {name||"Your Account"}
                    </div>
                    <div style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.45)" }}>Shop Owner</div>
                  </div>
                </div>
              </div>
              <nav style={{ padding:"0.5rem 0" }}>
                {TABS.map(tab => {
                  const isActive = activeTab===tab.key;
                  return (
                    <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
                      width:"100%", display:"flex", alignItems:"center", gap:"0.65rem",
                      padding:"0.65rem 1rem", border:"none", background:"transparent",
                      cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                      color: isActive?T.navy:T.text2, fontWeight: isActive?700:500,
                      fontSize:"0.82rem",
                      borderRight: isActive?`3px solid ${T.gold}`:"3px solid transparent",
                      backgroundColor: isActive?T.goldPale:"transparent",
                      transition:"all 0.15s",
                    }}
                    onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.backgroundColor="rgba(11,24,41,0.04)"; e.currentTarget.style.color=T.text1; } }}
                    onMouseLeave={e=>{ if(!isActive){ e.currentTarget.style.backgroundColor="transparent"; e.currentTarget.style.color=T.text2; } }}>
                      <div style={{
                        width:28, height:28, borderRadius:"7px",
                        background: isActive?T.goldPale:"rgba(11,24,41,0.04)",
                        border: isActive?`1px solid ${T.goldBorder}`:"1px solid transparent",
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke={isActive?T.gold:T.text3} strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round">
                          <path d={tab.icon} />
                        </svg>
                      </div>
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
              <div style={{ padding:"0.75rem 0.85rem", borderTop:`1px solid ${T.border}` }}>
                <button onClick={handleLogout} style={{
                  width:"100%", display:"flex", alignItems:"center", gap:"0.6rem",
                  padding:"0.6rem 0.75rem", border:`1px solid rgba(220,38,38,0.2)`,
                  borderRadius:T.radiusSm, background:T.redPale,
                  cursor:"pointer", fontFamily:"inherit",
                  color:T.red, fontWeight:600, fontSize:"0.78rem", transition:"all 0.15s",
                }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(220,38,38,0.13)"}
                onMouseLeave={e=>e.currentTarget.style.background=T.redPale}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={T.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Desktop main content */}
          <main style={{ flex:1, minWidth:0 }}>
            <div style={{ marginBottom:"1.25rem" }}>
              <h1 style={{ fontSize:"1.35rem", fontWeight:900, color:T.text1,
                fontFamily:"'Georgia',serif", letterSpacing:"-0.02em", margin:0, marginBottom:3 }}>
                {TABS.find(t=>t.key===activeTab)?.label}
              </h1>
              <div style={{ width:36, height:3, background:`linear-gradient(90deg,${T.gold},${T.goldLight})`, borderRadius:2 }} />
            </div>
            {RENDERERS[activeTab]?.()}
          </main>
        </div>
      ) : (
        /* ── Mobile: scrollable content with bottom nav ── */
        <div style={{ padding:"1rem 1rem", paddingBottom:"90px" }}>
          {RENDERERS[activeTab]?.()}
        </div>
      )}

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <div style={{
          position:"fixed", bottom:0, left:0, right:0, zIndex:200,
          background:T.white, borderTop:`1px solid ${T.border}`,
          display:"flex", boxShadow:"0 -4px 20px rgba(11,24,41,0.08)",
          paddingBottom:"env(safe-area-inset-bottom, 0px)",
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                flex:1, padding:"8px 4px 10px",
                border:"none", background:"transparent",
                cursor:"pointer", fontFamily:"inherit",
                display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              }}>
                <div style={{
                  width:32, height:32, borderRadius:"9px",
                  background: isActive ? T.goldPale : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all 0.15s",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke={isActive ? T.gold : T.text3} strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d={tab.icon} />
                  </svg>
                </div>
                <span style={{
                  fontSize:"0.58rem", fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.gold : T.text3, letterSpacing:"0.01em", lineHeight:1,
                }}>
                  {tab.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(-8px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

/* ── FAQ Item ── */
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={()=>setOpen(o=>!o)} style={{
      background: T.bg, border:`1px solid ${T.border}`,
      borderRadius: T.radiusSm, padding:"11px 13px",
      cursor:"pointer", transition:"all 0.18s",
    }}
    onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.borderMid; e.currentTarget.style.background=T.white; }}
    onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.bg; }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:"0.84rem", fontWeight:600, color:T.text1 }}>{q}</span>
        <span style={{ transition:"transform 0.2s", flexShrink:0, color:T.text3, fontSize:"0.75rem",
          transform: open?"rotate(180deg)":"none" }}>▾</span>
      </div>
      {open && (
        <div style={{ fontSize:"0.8rem", color:T.text2, lineHeight:1.65,
          marginTop:9, paddingTop:9, borderTop:`1px solid ${T.border}` }}>
          {a}
        </div>
      )}
    </div>
  );
};

export default AccountPage;
