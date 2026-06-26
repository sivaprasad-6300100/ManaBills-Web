import React from "react";
import { useNavigate } from "react-router-dom";

const modules = [
  {
    key: "business",
    icon: "🧾",
    title: "Business Billing",
    description: "Invoices, GST, stock & customer management for your shop",
    price: "₹199",
    trial: "3 Days Free Trial",
    trialIcon: "clock",
    accent: "#c9963a",
    accentBg: "rgba(201,150,58,0.15)",
    accentBorder: "rgba(201,150,58,0.35)",
    bar: "linear-gradient(90deg,#c9963a,#f4c542)",
    featured: true,
    tag: "⭐ Most Popular",
    features: [
      "GST-compliant invoices in 30 sec",
      "Auto stock deduction on sales",
      "WhatsApp invoice sharing",
      "Customer ledger & reports",
    ],
    route: "/subscription/business",
  },
  {
    key: "home-expense",
    icon: "🏠",
    title: "Home Expense Tracker",
    description: "Track family expenses & monthly savings with smart categories",
    price: "₹99",
    trial: "7 Days Free Trial",
    trialIcon: "clock",
    accent: "#15803d",
    accentBg: "rgba(21,128,61,0.08)",
    accentBorder: "rgba(21,128,61,0.25)",
    bar: "linear-gradient(90deg,#15803d,#22c55e)",
    features: [
      "Daily expense tracking",
      "Monthly budget reports",
      "Category-wise analysis",
      "Savings goal tracker",
    ],
    route: "/subscription/home-expense",
  },
  {
    key: "construction",
    icon: "🏗️",
    title: "Construction Billing",
    description: "Project cost, contractor & labor payments for site management",
    price: "₹699",
    trial: "Free Plan Available",
    trialIcon: "check",
    accent: "#c2410c",
    accentBg: "rgba(194,65,12,0.08)",
    accentBorder: "rgba(194,65,12,0.25)",
    bar: "linear-gradient(90deg,#c2410c,#f97316)",
    features: [
      "Project-wise cost tracking",
      "Labour & contractor payments",
      "Material purchase logs",
      "Budget vs actual reports",
    ],
    route: "/subscription/construction",
  },
  {
    key: "custom",
    icon: "⚙️",
    title: "Customized Billing",
    description: "Tailor-made billing formats, estimates & flexible workflows",
    price: "₹199",
    trial: "3 Days Free Trial",
    trialIcon: "clock",
    accent: "#6d28d9",
    accentBg: "rgba(109,40,217,0.08)",
    accentBorder: "rgba(109,40,217,0.25)",
    bar: "linear-gradient(90deg,#6d28d9,#a855f7)",
    features: [
      "Custom bill formats",
      "Estimate & quotation builder",
      "Works contract billing",
      "Flexible tax configuration",
    ],
    route: "/subscription/custom",
  },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "linear-gradient(160deg,#f0f4ff 0%,#faf8f3 40%,#fff7ed 100%)", minHeight: "100vh", paddingBottom: 60 }}>

      {/* ── HERO ── */}
      <div style={{ background: "linear-gradient(135deg,#0e1b2e 0%,#1a2d47 55%,#0e1b2e 100%)", padding: "56px 24px 72px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#c9963a,#e8a020,#f4c542,#e8a020,#c9963a)" }} />
        <div style={{ position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,150,58,0.13) 0%,transparent 65%)", pointerEvents: "none" }} />

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(201,150,58,0.15)", border: "1px solid rgba(201,150,58,0.35)", color: "#e8a020", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 16px", borderRadius: 100, marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c9963a" }} />
          ManaBills · Choose Your Module
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2rem,5vw,2.8rem)", fontWeight: 900, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 14 }}>
          Unlock the Power of{" "}
          <span style={{ background: "linear-gradient(135deg,#c9963a 0%,#f4c542 50%,#c9963a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Smart Billing
          </span>
        </h1>

        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.58)", lineHeight: 1.7, maxWidth: 440, margin: "0 auto 28px" }}>
          Each module is built for a specific need. Pick what suits you — pay only for what you use.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          {["No credit card required", "Cancel anytime", "GST compliant"].map((t, i) => (
            <React.Fragment key={t}>
              {i > 0 && <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)" }} />}
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
                <span style={{ color: "#c9963a" }}>✓</span> {t}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Section label */}
      <div style={{ textAlign: "center", padding: "36px 24px 8px" }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.45rem", fontWeight: 800, color: "#0e1b2e", letterSpacing: "-0.02em", marginBottom: 6 }}>Select Your Module</h2>
        <p style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Each module has unique plans & features tailored to your business.</p>
      </div>

      {/* ── CARDS GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 20, maxWidth: 960, margin: "20px auto 0", padding: "0 20px" }}>
        {modules.map((m) => (
          <div
            key={m.key}
            style={{
              background: m.featured ? "linear-gradient(145deg,#0e1b2e 0%,#1a2d47 100%)" : "#fff",
              border: `1.5px solid ${m.featured ? "rgba(201,150,58,0.35)" : "rgba(14,27,46,0.07)"}`,
              borderRadius: 22, padding: "28px 26px 24px",
              position: "relative", overflow: "hidden",
              boxShadow: m.featured ? "0 8px 36px rgba(14,27,46,0.28)" : "0 4px 24px rgba(14,27,46,0.06)",
              transition: "transform .25s ease, box-shadow .25s ease",
            }}
          >
            {/* Top bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: m.bar, borderRadius: "22px 22px 0 0" }} />

            {/* Popular tag OR Lock badge */}
        {m.key === "business" ? (
          m.tag && (
            <div style={{ position: "absolute", top: 16, right: 16, background: "linear-gradient(135deg,#c9963a,#e8a020)", color: "#0e1b2e", fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100 }}>
              {m.tag}
            </div>
          )
        ) : (
          /* 🔒 Lock badge top-right */
          <div style={{
            position: "absolute", top: 16, right: 16,
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "rgba(14,27,46,0.06)",
            border: "1px solid rgba(14,27,46,0.12)",
            borderRadius: 20, padding: "3px 8px 3px 6px",
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
              stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>Soon</span>
          </div>
        )}
            {/* Icon */}
            <div style={{ width: 50, height: 50, borderRadius: 14, background: m.featured ? "rgba(201,150,58,0.15)" : m.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
              {m.icon}
            </div>

            {/* Title & Desc */}
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.15rem", fontWeight: 800, color: m.featured ? "#fff" : "#0e1b2e", letterSpacing: "-0.02em", marginBottom: 6 }}>{m.title}</div>
            <div style={{ fontSize: 12.5, color: m.featured ? "rgba(255,255,255,0.52)" : "#6b7280", lineHeight: 1.6, marginBottom: 18, fontWeight: 500 }}>{m.description}</div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 8 }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.75rem", fontWeight: 900, lineHeight: 1, color: m.featured ? "#c9963a" : "#0e1b2e" }}>{m.price}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: m.featured ? "rgba(255,255,255,0.38)" : "#9ca3af", paddingBottom: 3 }}>/month</div>
            </div>

            {/* Trial pill */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, background: m.featured ? "rgba(201,150,58,0.15)" : m.accentBg, color: m.featured ? "#c9963a" : m.accent, border: `1px solid ${m.featured ? "rgba(201,150,58,0.35)" : m.accentBorder}`, borderRadius: 100, padding: "4px 10px", marginBottom: 18 }}>
              ⏱ {m.trial}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: m.featured ? "rgba(255,255,255,0.08)" : "rgba(14,27,46,0.06)", marginBottom: 18 }} />

            {/* Features */}
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
              {m.features.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 500, color: m.featured ? "rgba(255,255,255,0.72)" : "#374151" }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: m.featured ? "rgba(201,150,58,0.2)" : m.accentBg, color: m.featured ? "#c9963a" : m.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
              {m.key === "business" ? (
                <button
                  onClick={() => navigate(m.route)}
                  style={{
                    display: "block", width: "100%", padding: "13px 20px", borderRadius: 12,
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13.5, fontWeight: 800,
                    cursor: "pointer", border: "none",
                    background: "linear-gradient(135deg,#c9963a,#e8a020)",
                    color: "#0e1b2e",
                    boxShadow: "0 6px 20px rgba(201,150,58,0.4)",
                    transition: "all .2s ease",
                  }}
                >
                  View Plans →
                </button>
              ) : (
                /* 🔒 LOCKED button */
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", padding: "13px 20px", borderRadius: 12,
                    background: "rgba(14,27,46,0.04)",
                    border: "1.5px dashed rgba(14,27,46,0.14)",
                    cursor: "not-allowed",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.04em" }}>
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>   

      {/* Footer note */}
      <div style={{ textAlign: "center", marginTop: 32, padding: "0 20px" }}>
        <p style={{ fontSize: 12.5, color: "#9ca3af", fontWeight: 500 }}>
          🔒 All plans include <strong style={{ color: "#374151" }}>SSL security</strong> · <strong style={{ color: "#374151" }}>Privacy</strong> · <strong style={{ color: "#374151" }}>24/7 support</strong> · Cancel anytime without penalty
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
}