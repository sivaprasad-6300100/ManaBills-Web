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

// ✅ ALL TESTIMONIALS — AP Telugu English style (not Hindi)
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


/* ═══════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate();

  const [modal,       setModal]       = useState(null);
  const [isLoggedIn,  setLoggedIn]    = useState(false);
  const [message,     setMessage]     = useState({ text: "", type: "" });
  const [loading,     setLoading]     = useState(false);
  const [activeTesti, setActiveTesti] = useState(0);

  const [loginData,  setLoginData]  = useState({ mobile_number: "", password: "" });
  const [signupData, setSignupData] = useState({ full_name: "", mobile_number: "", password: "" });

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

  const openModal  = (type) => { setModal(type); setMessage({ text: "", type: "" }); };
  const closeModal = ()     => { setModal(null);  setMessage({ text: "", type: "" }); };

  const handleLoginSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setMessage({ text: "", type: "" });
    try {
      const res = await publicAxios.post("auth/login/", loginData);
      localStorage.setItem("access_token",  res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      // Save full_name from API response if available, else keep mobile
      const userData = {
        mobile_number: loginData.mobile_number,
        full_name: res.data.full_name || res.data.name || "",
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setLoggedIn(true);
      setMessage({ text: "Login successful! Redirecting…", type: "success" });
      setTimeout(() => navigate("/dashboard"), 700);
    } catch {
      setMessage({ text: "Invalid credentials. Please try again.", type: "error" });
    } finally { setLoading(false); }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setMessage({ text: "", type: "" });
    try {
      await publicAxios.post("auth/signup/", signupData);
      setMessage({ text: "Account created! Please sign in.", type: "success" });
      setTimeout(() => openModal("login"), 1100);
    } catch {
      setMessage({ text: "Mobile already registered. Sign in instead.", type: "error" });
    } finally { setLoading(false); }
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
          {/* ✅ AP style — Andhra Pradesh & Telangana specific */}
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

          {/* ✅ AP style eyebrow */}
          <div className="hp-hero-eyebrow">
            <span className="hp-eyebrow-dot" />
            Andhra Pradesh &amp; Telangana's #1 Billing App
          </div>

          {/* ✅ CHANGED: "Apna Bill. Apna Hisaab." → AP English */}
          <h1 className="hp-hero-h1">
            Your Bill.<br />
            <span className="hp-gold-text">Your Account. Your Control.</span>
          </h1>

          {/* ✅ AP style subtext */}
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
          {/* ✅ CHANGED: "Kaun use karta hai ManaBills?" → AP English */}
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
          {/* ✅ CHANGED: "Sab kuch ek jagah" → AP English */}
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
          {/* ✅ CHANGED: "Hamare customers kya kehte hain" → AP English */}
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
          {/* ✅ CHANGED: "Sirf ₹99 se shuru — koi hidden charge nahi" → AP English */}
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
          {/* ✅ CHANGED: "Aaj hi shuru karein — bilkul free" → AP English */}
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
            {/* ✅ AP style footer tagline */}
            <p className="hp-footer-tag">
              Andhra Pradesh &amp; Telangana's trusted billing &amp; expense management app
            </p>
            <a
              href="https://wa.me/919999999999"
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
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer">WhatsApp Help</a>
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
          {/* ✅ AP style footer bottom */}
          <span>© 2026 ManaBills. All rights reserved. · Made with ❤️ in Andhra Pradesh</span>
          <span>GST Compliant · Secure Payments</span>
        </div>
      </footer>

      {/* WhatsApp float */}
      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noreferrer"
        className="hp-wa-float"
        title="Chat on WhatsApp"
      >
        💬
      </a>

      {/* ══ AUTH MODAL ══ */}
      {modal && (
        <div className="hp-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="hp-modal">
            <button className="hp-modal-close" onClick={closeModal}>✕</button>
            <div className="hp-modal-logo">Mana<span>Bills</span></div>

            {modal === "login" ? (
              <>
                <h2 className="hp-modal-h2">Welcome Back 👋</h2>
                <p className="hp-modal-desc">Sign in to your ManaBills account</p>
                <form onSubmit={handleLoginSubmit}>
                  <div className="hp-field">
                    <label>Mobile Number</label>
                    <input type="text" placeholder="Enter your mobile number"
                      value={loginData.mobile_number}
                      onChange={e => setLoginData({ ...loginData, mobile_number: e.target.value })} required />
                  </div>
                  <div className="hp-field">
                    <label>Password</label>
                    <input type="password" placeholder="Enter your password"
                      value={loginData.password}
                      onChange={e => setLoginData({ ...loginData, password: e.target.value })} required />
                  </div>
                  <button type="submit" className="hp-modal-btn hp-modal-login" disabled={loading}>
                    {loading ? "Signing in…" : "Sign In →"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="hp-modal-h2">Create Free Account 🎉</h2>
                <p className="hp-modal-desc">Join 12,000+ businesses across AP &amp; Telangana</p>
                <form onSubmit={handleSignupSubmit}>
                  <div className="hp-field">
                    <label>Full Name</label>
                    <input type="text" placeholder="Your full name"
                      value={signupData.full_name}
                      onChange={e => setSignupData({ ...signupData, full_name: e.target.value })} required />
                  </div>
                  <div className="hp-field">
                    <label>Mobile Number</label>
                    <input type="text" placeholder="Your mobile number"
                      value={signupData.mobile_number}
                      onChange={e => setSignupData({ ...signupData, mobile_number: e.target.value })} required />
                  </div>
                  <div className="hp-field">
                    <label>Password</label>
                    <input type="password" placeholder="Create a strong password"
                      value={signupData.password}
                      onChange={e => setSignupData({ ...signupData, password: e.target.value })} required />
                  </div>
                  <button type="submit" className="hp-modal-btn hp-modal-signup" disabled={loading}>
                    {loading ? "Creating account…" : "Create Free Account →"}
                  </button>
                </form>
              </>
            )}

            {message.text && (
              <p className={`hp-modal-msg ${message.type}`}>{message.text}</p>
            )}
            <p className="hp-modal-switch">
              {modal === "login"
                ? <> No account? <button onClick={() => openModal("signup")}>Sign up free</button> </>
                : <> Have an account? <button onClick={() => openModal("login")}>Sign in here</button> </>
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
