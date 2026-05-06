import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { BusinessStatsContext } from "../../context/BusinessStatsContext";
import SummaryCard from "../../components/cards/SummaryCard";
import UpgradeCard from "../../components/cards/UpgradeCard";

/* ── Module config ── */
const MODULES = [
  {
    key:         "business",
    title:       "Business Billing",
    value:       "₹1,25,000",
    subtitle:    "Total Billing This Month",
    icon:        "🧾",
    route:       "/dashboard/business",
    actionRoute: "/dashboard/business/create-invoice",
    actionLabel: "Create Invoice",
    color:       "blue",
    desc:        "Create and send GST invoices in under 30 seconds",
    trend:       "+12%",
    trendUp:     true,
    price:       "₹199/mo",
    accent:      "#1e4fba",
    accentBg:    "rgba(30,79,186,0.10)",
    tag:         "Most Popular",
  },
  {
    key:         "home-expense",
    title:       "Home Expenses",
    value:       "₹45,000",
    subtitle:    "Total Expenses This Month",
    icon:        "🏠",
    route:       "/dashboard/home-expense",
    actionRoute: "/dashboard/home-expense/add-expense",
    actionLabel: "Add Expense",
    color:       "green",
    desc:        "Add and track your daily household expenses",
    trend:       "-5%",
    trendUp:     false,
    price:       "₹99/mo",
    accent:      "#15803d",
    accentBg:    "rgba(21,128,61,0.10)",
    tag:         "Family Plan",
  },
  {
    key:         "construction",
    title:       "Construction",
    value:       "₹8,90,000",
    subtitle:    "Total Project Cost",
    icon:        "🏗️",
    route:       "/dashboard/construction",
    actionRoute: "/dashboard/construction",
    actionLabel: "View Projects",
    color:       "orange",
    desc:        "Manage construction projects, labour and materials",
    trend:       "+28%",
    trendUp:     true,
    price:       "₹699/mo",
    accent:      "#c2410c",
    accentBg:    "rgba(194,65,12,0.10)",
    tag:         "Pro",
  },
  {
    key:         "custom",
    title:       "Customized Billing",
    value:       "Active",
    subtitle:    "Custom Estimations Enabled",
    icon:        "⚙️",
    route:       "/dashboard/custom",
    actionRoute: "/dashboard/custom/create-estimate",
    actionLabel: "Create Estimate",
    color:       "purple",
    desc:        "Create custom estimates and billing formats",
    trend:       "Live",
    trendUp:     true,
    price:       "₹199/mo",
    accent:      "#6d28d9",
    accentBg:    "rgba(109,40,217,0.10)",
    tag:         "Flexible",
  },
];

/* ── Business quick actions ── */
const QUICK_ACTIONS = [
  { icon: "📄", label: "New Invoice",  route: "/dashboard/business/create-invoice", color: "#1e4fba" },
  { icon: "👤", label: "Customers",    route: "/dashboard/business/customers",      color: "#0891b2" },
  { icon: "📦", label: "Stock Entry",  route: "/dashboard/business/products",       color: "#15803d" },
  { icon: "📊", label: "GST Reports",  route: "/dashboard/business/gst",            color: "#c9963a" },
  { icon: "🧾", label: "Invoices",     route: "/dashboard/business/invoices",       color: "#6d28d9" },
  { icon: "🏪", label: "Shop Profile", route: "/dashboard/business/shop-profile",   color: "#c2410c" },
];

/* ── Helper: get display name — never show mobile number ── */
const getDisplayName = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.full_name && user.full_name.trim().length > 0) {
      return user.full_name.trim().split(" ")[0];
    }
    return "there";
  } catch {
    return "there";
  }
};

/* ── Animated counter hook ── */
const useCounter = (target, duration = 1400, active = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return count;
};

