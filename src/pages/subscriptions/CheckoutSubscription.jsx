import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { authAxios } from "../../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// PLAN DATA
// ─────────────────────────────────────────────────────────────────────────────

const ALL_PLANS = {
  business_basic:    { name: "Business Basic",    dashboard: "/dashboard/business",     durations: [{ label: "1 Year", price: 1999, fee: 15, save: 1389, perday: "₹5.47/day" }, { label: "6 Months", price: 999, fee: 10, save: 195, perday: "₹5.49/day" }, { label: "1 Month", price: 199, fee: 5, save: 0, perday: "₹6.63/day" }] },
  business_pro:      { name: "Business Pro",      dashboard: "/dashboard/business",     durations: [{ label: "1 Year", price: 2799, fee: 15, save: 789,  perday: "₹7.67/day" }, { label: "6 Months", price: 1599, fee: 10, save: 201, perday: "₹8.78/day" }, { label: "1 Month", price: 299, fee: 5, save: 0, perday: "₹9.97/day" }] },
  home_basic:        { name: "Home Basic",        dashboard: "/dashboard/home-expense", durations: [{ label: "1 Year", price: 999,  fee: 10, save: 189,  perday: "₹2.74/day" }, { label: "1 Month", price: 99,  fee: 5,  save: 0,   perday: "₹3.3/day"  }] },
  home_pro:          { name: "Home Pro",          dashboard: "/dashboard/home-expense", durations: [{ label: "1 Year", price: 1499, fee: 15, save: 289,  perday: "₹4.11/day" }, { label: "1 Month", price: 149, fee: 5,  save: 0,   perday: "₹4.97/day" }] },
  construction_basic:{ name: "Construction Basic",dashboard: "/dashboard/construction", durations: [{ label: "1 Year", price: 6999, fee: 15, save: 1389, perday: "₹19.2/day" }, { label: "6 Months", price: 3499, fee: 10, save: 695, perday: "₹19.2/day" }, { label: "1 Month", price: 699, fee: 5, save: 0, perday: "₹23.3/day" }] },
  construction_pro:  { name: "Construction Pro",  dashboard: "/dashboard/construction", durations: [{ label: "1 Year", price: 12999,fee: 15, save: 2589, perday: "₹35.6/day" }, { label: "6 Months", price: 6999, fee: 10, save: 795, perday: "₹38.5/day" }, { label: "1 Month", price: 1299, fee: 5, save: 0, perday: "₹43.3/day" }] },
  custom_basic:      { name: "Custom Basic",      dashboard: "/dashboard/custom",       durations: [{ label: "1 Year", price: 1999, fee: 15, save: 389,  perday: "₹5.47/day" }, { label: "6 Months", price: 999, fee: 10, save: 195, perday: "₹5.49/day" }, { label: "1 Month", price: 199, fee: 5, save: 0, perday: "₹6.63/day" }] },
  custom_pro:        { name: "Custom Pro",        dashboard: "/dashboard/custom",       durations: [{ label: "1 Year", price: 4999, fee: 15, save: 989,  perday: "₹13.7/day" }, { label: "6 Months", price: 2499, fee: 10, save: 495, perday: "₹13.7/day" }, { label: "1 Month", price: 499, fee: 5, save: 0, perday: "₹16.6/day" }] },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contextual saving message — reactive to whatever duration is selected.
 *   1 Month  → null (no banner)
 *   6 Months → saving vs monthly × 6, nudge toward yearly
 *   1 Year   → saving vs monthly × 12
 */
const getContextualSaving = (durations, selected) => {
  const monthly = durations.find((d) => d.label === "1 Month");
  if (!monthly || selected.label === "1 Month") return null;

  if (selected.label === "6 Months") {
    const saving = monthly.price * 6 - selected.price;
    return { saving, vs: "monthly × 6", tip: "Upgrade to 1 Year to save even more" };
  }
  if (selected.label === "1 Year") {
    const saving = monthly.price * 12 - selected.price;
    return { saving, vs: "monthly × 12", tip: null };
  }
  return null;
};

/**
 * Strikethrough anchor price shown above the actual plan price.
 * Lets users see what they would pay without the discount.
 */
const getStrikePrice = (durations, targetLabel) => {
  const monthly = durations.find((d) => d.label === "1 Month");
  if (!monthly) return null;
  if (targetLabel === "1 Year")   return monthly.price * 12;
  if (targetLabel === "6 Months") return monthly.price * 6;
  return null;
};

/**
 * Compute plan expiry date string from duration label.
 * Used in the post-payment notification message.
 */
const getExpiryDate = (durationLabel) => {
  const now = new Date();
  if (durationLabel === "1 Year")       now.setFullYear(now.getFullYear() + 1);
  else if (durationLabel === "6 Months") now.setMonth(now.getMonth() + 6);
  else                                   now.setMonth(now.getMonth() + 1);
  return now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY SCRIPT LOADER
// Dynamically loads checkout.js once; resolves true/false.
// ─────────────────────────────────────────────────────────────────────────────

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script    = document.createElement("script");
    script.id       = "razorpay-script";
    script.src      = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutSubscription() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const { subscribe } = useContext(SubscriptionContext);

  const planKey = location.state?.planKey;
  const isFirstSetup = location.state?.isFirstSetup || false; // ← NEW
  const plan    = ALL_PLANS[planKey];

  const [selected,    setSelected]    = useState(plan ? plan.durations[0] : null);
  const [loading,     setLoading]     = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  // Redirect if plan key is invalid
  useEffect(() => {
    if (!planKey || !plan) navigate("/subscription");
  }, [planKey, plan, navigate]);

  // Pre-load Razorpay script on mount so there is no delay when user clicks Pay
  useEffect(() => {
    loadRazorpayScript().then((ok) => setScriptReady(ok));
  }, []);

  if (!plan || !selected) return null;

  const total = selected.price + selected.fee;
  const ctx   = getContextualSaving(plan.durations, selected);

  // User details for pre-filling Razorpay form
  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const userName  = user.full_name     || "";
  const userEmail = user.email         || "";
  const userPhone = user.mobile_number || "";

  // ─────────────────────────────────────────────────────────────────────────
  // RAZORPAY PAYMENT HANDLER
  //
  // Security notes:
  //   • RAZORPAY_KEY_SECRET must NEVER appear in frontend code.
  //     Keep it only on your Django backend.
  //   • Set REACT_APP_RAZORPAY_KEY_ID in your .env file:
  //       REACT_APP_RAZORPAY_KEY_ID=rzp_test_SgQPeC1QVxeV77
  //   • For production, create the order on your backend first and pass
  //     the returned order_id here (see commented block below).
  // ─────────────────────────────────────────────────────────────────────────
  // RENDER

  const handlePayment = async () => {
  if (!scriptReady) {
    alert("Payment gateway is still loading. Please try again in a moment.");
    return;
  }

  const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
  if (!razorpayKey) {
    alert("Payment configuration error. Please contact support.");
    return;
  }

  setLoading(true); // ← set true before opening

  const options = {
    key:         razorpayKey,
    amount:      total * 100,
    currency:    "INR",
    name:        "ManaBills",
    description: `${plan.name} — ${selected.label} Plan`,
    image:       "/logo192.png",

    prefill: { name: userName, email: userEmail, contact: userPhone },
    notes:   { plan_key: planKey, duration: selected.label },
    theme:   { color: "#c9963a" },

    // ── SUCCESS ──────────────────────────────────────────────
    handler:  async (response) => {
  // ── Map plan key → module key ──────────────────────────────
  const PLAN_TO_MODULE = {
    business_basic:     "business",
    business_pro:       "business",
    home_basic:         "home-expense",
    home_pro:           "home-expense",
    construction_basic: "construction",
    construction_pro:   "construction",
    custom_basic:       "custom",
    custom_pro:         "custom",
  };
  const moduleKey = PLAN_TO_MODULE[planKey] || planKey.split("_")[0];
  await authAxios.post("subscriptions/activate/", {
  module: moduleKey,
  plan_key: planKey,
  duration: selected.label,
  payment_id: response.razorpay_payment_id,
  amount: total,
});
subscribe(moduleKey, selected.label);

  // ── Rich notification ─────────────────────────────────────
  // replace the window.manaBillsNotify block in the handler with this:
const expiry  = getExpiryDate(selected.label);
const shortId = response.razorpay_payment_id?.slice(-8).toUpperCase();
const savings = ctx
  ? ` You saved ₹${ctx.saving.toLocaleString("en-IN")} by choosing ${selected.label}.`
  : "";

// ── Queue notification for Topbar to pick up after navigation ──
const pending = {
  type:    "subscription_new",
  title:   `${plan.name} Activated! 🎉`,
  message: `Payment of ₹${total.toLocaleString("en-IN")} confirmed (ID: #${shortId}).` +
           `${savings} Your plan is active until ${expiry}.`,
};
localStorage.setItem("manabills_pending_notif", JSON.stringify(pending));

setLoading(false);
// AFTER
const PLAN_TO_PROFILE = {
  business_basic:     "/dashboard/business/shop-profile",
  business_pro:       "/dashboard/business/shop-profile",
  home_basic:         "/dashboard/home-expense",
  home_pro:           "/dashboard/home-expense",
  construction_basic: "/dashboard/construction",
  construction_pro:   "/dashboard/construction",
  custom_basic:       "/dashboard/custom",
  custom_pro:         "/dashboard/custom",
};

navigate(PLAN_TO_PROFILE[planKey] || plan.dashboard, {
  state: {
    paymentSuccess: true,
    paymentId:      response.razorpay_payment_id,
    planName:       plan.name,
    duration:       selected.label,
    isFirstSetup,
  },
});
    },

    // ── MODAL DISMISSED ──────────────────────────────────────
    modal: {
      ondismiss: () => {
        setLoading(false); // ← only reset here, not after rzp.open()
      },
    },
  };

  const rzp = new window.Razorpay(options);

  // ── PAYMENT FAILURE ──────────────────────────────────────
  rzp.on("payment.failed", (response) => {
    if (window.manaBillsNotify && window.MANABILLS_NOTIF_TYPES) {
      window.manaBillsNotify(
        window.MANABILLS_NOTIF_TYPES.BILLING_DUE,
        "Payment Failed ⚠️",
        `Your payment for ${plan.name} could not be processed: ` +
        `${response.error.description}. No amount was charged. Please try again.`,
      );
    }
    setLoading(false);
    alert(`Payment failed: ${response.error.description}`);
  });

  rzp.open();
  // ← DO NOT call setLoading(false) here — modal is still open
};
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "linear-gradient(160deg,#f0f4ff 0%,#faf8f3 50%,#fff7ed 100%)", minHeight: "100vh", paddingBottom: 60 }}>

      {/* ── HERO ── */}
      <div style={{ background: "linear-gradient(135deg,#0e1b2e 0%,#1a2d47 55%,#0e1b2e 100%)", padding: "clamp(20px,4vw,36px) clamp(14px,4vw,24px) clamp(24px,5vw,48px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#c9963a,#e8a020,#f4c542,#e8a020,#c9963a)" }} />

        {/* Progress steps */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 20 }}>
          {[
            { label: "Module", state: "done"     },
            { label: "Plan",   state: "active"   },
            { label: "Pay",    state: "inactive" },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && (
                <div style={{ width: 32, height: 1.5, background: i === 1 ? "rgba(255,255,255,0.15)" : "#c9963a", margin: "0 4px" }} />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                  background: s.state === "done" ? "#c9963a" : s.state === "active" ? "#fff" : "rgba(255,255,255,0.12)",
                  color: s.state === "inactive" ? "rgba(255,255,255,0.35)" : "#0e1b2e",
                }}>
                  {s.state === "done" ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: s.state === "active" ? "#fff" : s.state === "done" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.28)" }}>
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.4rem,4vw,2.2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 10 }}>
          One Last Step to{" "}
          <span style={{ background: "linear-gradient(135deg,#c9963a,#f4c542,#c9963a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Save More Money
          </span>
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.52)", lineHeight: 1.6, margin: 0 }}>
          Most ManaBills users save ₹1,400+ per year by picking the right plan
        </p>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="checkout-grid" style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* ── LEFT COLUMN ── */}
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.05rem", fontWeight: 800, color: "#0e1b2e", marginBottom: 16, letterSpacing: "-0.02em" }}>
            {plan.name.toUpperCase()} — <span style={{ color: "#c9963a" }}>Choose Your Duration</span>
          </div>

          {/* Contextual saving banner — updates on every card selection */}
          {ctx && (
            <div style={{ background: "linear-gradient(135deg,#0e1b2e,#1a2d47)", border: "1.5px solid rgba(201,150,58,0.35)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", fontWeight: 500, lineHeight: 1.5 }}>
                Saves you{" "}
                <strong style={{ color: "#c9963a", fontSize: 15 }}>₹{ctx.saving.toLocaleString("en-IN")}</strong>{" "}
                vs {ctx.vs} billing
                {ctx.tip && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>↑ {ctx.tip}</div>
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 100, padding: "3px 10px", whiteSpace: "nowrap", flexShrink: 0 }}>
                🔥 Best Value
              </div>
            </div>
          )}

          {/* Duration cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {plan.durations.map((d, i) => {
              const isActive      = selected.label === d.label;
              const isRecommended = i === 0;
              const strikePrice   = getStrikePrice(plan.durations, d.label);

              return (
                <div
                  key={d.label}
                  onClick={() => setSelected(d)}
                  style={{
                    borderRadius: 16, padding: "16px 18px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 14,
                    position: "relative", overflow: "hidden",
                    transition: "all .2s ease",
                    background: isActive ? "linear-gradient(145deg,#0e1b2e,#1a2d47)" : "#fff",
                    border: isActive ? "2px solid #c9963a" : "1.5px solid rgba(14,27,46,0.08)",
                    boxShadow: isActive ? "0 8px 32px rgba(14,27,46,0.28)" : "0 2px 12px rgba(14,27,46,0.04)",
                  }}
                >
                  {/* Most popular ribbon */}
                  {isRecommended && (
                    <div style={{ position: "absolute", top: 0, right: 0, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: 8.5, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px 3px 14px", clipPath: "polygon(12px 0,100% 0,100% 100%,0 100%)" }}>
                      ✦ MOST POPULAR
                    </div>
                  )}

                  {/* Radio */}
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${isActive ? "#c9963a" : "rgba(14,27,46,0.15)"}`, background: isActive ? "rgba(201,150,58,0.15)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9963a" }} />}
                  </div>

                  {/* Label + per-day */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: isActive ? "#fff" : "#0e1b2e", marginBottom: 2 }}>{d.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isActive ? "rgba(255,255,255,0.45)" : "#9ca3af" }}>{d.perday} · Cancel anytime</div>
                  </div>

                  {/* Price with strikethrough anchor */}
                  <div style={{ textAlign: "right" }}>
                    {strikePrice && (
                      <div style={{ fontSize: 10, color: isActive ? "rgba(255,255,255,0.3)" : "#d1d5db", textDecoration: "line-through", marginBottom: 1 }}>
                        ₹{strikePrice.toLocaleString("en-IN")}
                      </div>
                    )}
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.35rem", fontWeight: 900, lineHeight: 1, color: isActive ? "#c9963a" : "#0e1b2e" }}>
                      ₹{d.price.toLocaleString("en-IN")}
                    </div>
                    {d.save > 0
                      ? <div style={{ fontSize: 10, fontWeight: 700, color: "#10b981", marginTop: 2 }}>Save ₹{d.save.toLocaleString("en-IN")}</div>
                      : <div style={{ fontSize: 10, color: "#d1d5db", marginTop: 2 }}>Base price</div>
                    }
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[["🔒","SSL Secure"], ["↩️","Cancel anytime"], ["📞","24/7 Support"], ["🇮🇳","GST Invoice"], ["☁️","Cloud Backup"]].map(([icon, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#374151", background: "#fff", border: "1px solid rgba(14,27,46,0.08)", borderRadius: 100, padding: "5px 10px", boxShadow: "0 1px 4px rgba(14,27,46,0.04)" }}>
                <span>{icon}</span> {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN: ORDER SUMMARY ── */}
        <div className="summary-sticky" style={{ background: "#fff", border: "1.5px solid rgba(14,27,46,0.08)", borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 24px rgba(14,27,46,0.07)", position: "sticky", top: 24 }}>

          {/* Summary header */}
          <div style={{ background: "linear-gradient(135deg,#0e1b2e,#1a2d47)", padding: "20px 22px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-40px", right: "-30px", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,150,58,0.18) 0%,transparent 70%)" }} />
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", marginBottom: 6 }}>Your Order Summary</div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.15rem", fontWeight: 900, color: "#fff", marginBottom: 2 }}>{plan.name}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#c9963a" }}>{selected.label} Plan</div>
          </div>

          {/* Social proof */}
          <div style={{ margin: "16px 22px 0", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex" }}>
              {["#1e4fba","#15803d","#c2410c","#6d28d9"].map((bg, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid #fff", marginLeft: i === 0 ? 0 : -6, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>
                  {["R","S","K","M"][i]}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#065f46", lineHeight: 1.4 }}>4 shop owners in your area subscribed this week</div>
          </div>

          {/* Scarcity bar */}
          <div style={{ margin: "12px 22px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, fontWeight: 700, color: "#374151", marginBottom: 5 }}>
              <span>Trial slots filling up</span>
              <span style={{ color: "#c2410c" }}>73% full</span>
            </div>
            <div style={{ height: 6, background: "#f1f5f9", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "73%", background: "linear-gradient(90deg,#10b981,#059669)", borderRadius: 100 }} />
            </div>
          </div>

          {/* Line items — You Save uses ctx.saving so it is always correct */}
          <div style={{ padding: "16px 22px 0" }}>
            {[
              { label: "Plan Price",   val: `₹${selected.price.toLocaleString("en-IN")}`,         color: "#0e1b2e"  },
              { label: "GST (18%)",    val: "₹0 (Trial)",                                           color: "#10b981"  },
              { label: "Platform Fee", val: `₹${selected.fee}`,                                     color: "#0e1b2e"  },
              { label: "You Save",     val: ctx ? `₹${ctx.saving.toLocaleString("en-IN")}` : "—",  color: ctx ? "#10b981" : "#9ca3af" },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "8px 0", borderBottom: "1px solid rgba(14,27,46,0.05)" }}>
                <span style={{ color: "#6b7280", fontWeight: 500 }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ background: "linear-gradient(135deg,rgba(201,150,58,0.08),rgba(201,150,58,0.04))", borderTop: "1.5px solid rgba(201,150,58,0.2)", padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Payable</div>
              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500, marginTop: 2 }}>Incl. all fees</div>
            </div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.6rem", fontWeight: 900, color: "#0e1b2e", letterSpacing: "-0.03em" }}>
              ₹{total.toLocaleString("en-IN")}
            </div>
          </div>

          {/* CTA — opens Razorpay */}
          <div style={{ padding: "0 22px 22px" }}>
            <button
              onClick={handlePayment}
              disabled={loading}
              style={{
                display: "block", width: "100%",
                padding: "15px 20px", borderRadius: 14,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 14, fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                border: "none",
                background: loading
                  ? "linear-gradient(135deg,#d4a853,#b8861a)"
                  : "linear-gradient(135deg,#c9963a,#e8a020)",
                color: "#0e1b2e",
                boxShadow: "0 8px 28px rgba(201,150,58,0.45)",
                transition: "all .2s ease",
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading
                ? "⏳ Opening Payment..."
                : `🚀 Proceed to Pay ₹${total.toLocaleString("en-IN")}`
              }
            </button>

            <div style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", fontWeight: 500, marginTop: 10 }}>
              🔒 <strong style={{ color: "#374151" }}>100% Secure</strong> · Powered by Razorpay · No auto-charge
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        @media (max-width: 700px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
            padding: 16px 14px !important;
            gap: 16px !important;
          }
          .summary-sticky {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
