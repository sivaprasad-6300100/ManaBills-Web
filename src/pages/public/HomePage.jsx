import React, { useState, useEffect } from "react";
import { publicAxios } from "../../services/api";
import { useNavigate } from "react-router-dom";
import '../../styles/global/publicHomePage.css'


/* ─── STATIC DATA ─── */
const TRUST_BADGES = [
  { icon: "🔒", label: "Bank-grade Security" },
  { icon: "📄", label: "GST Compliant" },
  { icon: "🇮🇳", label: "Made in India" },
  { icon: "⚡", label: "Works Offline" },
  { icon: "☁️", label: "Cloud Backup" },
  { icon: "📱", label: "Mobile Ready" },
];

const FOR_WHO = [
  { icon: "🛍️", title: "Retail & Kirana Shops",  desc: "GST invoices, stock tracking, customer ledger — all in one tap.",    tag: "Most Popular" },
  { icon: "🏗️", title: "Contractors & Builders", desc: "Track project costs, labour payments, and material bills easily.",    tag: "New" },
  { icon: "🏠", title: "Families & Households",  desc: "Manage monthly expenses, utility bills, and savings goals.",          tag: "" },
  { icon: "💼", title: "Freelancers & Agencies", desc: "Custom quotations, client invoices, and payment tracking.",           tag: "" },
];

const FEATURES = [
  { icon: "🧾", color: "#1e4fba", bg: "rgba(30,79,186,0.1)",  title: "GST Invoices in 30 Seconds",  desc: "Tax-compliant invoices instantly with PDF export and auto-calculations. Send directly on WhatsApp." },
  { icon: "📊", color: "#c9963a", bg: "rgba(201,150,58,0.1)", title: "Smart Expense Tracking",       desc: "Auto-categorize spending. See exactly where your money is going every single month." },
  { icon: "🏗️", color: "#1a6b3e", bg: "rgba(26,107,62,0.1)",  title: "Construction Billing",         desc: "Manage materials, labour, contractors and project budgets all in one place." },
  { icon: "📦", color: "#7c3aed", bg: "rgba(124,58,237,0.1)", title: "Stock Management",             desc: "Track inventory levels, set reorder alerts, and never run out of stock again." },
  { icon: "👥", color: "#0891b2", bg: "rgba(8,145,178,0.1)",  title: "Customer Ledger",              desc: "Know who owes you money. Automated payment reminders sent on WhatsApp." },
  { icon: "✨", color: "#e8780a", bg: "rgba(232,120,10,0.1)", title: "AI Financial Insights",        desc: "Smart tips to save money. Spot unusual spending before it becomes a big problem." },
];

const BEFORE_AFTER = [
  { before: "Notebook or Excel billing",           after: "Digital GST invoices in 30 seconds" },
  { before: "Manual tax calculations",             after: "Auto GST, totals & discounts" },
  { before: "Lost receipts & forgotten payments",  after: "Cloud backup, never lose a bill" },
  { before: "Hours of end-month accounting",       after: "One-click monthly reports" },
  { before: "Chasing customers for payment",       after: "Auto WhatsApp payment reminders" },
  { before: "No idea where money is going",        after: "Real-time expense dashboard" },
];

const TESTIMONIALS = [
  {
    name: "Ramesh Reddy",
    role: "Hardware Store Owner, Hyderabad",
    avatar: "RR",
    stars: 5,
    text: "Earlier one invoice was taking 20 minutes only na. Now 30 seconds itself it is done. ManaBills completely changed my business only.",
  },
  {
    name: "Sunita Sharma",
    role: "Boutique Owner, Vijayawada",
    avatar: "SS",
    stars: 5,
    text: "GST filing time came down from 3 hours to 15 minutes only. Customer ledger feature is too good — everyone's account is crystal clear itself.",
  },
  {
    name: "Anil Kumar",
    role: "Construction Contractor, Warangal",
    avatar: "AK",
    stars: 5,
    text: "Labour payments, material cost, project budget — everything is in one place only. Very less price but very professional tool it is.",
  },
];