/* ═══════════════════════════════════════════
   PRE-SUBSCRIPTION HERO SECTION  (File 1)
═══════════════════════════════════════════ */
const PreSubscriptionView = ({ greet, displayName, navigate }) => {
  const [visible, setVisible] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const invoicesCount = useCounter(50000, 1600, visible);
  const revenueCount  = useCounter(2, 1200, visible);
  const ratingCount   = useCounter(49, 1000, visible);

  const TRUST_STATS = [
    { value: invoicesCount, suffix: "K+",  label: "Invoices Created", icon: "🧾", color: "#1e4fba" },
    { value: revenueCount,  suffix: "Cr+", prefix: "₹", label: "Amount Tracked", icon: "💰", color: "#15803d" },
    { value: ratingCount === 49 ? "4.9" : (ratingCount / 10).toFixed(1), suffix: "★", label: "App Rating", icon: "⭐", color: "#c9963a" },
  ];

  const BENEFITS = [
    "GST-compliant invoices in 30 seconds",
    "Auto stock deduction on every sale",
    "Family expense tracker built-in",
    "Construction project cost manager",
    "WhatsApp invoice sharing",
    "Cloud backup — never lose data",
  ];

  return (
    <>
      <style>{`
        @keyframes presub-fadeup {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes presub-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes presub-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes presub-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .presub-hero-wrap      { animation: presub-fadeup 0.55s ease both; }
        .presub-stat-card      { animation: presub-fadeup 0.55s ease both; }
        .presub-stat-card:nth-child(1) { animation-delay: 0.1s; }
        .presub-stat-card:nth-child(2) { animation-delay: 0.2s; }
        .presub-stat-card:nth-child(3) { animation-delay: 0.3s; }
        .presub-upgrade-wrap   { animation: presub-fadeup 0.55s ease 0.35s both; }
        .presub-modules-wrap   { animation: presub-fadeup 0.55s ease 0.45s both; }
        .presub-module-card    { transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
        .presub-module-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(14,27,46,0.14); }
        .presub-cta-btn        { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .presub-cta-btn:hover  { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(201,150,58,0.42); }
        .presub-viewplans-btn  { transition: all 0.2s ease; }
        .presub-viewplans-btn:hover { background: rgba(255,255,255,0.15) !important; }
        .presub-float-chip     { animation: presub-float 3.2s ease-in-out infinite; }
        .presub-float-chip:nth-child(2) { animation-delay: 1.1s; }
        .presub-float-chip:nth-child(3) { animation-delay: 2.0s; }
      `}</style>

      {/* ── 1. HERO BANNER ── */}
      <div
        ref={heroRef}
        className="presub-hero-wrap"
        style={{
          background: "linear-gradient(135deg, #0e1b2e 0%, #1a2d47 55%, #0e1b2e 100%)",
          borderRadius: "24px",
          padding: "2.25rem 2rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(14,27,46,0.28)",
          marginBottom: "1.1rem",
        }}
      >
        {/* Decorative glow blobs */}
        <div style={{ position: "absolute", top: "-40px", right: "-30px", width: "220px", height: "220px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,150,58,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-50px", left: "10%", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle, rgba(30,79,186,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Gold top stripe */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #c9963a, #e8a020, #f4c542, #e8a020, #c9963a)", borderRadius: "24px 24px 0 0" }} />

        {/* Floating chips */}
        <div style={{ position: "absolute", top: "14px", right: "18px", display: "flex", gap: "8px" }}>
          {["GST Ready", "Cloud Backup", "Offline Works"].map((chip, i) => (
            <div
              key={chip}
              className="presub-float-chip"
              style={{
                animationDelay: `${i * 1.1}s`,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.62rem", fontWeight: 600,
                padding: "0.22rem 0.7rem", borderRadius: "100px",
                backdropFilter: "blur(6px)",
                display: window.innerWidth < 520 ? "none" : "block",
              }}
            >
              ✦ {chip}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(201,150,58,0.14)", border: "1px solid rgba(201,150,58,0.30)", color: "#e8a020", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.22rem 0.8rem", borderRadius: "100px", marginBottom: "1rem" }}>
            <span style={{ width: 6, height: 6, background: "#c9963a", borderRadius: "50%", animation: "presub-pulse-ring 1.8s ease-out infinite" }} />
            AP & Telangana's #1 Billing App
          </div>

          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.4rem, 3.5vw, 1.85rem)", fontWeight: 800, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.025em", marginBottom: "0.65rem" }}>
            {greet}, {displayName} 👋
            <br />
            <span style={{ background: "linear-gradient(135deg, #c9963a 0%, #f4c542 50%, #c9963a 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "presub-shimmer 3s linear infinite" }}>
              Welcome to ManaBills
            </span>
          </h2>

          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.62)", lineHeight: 1.65, maxWidth: "480px", marginBottom: "1.5rem" }}>
            Manage billing, home expenses and construction projects — all in one place only.
            Start with a free trial. No credit card needed.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button className="presub-cta-btn" onClick={() => navigate("/subscription")} style={{ background: "linear-gradient(135deg, #c9963a 0%, #e8a020 100%)", color: "#0e1b2e", border: "none", padding: "0.78rem 1.75rem", borderRadius: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.92rem", fontWeight: 800, cursor: "pointer", letterSpacing: "0.01em", boxShadow: "0 6px 22px rgba(201,150,58,0.38)" }}>
              🚀 Start Free Trial
            </button>
            <button className="presub-viewplans-btn" onClick={() => navigate("/subscription")} style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(255,255,255,0.15)", padding: "0.78rem 1.5rem", borderRadius: "12px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.92rem", fontWeight: 600, cursor: "pointer" }}>
              View Plans →
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. TRUST STATS ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.1rem" }}>
        {TRUST_STATS.map((s, i) => (
          <div key={i} className="presub-stat-card" style={{ background: "#fff", border: "1.5px solid rgba(14,27,46,0.08)", borderRadius: "18px", padding: "1.1rem 1rem", textAlign: "center", boxShadow: "0 4px 16px rgba(14,27,46,0.06)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: "2.5px", background: s.color, borderRadius: "0 0 4px 4px", opacity: 0.7 }} />
            <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>{s.icon}</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {s.prefix || ""}{s.value}{s.suffix}
            </div>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#6b7280", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. PREMIUM UPGRADE CTA CARD ── */}
      <div className="presub-upgrade-wrap" style={{ background: "#fff", border: "1.5px solid rgba(201,150,58,0.22)", borderRadius: "22px", overflow: "hidden", boxShadow: "0 8px 32px rgba(14,27,46,0.08)", marginBottom: "1.25rem" }}>
        <div style={{ height: "4px", background: "linear-gradient(90deg, #1e4fba 0%, #c9963a 50%, #15803d 100%)" }} />
        <div style={{ padding: "1.5rem 1.5rem 1.4rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* Left */}
          <div style={{ flex: 1, minWidth: "220px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(201,150,58,0.1)", border: "1px solid rgba(201,150,58,0.25)", color: "#c9963a", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.2rem 0.7rem", borderRadius: "100px", marginBottom: "0.7rem" }}>
              ✦ No Active Subscription
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.15rem", fontWeight: 800, color: "#0e1b2e", letterSpacing: "-0.02em", marginBottom: "0.45rem" }}>
              Unlock Your Business Power
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.65, marginBottom: "1rem", maxWidth: "360px" }}>
              Starting at just <strong style={{ color: "#c9963a" }}>₹99/month</strong> — choose any module and get full access with a free trial.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.4rem 1rem" }}>
              {BENEFITS.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#374151", fontWeight: 500 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(21,128,61,0.12)", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, flexShrink: 0 }}>✓</span>
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Right — price card */}
          <div style={{ background: "linear-gradient(145deg, #0e1b2e 0%, #1a2d47 100%)", borderRadius: "16px", padding: "1.25rem 1.4rem", minWidth: "160px", textAlign: "center", boxShadow: "0 8px 24px rgba(14,27,46,0.22)", flexShrink: 0, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-20px", right: "-20px", width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,150,58,0.2) 0%, transparent 70%)" }} />
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>Plans starting at</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2rem", fontWeight: 900, color: "#c9963a", lineHeight: 1, letterSpacing: "-0.02em" }}>₹99</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", marginBottom: "1rem" }}>per month only</div>
            <button onClick={() => navigate("/subscription")} style={{ display: "block", width: "100%", background: "linear-gradient(135deg, #c9963a, #e8a020)", color: "#0e1b2e", border: "none", padding: "0.65rem 1rem", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(201,150,58,0.35)", transition: "all 0.2s" }}>
              Choose a Plan →
            </button>
            <p style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.28)", marginTop: "0.5rem" }}>Free trial · Cancel anytime</p>
          </div>
        </div>
      </div>

      {/* ── 4. MODULE PREVIEW CARDS ── */}
      <div className="presub-modules-wrap">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1rem", fontWeight: 800, color: "#0e1b2e", letterSpacing: "-0.01em" }}>Available Modules</div>
          <button onClick={() => navigate("/subscription")} style={{ background: "none", border: "none", fontSize: "0.78rem", fontWeight: 700, color: "#c9963a", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>View All Plans →</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "rgba(14,27,46,0.08)", border: "1.5px solid rgba(14,27,46,0.08)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 16px rgba(14,27,46,0.06)" }}>
          {MODULES.map((m) => (
            <div key={m.key} className="presub-module-card" onClick={() => navigate("/subscription")} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "#fff", cursor: "pointer", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: "3px", background: m.accent, borderRadius: "0 3px 3px 0", opacity: 0.7 }} />
              <div style={{ width: 44, height: 44, borderRadius: "12px", background: m.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>{m.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.15rem" }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.9rem", fontWeight: 800, color: "#0e1b2e" }}>{m.title}</span>
                  <span style={{ fontSize: "0.58rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: m.accentBg, color: m.accent, padding: "0.12rem 0.5rem", borderRadius: "100px", border: `1px solid ${m.accent}30` }}>{m.tag}</span>
                </div>
                <p style={{ fontSize: "0.77rem", color: "#6b7280", margin: 0, lineHeight: 1.4 }}>{m.desc}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "0.92rem", fontWeight: 800, color: m.accent }}>{m.price}</div>
                <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "2px" }}>Free trial →</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "1rem", padding: "0.75rem", background: "rgba(201,150,58,0.06)", border: "1px dashed rgba(201,150,58,0.28)", borderRadius: "12px" }}>
          <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500 }}>
            🔒 All modules include <strong style={{ color: "#0e1b2e" }}>free trial</strong> · No credit card required · <strong style={{ color: "#0e1b2e" }}>Cancel anytime</strong>
          </span>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════
   MAIN DASHBOARD HOME
═══════════════════════════════════════════ */
const DashboardHome = () => {
  const navigate = useNavigate();
  const { subscriptions: subData } = useContext(SubscriptionContext);
  const { stats: businessStats, loading: statsLoading } = useContext(BusinessStatsContext);
  const subscriptions  = Object.keys(subData);
  const hasAny         = subscriptions.length > 0;
  const hasBusiness    = subscriptions.includes("business");

  const displayName  = getDisplayName();
  const hour         = new Date().getHours();
  const greet        = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetEmoji   = hour < 12 ? "☀️" : hour < 17 ? "👋" : "🌙";
  const today        = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  // Format currency
  const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

  // Use real business stats from API, fallback to defaults
  const dailyInvoices   = businessStats?.today_invoice_count || 0;
  const monthlyInvoices = businessStats?.month_invoice_count || 0;
  const monthlyBilling  = fmt(businessStats?.month_billing || 0);
  const pendingAmount   = fmt(businessStats?.unpaid_amount || 0);
  const paidAmount      = fmt(businessStats?.paid_amount || 0);

  // Update business module with real stats
  const getBusinessModule = () => {
    const base = MODULES.find((m) => m.key === "business") || {};
    return {
      ...base,
      value: monthlyBilling,
      subtitle: "Total Billing This Month",
    };
  };

  const activeModules = MODULES.filter((m) => subscriptions.includes(m.key)).map((m) =>
    m.key === "business" ? getBusinessModule() : m
  );

  return (
    <div className="db-home">

      {/* ══════════════════════════════
          NO SUBSCRIPTION  (File 1 UI)
      ══════════════════════════════ */}
      {!hasAny && (
        <PreSubscriptionView
          greet={greet}
          displayName={displayName}
          navigate={navigate}
        />
      )}

      {/* ══════════════════════════════
          ACTIVE SUBSCRIPTION  (File 2 UI)
      ══════════════════════════════ */}
      {hasAny && (
        <>
          {/* ── GREETING BANNER ── */}
          <div className="db-greeting-banner">
            <div className="db-greeting-left">
              <div className="db-greeting-date">{today}</div>
              <h2 className="db-greeting-h2">
                {greet}, <span className="db-greeting-name">{displayName}</span> {greetEmoji}
              </h2>
              <p className="db-greeting-sub">Here's your business overview for today.</p>
            </div>
            {hasBusiness && (
              <button className="db-greeting-cta" onClick={() => navigate("/dashboard/business/create-invoice")}>
                + New Invoice
              </button>
            )}
          </div>

          {/* ── KPI CARDS ── */}
          {hasBusiness && (
            <div>
            <div className="db-kpi-grid">
              {[
                { label: "Today",      value: dailyInvoices,   sub: "Invoices Created", accent: "#1e4fba", icon: "📄" },
                { label: "This Month", value: monthlyInvoices, sub: "Invoices Created", accent: "#15803d", icon: "📅" },
                { label: "Pending",    value: pendingAmount,   sub: "Awaiting Payment", accent: "#c2410c", icon: "⏳" },
                { label: "Collected",  value: paidAmount,      sub: "This Month",       accent: "#c9963a", icon: "💰" },
              ].map((kpi) => (
                <div key={kpi.label} className="db-kpi-card" style={{ "--kpi-accent": kpi.accent }}>
                  <div className="db-kpi-top">
                    <span className="db-kpi-icon">{kpi.icon}</span>
                    <span className="db-kpi-label">{kpi.label}</span>
                  </div>
                  <div className="db-kpi-value">{statsLoading && kpi.label !== "Today" && kpi.label !== "This Month" ? "..." : kpi.value}</div>
                  <div className="db-kpi-sub">{kpi.sub}</div>
                  <div className="db-kpi-bar" />
                </div>
              ))}
            </div>
                <button className="db-section-link" onClick={() => navigate("/dashboard/business")}>OverView →→</button>
          </div>
          )}

          {/* ── QUICK ACTIONS ── */}
          {hasBusiness && (
            <>
              <div className="db-section-row">
                <div className="db-section-title">Quick Actions</div>
              </div>
              <div className="db-quick-grid">
                {QUICK_ACTIONS.map((qa) => (
                  <button key={qa.label} className="db-quick-btn" style={{ "--qa-color": qa.color }} onClick={() => navigate(qa.route)}>
                    <span className="db-quick-icon">{qa.icon}</span>
                    <span className="db-quick-label">{qa.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── ACTIVE MODULE CARDS ── */}
          <div className="db-section-row">
            <div className="db-section-title">My Modules</div>
            {/* <button className="db-section-link" onClick={() => navigate("/subscription")}>+ Add Module →</button> */}
          </div>
          <div className="db-module-grid">
            {activeModules.map((m) => (
              <div
                key={m.key}
                className="db-module-card"
                style={{ "--mc-color": m.accent, "--mc-bg": m.accentBg }}
                onClick={() => navigate(m.route)}
              >
                <div className="db-mc-header">
                  <div className="db-mc-icon">{m.icon}</div>
                  <div className="db-mc-trend" style={{ color: m.trendUp ? "#15803d" : "#dc2626", background: m.trendUp ? "rgba(21,128,61,0.1)" : "rgba(220,38,38,0.1)" }}>
                    {m.trendUp ? "↑" : "↓"} {m.trend}
                  </div>
                </div>
                <div className="db-mc-value">{m.value}</div>
                <div className="db-mc-subtitle">{m.subtitle}</div>
                <div className="db-mc-title">{m.title}</div>
                <div className="db-mc-footer">
                  <span className="db-mc-action-link" onClick={(e) => { e.stopPropagation(); navigate(m.actionRoute); }}>
                    {m.actionLabel} →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── RECENT ACTIVITY ── */}
          <div className="db-section-row" style={{ marginTop: "0.5rem" }}>
            <div className="db-section-title">Recent Activity</div>
            {hasBusiness && (
              <button className="db-section-link" onClick={() => navigate("/dashboard/business/invoices")}>View All →</button>
            )}
          </div>
          <div className="db-activity-card">
            {hasBusiness ? (
              <div className="db-activity-empty">
                <span>📋</span>
                <p>Your recent invoices will appear here.</p>
                <button onClick={() => navigate("/dashboard/business/create-invoice")}>Create your first invoice →</button>
              </div>
            ) : (
              <div className="db-activity-empty">
                <span>📊</span>
                <p>Activity from your active modules will appear here.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════
          SHARED CSS  (post-subscription)
      ══════════════════════════════ */}
      <style>{`
        .db-home {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          min-height: 100%;
          animation: dbHomeUp 0.4s ease both;
        }
        @keyframes dbHomeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Greeting Banner ── */
        .db-greeting-banner {
          background: linear-gradient(135deg, #0e1b2e 0%, #1a2d47 100%);
          border-radius: 20px;
          padding: 1.5rem 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(14,27,46,0.22);
        }
        .db-greeting-banner::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(201,150,58,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .db-greeting-date {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255,255,255,0.45);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.35rem;
        }
        .db-greeting-h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.45rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
          margin-bottom: 0.3rem;
        }
        .db-greeting-name { color: #c9963a; }
        .db-greeting-sub {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
        }
        .db-greeting-cta {
          background: linear-gradient(135deg, #c9963a, #e8a020);
          color: #0e1b2e;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(201,150,58,0.35);
          transition: all 0.2s;
          position: relative; z-index: 1;
        }
        .db-greeting-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,150,58,0.45); }

        /* ── KPI Cards ── */
        .db-kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.85rem;
        }
        .db-kpi-card {
          background: #fff;
          border-radius: 16px;
          padding: 1.1rem 1.15rem;
          border: 1px solid rgba(14,27,46,0.07);
          box-shadow: 0 2px 12px rgba(14,27,46,0.05);
          position: relative;
          overflow: hidden;
          transition: all 0.2s;
        }
        .db-kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(14,27,46,0.10); }
        .db-kpi-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.55rem;
        }
        .db-kpi-icon { font-size: 1rem; }
        .db-kpi-label {
          font-size: 0.62rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #6b7280;
        }
        .db-kpi-value {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.75rem;
          font-weight: 900;
          color: #0e1b2e;
          line-height: 1;
          margin-bottom: 0.25rem;
        }
        .db-kpi-sub {
          font-size: 0.7rem;
          color: #9ca3af;
          font-weight: 500;
        }
        .db-kpi-bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: var(--kpi-accent);
          opacity: 0.7;
          border-radius: 0 0 16px 16px;
        }

        /* ── Quick Actions ── */
        .db-quick-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.65rem;
        }
        .db-quick-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.9rem 0.5rem;
          background: #fff;
          border: 1.5px solid rgba(14,27,46,0.07);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.18s;
          box-shadow: 0 2px 8px rgba(14,27,46,0.04);
        }
        .db-quick-btn:hover {
          border-color: var(--qa-color);
          background: color-mix(in srgb, var(--qa-color) 6%, #fff);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(14,27,46,0.09);
        }
        .db-quick-icon { font-size: 1.3rem; }
        .db-quick-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #374151;
          text-align: center;
          line-height: 1.3;
        }

        /* ── Section Row ── */
        .db-section-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .db-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1rem;
          font-weight: 800;
          color: #0e1b2e;
          letter-spacing: -0.01em;
        }
        .db-section-link {
          font-size: 1rem;
          font-weight: 800;
          padding-left:850px;
          margin-top:10px;
          color: #c9963a;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.18s;
        }
        .db-section-link:hover { opacity: 0.7; }

        /* ── Active Module Cards ── */
        .db-module-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .db-module-card {
          background: #fff;
          border: 1px solid rgba(14,27,46,0.07);
          border-radius: 18px;
          padding: 1.25rem 1.35rem;
          cursor: pointer;
          transition: all 0.22s;
          box-shadow: 0 2px 12px rgba(14,27,46,0.05);
          position: relative;
          overflow: hidden;
        }
        .db-module-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 4px;
          background: var(--mc-color);
          border-radius: 18px 0 0 18px;
        }
        .db-module-card:hover {
          transform: translateX(3px);
          box-shadow: 0 6px 24px rgba(14,27,46,0.10);
          border-color: color-mix(in srgb, var(--mc-color) 30%, transparent);
        }
        .db-mc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .db-mc-icon { font-size: 1.4rem; }
        .db-mc-trend {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.18rem 0.55rem;
          border-radius: 100px;
        }
        .db-mc-value {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 900;
          color: #0e1b2e;
          line-height: 1;
          margin-bottom: 0.2rem;
        }
        .db-mc-subtitle {
          font-size: 0.72rem;
          color: #9ca3af;
          margin-bottom: 0.5rem;
        }
        .db-mc-title {
          font-size: 0.78rem;
          font-weight: 800;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 0.65rem;
        }
        .db-mc-footer {
          border-top: 1px solid rgba(14,27,46,0.06);
          padding-top: 0.6rem;
        }
        .db-mc-action-link {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--mc-color);
          transition: opacity 0.18s;
          cursor: pointer;
        }
        .db-mc-action-link:hover { opacity: 0.75; }

        /* ── Activity Card ── */
        .db-activity-card {
          background: #fff;
          border: 1px solid rgba(14,27,46,0.07);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(14,27,46,0.04);
        }
        .db-activity-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 0;
          text-align: center;
        }
        .db-activity-empty span { font-size: 2rem; }
        .db-activity-empty p { font-size: 0.85rem; color: #6b7280; }
        .db-activity-empty button {
          font-size: 0.8rem; font-weight: 700;
          color: #c9963a; background: rgba(201,150,58,0.08);
          border: 1px solid rgba(201,150,58,0.2);
          cursor: pointer; font-family: inherit;
          padding: 0.4rem 0.8rem; border-radius: 8px;
          transition: all 0.18s;
        }
        .db-activity-empty button:hover { background: rgba(201,150,58,0.15); }

        

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .db-quick-grid { grid-template-columns: repeat(3, 1fr); }
          .db-kpi-grid   { grid-template-columns: repeat(2, 1fr); }
          .db-greeting-h2 { font-size: 1.2rem; }
          .db-kpi-value   { font-size: 1.5rem; }
          .db-section-link {
              font-size: 0.78rem;
              font-weight: 700;
              padding-left:250px;
              margin-top:10px;
              color: #c9963a;
              background: none;
              border: none;
              cursor: pointer;
              font-family: inherit;
              transition: opacity 0.18s;
            }
            .db-section-link:hover { opacity: 0.7; }
            }
        @media (max-width: 360px) {
          .db-quick-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
};

export default DashboardHome;
