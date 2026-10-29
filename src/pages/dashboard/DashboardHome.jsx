import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { BusinessStatsContext } from "../../context/BusinessStatsContext";
import { authAxios } from "../../services/api";
// import { SubscriptionContext } from "../../context/SubscriptionContext";
// import SummaryCard from "../../components/cards/SummaryCard";
// import UpgradeCard from "../../components/cards/UpgradeCard";

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

/* ── Period tabs config ── */
const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week",  label: "Week"  },
  { key: "month", label: "Month" },
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

/* ═══════════════════════════════════════════
   PRE-SUBSCRIPTION VIEW
═══════════════════════════════════════════ */
const PRESUB_FEATURES = [
  { icon: "🧾", title: "GST invoices in 30 sec", text: "Create and send compliant invoices fast" },
  { icon: "📦", title: "Auto stock deduction",   text: "Stock updates on every sale" },
  { icon: "💬", title: "WhatsApp sharing",       text: "Send invoices to customers instantly" },
  { icon: "👤", title: "Customer ledger",        text: "Track dues and payments per customer" },
  { icon: "📊", title: "GST reports",            text: "Ready-to-use reports for filing" },
  { icon: "🔒", title: "Private & secure",       text: "Your business data stays protected" },
];

const PRESUB_COMING_SOON = ["🏠 Home Expenses", "🏗️ Construction", "⚙️ Customized Billing"];