const PRICING = [
  {
    name: "Home Expense",
    price: "₹99",
    per: "/month",
    trial: "7 Days Free",
    color: "#1a6b3e",
    highlight: false,
    features: ["Expense tracking", "Monthly reports", "Bill reminders", "AI savings tips"],
  },
  {
    name: "Business Billing",
    price: "₹199",
    per: "/month",
    trial: "3 Days Free",
    color: "#1e4fba",
    highlight: true,
    features: ["GST invoices", "Customer ledger", "Stock tracking", "WhatsApp reminders", "PDF export"],
  },
  {
    name: "Construction",
    price: "₹699",
    per: "/month",
    trial: "Free Plan Available",
    color: "#c9963a",
    highlight: false,
    features: ["Project budgeting", "Labour billing", "Material tracking", "Contractor payments", "Cost reports"],
  },
];

/* ─── EYE ICON COMPONENT ─── */
const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

/* ─── PASSWORD INPUT COMPONENT ─── */
const PasswordInput = ({ placeholder, value, onChange, id }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        style={{ paddingRight: "44px" }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer",
          color: "var(--muted, #7a8898)", padding: "4px",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "color 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--navy, #0e1b2e)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--muted, #7a8898)"}
        title={show ? "Hide password" : "Show password"}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate();

  const [modal,         setModal]         = useState(null);
  const [isLoggedIn,    setLoggedIn]       = useState(false);
  const [message,       setMessage]        = useState({ text: "", type: "" });
  const [loading,       setLoading]        = useState(false);
  const [activeTesti,   setActiveTesti]    = useState(0);
  const [forgotMode, setForgotMode] = useState(false); // forgot password mode
  const [forgotStep, setForgotStep] = useState(1); // 1=mobile, 2=otp, 3=newpass
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");

  const [loginData,  setLoginData]  = useState({ identifier: "", password: "" });
  const [signupData, setSignupData] = useState({
    full_name: "",
    mobile_number: "",
    password: "",
    confirm_password: "",
  });

  /* auto-rotate testimonials */
  useEffect(() => {
    const t = setInterval(() => setActiveTesti(p => (p + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  /* redirect if already logged in */
  useEffect(() => {
    if (localStorage.getItem("access_token")) {
      setLoggedIn(true);
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const openModal = (type) => {
    setModal(type);
    setMessage({ text: "", type: "" });
    setForgotMode(false);
    setForgotStep(1);
    setForgotMobile("");
    setForgotOtp("");
    setForgotNewPass("");
    setForgotConfirmPass("");
  };
  const closeModal = () => {
    setModal(null);
    setMessage({ text: "", type: "" });
    setForgotMode(false);
    setForgotStep(1);
    setForgotMobile("");
    setForgotOtp("");
    setForgotNewPass("");
    setForgotConfirmPass("");
  };

  // Reset helper
  const resetForgot = () => {
    setForgotStep(1);
    setForgotMobile("");
    setForgotOtp("");
    setForgotNewPass("");
    setForgotConfirmPass("");
    setMessage({ text: "", type: "" });
  };

  /* ── LOGIN SUBMIT ── */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    // identifier can be mobile number or username
    const isMobile = /^\d+$/.test(loginData.identifier.trim());
    const payload = isMobile
      ? { mobile_number: loginData.identifier.trim(), password: loginData.password }
      : { username: loginData.identifier.trim(), password: loginData.password };

    try {
      const res = await publicAxios.post("auth/login/", payload);
      localStorage.setItem("access_token",  res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      const userData = {
        mobile_number: res.data.mobile_number || loginData.identifier,
        full_name: res.data.full_name || res.data.name || "",
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setLoggedIn(true);
      setMessage({ text: "Login successful! Redirecting…", type: "success" });
      setTimeout(() => navigate("/dashboard"), 700);
    } catch {
      setMessage({ text: "Invalid credentials. Please check your mobile/username and password.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  /* ── SIGNUP SUBMIT ── */
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!signupData.full_name.trim()) {
      setMessage({ text: "Please enter your full name.", type: "error" }); return;
    }
    if (!/^\d{10}$/.test(signupData.mobile_number.trim())) {
      setMessage({ text: "Enter a valid 10-digit mobile number.", type: "error" }); return;
    }
    if (signupData.password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" }); return;
    }
    if (signupData.password !== signupData.confirm_password) {
      setMessage({ text: "Passwords do not match. Please re-enter.", type: "error" }); return;
    }

    setLoading(true);
    try {
      await publicAxios.post("auth/signup/", {
        full_name:     signupData.full_name,
        mobile_number: signupData.mobile_number,
        password:      signupData.password,
      });
      setMessage({ text: "Account created successfully! Please sign in.", type: "success" });
      setSignupData({ full_name: "", mobile_number: "", password: "", confirm_password: "" });
      setTimeout(() => openModal("login"), 1200);
    } catch {
      setMessage({ text: "Mobile number already registered. Sign in instead.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(forgotMobile)) {
      setMessage({ text: "Enter a valid 10-digit mobile number.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await publicAxios.post("auth/forgot-password/", { phone: forgotMobile });
      setMessage({ text: "OTP sent to your registered mobile!", type: "success" });
      setForgotStep(2);
    } catch (err) {
      const msg = err?.response?.data?.phone?.[0] || "Mobile number not found.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (forgotOtp.length !== 6) {
      setMessage({ text: "Enter the 6-digit OTP.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await publicAxios.post("auth/verify-otp/", {
        phone: forgotMobile,
        otp: forgotOtp,
      });
      setMessage({ text: "OTP verified! Set your new password.", type: "success" });
      setForgotStep(3);
    } catch (err) {
      const msg = err?.response?.data?.error || "Invalid OTP. Try again.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (forgotNewPass.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await publicAxios.post("auth/reset-password/", {
        phone: forgotMobile,
        otp: forgotOtp,
        new_password: forgotNewPass,
      });
      setMessage({ text: "Password reset! Please sign in with your new password.", type: "success" });
      setTimeout(() => {
        resetForgot();
        setForgotMode(false);
        openModal("login");
      }, 1800);
    } catch (err) {
      const msg = err?.response?.data?.error || "Reset failed. Please try again.";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="hp-page">

      {/* ══ 1. NAVBAR ══ */}
      <nav className="hp-nav">
        <div className="hp-nav-left">
          <div className="hp-logo">Mana<span>Bills</span></div>
          <div className="hp-nav-trust">
            <span className="hp-trust-dot" />
            Trusted by 12,000+ businesses
          </div>
        </div>
        <div className="hp-nav-right">
          {isLoggedIn ? (
            <button className="hp-btn-ghost" onClick={handleLogout}>Logout</button>
          ) : (
            <>
              <button className="hp-btn-ghost"   onClick={() => openModal("login")}>Sign In</button>
              <button className="hp-btn-primary"  onClick={() => openModal("signup")}>Get Started Free →</button>
            </>
          )}
        </div>
      </nav>

      {/* ══ 2. SOCIAL PROOF BAR ══ */}
      <div className="hp-proof-bar">
        <div className="hp-proof-inner">
          <span className="hp-proof-stars">⭐⭐⭐⭐⭐</span>
          <span className="hp-proof-text">
            <strong>12,000+ shop owners</strong> across Andhra Pradesh &amp; Telangana are using ManaBills daily
          </span>
          <div className="hp-proof-avatars">
            {["RR","SK","AM","PP","VK"].map((a, i) => (
              <div key={i} className="hp-proof-avatar" style={{ zIndex: 5 - i, left: i * 18 }}>{a}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 3. HERO ══ */}
      <section className="hp-hero">
        <div className="hp-hero-content">
          <div className="hp-hero-eyebrow">
            <span className="hp-eyebrow-dot" />
            Andhra Pradesh &amp; Telangana's #1 Billing App
          </div>
          <h1 className="hp-hero-h1">
            Your Bill.<br />
            <span className="hp-gold-text">Your Account. Your Control.</span>
          </h1>
          <p className="hp-hero-sub">
            GST invoices, expense tracking, construction billing — everything your
            shop or business needs, all in one simple app only.
            No accountant needed. No confusion at all.
          </p>
          <div className="hp-hero-cta-row">
            <button className="hp-cta-main"  onClick={() => openModal("signup")}>🚀 Start Free — No Card Needed</button>
            <button className="hp-cta-ghost" onClick={() => openModal("login")}>Sign In →</button>
          </div>
          <div className="hp-hero-mini-stats">
            <div className="hp-mini-stat"><strong>50K+</strong><span>Invoices/month</span></div>
            <div className="hp-mini-divider" />
            <div className="hp-mini-stat"><strong>₹2Cr+</strong><span>Tracked monthly</span></div>
            <div className="hp-mini-divider" />
            <div className="hp-mini-stat"><strong>4.9★</strong><span>App rating</span></div>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="hp-hero-visual">
          <div className="hp-phone-wrap">
            <div className="hp-phone-glow" />
            <div className="hp-phone">
              <div className="hp-phone-notch" />
              <div className="hp-phone-screen">
                <div className="hp-mock-header">
                  <span className="hp-mock-logo-text">ManaBills</span>
                  <span className="hp-mock-badge">GST Invoice</span>
                </div>
                <div className="hp-mock-shop">Reddy Hardware Store</div>
                <div className="hp-mock-invno">INV-2026-0124</div>
                <div className="hp-mock-row"><span>Cement (50 bags)</span><span>₹18,000</span></div>
                <div className="hp-mock-row"><span>Steel Rods (100kg)</span><span>₹12,500</span></div>
                <div className="hp-mock-row"><span>Paint (10L)</span><span>₹4,200</span></div>
                <div className="hp-mock-sep" />
                <div className="hp-mock-row hp-mock-gst"><span>GST (18%)</span><span>₹6,246</span></div>
                <div className="hp-mock-row hp-mock-total"><span>Total</span><span>₹40,946</span></div>
                <div className="hp-mock-paid">✓ PAID</div>
              </div>
            </div>
            <div className="hp-chip hp-chip-1">✅ GST Auto-Calc</div>
            <div className="hp-chip hp-chip-2">📲 Sent on WhatsApp</div>
            <div className="hp-chip hp-chip-3">⚡ 28 sec to create</div>
          </div>
        </div>
      </section>

      {/* ══ 4. TRUST BADGES ══ */}
      <section className="hp-trust-section">
        <div className="hp-trust-grid">
          {TRUST_BADGES.map((b, i) => (
            <div key={i} className="hp-trust-badge">
              <span className="hp-trust-icon">{b.icon}</span>
              <span className="hp-trust-label">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 5. WHO IS IT FOR ══ */}
      <section className="hp-section" id="who">
        <div className="hp-section-head">
          <div className="hp-eyebrow">Built for every business</div>
          <h2 className="hp-section-h2">Who All Are Using ManaBills?</h2>
          <p className="hp-section-p">
            From small kirana shops to large construction firms — one platform is fitting all types of businesses only.
          </p>
        </div>
        <div className="hp-for-grid">
          {FOR_WHO.map((item, i) => (
            <div key={i} className="hp-for-card">
              {item.tag && <div className="hp-for-tag">{item.tag}</div>}
              <div className="hp-for-icon">{item.icon}</div>
              <h3 className="hp-for-title">{item.title}</h3>
              <p className="hp-for-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 6. FEATURES ══ */}
      <section className="hp-section hp-feat-bg" id="features">
        <div className="hp-section-head">
          <div className="hp-eyebrow">Everything included</div>
          <h2 className="hp-section-h2">All Features in One Place Only</h2>
          <p className="hp-section-p">
            No extra software needed. No separate apps required. Everything is built inside itself only.
          </p>
        </div>
        <div className="hp-feat-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="hp-feat-card">
              <div className="hp-feat-icon" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
              <h3 className="hp-feat-title">{f.title}</h3>
              <p className="hp-feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 7. BEFORE / AFTER ══ */}
      <section className="hp-section">
        <div className="hp-section-head">
          <div className="hp-eyebrow">The difference is real</div>
          <h2 className="hp-section-h2">Business Life Before &amp; After ManaBills</h2>
          <p className="hp-section-p">
            See how shop owners across Andhra Pradesh and Telangana saved time and money after switching.
          </p>
        </div>
        <div className="hp-ba-wrap">
          <div className="hp-ba-col hp-ba-before">
            <div className="hp-ba-head hp-ba-head-bad">😓 Before ManaBills</div>
            {BEFORE_AFTER.map((r, i) => (
              <div key={i} className="hp-ba-row hp-ba-bad">
                <span className="hp-ba-x">✗</span>{r.before}
              </div>
            ))}
          </div>
          <div className="hp-ba-vs">VS</div>
          <div className="hp-ba-col hp-ba-after">
            <div className="hp-ba-head hp-ba-head-good">🚀 After ManaBills</div>
            {BEFORE_AFTER.map((r, i) => (
              <div key={i} className="hp-ba-row hp-ba-good">
                <span className="hp-ba-check">✓</span>{r.after}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. TESTIMONIALS ══ */}
      <section className="hp-section hp-testi-bg">
        <div className="hp-section-head">
          <div className="hp-eyebrow">Real businesses, real results</div>
          <h2 className="hp-section-h2">What Our Customers Are Telling</h2>
          <p className="hp-section-p">
            Real shop owners from Hyderabad, Vijayawada and Warangal are sharing their experience only.
          </p>
        </div>
        <div className="hp-testi-grid">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className={`hp-testi-card ${i === activeTesti ? "hp-testi-active" : ""}`}
              onClick={() => setActiveTesti(i)}
            >
              <div className="hp-testi-stars">{"⭐".repeat(t.stars)}</div>
              <p className="hp-testi-text">"{t.text}"</p>
              <div className="hp-testi-author">
                <div className="hp-testi-av">{t.avatar}</div>
                <div>
                  <div className="hp-testi-name">{t.name}</div>
                  <div className="hp-testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hp-testi-dots">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              className={`hp-dot ${i === activeTesti ? "hp-dot-on" : ""}`}
              onClick={() => setActiveTesti(i)}
            />
          ))}
        </div>
      </section>

      {/* ══ 9. PRICING ══ */}
      <section className="hp-section" id="pricing">
        <div className="hp-section-head">
          <div className="hp-eyebrow">Simple, honest pricing</div>
          <h2 className="hp-section-h2">Starting ₹99 Only — Zero Hidden Charges</h2>
          <p className="hp-section-p">
            Start free itself. Upgrade only when you are ready. Cancel anytime. No tension at all.
          </p>
        </div>
        <div className="hp-pricing-grid">
          {PRICING.map((plan, i) => (
            <div key={i} className={`hp-plan ${plan.highlight ? "hp-plan-pop" : ""}`}>
              {plan.highlight && <div className="hp-plan-badge">⭐ Most Popular</div>}
              <h3 className="hp-plan-name">{plan.name}</h3>
              <div className="hp-plan-price">{plan.price}<span>{plan.per}</span></div>
              <div className="hp-plan-trial" style={{ color: plan.color }}>✦ {plan.trial}</div>
              <ul className="hp-plan-feats">
                {plan.features.map((f, j) => (
                  <li key={j}><span className="hp-plan-check">✓</span>{f}</li>
                ))}
              </ul>
              <button
                className="hp-plan-btn"
                style={plan.highlight
                  ? { background: `linear-gradient(135deg,${plan.color},#4f46e5)` }
                  : { background: plan.color }}
                onClick={() => openModal("signup")}
              >
                Start Free Trial
              </button>
            </div>
          ))}
        </div>
        <p className="hp-pricing-note">
          🔒 No credit card required · Cancel anytime · 24/7 WhatsApp support is available
        </p>
      </section>

      {/* ══ 10. FINAL CTA ══ */}
      <section className="hp-final">
        <div className="hp-final-inner">
          <div className="hp-final-emoji">🚀</div>
          <h2 className="hp-final-h2">Start Today Itself — Completely Free Only</h2>
          <p className="hp-final-sub">
            Join 12,000+ shop owners from Andhra Pradesh and Telangana who are already
            saving time and money with ManaBills. No setup fees. No contracts. Results are guaranteed.
          </p>
          <button className="hp-final-btn" onClick={() => openModal("signup")}>
            Start Your Free Trial Today →
          </button>
          <p className="hp-final-note">
            No credit card · Free forever plan is available · Setup is done in 2 minutes only
          </p>
        </div>
      </section>

      {/* ══ 11. FOOTER ══ */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-brand">
            <div className="hp-footer-logo">Mana<span>Bills</span></div>
            <p className="hp-footer-tag">
              Andhra Pradesh &amp; Telangana's trusted billing &amp; expense management app
            </p>
            <a
              href="https://wa.me/919550544441"
              target="_blank"
              rel="noreferrer"
              className="hp-wa-link"
            >
              💬 Chat on WhatsApp
            </a>
          </div>
          <div className="hp-footer-cols">
            <div className="hp-footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#who">Who It's For</a>
            </div>
            <div className="hp-footer-col">
              <h4>Support</h4>
              <a href="https://wa.me/919550544441" target="_blank" rel="noreferrer">WhatsApp Help</a>
              <a href="mailto:support@manabills.in">Email Us</a>
            </div>
            <div className="hp-footer-col">
              <h4>Legal</h4>
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Use</a>
              <a href="#refund">Refund Policy</a>
            </div>
          </div>
        </div>
        <div className="hp-footer-bottom">
          <span>© 2026 ManaBills. All rights reserved. · Made with ❤️ in Andhra Pradesh</span>
          <span>GST Compliant · Secure Payments</span>
        </div>
      </footer>

      {/* WhatsApp float */}
      <a
        href="https://wa.me/919550544441"
        target="_blank"
        rel="noreferrer"
        className="hp-wa-float"
        title="Chat on WhatsApp"
      >
        💬
      </a>

      {/* ══════════════════════════════════════════
          AUTH MODAL
      ══════════════════════════════════════════ */}
      {modal && (
        <div className="hp-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="hp-modal" style={{ maxWidth: modal === "signup" ? "420px" : "400px" }}>
            <button className="hp-modal-close" onClick={closeModal}>✕</button>
            <div className="hp-modal-logo">Mana<span>Bills</span></div>

            {/* ══ SIGN UP MODAL ══ */}
            {modal === "signup" && (
              <>
                <h2 className="hp-modal-h2">Create Free Account 🎉</h2>
                <p className="hp-modal-desc">Join 12,000+ businesses across AP &amp; Telangana</p>

                <form onSubmit={handleSignupSubmit}>

                  {/* Full Name */}
                  <div className="hp-field">
                    <label htmlFor="su-name">Full Name</label>
                    <input
                      id="su-name"
                      type="text"
                      placeholder="Your full name"
                      value={signupData.full_name}
                      onChange={e => setSignupData({ ...signupData, full_name: e.target.value })}
                      required
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="hp-field">
                    <label htmlFor="su-mobile">Mobile Number</label>
                    <input
                      id="su-mobile"
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={signupData.mobile_number}
                      onChange={e => setSignupData({ ...signupData, mobile_number: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      maxLength={10}
                      required
                    />
                  </div>

                  {/* Create Password */}
                  <div className="hp-field">
                    <label htmlFor="su-pass">Create Password</label>
                    <PasswordInput
                      id="su-pass"
                      placeholder="Min. 6 characters"
                      value={signupData.password}
                      onChange={e => setSignupData({ ...signupData, password: e.target.value })}
                    />
                    {/* Strength indicator */}
                    {signupData.password.length > 0 && (
                      <div style={{ marginTop: "6px", display: "flex", gap: "4px", alignItems: "center" }}>
                        {[1, 2, 3, 4].map(lvl => {
                          const len = signupData.password.length;
                          const hasUpper = /[A-Z]/.test(signupData.password);
                          const hasNum   = /\d/.test(signupData.password);
                          const hasSpec  = /[^a-zA-Z0-9]/.test(signupData.password);
                          const score = (len >= 6 ? 1 : 0) + (len >= 8 ? 1 : 0) + (hasUpper || hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
                          const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
                          return (
                            <div key={lvl} style={{
                              flex: 1, height: "3px", borderRadius: "2px",
                              background: lvl <= score ? colors[score - 1] : "#e5e7eb",
                              transition: "background 0.3s",
                            }} />
                          );
                        })}
                        <span style={{ fontSize: "0.65rem", color: "var(--muted)", marginLeft: "4px", whiteSpace: "nowrap" }}>
                          {signupData.password.length < 6 ? "Too short" :
                           signupData.password.length < 8 ? "Weak" :
                           /[^a-zA-Z0-9]/.test(signupData.password) ? "Strong" : "Good"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Re-enter Password */}
                  <div className="hp-field">
                    <label htmlFor="su-confirm">Re-enter Password</label>
                    <PasswordInput
                      id="su-confirm"
                      placeholder="Confirm your password"
                      value={signupData.confirm_password}
                      onChange={e => setSignupData({ ...signupData, confirm_password: e.target.value })}
                    />
                    {/* Match indicator */}
                    {signupData.confirm_password.length > 0 && (
                      <div style={{
                        marginTop: "5px", fontSize: "0.72rem", fontWeight: 600,
                        color: signupData.password === signupData.confirm_password ? "#22c55e" : "#ef4444",
                        display: "flex", alignItems: "center", gap: "4px",
                      }}>
                        {signupData.password === signupData.confirm_password ? "✓ Passwords match" : "✗ Passwords don't match"}
                      </div>
                    )}
                  </div>

                  {/* Terms note */}
                  <p style={{ fontSize: "0.72rem", color: "var(--muted)", marginBottom: "0.5rem", lineHeight: 1.5 }}>
                    By creating an account you agree to our{" "}
                    <a href="#terms" style={{ color: "var(--blue)", textDecoration: "none" }}>Terms of Use</a>{" "}
                    and{" "}
                    <a href="#privacy" style={{ color: "var(--blue)", textDecoration: "none" }}>Privacy Policy</a>.
                  </p>

                  <button
                    type="submit"
                    className="hp-modal-btn hp-modal-signup"
                    disabled={loading || (signupData.confirm_password.length > 0 && signupData.password !== signupData.confirm_password)}
                  >
                    {loading ? "Creating account…" : "Create Free Account →"}
                  </button>
                </form>
              </>
            )}

            {/* ══ LOGIN MODAL ══ */}
            {modal === "login" && !forgotMode && (
              <>
                <h2 className="hp-modal-h2">Welcome Back 👋</h2>
                <p className="hp-modal-desc">Sign in to your ManaBills account</p>

                <form onSubmit={handleLoginSubmit}>

                  {/* Mobile / Username */}
                  <div className="hp-field">
                    <label htmlFor="li-id">Mobile Number or Username</label>
                    <input
                      id="li-id"
                      type="text"
                      placeholder="Enter mobile number or username"
                      value={loginData.identifier}
                      onChange={e => setLoginData({ ...loginData, identifier: e.target.value })}
                      required
                      autoComplete="username"
                    />
                    <span style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "3px" }}>
                      You can use your 10-digit mobile number or username
                    </span>
                  </div>

                  {/* Password */}
                  <div className="hp-field">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <label htmlFor="li-pass" style={{ margin: 0 }}>Password</label>
                      <button
                        type="button"
                        onClick={() => { setForgotMode(true); setMessage({ text: "", type: "" }); }}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--blue, #1e4fba)", fontSize: "0.72rem",
                          fontWeight: 600, padding: 0, fontFamily: "inherit",
                          textDecoration: "underline", textUnderlineOffset: "2px",
                        }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <PasswordInput
                      id="li-pass"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="hp-modal-btn hp-modal-login"
                    disabled={loading}
                  >
                    {loading ? "Signing in…" : "Sign In →"}
                  </button>
                </form>
              </>
            )}

            {/* ══ FORGOT PASSWORD FLOW ══ */}
            {modal === "login" && forgotMode && (
              <>
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => { setForgotMode(false); resetForgot(); setMessage({ text: "", type: "" }); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", padding: "0 0 0.5rem 0", fontFamily: "inherit" }}
                >
                  ← Back to Sign In
                </button>

                {/* Step indicators */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
                  {[1, 2, 3].map(step => (
                    <div key={step} style={{
                      flex: 1, height: "4px", borderRadius: "2px",
                      background: forgotStep >= step ? "var(--gold)" : "#e5e7eb",
                      transition: "background 0.3s"
                    }} />
                  ))}
                </div>

                {/* STEP 1 — Mobile */}
                {forgotStep === 1 && (
                  <>
                    <h2 className="hp-modal-h2">Forgot Password? 🔑</h2>
                    <p className="hp-modal-desc">Enter your registered mobile number.</p>
                    <form onSubmit={handleSendOtp}>
                      <div className="hp-field">
                        <label>Mobile Number</label>
                        <input
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={forgotMobile}
                          onChange={e => setForgotMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          maxLength={10}
                          required
                          autoFocus
                        />
                      </div>
                      <button type="submit" className="hp-modal-btn hp-modal-login" disabled={loading}>
                        {loading ? "Sending OTP…" : "Send OTP →"}
                      </button>
                    </form>
                  </>
                )}

                {/* STEP 2 — OTP */}
                {forgotStep === 2 && (
                  <>
                    <h2 className="hp-modal-h2">Enter OTP 📱</h2>
                    <p className="hp-modal-desc">
                      OTP sent to <strong>{forgotMobile}</strong>.
                      <br />
                      <button
                        type="button"
                        onClick={() => { setForgotStep(1); setForgotOtp(""); setMessage({ text: "", type: "" }); }}
                        style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, padding: 0, fontFamily: "inherit" }}
                      >
                        Change number
                      </button>
                    </p>
                    <form onSubmit={handleVerifyOtp}>
                      <div className="hp-field">
                        <label>6-Digit OTP</label>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          value={forgotOtp}
                          onChange={e => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          required
                          autoFocus
                          style={{ letterSpacing: "0.3em", fontSize: "1.2rem", textAlign: "center" }}
                        />
                      </div>
                      <button type="submit" className="hp-modal-btn hp-modal-login" disabled={loading}>
                        {loading ? "Verifying…" : "Verify OTP →"}
                      </button>
                      <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={loading}
                          style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, fontFamily: "inherit" }}
                        >
                          Resend OTP
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* STEP 3 — New Password */}
                {forgotStep === 3 && (
                  <>
                    <h2 className="hp-modal-h2">Set New Password 🔐</h2>
                    <p className="hp-modal-desc">Choose a strong password. Minimum 6 characters.</p>
                    <form onSubmit={handleResetPassword}>
                      <div className="hp-field">
                        <label>New Password</label>
                        <PasswordInput
                          placeholder="Enter new password"
                          value={forgotNewPass}
                          onChange={e => setForgotNewPass(e.target.value)}
                        />
                      </div>
                      <div className="hp-field">
                        <label>Confirm Password</label>
                        <PasswordInput
                          placeholder="Re-enter new password"
                          value={forgotConfirmPass}
                          onChange={e => setForgotConfirmPass(e.target.value)}
                        />
                        {forgotConfirmPass.length > 0 && (
                          <div style={{ marginTop: "5px", fontSize: "0.72rem", fontWeight: 600, color: forgotNewPass === forgotConfirmPass ? "#22c55e" : "#ef4444" }}>
                            {forgotNewPass === forgotConfirmPass ? "✓ Passwords match" : "✗ Passwords don't match"}
                          </div>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="hp-modal-btn hp-modal-login"
                        disabled={loading || (forgotConfirmPass.length > 0 && forgotNewPass !== forgotConfirmPass)}
                      >
                        {loading ? "Resetting…" : "Reset Password →"}
                      </button>
                    </form>
                  </>
                )}
              </>
            )}

            {/* Message */}
            {message.text && (
              <p className={`hp-modal-msg ${message.type}`}>{message.text}</p>
            )}

            {/* Switch between login / signup */}
            {!forgotMode && (
              <p className="hp-modal-switch">
                {modal === "login"
                  ? <> Don't have an account? <button onClick={() => openModal("signup")}>Sign up free</button> </>
                  : <> Already have an account? <button onClick={() => openModal("login")}>Sign in here</button> </>
                }
              </p>
            )}
          </div>
        </div>
      )}

      {/* Inline styles for new auth UI elements */}
      <style>{`
        /* Eye button hover */
        .hp-field .pw-toggle-btn:hover { color: var(--navy) !important; }

        /* Subtle modal divider styling */
        .hp-modal-h2 { margin-bottom: 0.25rem; }
        .hp-modal-desc { margin-bottom: 1.2rem; }

        /* Disable signup button when passwords don't match */
        .hp-modal-btn:disabled { opacity: 0.6; cursor: not-allowed !important; }

        /* Password input wrapper */
        .hp-field > div > input {
          width: 100%;
          padding: 0.75rem 2.8rem 0.75rem 1rem;
          border: 1.5px solid var(--border-2, rgba(14,27,46,0.16));
          border-radius: 0.875rem;
          background: var(--cream, #faf8f4);
          color: var(--text, #0e1b2e);
          font-family: var(--font-b, sans-serif);
          font-size: 0.93rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .hp-field > div > input:focus {
          border-color: var(--gold, #c9963a);
          background: var(--ivory, #fff9f0);
          box-shadow: 0 0 0 3px rgba(201,150,58,0.1);
        }
        .hp-field > div > input::placeholder { color: var(--muted, #7a8898); }

        /* Forgot password button spacing */
        .hp-field label { margin-bottom: 0; }

        /* Back arrow button */
        @media (max-width: 480px) {
          .hp-modal { padding: 1.75rem 1.25rem; }
        }
      `}</style>
    </div>
  );
}