const PreSubscriptionView = ({ greet, displayName, navigate }) => {
  const goPlans = () => navigate("/subscription");

  return (
    <div className="ps-wrap">
      {/* ── HERO ── */}
      <section className="ps-hero">
        <div className="ps-hero-glow" />
        <div className="ps-hero-line" />
        <div className="ps-hero-body">
          <span className="ps-badge">
            <i className="ps-badge-dot" /> Built for AP &amp; Telangana shops
          </span>
          <h2 className="ps-hero-title">
            {greet}, {displayName} 👋
            <br />
            <span className="ps-gold">Welcome to ManaBills</span>
          </h2>
          <p className="ps-hero-text">
            Create GST invoices, manage stock and track customer dues — all in one place.
            Start your free trial. No credit card needed.
          </p>
          <button className="ps-btn-primary" onClick={goPlans}>
            🚀 Start Free Trial
          </button>
        </div>
      </section>

      {/* ── FEATURES + PRICING ── */}
      <section className="ps-main">
        <div className="ps-features-card">
          <span className="ps-status">✦ No active subscription</span>
          <h3 className="ps-h3">Everything your shop needs</h3>
          <div className="ps-features-grid">
            {PRESUB_FEATURES.map((f) => (
              <div key={f.title} className="ps-feature">
                <div className="ps-feature-icon">{f.icon}</div>
                <div>
                  <div className="ps-feature-title">{f.title}</div>
                  <div className="ps-feature-text">{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="ps-price-card">
          <span className="ps-price-tag">⭐ Most Popular</span>
          <div className="ps-price-name">Business Billing</div>
          <div className="ps-price-row">
            <span className="ps-price">₹199</span>
            <span className="ps-price-per">/month</span>
          </div>
          <div className="ps-trial">⏱ 7 Days Free Trial</div>
          <button className="ps-btn-primary ps-btn-block" onClick={goPlans}>
            Choose a Plan →
          </button>
          <p className="ps-price-note">Cancel anytime</p>
        </aside>
      </section>

      {/* ── COMING SOON ── */}
      <section className="ps-soon">
        <span className="ps-soon-label">More modules coming soon</span>
        <div className="ps-soon-chips">
          {PRESUB_COMING_SOON.map((c) => (
            <span key={c} className="ps-chip">🔒 {c}</span>
          ))}
        </div>
      </section>

      <style>{`
        .ps-wrap { display: flex; flex-direction: column; gap: 1.1rem; animation: ps-up .5s ease both; }
        @keyframes ps-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes ps-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes ps-pulse { 0% { box-shadow: 0 0 0 0 rgba(201,150,58,.6); } 100% { box-shadow: 0 0 0 8px rgba(201,150,58,0); } }

        /* Hero */
        .ps-hero { position: relative; overflow: hidden; border-radius: 24px; padding: 2.25rem 2rem;
          background: linear-gradient(135deg,#0e1b2e 0%,#1a2d47 55%,#0e1b2e 100%);
          box-shadow: 0 20px 60px rgba(14,27,46,.28); }
        .ps-hero-glow { position: absolute; top: -50px; right: -30px; width: 260px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle,rgba(201,150,58,.2) 0%,transparent 70%); pointer-events: none; }
        .ps-hero-line { position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg,#c9963a,#e8a020,#f4c542,#e8a020,#c9963a); }
        .ps-hero-body { position: relative; z-index: 1; }
        .ps-badge { display: inline-flex; align-items: center; gap: .45rem; margin-bottom: 1rem; padding: .25rem .85rem;
          border-radius: 100px; background: rgba(201,150,58,.14); border: 1px solid rgba(201,150,58,.3);
          color: #e8a020; font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .ps-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #c9963a; animation: ps-pulse 1.8s ease-out infinite; }
        .ps-hero-title { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(1.4rem,3.5vw,1.9rem);
          font-weight: 800; line-height: 1.2; letter-spacing: -.025em; color: #fff; margin: 0 0 .65rem; }
        .ps-gold { background: linear-gradient(135deg,#c9963a,#f4c542,#c9963a); background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: ps-shimmer 3s linear infinite; }
        .ps-hero-text { max-width: 480px; margin: 0 0 1.5rem; font-size: .9rem; line-height: 1.65; color: rgba(255,255,255,.62); }

        /* Buttons */
        .ps-btn-primary { border: none; cursor: pointer; padding: .8rem 1.75rem; border-radius: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: .92rem; font-weight: 800; color: #0e1b2e;
          background: linear-gradient(135deg,#c9963a,#e8a020); box-shadow: 0 6px 22px rgba(201,150,58,.38);
          transition: transform .2s ease, box-shadow .2s ease; }
        .ps-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(201,150,58,.45); }
        .ps-btn-block { display: block; width: 100%; padding: .75rem 1rem; font-size: .85rem; }

        /* Features + pricing */
        .ps-main { display: grid; grid-template-columns: 1fr 260px; gap: 1.1rem; align-items: stretch; }
        .ps-features-card { background: #fff; border: 1.5px solid rgba(14,27,46,.07); border-radius: 22px;
          padding: 1.5rem; box-shadow: 0 8px 32px rgba(14,27,46,.07); position: relative; overflow: hidden; }
        .ps-features-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg,#1e4fba,#c9963a 50%,#15803d); }
        .ps-status { display: inline-block; margin-bottom: .7rem; padding: .2rem .7rem; border-radius: 100px;
          background: rgba(201,150,58,.1); border: 1px solid rgba(201,150,58,.25); color: #c9963a;
          font-size: .65rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .ps-h3 { font-family: 'Playfair Display', Georgia, serif; font-size: 1.15rem; font-weight: 800;
          color: #0e1b2e; letter-spacing: -.02em; margin: 0 0 1rem; }
        .ps-features-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(230px,1fr)); gap: .9rem 1.2rem; }
        .ps-feature { display: flex; gap: .7rem; align-items: flex-start; }
        .ps-feature-icon { width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          border-radius: 10px; background: rgba(201,150,58,.12); font-size: 1rem; }
        .ps-feature-title { font-size: .84rem; font-weight: 700; color: #0e1b2e; }
        .ps-feature-text { font-size: .74rem; color: #6b7280; line-height: 1.45; margin-top: 1px; }

        .ps-price-card { position: relative; overflow: hidden; border-radius: 22px; padding: 1.5rem 1.4rem; text-align: center;
          background: linear-gradient(145deg,#0e1b2e,#1a2d47); border: 1.5px solid rgba(201,150,58,.35);
          box-shadow: 0 8px 28px rgba(14,27,46,.25); display: flex; flex-direction: column; justify-content: center; }
        .ps-price-tag { align-self: center; margin-bottom: .8rem; padding: .22rem .75rem; border-radius: 100px;
          background: linear-gradient(135deg,#c9963a,#e8a020); color: #0e1b2e; font-size: .6rem; font-weight: 800;
          letter-spacing: .08em; text-transform: uppercase; }
        .ps-price-name { font-size: .95rem; font-weight: 800; color: #fff; margin-bottom: .4rem; }
        .ps-price-row { display: flex; align-items: flex-end; justify-content: center; gap: .3rem; margin-bottom: .6rem; }
        .ps-price { font-family: 'Playfair Display', Georgia, serif; font-size: 2.2rem; font-weight: 900; line-height: 1; color: #c9963a; }
        .ps-price-per { font-size: .78rem; color: rgba(255,255,255,.45); padding-bottom: 4px; }
        .ps-trial { align-self: center; margin-bottom: 1.1rem; padding: .25rem .75rem; border-radius: 100px;
          background: rgba(201,150,58,.15); border: 1px solid rgba(201,150,58,.35); color: #c9963a; font-size: .72rem; font-weight: 700; }
        .ps-price-note { margin: .6rem 0 0; font-size: .66rem; color: rgba(255,255,255,.35); }

        /* Coming soon */
        .ps-soon { display: flex; align-items: center; gap: .75rem 1rem; flex-wrap: wrap; padding: .9rem 1.2rem;
          background: rgba(14,27,46,.03); border: 1.5px dashed rgba(14,27,46,.12); border-radius: 16px; }
        .ps-soon-label { font-size: .72rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; }
        .ps-soon-chips { display: flex; gap: .5rem; flex-wrap: wrap; }
        .ps-chip { padding: .28rem .75rem; border-radius: 100px; background: #fff; border: 1px solid rgba(14,27,46,.1);
          font-size: .74rem; font-weight: 600; color: #6b7280; }

        @media (max-width: 820px) {
          .ps-main { grid-template-columns: 1fr; }
          .ps-hero { padding: 1.75rem 1.25rem; }
        }
      `}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════
   PERIOD TAB SELECTOR COMPONENT
═══════════════════════════════════════════ */
const PeriodTabs = ({ active, onChange }) => (
  <>
    <style>{`
      .period-tabs-wrap {
        display: inline-flex;
        align-items: center;
        background: #fff;
        border-radius: 10px;
        padding: 3px;
        gap: 2px;
        border: 1.5px solid rgba(14,27,46,0.09);
        box-shadow: 0 1px 6px rgba(14,27,46,0.06);
      }
      .period-tab {
        padding: 0.36rem 1rem;
        border-radius: 7px;
        font-size: 0.74rem;
        font-weight: 700;
        font-family: 'Plus Jakarta Sans', sans-serif;
        letter-spacing: 0.02em;
        border: none;
        cursor: pointer;
        transition: all 0.18s ease;
        background: transparent;
        color: #9ca3af;
        white-space: nowrap;
      }
      .period-tab.active {
        background: #0e1b2e;
        color: #c9963a;
        box-shadow: 0 2px 8px rgba(14,27,46,0.18);
      }
      .period-tab:not(.active):hover {
        color: #374151;
        background: #f8fafc;
      }
    `}</style>
    <div className="period-tabs-wrap">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          className={`period-tab${active === p.key ? " active" : ""}`}
          onClick={() => onChange(p.key)}
        >
          {p.label}
        </button>
      ))}
    </div>
  </>
);


const ReferralCard = () => {
  const [referral, setReferral] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const res = await authAxios.get("auth/my-referral/");
        setReferral(res.data);
      } catch (err) {
        console.error("Failed to load referral info", err);
      }
    };
    fetchReferral();
  }, []);

  if (!referral) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(referral.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `Try ManaBills — GST billing app for shops! Use my referral link to sign up: ${referral.referral_link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #0e1b2e 0%, #1a2d47 100%)",
      borderRadius: "18px",
      padding: "1.1rem 1.4rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      flexWrap: "wrap",
      boxShadow: "0 6px 24px rgba(14,27,46,0.18)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "-30px", right: "-20px", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,150,58,0.14) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, minWidth: "220px" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>
          🎁 Your Referral Code
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.35rem", fontWeight: 900, color: "#c9963a", letterSpacing: "0.03em" }}>
            {referral.referral_code}
          </span>
          {referral.total_referred > 0 && (
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              · {referral.total_referred} shop{referral.total_referred > 1 ? "s" : ""} referred
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.6rem", position: "relative", zIndex: 1 }}>
        <button onClick={handleCopy} style={{ background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)", color: "#fff", padding: "0.6rem 1rem", borderRadius: "10px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          {copied ? "✓ Copied!" : "Copy Link"}
        </button>
        <button onClick={handleWhatsAppShare} style={{ background: "linear-gradient(135deg, #c9963a, #e8a020)", border: "none", color: "#0e1b2e", padding: "0.6rem 1.1rem", borderRadius: "10px", fontSize: "0.78rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(201,150,58,0.35)" }}>
          💬 Share on WhatsApp
        </button>
      </div>
    
    {/* ── Incentive banner ── */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", gap: "0.6rem",
        background: "rgba(201,150,58,0.12)",
        border: "1px solid rgba(201,150,58,0.28)",
        borderRadius: "10px",
        padding: "0.55rem 0.85rem",
      }}>
        <span style={{ fontSize: "1.1rem" }}>💰</span>
        <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.85)", fontWeight: 600, lineHeight: 1.4 }}>
          Earn <span style={{ color: "#c9963a", fontWeight: 800 }}>₹100</span> or <span style={{ color: "#c9963a", fontWeight: 800 }}>50%</span> of your referral's first plan — whichever is higher.
        </span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   MAIN DASHBOARD HOME
═══════════════════════════════════════════ */
const DashboardHome = () => {
  const navigate = useNavigate();
  const { subscriptions: subData } = useContext(SubscriptionContext);
  const { stats: businessStats, loading: statsLoading } = useContext(BusinessStatsContext);

  const [period, setPeriod] = useState("today");


  const subscriptions  = Object.keys(subData).filter(k => subData[k]?.is_active === true);
  const hasAny         = subscriptions.length > 0;
  const hasBusiness    = subscriptions.includes("business");

  // ── NEW: detect "had a subscription before, now expired" ──
  // (any module that EXISTS in subData at all, active or not)
  const hasAnyHistory  = Object.keys(subData).length > 0;
  const businessSub    = subData?.business;
  const businessExpired = businessSub?.status === "expired";
  const showBusiness = hasBusiness || businessExpired;
  

  const displayName  = getDisplayName();
  const hour         = new Date().getHours();
  const greet        = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetEmoji   = hour < 12 ? "☀️" : hour < 17 ? "👋" : "🌙";
  const today        = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

  const getStatsByPeriod = () => {
  if (period === "today") {
    return {
      invoiceCount: businessStats?.today_invoice_count || 0,
      // ✅ Use today_sales directly — not paid+unpaid sum
      revenue:   fmt(businessStats?.today_sales || 0),
      pending:   fmt(businessStats?.today_unpaid_amount || 0),
      collected: fmt(businessStats?.today_paid_amount  || 0),
    };
  }
  if (period === "week") {
    // week_billing = paid + unpaid combined
    const weekTotal = (businessStats?.week_paid_amount || 0) + (businessStats?.week_unpaid_amount || 0);
    return {
      invoiceCount: businessStats?.week_invoice_count || 0,
      revenue:      fmt(businessStats?.week_billing || 0),
      pending:   fmt(businessStats?.week_unpaid_amount || 0),
      collected: fmt(businessStats?.week_paid_amount  || 0),
    };
  }
  // Month
  return {
    invoiceCount: businessStats?.month_invoice_count || 0,
    revenue:   fmt(businessStats?.month_billing || 0),  // ✅ use month_billing directly
    pending:   fmt(businessStats?.unpaid_amount  || 0),
    collected: fmt(businessStats?.paid_amount    || 0),
  };
};

  const periodStats = getStatsByPeriod();
  const periodLabel = PERIODS.find((p) => p.key === period)?.label || "Today";

  const getBusinessModule = () => {
    const base = MODULES.find((m) => m.key === "business") || {};
    return {
      ...base,
      value: fmt(businessStats?.month_billing || 0),
      subtitle: "Total Billing This Month",
    };
  };

  const visibleModuleKeys = showBusiness
  ? [...new Set([...subscriptions, "business"])]
  : subscriptions;

  const activeModules = MODULES.filter((m) => visibleModuleKeys.includes(m.key)).map((m) =>
    m.key === "business" ? getBusinessModule() : m
  );

  return (
    <div className="db-home">

      {/* ══════════════════════════════
          NO SUBSCRIPTION
      ══════════════════════════════ */}
      {!hasAny && !hasAnyHistory && (
        <PreSubscriptionView
          greet={greet}
          displayName={displayName}
          navigate={navigate}
        />
      )}

      {/* ══════════════════════════════
          ACTIVE SUBSCRIPTION
      ══════════════════════════════ */}
      {(hasAny || hasAnyHistory) && (
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
            {showBusiness && (
              <button className="db-greeting-cta" onClick={() => navigate("/dashboard/business/create-invoice")}>
                + New Invoice
              </button>
            )}
          </div>

          {/* ── KPI SECTION ── */}
          {showBusiness && (
            <div>
              <div className="db-kpi-section-header">
                <div className="db-section-title">Business Overview</div>
                <PeriodTabs active={period} onChange={setPeriod} />
              </div>
              <div className="db-kpi-grid">
                {[
                  { label: "Invoices", value: statsLoading ? "..." : periodStats.invoiceCount, sub: `Created · ${periodLabel}`, accent: "#1e4fba", icon: "📄", isCurrency: false },
                  { label: "Revenue",  value: statsLoading ? "..." : periodStats.revenue,      sub: `Total Billed · ${periodLabel}`, accent: "#c9963a", icon: "💹", isCurrency: true, highlight: true },
                  { label: "Pending",  value: statsLoading ? "..." : periodStats.pending,      sub: `Awaiting Payment · ${periodLabel}`, accent: "#c2410c", icon: "⏳", isCurrency: true },
                  { label: "Collected",value: statsLoading ? "..." : periodStats.collected,    sub: `Payments Received · ${periodLabel}`, accent: "#15803d", icon: "✅", isCurrency: true },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className={`db-kpi-card${kpi.highlight ? " db-kpi-card--highlight" : ""}`}
                    style={{ "--kpi-accent": kpi.accent }}
                  >
                    <div className="db-kpi-top">
                      <span className="db-kpi-icon">{kpi.icon}</span>
                      <span className="db-kpi-label">{kpi.label}</span>
                    </div>
                    <div className={`db-kpi-value${kpi.highlight ? " db-kpi-value--gold" : ""}`}>
                      {kpi.value}
                    </div>
                    <div className="db-kpi-sub">{kpi.sub}</div>
                    <div className="db-kpi-bar" />
                  </div>
                ))}
              </div>
              <button className="db-section-link" onClick={() => navigate("/dashboard/business")}>
                Full Overview →
              </button>
            </div>
          )}


          {/* ── QUICK ACTIONS ── */}
          {showBusiness && (
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

          <ReferralCard />


          {/* ── RECENT ACTIVITY ── */}
          <div className="db-section-row" style={{ marginTop: "0.5rem" }}>
            <div className="db-section-title">Recent Activity</div>
            {showBusiness && (
              <button className="db-section-link-inline" onClick={() => navigate("/dashboard/business/invoices")}>View All →</button>
            )}
          </div>

          {hasBusiness ? (
            <div className="db-activity-card">
              {/* ── INSIGHTS BAR ── */}
              <div className="db-insights-bar">
                {[
                  { icon: "⚠️", text: `₹${Number(businessStats?.unpaid_amount || 0).toLocaleString("en-IN")} unpaid`, color: "#c2410c", bg: "rgba(194,65,12,0.08)", border: "rgba(194,65,12,0.18)" },
                  { icon: "📈", text: `${businessStats?.month_invoice_count || 0} invoices this month`, color: "#1e4fba", bg: "rgba(30,79,186,0.08)", border: "rgba(30,79,186,0.18)" },
                  { icon: "🏆", text: "View top customer", color: "#c9963a", bg: "rgba(201,150,58,0.08)", border: "rgba(201,150,58,0.22)" },
                ].map((chip, i) => (
                  <div key={i} className="db-insight-chip" style={{ "--chip-color": chip.color, "--chip-bg": chip.bg, "--chip-border": chip.border }}>
                    <span>{chip.icon}</span>
                    <span>{chip.text}</span>
                  </div>
                ))}
              </div>

              {/* ── LIVE INVOICE FEED ── */}
              <div className="db-feed-divider" />
              <div className="db-feed-list">
                {businessStats?.recent_invoices?.length > 0 ? (
                  businessStats.recent_invoices.slice(0, 5).map((inv, i) => (
                    <div key={i} className="db-feed-row" onClick={() => navigate(`/dashboard/business/invoices/${inv.id}`)}>
                      <div className="db-feed-dot" style={{ "--dot-color": inv.payment_status === "Paid" ? "#15803d" : "#c9963a" }} />
                      <div className="db-feed-info">
                        <span className="db-feed-name">{inv.customer_name || "Customer"}</span>
                        <span className="db-feed-time">{inv.created_at ? new Date(inv.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                      </div>
                      <div className="db-feed-right">
                        <span className="db-feed-amount">₹{Number(inv.total_amount || 0).toLocaleString("en-IN")}</span>
                        <span className="db-feed-status" style={{ color: inv.payment_status === "Paid" ? "#15803d" : "#c9963a" }}>
                          {inv.payment_status === "Paid" ? "Paid" : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="db-activity-empty">
                    <span>📋</span>
                    <p>Your recent invoices will appear here.</p>
                    <button onClick={() => navigate("/dashboard/business/create-invoice")}>Create your first invoice →</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="db-activity-card">
              <div className="db-activity-empty">
                <span>📊</span>
                <p>Activity from your active modules will appear here.</p>
              </div>
            </div>
          )}

        </> 
      )}

      {/* ══════════════════════════════
          SHARED CSS
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

        /* ── KPI Section Header ── */
        .db-kpi-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.85rem;
        }

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
        .db-kpi-card--highlight {
          background: linear-gradient(145deg, #0e1b2e 0%, #1a2d47 100%);
          border: 1px solid rgba(201,150,58,0.28);
          box-shadow: 0 4px 20px rgba(14,27,46,0.18);
        }
        .db-kpi-card--highlight .db-kpi-label { color: rgba(255,255,255,0.5); }
        .db-kpi-card--highlight .db-kpi-sub   { color: rgba(255,255,255,0.35); }
        .db-kpi-card--highlight .db-kpi-icon  { filter: none; }
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
          font-size: 1.55rem;
          font-weight: 900;
          color: #0e1b2e;
          line-height: 1;
          margin-bottom: 0.25rem;
          letter-spacing: -0.02em;
        }
        .db-kpi-value--gold {
          background: linear-gradient(135deg, #c9963a 0%, #f4c542 60%, #c9963a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 1.45rem;
        }
        .db-kpi-sub {
          font-size: 0.68rem;
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
          display: block;
          text-align: right;
          margin-top: 0.5rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: #c9963a;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.18s;
          width: 100%;
        }
        .db-section-link:hover { opacity: 0.7; }
        .db-section-link-inline {
          font-size: 0.78rem;
          font-weight: 700;
          color: #c9963a;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.18s;
        }
        .db-section-link-inline:hover { opacity: 0.7; }

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

        /* ── Insights Bar ── */
        .db-insights-bar {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .db-insights-bar::-webkit-scrollbar { display: none; }
        .db-insight-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.32rem 0.7rem;
          border-radius: 100px;
          background: var(--chip-bg);
          border: 1px solid var(--chip-border);
          color: var(--chip-color);
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
          cursor: default;
        }

        /* ── Live Feed ── */
        .db-feed-divider {
          height: 1px;
          background: rgba(14,27,46,0.06);
          margin: 0.85rem 0 0.65rem;
        }
        .db-feed-list {
          display: flex;
          flex-direction: column;
        }
        .db-feed-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.1rem;
          border-bottom: 1px solid rgba(14,27,46,0.05);
          cursor: pointer;
          transition: all 0.15s;
          border-radius: 8px;
        }
        .db-feed-row:last-child { border-bottom: none; }
        .db-feed-row:hover { background: rgba(14,27,46,0.03); padding-left: 0.4rem; }
        .db-feed-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--dot-color);
          flex-shrink: 0;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--dot-color) 18%, transparent);
          animation: db-dot-pulse 2.4s ease-in-out infinite;
        }
        @keyframes db-dot-pulse {
          0%, 100% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--dot-color) 18%, transparent); }
          50%       { box-shadow: 0 0 0 6px color-mix(in srgb, var(--dot-color) 8%, transparent); }
        }
        .db-feed-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .db-feed-name {
          font-size: 0.84rem;
          font-weight: 700;
          color: #0e1b2e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .db-feed-time {
          font-size: 0.66rem;
          color: #9ca3af;
          font-weight: 500;
        }
        .db-feed-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1px;
          flex-shrink: 0;
        }
        .db-feed-amount {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 0.9rem;
          font-weight: 800;
          color: #0e1b2e;
        }
        .db-feed-status {
          font-size: 0.66rem;
          font-weight: 700;
          text-transform: capitalize;
        }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .db-quick-grid { grid-template-columns: repeat(3, 1fr); }
          .db-kpi-grid   { grid-template-columns: repeat(2, 1fr); }
          .db-greeting-h2 { font-size: 1.2rem; }
          .db-kpi-value   { font-size: 1.3rem; }
          .db-kpi-value--gold { font-size: 1.2rem; }
          .db-kpi-section-header { flex-wrap: wrap; gap: 0.5rem; }
        }
        @media (max-width: 360px) {
          .db-quick-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
};

export default DashboardHome;