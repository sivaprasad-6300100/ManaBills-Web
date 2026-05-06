/**
 * CustomerView.jsx — Public QR Customer View with Firebase OTP Login
 *
 * CHANGES FROM ORIGINAL:
 * 1. Added Firebase Phone Auth (OTP) login screen shown before shop content
 * 2. After login, customer name + mobile pre-filled and locked in checkout
 * 3. Session persists in localStorage (name + mobile) — skips login on return
 * 4. Advance payment minimum is 10% (slider starts at 10, enforced)
 * 5. Full payment (100%) also supported
 * 6. Success modal shows order confirmation with persistent user info
 * 7. "Continue Shopping" keeps user logged in — no re-login needed
 *
 * FIREBASE CONFIG: reads from REACT_APP_FIREBASE_* env vars
 * RAZORPAY: unchanged from original
 */

import React, {
  useState, useCallback, useMemo, useEffect, useRef, memo,
} from "react";
import { authAxios } from "../../services/api";

// ─── Firebase imports ─────────────────────────────────────────
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
} from "firebase/auth";

// ─── Firebase init ────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const firebaseAuth = getAuth(firebaseApp);

// ─── Constants ────────────────────────────────────────────────
const TOAST_MS      = 3500;
const SESSION_KEY   = "manabills_cust_session";
const fmt           = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const RAZORPAY_KEY_ID = "rzp_test_SgQPeC1QVxeV77";

// ─── Load Razorpay script ─────────────────────────────────────
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

// ─── Extract scanner ID from URL ─────────────────────────────
const extractScannerIdFromUrl = () => {
  try {
    const path = window.location.pathname;
    const qp   = new URLSearchParams(window.location.search);
    if (qp.get("scanner"))    return qp.get("scanner");
    if (qp.get("scanner_id")) return qp.get("scanner_id");
    const segments = path.split("/").filter(Boolean);
    const markers  = ["shop", "scan", "public", "qr", "customer"];
    for (let i = 0; i < segments.length; i++) {
      if (markers.includes(segments[i]) && segments[i + 1]) return segments[i + 1];
    }
    const last = segments[segments.length - 1];
    if (last && last.length > 4 && last !== "shop") return last;
  } catch { /* ignore */ }
  return null;
};

// ─── API helpers ──────────────────────────────────────────────
const publicFetch = async (url, options = {}) => {
  const base = (typeof window !== "undefined" && window.__API_BASE__)
    || process.env.REACT_APP_API_BASE
    || "/api";
  const fullUrl = url.startsWith("http") ? url : `${base}/${url.replace(/^\//, "")}`;
  const res = await fetch(fullUrl, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.detail || `HTTP ${res.status}`), { status: res.status, data: err });
  }
  return res.json();
};
const publicGet  = (url)       => publicFetch(url);
const publicPost = (url, body) => publicFetch(url, { method: "POST", body: JSON.stringify(body) });

// ─── Sanitize helpers ─────────────────────────────────────────
const sanitizeName   = (v) => v.replace(/[^a-zA-Z\s.'-]/g, "").slice(0, 60);
const sanitizeMobile = (v) => v.replace(/\D/g, "").slice(0, 10);

// ─── Session helpers ──────────────────────────────────────────
const loadSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
};
const saveSession = (data) => {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* ignore */ }
};
const clearSession = () => {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
};

// ─── Shop open/close ──────────────────────────────────────────
const getShopStatus = (timings) => {
  if (!timings) return { open: true, label: "" };
  const now = new Date();
  const day = now.toLocaleDateString("en-IN", { weekday: "long" }).toLowerCase();
  const tod = timings[day] || timings["all"] || timings["weekday"] || null;
  if (!tod || tod.closed) return { open: false, label: "Closed today" };
  const [oh, om] = (tod.open  || "00:00").split(":").map(Number);
  const [ch, cm] = (tod.close || "23:59").split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins < oh * 60 + om) return { open: false, label: `Opens at ${tod.open}` };
  if (mins > ch * 60 + cm) return { open: false, label: `Closed · Opens tomorrow at ${tod.open}` };
  return { open: true, label: `Open until ${tod.close}` };
};

// ─── Category colors / icons ─────────────────────────────────
const CAT_COLORS = [
  "#E8A020","#16A34A","#2563EB","#DC2626","#7C3AED",
  "#0891B2","#B45309","#059669","#D97706","#6D28D9",
];
const CAT_ICONS = {
  fruits:"🍎", vegetables:"🥦", dairy:"🥛", grains:"🌾", meat:"🥩",
  fish:"🐟", snacks:"🍿", beverages:"☕", spices:"🌶️", bakery:"🥖",
  frozen:"❄️", personal:"🧴", household:"🏠", general:"📦",
};
const getCatIcon = (cat = "") => {
  const k = cat.toLowerCase();
  for (const [key, icon] of Object.entries(CAT_ICONS)) {
    if (k.includes(key)) return icon;
  }
  return "📦";
};

// ══════════════════════════════════════════════════════════════
//   STYLES
// ══════════════════════════════════════════════════════════════
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@700;800&display=swap');

  :root {
    --ink:#0A0F1E; --ink2:#3D4660; --ink3:#8892A4;
    --bg:#F4F2EF; --bg2:#ECEAE6; --white:#FFFFFF;
    --gold:#C9841A; --gold2:#E8A020;
    --green:#15803D; --red:#DC2626; --blue:#1E40AF;
    --rzp:#2563EB;
    --r:18px; --sh:0 2px 12px rgba(10,15,30,.07); --sh2:0 8px 32px rgba(10,15,30,.13);
  }

  @keyframes slideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes popIn    { 0%{transform:scale(.8);opacity:0} 65%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes toastIn  { from{opacity:0;transform:translate(-50%,-14px)} to{opacity:1;transform:translate(-50%,0)} }
  @keyframes barUp    { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes breathe  { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.4)} 50%{box-shadow:0 0 0 8px rgba(74,222,128,0)} }
  @keyframes breatheRed{ 0%,100%{box-shadow:0 0 0 0 rgba(252,165,165,.35)} 50%{box-shadow:0 0 0 7px rgba(252,165,165,0)} }
  @keyframes scanLine { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
  @keyframes rzpPulse { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)} 50%{box-shadow:0 0 0 10px rgba(37,99,235,0)} }
  @keyframes loginFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes otpSlide { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
  @keyframes countDown { from{stroke-dashoffset:0} to{stroke-dashoffset:126} }
  @keyframes glowGold { 0%,100%{box-shadow:0 0 0 0 rgba(232,160,32,.5)} 50%{box-shadow:0 0 0 12px rgba(232,160,32,0)} }

  *,*::before,*::after { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }

  /* ─── LOGIN SCREEN ─── */
  .cv-login-root {
    min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(160deg,#060A15 0%,#0D1526 50%,#111827 100%);
    padding:24px 16px; position:relative; overflow:hidden;
  }
  .cv-login-bg-orb {
    position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none;
  }
  .cv-login-bg-orb.a { width:400px; height:400px; background:rgba(201,132,26,.08); top:-100px; right:-100px; }
  .cv-login-bg-orb.b { width:300px; height:300px; background:rgba(37,99,235,.07); bottom:-80px; left:-80px; }
  .cv-login-grid {
    position:absolute; inset:0;
    background-image:repeating-linear-gradient(-55deg,transparent,transparent 40px,rgba(255,255,255,.012) 40px,rgba(255,255,255,.012) 41px);
    pointer-events:none;
  }

  .cv-login-card {
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09);
    border-radius:24px; padding:32px 28px 36px; width:100%; max-width:380px;
    backdrop-filter:blur(20px); position:relative; z-index:1;
    box-shadow:0 32px 80px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.06) inset;
    animation:slideUp .4s cubic-bezier(.34,1.15,.64,1);
  }

  .cv-login-logo { text-align:center; margin-bottom:28px; }
  .cv-login-wordmark {
    font-family:'Playfair Display',serif; font-size:34px; font-weight:800;
    letter-spacing:-0.5px; display:inline-block;
  }
  .cv-login-mana  { color:rgba(255,255,255,.85); }
  .cv-login-bills { color:var(--gold2); position:relative; }
  .cv-login-bills::after {
    content:''; position:absolute; left:0; bottom:-3px; right:0;
    height:2px; background:linear-gradient(90deg,var(--gold2),transparent); border-radius:1px;
  }
  .cv-login-tagline {
    display:block; font-size:10px; letter-spacing:.18em; text-transform:uppercase;
    color:rgba(255,255,255,.25); margin-top:10px; font-family:'DM Sans',sans-serif;
  }

  .cv-login-title {
    font-family:'Sora',sans-serif; font-size:18px; font-weight:700;
    color:#fff; margin:0 0 4px; text-align:center;
  }
  .cv-login-sub { font-size:13px; color:rgba(255,255,255,.35); text-align:center; margin:0 0 26px; font-family:'DM Sans',sans-serif; }

  .cv-login-field { margin-bottom:14px; }
  .cv-login-lbl { font-size:10px; font-weight:700; color:rgba(255,255,255,.35); text-transform:uppercase; letter-spacing:.1em; display:block; margin-bottom:7px; font-family:'DM Sans',sans-serif; }
  .cv-login-inp-wrap { position:relative; }
  .cv-login-inp-ico { position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:15px; pointer-events:none; opacity:.5; }
  .cv-login-inp-prefix { position:absolute; left:44px; top:50%; transform:translateY(-50%); font-size:14px; font-weight:700; color:rgba(255,255,255,.4); font-family:'DM Sans',sans-serif; }
  .cv-login-inp {
    width:100%; padding:13px 14px 13px 44px; border-radius:13px;
    border:1.5px solid rgba(255,255,255,.1); font-size:15px; font-family:'DM Sans',inherit;
    color:#fff; outline:none; background:rgba(255,255,255,.06);
    transition:all .2s; letter-spacing:.02em;
  }
  .cv-login-inp.with-prefix { padding-left:80px; }
  .cv-login-inp:focus { border-color:rgba(232,160,32,.5); background:rgba(255,255,255,.09); box-shadow:0 0 0 3px rgba(232,160,32,.1); }
  .cv-login-inp::placeholder { color:rgba(255,255,255,.2); }
  .cv-login-inp:disabled { opacity:.5; cursor:not-allowed; }

  .cv-login-btn {
    width:100%; padding:14px; border-radius:13px; border:none;
    background:linear-gradient(135deg,var(--gold),var(--gold2));
    color:var(--ink); font-weight:800; font-size:15px; cursor:pointer;
    font-family:'Sora','DM Sans',inherit; transition:all .2s; margin-top:4px;
    box-shadow:0 4px 18px rgba(201,132,26,.35);
    display:flex; align-items:center; justify-content:center; gap:9px;
  }
  .cv-login-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 26px rgba(201,132,26,.5); filter:brightness(1.06); animation:glowGold 1.8s infinite; }
  .cv-login-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; animation:none; }

  /* OTP boxes */
  .cv-otp-wrap { display:flex; gap:10px; justify-content:center; margin-bottom:6px; animation:otpSlide .3s ease; }
  .cv-otp-box {
    width:50px; height:58px; border-radius:13px; border:2px solid rgba(255,255,255,.12);
    background:rgba(255,255,255,.06); color:#fff; font-size:24px; font-weight:800;
    text-align:center; outline:none; font-family:'Sora',sans-serif;
    transition:all .2s; caret-color:var(--gold2);
  }
  .cv-otp-box:focus { border-color:var(--gold2); background:rgba(232,160,32,.08); box-shadow:0 0 0 3px rgba(232,160,32,.12); }
  .cv-otp-box.filled { border-color:rgba(232,160,32,.4); background:rgba(232,160,32,.07); }

  .cv-otp-timer { text-align:center; font-size:12px; color:rgba(255,255,255,.3); margin-bottom:14px; font-family:'DM Sans',sans-serif; }
  .cv-otp-resend { background:none; border:none; color:var(--gold2); font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; text-decoration:underline; }
  .cv-otp-resend:disabled { opacity:.4; cursor:not-allowed; }

  .cv-login-divider { display:flex; align-items:center; gap:10px; margin:18px 0 14px; }
  .cv-login-divider::before,.cv-login-divider::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.08); }
  .cv-login-divider-txt { font-size:11px; color:rgba(255,255,255,.25); font-weight:600; font-family:'DM Sans',sans-serif; }

  .cv-login-secure { display:flex; align-items:center; justify-content:center; gap:7px; font-size:11px; color:rgba(255,255,255,.2); margin-top:20px; font-family:'DM Sans',sans-serif; }
  .cv-login-back-btn { background:none; border:none; color:rgba(255,255,255,.4); font-size:12px; cursor:pointer; font-family:inherit; margin-bottom:16px; display:flex; align-items:center; gap:5px; padding:0; }
  .cv-login-back-btn:hover { color:rgba(255,255,255,.7); }

  .cv-phone-display { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:11px; padding:10px 14px; margin-bottom:18px; display:flex; align-items:center; justify-content:space-between; }
  .cv-phone-display-num { font-family:'Sora',sans-serif; font-size:14px; font-weight:700; color:#fff; }
  .cv-phone-display-flag { font-size:16px; }

  /* ─── SHOP ROOT ─── */
  .cv-root { min-height:100vh; background:var(--bg); font-family:'DM Sans',system-ui,sans-serif; color:var(--ink); padding-bottom:110px; }

  /* ─── HEADER ─── */
  .cv-hdr {
    background:linear-gradient(160deg,#060A15 0%,#0D1526 40%,#111827 100%);
    position:sticky; top:0; z-index:100;
    box-shadow:0 1px 0 rgba(255,255,255,.04),0 4px 32px rgba(0,0,0,.5);
    overflow:hidden;
  }
  .cv-hdr::before {
    content:''; position:absolute; inset:0;
    background-image:repeating-linear-gradient(-55deg,transparent,transparent 40px,rgba(255,255,255,.012) 40px,rgba(255,255,255,.012) 41px);
    pointer-events:none;
  }
  .cv-hdr-inner { max-width:760px; margin:0 auto; padding:0 18px; position:relative; z-index:1; }
  .cv-brand-row { display:flex; align-items:flex-start; justify-content:space-between; padding:8px 0 4px; gap:4px; }
  .cv-wordmark { display:flex; flex-direction:column; gap:2px; }
  .cv-wordmark-line1 { display:flex; align-items:baseline; font-family:'Playfair Display','Sora',serif; font-size:26px; font-weight:800; letter-spacing:-0.5px; line-height:1; color:#fff; }
  .cv-wordmark-mana { color:rgba(255,255,255,.9); }
  .cv-wordmark-bills { color:var(--gold2); position:relative; }
  .cv-wordmark-bills::after { content:''; position:absolute; left:0; bottom:-2px; right:0; height:2px; background:linear-gradient(90deg,var(--gold2),transparent); border-radius:1px; }
  .cv-wordmark-tagline { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.25); padding-left:2px; }
  .cv-hdr-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
  .cv-user-chip { display:flex; align-items:center; gap:7px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); border-radius:100px; padding:5px 10px 5px 7px; cursor:default; }
  .cv-user-avatar { width:22px; height:22px; border-radius:50%; background:linear-gradient(135deg,var(--gold),var(--gold2)); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:var(--ink); flex-shrink:0; }
  .cv-user-name { font-size:11px; font-weight:600; color:rgba(255,255,255,.7); max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cv-logout-btn { background:none; border:none; color:rgba(255,255,255,.3); font-size:10px; cursor:pointer; font-family:inherit; padding:0; transition:color .2s; }
  .cv-logout-btn:hover { color:rgba(255,255,255,.6); }

  .cv-status-toggle { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
  .cv-status-pill { display:flex; align-items:center; gap:8px; padding:6px 10px 6px 7px; border-radius:100px; border:1px solid; cursor:default; }
  .cv-status-pill.open  { background:rgba(20,83,45,.35); border-color:rgba(74,222,128,.25); }
  .cv-status-pill.closed{ background:rgba(127,29,29,.25); border-color:rgba(252,165,165,.2); }
  .cv-status-bulb { width:12px; height:12px; border-radius:50%; position:relative; flex-shrink:0; }
  .cv-status-pill.open  .cv-status-bulb { background:#4ADE80; animation:breathe 2.4s ease-in-out infinite; }
  .cv-status-pill.closed .cv-status-bulb { background:#FCA5A5; animation:breatheRed 3s ease-in-out infinite; }
  .cv-status-bulb::after { content:''; position:absolute; inset:2px; border-radius:50%; background:rgba(255,255,255,.5); }
  .cv-status-text { font-size:11px; font-weight:700; letter-spacing:.04em; }
  .cv-status-pill.open  .cv-status-text { color:#4ADE80; }
  .cv-status-pill.closed .cv-status-text { color:#FCA5A5; }
  .cv-status-sub { font-size:10px; color:rgba(255,255,255,.28); font-weight:400; text-align:right; min-height:13px; }

  .cv-cart-pill { display:flex; align-items:center; gap:7px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.11); border-radius:14px; padding:8px 14px; cursor:pointer; transition:all .18s; }
  .cv-cart-pill:hover { background:rgba(255,255,255,.14); }
  .cv-cart-pill-txt { font-size:13px; font-weight:600; color:#fff; }
  .cv-cart-pill-badge { background:var(--gold2); color:var(--ink); font-size:10px; font-weight:800; min-width:20px; height:20px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; padding:0 5px; }
  .cv-cart-pill-amt { font-size:12px; color:rgba(255,255,255,.45); border-left:1px solid rgba(255,255,255,.1); padding-left:9px; }

  .cv-shop-card { margin:0 0 14px; padding:12px 15px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:14px; display:flex; flex-direction:column; gap:6px; position:relative; overflow:hidden; }
  .cv-shop-card::before { content:''; position:absolute; top:0; bottom:0; width:40px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.06),transparent); animation:scanLine 3.5s ease-in-out infinite; pointer-events:none; }
  .cv-shop-name { font-family:'Sora',sans-serif; font-size:15px; font-weight:700; color:#fff; letter-spacing:-.2px; line-height:1.2; }
  .cv-shop-owner { font-size:12px; color:rgba(255,255,255,.45); font-weight:500; }
  .cv-shop-meta { display:flex; flex-wrap:wrap; gap:6px 14px; margin-top:2px; }
  .cv-shop-meta-item { display:flex; align-items:center; gap:4px; font-size:11px; color:rgba(255,255,255,.32); }

  .cv-hdr-actions-row { display:flex; align-items:center; gap:8px; padding-bottom:14px; }
  .cv-hdr-top-divider { height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent); margin:0 0 13px; }
  .cv-search-wrap { position:relative; flex:1; }
  .cv-search-ico { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:14px; pointer-events:none; opacity:.3; }
  .cv-search { width:100%; padding:11px 14px 11px 40px; border-radius:12px; border:1px solid rgba(255,255,255,.09); font-size:14px; font-family:inherit; background:rgba(255,255,255,.07); color:#fff; outline:none; transition:all .2s; }
  .cv-search::placeholder { color:rgba(255,255,255,.25); }
  .cv-search:focus { background:rgba(255,255,255,.11); border-color:rgba(255,255,255,.18); }

  .cv-tabs { display:flex; background:var(--white); border-bottom:1px solid rgba(10,15,30,.06); position:sticky; top:0; z-index:90; }
  .cv-tab { flex:1; padding:13px 0 11px; border:none; font-family:'DM Sans',sans-serif; font-weight:600; font-size:13px; cursor:pointer; transition:all .15s; border-bottom:2.5px solid transparent; background:none; color:var(--ink3); }
  .cv-tab.on { color:var(--ink); background:var(--bg); border-bottom-color:var(--gold2); }

  .cv-cats { display:flex; gap:7px; overflow-x:auto; padding:12px 16px; background:var(--white); border-bottom:1px solid rgba(10,15,30,.05); scrollbar-width:none; }
  .cv-cats::-webkit-scrollbar { display:none; }
  .cv-cat { flex-shrink:0; padding:7px 16px; border-radius:100px; font-size:12px; font-weight:600; cursor:pointer; border:1.5px solid transparent; background:var(--bg2); color:var(--ink2); font-family:inherit; transition:all .18s; white-space:nowrap; }
  .cv-cat:hover:not(.on) { background:#E2DFD9; }
  .cv-cat.on { color:#fff; box-shadow:0 4px 14px rgba(0,0,0,.18); }

  .cv-section-lbl { font-size:11px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.08em; padding:16px 16px 8px; max-width:760px; margin:0 auto; }
  .cv-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(162px,1fr)); gap:12px; padding:0 16px 20px; max-width:760px; margin:0 auto; }
  @media(max-width:420px){ .cv-grid{grid-template-columns:repeat(2,1fr);gap:10px;} }

  .cv-pcard { background:var(--white); border-radius:var(--r); border:1.5px solid transparent; box-shadow:var(--sh); overflow:hidden; transition:box-shadow .22s,transform .18s,border-color .2s; animation:slideUp .3s ease both; }
  .cv-pcard:hover { box-shadow:var(--sh2); transform:translateY(-3px); }
  .cv-pcard.in-cart { border-color:var(--gold2); box-shadow:0 0 0 3px rgba(232,160,32,.15),var(--sh2); }
  .cv-pcard-accent { height:4px; }
  .cv-pcard-body { padding:12px 12px 8px; }
  .cv-cat-chip { display:inline-flex; align-items:center; gap:3px; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; padding:3px 8px; border-radius:100px; margin-bottom:6px; }
  .cv-pcard-name { font-family:'Sora',sans-serif; font-size:13px; font-weight:700; color:var(--ink); line-height:1.35; margin-bottom:4px; }
  .cv-pcard-avail { font-size:11px; color:var(--ink3); margin-bottom:8px; }
  .cv-price-row { display:flex; align-items:baseline; gap:2px; }
  .cv-price { font-family:'Sora',sans-serif; font-size:20px; font-weight:800; color:var(--green); line-height:1; }
  .cv-price-unit { font-size:10px; color:var(--ink3); font-weight:500; }
  .cv-low-tag { display:inline-flex; align-items:center; gap:3px; background:#FEF3C7; color:#92400E; font-size:9px; font-weight:800; padding:3px 8px; border-radius:100px; margin-top:5px; }
  .cv-qty-row { display:flex; align-items:center; justify-content:space-between; padding:8px 11px 10px; }
  .cv-in-cart-tag { font-size:10px; font-weight:700; color:var(--gold); }
  .cv-qty-ctrl { display:flex; align-items:center; gap:7px; }
  .cv-qbtn { width:28px; height:28px; border-radius:8px; border:none; font-size:16px; font-weight:800; cursor:pointer; font-family:inherit; transition:all .15s; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .cv-qbtn.m { background:#FEE2E2; color:#DC2626; }
  .cv-qbtn.p { background:#DCFCE7; color:#15803D; }
  .cv-qbtn:hover:not(:disabled) { filter:brightness(.85); transform:scale(1.12); }
  .cv-qbtn:disabled { opacity:.3; cursor:not-allowed; transform:none; }
  .cv-qty-num { font-family:'Sora',sans-serif; font-weight:800; font-size:15px; color:var(--ink); min-width:22px; text-align:center; }
  .cv-btn-row { display:grid; grid-template-columns:1fr 1fr; gap:6px; padding:0 10px 10px; }
  .cv-add-btn { padding:9px 5px; border-radius:10px; border:1.5px solid rgba(10,15,30,.14); font-weight:700; font-size:11px; cursor:pointer; font-family:inherit; transition:all .18s; background:var(--white); color:var(--ink); display:flex; align-items:center; justify-content:center; gap:3px; }
  .cv-add-btn:hover:not(:disabled) { background:var(--ink); color:#fff; border-color:var(--ink); transform:translateY(-1px); }
  .cv-add-btn:disabled { opacity:.35; cursor:not-allowed; }

  .cv-bar { position:fixed; bottom:0; left:0; right:0; z-index:200; padding:10px 14px 18px; animation:barUp .25s cubic-bezier(.34,1.4,.64,1); }
  .cv-bar-inner { max-width:500px; margin:0 auto; background:var(--ink); border-radius:20px; padding:14px 18px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 -2px 40px rgba(10,15,30,.3); }
  .cv-bar-count { font-size:11px; color:rgba(255,255,255,.4); font-weight:500; }
  .cv-bar-total { font-family:'Sora',sans-serif; font-size:20px; font-weight:800; color:#fff; margin-top:1px; }
  .cv-bar-btn { background:linear-gradient(135deg,var(--gold),var(--gold2)); border:none; border-radius:14px; padding:12px 22px; font-weight:800; font-size:14px; font-family:inherit; color:var(--ink); cursor:pointer; transition:all .18s; }
  .cv-bar-btn:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(232,160,32,.4); }

  .cv-overlay { position:fixed; inset:0; background:rgba(10,15,30,.6); backdrop-filter:blur(5px); z-index:300; display:flex; align-items:flex-end; justify-content:center; animation:fadeIn .22s ease; }
  .cv-sheet { background:var(--white); border-radius:26px 26px 0 0; width:100%; max-width:520px; animation:slideUp .3s cubic-bezier(.34,1.15,.64,1); max-height:94vh; overflow-y:auto; overscroll-behavior:contain; }
  @media(min-width:600px){ .cv-overlay{align-items:center} .cv-sheet{border-radius:24px;max-height:88vh} }
  .cv-drag { width:38px; height:4px; background:rgba(10,15,30,.1); border-radius:2px; margin:12px auto 0; }
  .cv-sheet-head { padding:16px 18px 14px; border-bottom:1px solid rgba(10,15,30,.06); display:flex; align-items:center; gap:10px; }
  .cv-back-btn { width:36px; height:36px; border-radius:10px; border:1.5px solid rgba(10,15,30,.1); background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--ink2); font-size:16px; transition:all .15s; flex-shrink:0; }
  .cv-back-btn:hover { background:var(--bg2); }
  .cv-sheet-title { font-family:'Sora',sans-serif; font-size:17px; font-weight:700; color:var(--ink); margin:0; flex:1; }
  .cv-close-btn { width:36px; height:36px; border-radius:10px; border:none; background:var(--bg2); cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--ink2); font-size:18px; transition:all .15s; }
  .cv-close-btn:hover { background:var(--bg); color:var(--ink); }
  .cv-body { padding:18px 18px 28px; }

  .cv-cart-row { display:flex; align-items:center; gap:11px; padding:12px 0; border-bottom:1px solid rgba(10,15,30,.05); animation:slideUp .2s ease; }
  .cv-cart-row:last-child { border-bottom:none; }
  .cv-cart-ico { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; background:#F1F5F9; }
  .cv-cart-info { flex:1; min-width:0; }
  .cv-cart-name { font-size:14px; font-weight:600; color:var(--ink); }
  .cv-cart-rate { font-size:12px; color:var(--ink3); margin-top:2px; }
  .cv-cart-ctrl { display:flex; align-items:center; gap:7px; flex-shrink:0; }
  .cv-cart-line { font-family:'Sora',sans-serif; font-weight:800; font-size:15px; color:var(--ink); min-width:58px; text-align:right; flex-shrink:0; }
  .cv-summary { background:var(--bg); border-radius:14px; padding:13px 15px; margin-top:8px; }
  .cv-sum-row { display:flex; justify-content:space-between; font-size:13px; color:var(--ink2); padding:4px 0; }
  .cv-sum-row.total { font-family:'Sora',sans-serif; font-weight:800; font-size:17px; color:var(--ink); border-top:1px solid rgba(10,15,30,.08); margin-top:8px; padding-top:11px; }

  .cv-steps { display:flex; align-items:center; padding:16px 18px 10px; }
  .cv-step { display:flex; align-items:center; gap:7px; }
  .cv-step-dot { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; flex-shrink:0; transition:all .3s; font-family:'Sora',sans-serif; }
  .cv-step-dot.done   { background:var(--green); color:#fff; }
  .cv-step-dot.active { background:var(--ink); color:#fff; box-shadow:0 0 0 4px rgba(10,15,30,.1); }
  .cv-step-dot.idle   { background:var(--bg2); color:var(--ink3); }
  .cv-step-lbl { font-size:11px; font-weight:600; color:var(--ink3); white-space:nowrap; }
  .cv-step-lbl.active { color:var(--ink); font-weight:700; }
  .cv-step-line { flex:1; height:2px; background:var(--bg2); margin:0 5px; border-radius:1px; transition:background .3s; min-width:16px; }
  .cv-step-line.done { background:var(--green); }

  .cv-rev-item { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid rgba(10,15,30,.05); }
  .cv-rev-item:last-child { border-bottom:none; }
  .cv-rev-name { font-size:13px; font-weight:600; color:var(--ink); }
  .cv-rev-qty  { font-size:11px; color:var(--ink3); margin-top:2px; }
  .cv-rev-price { font-family:'Sora',sans-serif; font-weight:700; font-size:14px; color:var(--ink); flex-shrink:0; }

  /* Pre-filled locked field */
  .cv-locked-field { background:var(--bg); border-radius:13px; border:1.5px solid rgba(10,15,30,.07); padding:12px 14px; display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .cv-locked-ico { font-size:16px; }
  .cv-locked-info { flex:1; }
  .cv-locked-lbl { font-size:10px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; margin-bottom:2px; }
  .cv-locked-val { font-size:15px; font-weight:700; color:var(--ink); }
  .cv-locked-badge { font-size:9px; font-weight:800; background:rgba(21,128,61,.1); color:var(--green); padding:3px 9px; border-radius:100px; }

  .cv-field { margin-bottom:14px; }
  .cv-lbl { font-size:11px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; margin-bottom:7px; display:block; }
  .cv-inp-wrap { position:relative; }
  .cv-inp-ico { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:16px; pointer-events:none; }
  .cv-inp { width:100%; padding:13px 14px 13px 42px; border-radius:12px; border:1.5px solid rgba(10,15,30,.12); font-size:15px; font-family:inherit; color:var(--ink); outline:none; transition:all .2s; background:var(--white); }
  .cv-inp:focus { border-color:var(--gold2); box-shadow:0 0 0 3px rgba(232,160,32,.12); }
  .cv-hint { font-size:11px; color:var(--ink3); margin-top:5px; padding-left:2px; }

  .cv-adv-row { display:flex; align-items:center; gap:12px; margin-bottom:6px; }
  .cv-adv-amt { font-family:'Sora',sans-serif; font-size:16px; font-weight:700; color:var(--ink); min-width:70px; }
  .cv-slider { flex:1; -webkit-appearance:none; height:5px; border-radius:3px; outline:none; cursor:pointer; }
  .cv-slider::-webkit-slider-thumb { -webkit-appearance:none; width:22px; height:22px; border-radius:50%; background:var(--gold2); cursor:pointer; border:3px solid #fff; box-shadow:0 1px 7px rgba(0,0,0,.22); }
  .cv-slider::-moz-range-thumb { width:22px; height:22px; border-radius:50%; background:var(--gold2); cursor:pointer; border:3px solid #fff; }
  .cv-adv-pct { font-size:12px; color:var(--ink3); min-width:34px; text-align:right; }

  .cv-pay-card { border-radius:14px; overflow:hidden; border:1.5px solid rgba(10,15,30,.07); margin-bottom:16px; }
  .cv-pay-row { display:flex; justify-content:space-between; align-items:center; padding:12px 15px; font-size:13px; border-bottom:1px solid rgba(10,15,30,.05); }
  .cv-pay-row:last-child { border-bottom:none; }
  .cv-pay-row.sub  { background:var(--bg); }
  .cv-pay-row.adv  { background:#F0FDF4; }
  .cv-pay-row.bal  { background:#FFF7ED; }
  .cv-pay-row.full { background:#F0FDF4; }

  .cv-pay-method-wrap { margin-bottom:18px; }
  .cv-pay-method-lbl { font-size:11px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; margin-bottom:10px; display:block; }
  .cv-pay-methods { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .cv-pay-method-card { padding:12px 14px; border-radius:13px; border:2px solid rgba(10,15,30,.1); background:var(--white); cursor:pointer; transition:all .2s; display:flex; flex-direction:column; gap:5px; position:relative; overflow:hidden; text-align:left; }
  .cv-pay-method-card:hover { border-color:rgba(10,15,30,.22); transform:translateY(-1px); box-shadow:var(--sh); }
  .cv-pay-method-card.selected { border-color:var(--rzp); background:#EFF6FF; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
  .cv-pay-method-card.selected-cash { border-color:var(--green); background:#F0FDF4; box-shadow:0 0 0 3px rgba(21,128,61,.12); }
  .cv-pay-method-ico { font-size:20px; }
  .cv-pay-method-title { font-size:13px; font-weight:700; color:var(--ink); }
  .cv-pay-method-sub { font-size:10px; color:var(--ink3); line-height:1.4; }
  .cv-pay-method-badge { position:absolute; top:7px; right:8px; font-size:9px; font-weight:800; padding:2px 7px; border-radius:100px; letter-spacing:.04em; }
  .cv-pay-method-card.selected .cv-pay-method-badge { background:var(--rzp); color:#fff; }
  .cv-pay-method-card.selected-cash .cv-pay-method-badge { background:var(--green); color:#fff; }

  .cv-rzp-btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; padding:15px 22px; border-radius:14px; border:none; background:linear-gradient(135deg,#1d4ed8,#2563EB,#3b82f6); color:#fff; font-weight:800; font-size:15px; cursor:pointer; font-family:inherit; transition:all .2s; width:100%; box-shadow:0 4px 16px rgba(37,99,235,.3); animation:rzpPulse 2.5s ease-in-out infinite; }
  .cv-rzp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 24px rgba(37,99,235,.45); filter:brightness(1.08); animation:none; }
  .cv-rzp-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; animation:none; }
  .cv-rzp-badge { background:rgba(255,255,255,.18); border-radius:6px; padding:2px 8px; font-size:10px; font-weight:700; letter-spacing:.04em; }

  .cv-cust-summary { background:var(--bg); border-radius:13px; padding:13px 15px; margin-bottom:16px; }
  .cv-cust-row { display:flex; justify-content:space-between; font-size:13px; padding:5px 0; border-bottom:1px solid rgba(10,15,30,.05); }
  .cv-cust-row:last-child { border-bottom:none; }

  .cv-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:14px 22px; border-radius:14px; border:none; font-weight:700; font-size:15px; cursor:pointer; font-family:inherit; transition:all .2s; width:100%; }
  .cv-btn:hover:not(:disabled) { transform:translateY(-2px); }
  .cv-btn:disabled { opacity:.4; cursor:not-allowed; transform:none; }
  .cv-btn-primary { background:linear-gradient(135deg,var(--gold),var(--gold2)); color:var(--ink); font-family:'Sora',sans-serif; font-weight:800; box-shadow:0 4px 16px rgba(201,132,26,.28); }
  .cv-btn-primary:hover:not(:disabled) { box-shadow:0 8px 24px rgba(201,132,26,.4); }
  .cv-btn-dark    { background:var(--ink); color:#fff; }
  .cv-btn-outline { background:transparent; color:var(--ink); border:1.5px solid rgba(10,15,30,.15); }
  .cv-btn-outline:hover:not(:disabled) { background:var(--bg); }
  .cv-btn-red     { background:transparent; color:var(--red); border:1.5px solid rgba(220,38,38,.22); }
  .cv-btn + .cv-btn { margin-top:10px; }
  .cv-spin { width:20px; height:20px; border:2.5px solid rgba(10,15,30,.15); border-top-color:var(--ink); border-radius:50%; animation:spin .7s linear infinite; }
  .cv-spin-white { width:20px; height:20px; border:2.5px solid rgba(255,255,255,.25); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }

  .cv-success { padding:22px 18px 32px; text-align:center; }
  .cv-success-ring { width:84px; height:84px; background:linear-gradient(135deg,#DCFCE7,#BBF7D0); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; animation:popIn .5s cubic-bezier(.34,1.56,.64,1); font-size:38px; }
  .cv-success-h { font-family:'Sora',sans-serif; font-size:24px; font-weight:800; color:var(--ink); margin-bottom:6px; }
  .cv-success-p { font-size:14px; color:var(--ink3); margin-bottom:22px; }
  .cv-oid-tag { display:inline-flex; align-items:center; gap:6px; background:linear-gradient(135deg,var(--gold),var(--gold2)); color:var(--ink); font-family:'Sora',sans-serif; font-size:13px; font-weight:800; padding:8px 18px; border-radius:100px; margin-bottom:22px; box-shadow:0 4px 14px rgba(201,132,26,.3); }
  .cv-detail-card { background:var(--bg); border-radius:16px; padding:14px 16px; margin-bottom:14px; text-align:left; }
  .cv-det-row { display:flex; justify-content:space-between; align-items:center; font-size:13px; padding:7px 0; border-bottom:1px solid rgba(10,15,30,.06); }
  .cv-det-row:last-child { border-bottom:none; }
  .cv-det-lbl { color:var(--ink3); font-weight:500; }
  .cv-det-val { font-weight:700; color:var(--ink); }
  .cv-next { background:#EFF6FF; border-radius:14px; padding:14px 16px; margin-bottom:20px; text-align:left; border:1px solid #BFDBFE; }
  .cv-next-h { font-size:12px; font-weight:700; color:var(--blue); margin-bottom:10px; }
  .cv-next-item { display:flex; gap:10px; align-items:flex-start; padding:4px 0; font-size:13px; color:var(--ink2); }
  .cv-next-num { width:20px; height:20px; border-radius:50%; background:var(--blue); color:#fff; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; font-family:'Sora',sans-serif; }

  .cv-rzp-paid-tag { display:inline-flex; align-items:center; gap:6px; background:linear-gradient(135deg,#1d4ed8,#2563EB); color:#fff; font-family:'Sora',sans-serif; font-size:11px; font-weight:700; padding:5px 14px; border-radius:100px; margin-bottom:14px; }

  .cv-ocard { background:var(--white); border-radius:16px; border:1.5px solid rgba(10,15,30,.06); padding:15px; margin-bottom:12px; box-shadow:var(--sh); }
  .cv-ocard-hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
  .cv-oid { font-family:'Sora',sans-serif; font-weight:700; font-size:14px; color:var(--ink); }
  .cv-odate { font-size:11px; color:var(--ink3); margin-top:2px; }
  .cv-status { font-size:10px; font-weight:800; padding:4px 12px; border-radius:100px; text-transform:uppercase; letter-spacing:.04em; }
  .cv-oitems { background:var(--bg); border-radius:10px; padding:10px 12px; margin-bottom:10px; }
  .cv-oitem { display:flex; justify-content:space-between; font-size:13px; color:var(--ink2); padding:3px 0; }
  .cv-ofoot { display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid rgba(10,15,30,.06); }

  .cv-empty { text-align:center; padding:60px 20px; animation:fadeIn .4s ease; }
  .cv-empty-ico { font-size:52px; margin-bottom:16px; }
  .cv-empty-h { font-family:'Sora',sans-serif; font-size:18px; font-weight:700; color:var(--ink); margin-bottom:8px; }
  .cv-empty-p { font-size:13px; color:var(--ink3); line-height:1.6; }
  .cv-closed-banner { background:linear-gradient(90deg,#7F1D1D,#991B1B); color:#FCA5A5; text-align:center; padding:9px 16px; font-size:12px; font-weight:700; letter-spacing:.04em; }
  .cv-toast { position:fixed; top:72px; left:50%; transform:translateX(-50%); z-index:9999; padding:11px 22px 11px 14px; border-radius:100px; font-weight:700; font-size:13px; white-space:nowrap; box-shadow:0 6px 24px rgba(0,0,0,.22); cursor:pointer; animation:toastIn .3s cubic-bezier(.34,1.3,.64,1); font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:8px; max-width:calc(100vw - 32px); }
  .cv-toast-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .cv-shimmer { background:linear-gradient(90deg,var(--bg2) 25%,var(--bg) 50%,var(--bg2) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:16px; }

  #recaptcha-container { position:fixed; bottom:20px; right:20px; z-index:9999; }
`;

if (typeof document !== "undefined" && !document.getElementById("__cv_v7")) {
  const el = document.createElement("style");
  el.id = "__cv_v7";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

// ══════════════════════════════════════════════════════════════
//   FIREBASE OTP LOGIN COMPONENT
// ══════════════════════════════════════════════════════════════
const OTP_LENGTH = 6;
const OTP_TIMER  = 60; // seconds

function CustomerLogin({ onLogin }) {
  const [phase,       setPhase]       = useState("name");   // "name" | "phone" | "otp"
  const [nameInput,   setNameInput]   = useState("");
  const [phone,       setPhone]       = useState("");
  const [otp,         setOtp]         = useState(["", "", "", "", "", ""]);
  const [sending,     setSending]     = useState(false);
  const [verifying,   setVerifying]   = useState(false);
  const [error,       setError]       = useState("");
  const [timer,       setTimer]       = useState(OTP_TIMER);
  const [canResend,   setCanResend]   = useState(false);
  const confirmRef    = useRef(null);
  const timerRef      = useRef(null);
  const otpRefs       = useRef([]);

  const startTimer = () => {
    setTimer(OTP_TIMER); setCanResend(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const initRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
      });
    }
  };

  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) { setError("Enter a valid 10-digit mobile number"); return; }
    setError(""); setSending(true);
    try {
      initRecaptcha();
      const fullPhone = `+91${cleanPhone}`;
      const result = await signInWithPhoneNumber(firebaseAuth, fullPhone, window.recaptchaVerifier);
      confirmRef.current = result;
      setPhase("otp");
      startTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      console.error("OTP send error:", err);
      setError(
        err.code === "auth/too-many-requests"
          ? "Too many attempts. Please try again later."
          : err.code === "auth/invalid-phone-number"
          ? "Invalid phone number. Include country code."
          : "Could not send OTP. Check your number and try again."
      );
      // reset recaptcha on error
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch {}
        window.recaptchaVerifier = null;
      }
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    // Reset OTP boxes
    setOtp(["", "", "", "", "", ""]);
    setError("");
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch {}
      window.recaptchaVerifier = null;
    }
    await handleSendOtp();
  };

  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[idx]   = digit;
    setOtp(next);
    setError("");
    if (digit && idx < OTP_LENGTH - 1) {
      otpRefs.current[idx + 1]?.focus();
    }
    // Auto-verify when all filled
    if (next.every((d) => d !== "") && digit) {
      handleVerify(next.join(""));
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      const next = [...otp];
      if (next[idx]) { next[idx] = ""; setOtp(next); }
      else if (idx > 0) { next[idx - 1] = ""; setOtp(next); otpRefs.current[idx - 1]?.focus(); }
    }
    if (e.key === "ArrowLeft"  && idx > 0)             otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      const next = pasted.split("");
      setOtp(next);
      otpRefs.current[OTP_LENGTH - 1]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code) => {
    if (!confirmRef.current) return;
    setVerifying(true); setError("");
    try {
      await confirmRef.current.confirm(code);
      const cleanPhone = phone.replace(/\D/g, "");
      const session = { name: nameInput.trim(), mobile: cleanPhone, verified: true };
      saveSession(session);
      onLogin(session);
    } catch (err) {
      console.error("OTP verify error:", err);
      setError(
        err.code === "auth/invalid-verification-code"
          ? "Incorrect OTP. Please try again."
          : "Verification failed. Try resending OTP."
      );
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="cv-login-root">
      <div id="recaptcha-container" />
      <div className="cv-login-bg-orb a" />
      <div className="cv-login-bg-orb b" />
      <div className="cv-login-grid" />

      <div className="cv-login-card">
        <div className="cv-login-logo">
          <div className="cv-login-wordmark">
            <span className="cv-login-mana">Mana</span>
            <span className="cv-login-bills">Bills</span>
          </div>
          <span className="cv-login-tagline">Digital Shop · Quick Order</span>
        </div>

        {/* ── PHASE: name ── */}
        {phase === "name" && (
          <>
            <div className="cv-login-title">Welcome! 👋</div>
            <div className="cv-login-sub">Enter your name to get started</div>

            <div className="cv-login-field">
              <label className="cv-login-lbl">Your Name</label>
              <div className="cv-login-inp-wrap">
                <span className="cv-login-inp-ico">👤</span>
                <input
                  className="cv-login-inp"
                  type="text"
                  placeholder="Full name"
                  value={nameInput}
                  onChange={(e) => { setNameInput(sanitizeName(e.target.value)); setError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && nameInput.trim().length >= 2) setPhase("phone"); }}
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            {error && <div style={{ fontSize:12, color:"#FCA5A5", marginBottom:10, paddingLeft:2 }}>{error}</div>}

            <button
              className="cv-login-btn"
              disabled={nameInput.trim().length < 2}
              onClick={() => setPhase("phone")}
            >
              Continue →
            </button>
            <div className="cv-login-secure">🔒 Your info stays private · No spam</div>
          </>
        )}

        {/* ── PHASE: phone ── */}
        {phase === "phone" && (
          <>
            <button className="cv-login-back-btn" onClick={() => setPhase("name")}>← Back</button>
            <div className="cv-login-title">Verify Mobile 📱</div>
            <div className="cv-login-sub">
              Hello <strong style={{ color:"#fff" }}>{nameInput}</strong>! We'll send an OTP to confirm
            </div>

            <div className="cv-login-field">
              <label className="cv-login-lbl">Mobile Number</label>
              <div className="cv-login-inp-wrap">
                <span className="cv-login-inp-ico">🇮🇳</span>
                <span className="cv-login-inp-prefix">+91</span>
                <input
                  className="cv-login-inp with-prefix"
                  type="tel"
                  placeholder="10-digit number"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => { setPhone(sanitizeMobile(e.target.value)); setError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && phone.length === 10) handleSendOtp(); }}
                  disabled={sending}
                  autoFocus
                />
              </div>
            </div>

            {error && <div style={{ fontSize:12, color:"#FCA5A5", marginBottom:10, paddingLeft:2 }}>{error}</div>}

            <button
              className="cv-login-btn"
              disabled={phone.length !== 10 || sending}
              onClick={handleSendOtp}
            >
              {sending ? <><div className="cv-spin-white" />Sending OTP…</> : "📤 Send OTP"}
            </button>
            <div className="cv-login-secure">🔒 OTP powered by Firebase Auth</div>
          </>
        )}

        {/* ── PHASE: otp ── */}
        {phase === "otp" && (
          <>
            <button className="cv-login-back-btn" onClick={() => { setPhase("phone"); setOtp(["","","","","",""]); setError(""); }}>← Change Number</button>
            <div className="cv-login-title">Enter OTP 🔐</div>

            <div className="cv-phone-display">
              <span className="cv-phone-display-flag">🇮🇳</span>
              <span className="cv-phone-display-num">+91 {phone.slice(0,5)} {phone.slice(5)}</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>OTP sent</span>
            </div>

            <div className="cv-otp-wrap" onPaste={handleOtpPaste}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  className={`cv-otp-box${d ? " filled" : ""}`}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={verifying}
                />
              ))}
            </div>

            {error && <div style={{ fontSize:12, color:"#FCA5A5", margin:"8px 0 4px", textAlign:"center" }}>{error}</div>}

            <div className="cv-otp-timer">
              {canResend ? (
                <button className="cv-otp-resend" onClick={handleResend}>Resend OTP</button>
              ) : (
                <>Resend in <strong style={{ color:"#fff" }}>{timer}s</strong></>
              )}
            </div>

            {verifying && (
              <div style={{ textAlign:"center", color:"rgba(255,255,255,.5)", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <div className="cv-spin-white" />Verifying…
              </div>
            )}

            <div className="cv-login-secure">✅ 6-digit OTP · Auto-detects on supported devices</div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//   SUBCOMPONENTS
// ══════════════════════════════════════════════════════════════
const Steps = ({ current }) => {
  const labels = ["Review", "Confirm & Pay"];
  return (
    <div className="cv-steps">
      {labels.map((l, i) => (
        <React.Fragment key={l}>
          <div className="cv-step">
            <div className={`cv-step-dot ${i < current ? "done" : i === current ? "active" : "idle"}`}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`cv-step-lbl ${i === current ? "active" : ""}`}>{l}</span>
          </div>
          {i < labels.length - 1 && <div className={`cv-step-line ${i < current ? "done" : ""}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

const ProductCard = memo(({ item, qty, onAdd, onRemove, color, delay }) => {
  const inCart     = qty > 0;
  const outOfStock = Number(item.qty) <= 0;
  const lowStock   = !outOfStock && Number(item.qty) <= (item.min_qty_alert || 5);
  const maxReached = qty >= Number(item.qty);
  const icon       = getCatIcon(item.category);

  return (
    <div className={`cv-pcard${inCart ? " in-cart" : ""}`} style={{ animationDelay:`${delay * 0.04}s` }}>
      <div className="cv-pcard-accent" style={{ background: inCart ? `linear-gradient(90deg,${color},${color}cc)` : `${color}20` }} />
      <div className="cv-pcard-body">
        {item.category && (
          <div className="cv-cat-chip" style={{ background:`${color}18`, color }}>
            {icon} {item.category}
          </div>
        )}
        <div className="cv-pcard-name">{item.name}</div>
        <div className="cv-pcard-avail">{outOfStock ? "❌ Out of stock" : `${item.qty} ${item.unit} available`}</div>
        <div className="cv-price-row">
          <span className="cv-price">{fmt(item.selling_price)}</span>
          <span className="cv-price-unit">/{item.unit}</span>
        </div>
        {lowStock && <div className="cv-low-tag">🔥 Only {item.qty} left</div>}
      </div>
      {inCart ? (
        <div className="cv-qty-row">
          <span className="cv-in-cart-tag">✓ In cart</span>
          <div className="cv-qty-ctrl">
            <button className="cv-qbtn m" onClick={() => onRemove(item.id)}>−</button>
            <span className="cv-qty-num">{qty}</span>
            <button className="cv-qbtn p" onClick={() => onAdd(item)} disabled={maxReached}>+</button>
          </div>
        </div>
      ) : (
        <div className="cv-btn-row" style={{ gridTemplateColumns:"1fr" }}>
          <button className="cv-add-btn" onClick={() => onAdd(item)} disabled={outOfStock}>+ Cart</button>
        </div>
      )}
    </div>
  );
});

const CartRow = memo(({ item, maxQty, onAdd, onRemove }) => {
  const lineTotal  = Number(item.qty) * Number(item.price);
  const maxReached = item.qty >= (maxQty ?? Infinity);
  return (
    <div className="cv-cart-row">
      <div className="cv-cart-ico">{getCatIcon(item.category || "")}</div>
      <div className="cv-cart-info">
        <div className="cv-cart-name">{item.name}</div>
        <div className="cv-cart-rate">{fmt(item.price)} / {item.unit}</div>
      </div>
      <div className="cv-cart-ctrl">
        <button className="cv-qbtn m" style={{ width:26,height:26,borderRadius:7 }} onClick={() => onRemove(item.id)}>−</button>
        <span className="cv-qty-num" style={{ fontSize:13 }}>{item.qty}</span>
        <button className="cv-qbtn p" style={{ width:26,height:26,borderRadius:7 }}
          onClick={() => onAdd({ id:item.id, name:item.name, unit:item.unit, selling_price:item.price })}
          disabled={maxReached}>+</button>
      </div>
      <div className="cv-cart-line">{fmt(lineTotal)}</div>
    </div>
  );
});

const ORDER_STATUS_STYLE = {
  new:       { bg:"#EFF6FF", c:"#1E40AF" },
  packing:   { bg:"#FFFBEB", c:"#B45309" },
  ready:     { bg:"#F0FDF4", c:"#15803D" },
  completed: { bg:"#F8FAFC", c:"#64748B" },
  cancelled: { bg:"#FFF5F5", c:"#DC2626" },
};

// ══════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function CustomerView({
  shopProfile:  propShopProfile = null,
  stockItems:   propStockItems  = null,
  loading:      propLoading     = null,
  scannerId:    propScannerId   = null,
  onOrderPlaced,
  onStockRefresh,
  toast$:       propToast$      = null,
}) {
  const urlScannerId       = extractScannerIdFromUrl();
  const effectiveScannerId = propScannerId || urlScannerId || "";
  const isPublic           = !propShopProfile && !propStockItems && !!urlScannerId;

  // ─── Auth state ───────────────────────────────────────────
  const [customer,     setCustomer]     = useState(() => loadSession());
  // customer = { name, mobile, verified } | null

  const [shopProfile,  setShopProfile]  = useState(propShopProfile);
  const [stockItems,   setStockItems]   = useState(propStockItems || []);
  const [loading,      setLoading]      = useState(propLoading !== null ? propLoading : true);
  const [loadError,    setLoadError]    = useState(null);
  const [scannerId,    setScannerId]    = useState(effectiveScannerId);

  const [localToast,   setLocalToast]   = useState(null);
  const [search,       setSearch]       = useState("");
  const [category,     setCategory]     = useState("All");
  const [cart,         setCart]         = useState({});
  const [modal,        setModal]        = useState(null);
  const [checkStep,    setCheckStep]    = useState(0);
  const [tab,          setTab]          = useState("shop");
  const [advPct,       setAdvPct]       = useState(10);
  const [placing,      setPlacing]      = useState(false);
  const [lastOrder,    setLastOrder]    = useState(null);
  const [myOrders,     setMyOrders]     = useState([]);
  const [ordersLoading,setOrdersLoading]= useState(false);

  const [payMethod,    setPayMethod]    = useState("razorpay");
  const [payStatus,    setPayStatus]    = useState(null);
  const [paymentId,    setPaymentId]    = useState(null);

  const stockRef = useRef(stockItems);
  useEffect(() => { stockRef.current = stockItems; }, [stockItems]);

  const showToast = useCallback((msg, type = "success") => {
    if (propToast$) { propToast$(msg, type); return; }
    setLocalToast({ msg, type });
    setTimeout(() => setLocalToast(null), TOAST_MS);
  }, [propToast$]);

  // ─── Load shop data ───────────────────────────────────────
  useEffect(() => {
    if (propShopProfile && propStockItems) {
      setShopProfile(propShopProfile);
      setStockItems(propStockItems);
      setLoading(false);
      return;
    }
    setLoading(true); setLoadError(null);
    if (isPublic && effectiveScannerId) {
      publicGet(`public/shop/${effectiveScannerId}/`)
        .then((data) => {
          setShopProfile(data.shop);
          setStockItems((data.products || []).filter((p) => Number(p.qty) > 0));
          setScannerId(data.scanner_id || effectiveScannerId);
          setLoading(false);
        })
        .catch((err) => {
          setLoadError(err.status === 404
            ? "This shop link is no longer active. Please ask the shop for a new QR code."
            : "Could not load shop. Please check your internet connection and try again.");
          setLoading(false);
        });
    } else {
      Promise.all([
        authAxios.get("business/shop-profile/").catch(() => ({ data: null })),
        authAxios.get("business/products/").catch(() => ({ data: [] })),
        authAxios.get("business/scanner/").catch(() => ({ data: null })),
      ]).then(([profileRes, productsRes, scannerRes]) => {
        setShopProfile(profileRes.data);
        const items = (productsRes.data || []).filter((p) => Number(p.qty) > 0 && p.is_active !== false);
        setStockItems(items);
        if (scannerRes.data?.scanner_id) setScannerId(scannerRes.data.scanner_id);
        setLoading(false);
      }).catch(() => { setLoadError("Failed to load shop data."); setLoading(false); });
    }
  }, [isPublic, effectiveScannerId, propShopProfile, propStockItems]);

  // ─── Auto-load orders when tab switched ──────────────────
  useEffect(() => {
    if (tab === "orders" && customer?.mobile && myOrders.length === 0 && !ordersLoading) {
      loadMyOrders(customer.mobile);
    }
  }, [tab]); // eslint-disable-line

  const shopStatus = useMemo(() => getShopStatus(shopProfile?.timings), [shopProfile]);

  const categories = useMemo(() =>
    ["All", ...new Set(stockItems.map((s) => s.category || "General"))],
    [stockItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stockItems.filter((s) => {
      if (Number(s.qty) <= 0) return false;
      if (category !== "All" && (s.category || "General") !== category) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [stockItems, search, category]);

  const catColorMap = useMemo(() => {
    const map = {};
    categories.forEach((c, i) => { map[c] = CAT_COLORS[i % CAT_COLORS.length]; });
    return map;
  }, [categories]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = useMemo(() => cartItems.reduce((s, c) => s + Number(c.qty) * Number(c.price), 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((s, c) => s + c.qty, 0), [cartItems]);
  const advAmt    = Math.round((advPct / 100) * cartTotal);
  const balance   = Math.max(0, cartTotal - advAmt);

  const addToCart = useCallback((item) => {
    const sid = String(item.id);
    setCart((prev) => {
      const existing = prev[sid];
      const stock    = stockRef.current.find((s) => String(s.id) === sid);
      const stockQty = stock ? Number(stock.qty) : Infinity;
      const current  = existing?.qty || 0;
      if (current >= stockQty) { showToast(`Only ${stockQty} ${item.unit} available`, "error"); return prev; }
      return { ...prev, [sid]: { id:item.id, name:item.name, unit:item.unit, price:Number(item.selling_price), qty:current + 1 } };
    });
  }, [showToast]);

  const removeFromCart = useCallback((id) => {
    const sid = String(id);
    setCart((prev) => {
      const entry = prev[sid];
      if (!entry) return prev;
      if (entry.qty <= 1) { const next = { ...prev }; delete next[sid]; return next; }
      return { ...prev, [sid]: { ...entry, qty: entry.qty - 1 } };
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const loadMyOrders = useCallback(async (mobile) => {
    if (!mobile || mobile.length !== 10) return;
    setOrdersLoading(true);
    try {
      if (isPublic) {
        const data = await publicGet(`public/shop/${scannerId}/orders/?mobile=${mobile}`);
        setMyOrders(Array.isArray(data) ? data : data.results || []);
      } else {
        const res = await authAxios.get(`business/orders/?mobile=${mobile}`);
        setMyOrders(Array.isArray(res.data) ? res.data : res.data?.results || []);
      }
    } catch {
      setMyOrders([]);
      showToast("Could not load orders.", "error");
    } finally {
      setOrdersLoading(false);
    }
  }, [isPublic, scannerId, showToast]);

  const triggerRazorpayPayment = useCallback(async (placedOrder, amountToPay) => {
    setPayStatus("processing");
    const loaded = await loadRazorpayScript();
    if (!loaded) { showToast("Razorpay could not be loaded.", "error"); setPayStatus("failed"); return; }

    let rzpOrderData;
    try {
      if (isPublic) {
        rzpOrderData = await publicPost(`public/shop/${scannerId}/create-razorpay-order/`, { order_id: placedOrder.order_id || placedOrder.id, amount: amountToPay });
      } else {
        const res = await authAxios.post("business/create-razorpay-order/", { order_id: placedOrder.order_id || placedOrder.id, amount: amountToPay });
        rzpOrderData = res.data;
      }
    } catch {
      showToast("Could not initiate payment. Pay at shop — order is saved.", "error");
      setPayStatus("failed"); setModal("success"); return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: rzpOrderData.amount,
      currency: rzpOrderData.currency || "INR",
      order_id: rzpOrderData.razorpay_order_id,
      name: shopProfile?.shop_name || "ManaBills Shop",
      description: `Order #${placedOrder.order_id || placedOrder.id}`,
      prefill: { name: customer?.name || "", contact: customer?.mobile || "", email: "" },
      theme: { color: "#2563EB" },
      handler: async (response) => {
        try {
          const verifyPayload = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_signature:  response.razorpay_signature,
            order_id:            placedOrder.order_id || placedOrder.id,
          };
          if (isPublic) { await publicPost(`public/shop/${scannerId}/verify-payment/`, verifyPayload); }
          else          { await authAxios.post("business/verify-payment/", verifyPayload); }
          setPaymentId(response.razorpay_payment_id);
          setPayStatus("verified");
          showToast(`✅ Payment of ${fmt(amountToPay)} verified!`);
          setModal("success");
        } catch { setPayStatus("failed"); showToast("Payment verification failed. Contact the shop.", "error"); setModal("success"); }
      },
      modal: {
        ondismiss: () => { setPayStatus("failed"); showToast("Payment cancelled. Order saved — pay at pickup.", "error"); setModal("success"); },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => {
      setPayStatus("failed");
      showToast(`Payment failed: ${resp.error?.description || "Unknown error"}`, "error");
      setModal("success");
    });
    rzp.open();
  }, [isPublic, scannerId, shopProfile, customer, showToast]);

  const handlePlaceOrder = useCallback(async () => {
    if (!customer?.name || !customer?.mobile) { showToast("Session expired. Please refresh.", "error"); return; }
    if (!cartItems.length) { showToast("Cart is empty", "error"); return; }

    setPlacing(true);
    const orderPayload = {
      customer_name:   customer.name,
      customer_mobile: customer.mobile,
      advance:         advAmt,
      payment_method:  payMethod,
      items: cartItems.map((ci) => ({ product_id: ci.id, qty: ci.qty })),
    };

    try {
      let placedOrder;
      if (isPublic) { placedOrder = await publicPost(`public/shop/${scannerId}/order/`, orderPayload); }
      else          { const res = await authAxios.post("business/orders/", orderPayload); placedOrder = res.data; }

      onOrderPlaced?.(placedOrder);
      const updatedStock = stockRef.current
        .map((s) => {
          const ci = cartItems.find((c) => String(c.id) === String(s.id));
          return ci ? { ...s, qty: Math.max(0, Number(s.qty) - Number(ci.qty)) } : s;
        })
        .filter((s) => Number(s.qty) > 0);

      setStockItems(updatedStock);
      onStockRefresh?.(updatedStock);
      setLastOrder(placedOrder);

      if (payMethod === "razorpay" && advAmt > 0) {
        setPlacing(false);
        await triggerRazorpayPayment(placedOrder, advAmt);
        clearCart(); setAdvPct(10);
      } else {
        clearCart(); setAdvPct(10);
        setPayStatus(null); setModal("success");
        showToast(`✅ Order #${placedOrder.order_id || placedOrder.id} placed!`);
        setPlacing(false);
      }
    } catch (err) {
      const msg = err?.data?.stock
        ? err.data.stock.join(" · ")
        : err?.data?.detail || err?.message || "Order failed. Please try again.";
      showToast(msg, "error"); setPlacing(false);
    }
  }, [customer, advAmt, advPct, payMethod, cartItems, isPublic, scannerId, onOrderPlaced, onStockRefresh, clearCart, showToast, triggerRazorpayPayment]);

  const handleLogout = () => {
    clearSession();
    try { firebaseAuth.signOut(); } catch {}
    setCustomer(null);
    clearCart();
    setModal(null);
  };

  // ─── Render: Login screen if not authenticated ────────────
  if (!customer?.verified) {
    return <CustomerLogin onLogin={(session) => setCustomer(session)} />;
  }

  const toastColors = { success:{ bg:"#0A0F1E", dot:"#4ADE80" }, error:{ bg:"#7F1D1D", dot:"#FCA5A5" }, info:{ bg:"#1E3A8A", dot:"#93C5FD" } };
  const tc = toastColors[localToast?.type] || toastColors.success;
  const initials = customer.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="cv-root">
      <div id="recaptcha-container" />

      {localToast && (
        <div className="cv-toast" style={{ background:tc.bg, color:"#fff" }} onClick={() => setLocalToast(null)}>
          <div className="cv-toast-dot" style={{ background:tc.dot }} />
          {localToast.msg}
        </div>
      )}

      {!shopStatus.open && shopStatus.label && (
        <div className="cv-closed-banner">🔒 {shopStatus.label}</div>
      )}

      {/* ═══ HEADER ═══ */}
      <div className="cv-hdr">
        <div className="cv-hdr-inner">
          <div className="cv-brand-row">
            <div className="cv-wordmark">
              <div className="cv-wordmark-line1">
                <span className="cv-wordmark-mana">Mana</span>
                <span className="cv-wordmark-bills">Bills</span>
              </div>
              <div className="cv-wordmark-tagline">Digital Shop · Quick Order</div>
            </div>
            <div className="cv-hdr-right">
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                <div className={`cv-status-pill ${shopStatus.open ? "open" : "closed"}`}>
                  <div className="cv-status-bulb" />
                  <span className="cv-status-text">{shopStatus.open ? "OPEN" : "CLOSED"}</span>
                </div>
                <div className="cv-status-sub">{shopStatus.label || (shopStatus.open ? "We're open now" : "")}</div>
              </div>
              {/* User chip */}
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div className="cv-user-chip">
                  <div className="cv-user-avatar">{initials}</div>
                  <span className="cv-user-name">{customer.name}</span>
                </div>
                <button className="cv-logout-btn" onClick={handleLogout} title="Sign out">✕</button>
              </div>
              {cartCount > 0 && (
                <button className="cv-cart-pill" onClick={() => setModal("cart")}>
                  <span style={{ fontSize:15 }}>🛒</span>
                  <span className="cv-cart-pill-txt">Cart</span>
                  <span className="cv-cart-pill-badge">{cartCount}</span>
                  <span className="cv-cart-pill-amt">{fmt(cartTotal)}</span>
                </button>
              )}
            </div>
          </div>

          <div className="cv-hdr-top-divider" />

          {(shopProfile?.shop_name || shopProfile?.owner_name) && (
            <div className="cv-shop-card">
              {shopProfile?.shop_name && <div className="cv-shop-name">{shopProfile.shop_name}</div>}
              {shopProfile?.owner_name && <div className="cv-shop-owner">Owner: {shopProfile.owner_name}</div>}
              <div className="cv-shop-meta">
                {shopProfile?.address && <div className="cv-shop-meta-item"><span>📍</span><span>{shopProfile.address}</span></div>}
                {shopProfile?.mobile  && <div className="cv-shop-meta-item"><span>📱</span><span>{shopProfile.mobile}</span></div>}
              </div>
            </div>
          )}

          <div className="cv-hdr-actions-row">
            <div className="cv-search-wrap">
              <span className="cv-search-ico">🔍</span>
              <input className="cv-search" type="text" placeholder="Search products…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {cartCount > 0 && (
              <button className="cv-cart-pill" onClick={() => setModal("cart")} style={{ flexShrink:0 }}>
                <span style={{ fontSize:15 }}>🛒</span>
                <span className="cv-cart-pill-badge">{cartCount}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="cv-tabs">
        {[{ k:"shop", l:"🛒 Shop" }, { k:"orders", l:"📦 My Orders" }].map(({ k, l }) => (
          <button key={k} className={`cv-tab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── SHOP TAB ── */}
      {tab === "shop" && (
        <>
          {loadError && !loading && (
            <div style={{ background:"#FEF2F2", border:"1.5px solid #FECACA", borderRadius:14, padding:"16px 18px", margin:20, textAlign:"center" }}>
              <h3 style={{ color:"var(--red)", margin:"0 0 6px", fontFamily:"'Sora',sans-serif" }}>⚠️ Could not load shop</h3>
              <p style={{ color:"#7F1D1D", fontSize:13, margin:"0 0 12px" }}>{loadError}</p>
              <button className="cv-btn cv-btn-dark" style={{ width:"auto", padding:"10px 24px" }} onClick={() => window.location.reload()}>Try Again</button>
            </div>
          )}

          {!loadError && (
            <div className="cv-cats">
              {categories.map((c) => (
                <button key={c} className={`cv-cat${category === c ? " on" : ""}`}
                  onClick={() => setCategory(c)}
                  style={category === c ? { background: c === "All" ? "#0A0F1E" : catColorMap[c] } : {}}>
                  {c !== "All" && getCatIcon(c) + " "}{c}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ padding:16, maxWidth:760, margin:"0 auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(162px,1fr))", gap:12 }}>
                {[...Array(6)].map((_, i) => <div key={i} style={{ height:220 }} className="cv-shimmer" />)}
              </div>
            </div>
          )}

          {!loading && !loadError && filtered.length === 0 && (
            <div className="cv-empty">
              <div className="cv-empty-ico">🛒</div>
              <div className="cv-empty-h">{stockItems.length === 0 ? "No products available" : "Nothing found"}</div>
              <div className="cv-empty-p">{stockItems.length === 0 ? "The shop hasn't added stock yet." : "Try a different search or category."}</div>
              {search && <button className="cv-btn cv-btn-outline" style={{ marginTop:20, width:"auto", padding:"10px 24px" }} onClick={() => { setSearch(""); setCategory("All"); }}>Clear filters</button>}
            </div>
          )}

          {!loading && !loadError && filtered.length > 0 && (
            <>
              <div className="cv-section-lbl">{filtered.length} item{filtered.length !== 1 ? "s" : ""} available</div>
              <div className="cv-grid">
                {filtered.map((item, idx) => (
                  <ProductCard key={String(item.id)} item={item}
                    qty={cart[String(item.id)]?.qty || 0}
                    onAdd={addToCart} onRemove={removeFromCart}
                    color={catColorMap[item.category || "General"] || "#E8A020"} delay={idx} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── MY ORDERS TAB ── */}
      {tab === "orders" && (
        <div style={{ maxWidth:640, margin:"0 auto", padding:16 }}>
          {ordersLoading ? (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div className="cv-spin" style={{ margin:"0 auto 16px" }} />
              <div style={{ color:"var(--ink3)", fontSize:13 }}>Loading your orders…</div>
            </div>
          ) : myOrders.length === 0 ? (
            <div className="cv-empty">
              <div className="cv-empty-ico">📦</div>
              <div className="cv-empty-h">No orders yet</div>
              <div className="cv-empty-p">Your orders for <strong>{customer.mobile}</strong> will appear here once you place one.</div>
              <button className="cv-btn cv-btn-dark" style={{ marginTop:20, width:"auto", padding:"10px 28px" }} onClick={() => loadMyOrders(customer.mobile)}>🔄 Refresh</button>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:700 }}>
                  {myOrders.length} order{myOrders.length !== 1 ? "s" : ""} for {customer.mobile}
                </div>
                <button style={{ background:"none", border:"none", fontSize:12, color:"var(--ink3)", cursor:"pointer", fontFamily:"inherit", padding:"6px 10px" }}
                  onClick={() => loadMyOrders(customer.mobile)}>🔄 Refresh</button>
              </div>
              {myOrders.map((o) => {
                const sc      = ORDER_STATUS_STYLE[o.status] || ORDER_STATUS_STYLE.new;
                const orderId = o.order_id || o.id;
                const orderDate = o.created_at
                  ? new Date(o.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
                  : "—";
                return (
                  <div key={orderId} className="cv-ocard">
                    <div className="cv-ocard-hdr">
                      <div><div className="cv-oid">#{orderId}</div><div className="cv-odate">{orderDate}</div></div>
                      <span className="cv-status" style={{ background:sc.bg, color:sc.c }}>{(o.status || "new").toUpperCase()}</span>
                    </div>
                    {o.payment_id && (
                      <div style={{ marginBottom:8 }}>
                        <span style={{ fontSize:10, background:"#EFF6FF", color:"#1E40AF", padding:"3px 9px", borderRadius:100, fontWeight:700 }}>
                          💳 Razorpay · {o.payment_id}
                        </span>
                      </div>
                    )}
                    <div className="cv-oitems">
                      {(o.items || []).map((it, i) => (
                        <div key={i} className="cv-oitem">
                          <span>{it.name} × {it.qty} {it.unit}</span>
                          <span style={{ fontWeight:700 }}>{fmt(Number(it.qty) * Number(it.price ?? 0))}</span>
                        </div>
                      ))}
                    </div>
                    <div className="cv-ofoot">
                      <div>
                        <div style={{ fontSize:11, color:"var(--ink3)" }}>Advance paid</div>
                        <div style={{ fontSize:14, fontWeight:700, color:"var(--green)" }}>{fmt(o.advance)}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:11, color:"var(--ink3)" }}>{Number(o.balance) > 0 ? "Balance due" : "Total paid"}</div>
                        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:16, fontWeight:800, color:Number(o.balance) > 0 ? "var(--red)" : "var(--green)" }}>
                          {Number(o.balance) > 0 ? fmt(o.balance) : fmt(o.subtotal)}
                        </div>
                      </div>
                    </div>
                    {o.status === "ready" && <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"10px 14px", marginTop:10, fontSize:12, fontWeight:700, color:"var(--green)" }}>✅ Ready for pickup! Bring {fmt(o.balance)} if balance due.</div>}
                    {o.status === "completed" && <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"9px 13px", marginTop:10, fontSize:12, fontWeight:700, color:"var(--green)" }}>✓ Completed — Thank you!</div>}
                    {o.status === "cancelled" && <div style={{ background:"#FFF5F5", border:"1px solid #FECACA", borderRadius:10, padding:"9px 13px", marginTop:10, fontSize:12, fontWeight:700, color:"var(--red)" }}>✕ This order was cancelled.</div>}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {cartCount > 0 && <div style={{ height:100 }} />}

      {cartCount > 0 && modal === null && (
        <div className="cv-bar">
          <div className="cv-bar-inner">
            <div>
              <div className="cv-bar-count">{cartCount} item{cartCount !== 1 ? "s" : ""} in cart</div>
              <div className="cv-bar-total">{fmt(cartTotal)}</div>
            </div>
            <button className="cv-bar-btn" onClick={() => { setCheckStep(0); setModal("checkout"); }}>Checkout →</button>
          </div>
        </div>
      )}

      {/* ── CART MODAL ── */}
      {modal === "cart" && (
        <div className="cv-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="cv-sheet">
            <div className="cv-drag" />
            <div className="cv-sheet-head">
              <div className="cv-sheet-title">🛒 Your Cart</div>
              <button className="cv-close-btn" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="cv-body">
              {cartItems.length === 0 ? (
                <div className="cv-empty" style={{ padding:"40px 0" }}>
                  <div className="cv-empty-ico">🛒</div>
                  <div className="cv-empty-h" style={{ fontSize:16 }}>Cart is empty</div>
                </div>
              ) : (
                <>
                  {cartItems.map((ci) => {
                    const se = stockRef.current.find((s) => String(s.id) === String(ci.id));
                    return <CartRow key={String(ci.id)} item={ci} maxQty={se ? Number(se.qty) : Infinity} onAdd={addToCart} onRemove={removeFromCart} />;
                  })}
                  <div className="cv-summary">
                    <div className="cv-sum-row"><span>Subtotal ({cartCount} items)</span><span style={{ fontWeight:700 }}>{fmt(cartTotal)}</span></div>
                    <div className="cv-sum-row total"><span>Total</span><span>{fmt(cartTotal)}</span></div>
                  </div>
                  <div style={{ marginTop:16 }}>
                    <button className="cv-btn cv-btn-primary" onClick={() => { setCheckStep(0); setModal("checkout"); }}>Proceed to Checkout →</button>
                    <button className="cv-btn cv-btn-red" onClick={() => { clearCart(); setModal(null); }}>🗑 Clear Cart</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CHECKOUT MODAL ── */}
      {modal === "checkout" && (
        <div className="cv-overlay" onClick={(e) => { if (e.target === e.currentTarget) { checkStep > 0 ? setCheckStep(s => s - 1) : setModal("cart"); } }}>
          <div className="cv-sheet">
            <div className="cv-drag" />
            <div className="cv-sheet-head">
              <button className="cv-back-btn" onClick={() => { checkStep > 0 ? setCheckStep(s => s - 1) : setModal("cart"); }}>←</button>
              <div className="cv-sheet-title">{["Review Order", "Confirm & Pay"][checkStep]}</div>
            </div>

            <Steps current={checkStep} />

            <div className="cv-body" style={{ paddingTop:6 }}>
              {/* ── STEP 0: Review ── */}
              {checkStep === 0 && (
                <>
                  {/* Pre-filled customer info — read only */}
                  <div style={{ marginBottom:18 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--ink3)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:10 }}>Ordering As</div>
                    <div className="cv-locked-field">
                      <span className="cv-locked-ico">👤</span>
                      <div className="cv-locked-info">
                        <div className="cv-locked-lbl">Name</div>
                        <div className="cv-locked-val">{customer.name}</div>
                      </div>
                      <span className="cv-locked-badge">✓ Verified</span>
                    </div>
                    <div className="cv-locked-field">
                      <span className="cv-locked-ico">📱</span>
                      <div className="cv-locked-info">
                        <div className="cv-locked-lbl">Mobile</div>
                        <div className="cv-locked-val">+91 {customer.mobile}</div>
                      </div>
                      <span className="cv-locked-badge">✓ OTP</span>
                    </div>
                  </div>

                  <div style={{ marginBottom:14 }}>
                    {cartItems.map((ci) => (
                      <div key={String(ci.id)} className="cv-rev-item">
                        <div>
                          <div className="cv-rev-name">{ci.name}</div>
                          <div className="cv-rev-qty">{ci.qty} {ci.unit} × {fmt(ci.price)}</div>
                        </div>
                        <div className="cv-rev-price">{fmt(Number(ci.qty) * Number(ci.price))}</div>
                      </div>
                    ))}
                  </div>

                  <div className="cv-summary" style={{ marginBottom:18 }}>
                    <div className="cv-sum-row"><span>Items</span><span>{cartCount}</span></div>
                    <div className="cv-sum-row total"><span>Order Total</span><span>{fmt(cartTotal)}</span></div>
                  </div>

                  {/* Advance slider — min 10% */}
                  <div className="cv-field">
                    <label className="cv-lbl">
                      Advance Payment
                      <span style={{ fontWeight:400, textTransform:"none", fontSize:10, color:"var(--ink3)", marginLeft:4 }}>
                        (min 10%)
                      </span>
                    </label>
                    <div className="cv-adv-row">
                      <span className="cv-adv-amt">{fmt(advAmt)}</span>
                      <input className="cv-slider" type="range" min="10" max="100" step="5"
                        value={advPct} onChange={(e) => setAdvPct(Number(e.target.value))}
                        style={{ background:`linear-gradient(to right,var(--gold2) ${advPct}%,var(--bg2) ${advPct}%)` }} />
                      <span className="cv-adv-pct">{advPct}%</span>
                    </div>
                    <div className="cv-hint">
                      {advPct === 100 ? "Paying in full now — ✅ nothing due at pickup" : `Pay ${fmt(advAmt)} now · ${fmt(balance)} at pickup`}
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="cv-pay-method-wrap">
                    <span className="cv-pay-method-lbl">Pay {fmt(advAmt)} via</span>
                    <div className="cv-pay-methods">
                      <button className={`cv-pay-method-card${payMethod === "razorpay" ? " selected" : ""}`} onClick={() => setPayMethod("razorpay")}>
                        {payMethod === "razorpay" && <span className="cv-pay-method-badge">✓ Selected</span>}
                        <span className="cv-pay-method-ico">💳</span>
                        <span className="cv-pay-method-title">Razorpay</span>
                        <span className="cv-pay-method-sub">UPI, Cards, Net Banking</span>
                      </button>
                      <button className={`cv-pay-method-card${payMethod === "cash" ? " selected-cash" : ""}`} onClick={() => setPayMethod("cash")}>
                        {payMethod === "cash" && <span className="cv-pay-method-badge">✓ Selected</span>}
                        <span className="cv-pay-method-ico">💵</span>
                        <span className="cv-pay-method-title">Cash at Shop</span>
                        <span className="cv-pay-method-sub">Pay when you collect</span>
                      </button>
                    </div>
                    {payMethod === "razorpay" && (
                      <div style={{ marginTop:8, padding:"8px 12px", background:"#EFF6FF", borderRadius:10, border:"1px solid #BFDBFE", fontSize:11, color:"#1E40AF", fontWeight:500 }}>
                        🔒 Secured by Razorpay · UPI · Cards · Net Banking · Wallets
                      </div>
                    )}
                  </div>

                  <button className="cv-btn cv-btn-primary" onClick={() => setCheckStep(1)}>
                    Review & Confirm →
                  </button>
                  <button className="cv-btn cv-btn-outline" onClick={() => setModal("cart")}>← Edit Cart</button>
                </>
              )}

              {/* ── STEP 1: Confirm ── */}
              {checkStep === 1 && (
                <>
                  <div className="cv-cust-summary">
                    <div className="cv-cust-row"><span style={{ color:"var(--ink3)" }}>Name</span><span style={{ fontWeight:700 }}>{customer.name}</span></div>
                    <div className="cv-cust-row"><span style={{ color:"var(--ink3)" }}>Mobile</span><span style={{ fontWeight:700 }}>+91 {customer.mobile}</span></div>
                    <div className="cv-cust-row"><span style={{ color:"var(--ink3)" }}>Items</span><span style={{ fontWeight:700 }}>{cartCount} item{cartCount !== 1 ? "s" : ""}</span></div>
                    <div className="cv-cust-row">
                      <span style={{ color:"var(--ink3)" }}>Payment via</span>
                      <span style={{ fontWeight:700, color: payMethod === "razorpay" ? "var(--rzp)" : "var(--green)" }}>
                        {payMethod === "razorpay" ? "💳 Razorpay" : "💵 Cash at Shop"}
                      </span>
                    </div>
                  </div>

                  <div className="cv-pay-card">
                    <div className="cv-pay-row sub">
                      <span style={{ color:"var(--ink2)" }}>Order Total</span>
                      <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:17 }}>{fmt(cartTotal)}</span>
                    </div>
                    <div className="cv-pay-row adv">
                      <div>
                        <div style={{ fontWeight:700, color:"var(--green)" }}>
                          {payMethod === "razorpay" ? "💳 Paying via Razorpay" : "✓ Paying Now (Cash)"}
                        </div>
                        <div style={{ fontSize:11, color:"var(--ink3)", marginTop:2 }}>{advPct}% advance</div>
                      </div>
                      <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:17, color:"var(--green)" }}>{fmt(advAmt)}</span>
                    </div>
                    {balance > 0 ? (
                      <div className="cv-pay-row bal">
                        <div>
                          <div style={{ fontWeight:700, color:"#B45309" }}>Balance at Pickup</div>
                          <div style={{ fontSize:11, color:"var(--ink3)", marginTop:2 }}>Bring this to the shop</div>
                        </div>
                        <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:17, color:"#B45309" }}>{fmt(balance)}</span>
                      </div>
                    ) : (
                      <div className="cv-pay-row full">
                        <span style={{ fontWeight:700, color:"var(--green)" }}>✅ Fully Paid</span>
                        <span style={{ fontWeight:600, color:"var(--green)", fontSize:13 }}>Nothing due at pickup</span>
                      </div>
                    )}
                  </div>

                  {payMethod === "razorpay" ? (
                    <>
                      <button className="cv-rzp-btn" onClick={handlePlaceOrder} disabled={placing}>
                        {placing
                          ? <><div className="cv-spin-white" />Processing…</>
                          : <><span>💳</span>Place & Pay {fmt(advAmt)}<span className="cv-rzp-badge">Razorpay</span></>}
                      </button>
                      <div style={{ textAlign:"center", fontSize:11, color:"var(--ink3)", margin:"10px 0 4px" }}>🔒 Secured by Razorpay · 256-bit SSL</div>
                    </>
                  ) : (
                    <button className="cv-btn cv-btn-primary" onClick={handlePlaceOrder} disabled={placing}>
                      {placing
                        ? <><div className="cv-spin-white" />Placing Order…</>
                        : advAmt > 0 ? `✅ Confirm Order (Pay ${fmt(advAmt)} at shop)` : "✅ Confirm Order"}
                    </button>
                  )}

                  <button className="cv-btn cv-btn-outline" onClick={() => setCheckStep(0)} disabled={placing}>← Edit Order</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS MODAL ── */}
      {modal === "success" && lastOrder && (
        <div className="cv-overlay">
          <div className="cv-sheet">
            <div className="cv-drag" />
            <div className="cv-success">
              <div className="cv-success-ring">{payStatus === "failed" ? "⚠️" : "✓"}</div>
              <div className="cv-success-h">Order Placed! 🎉</div>
              <div className="cv-success-p">
                {payStatus === "verified"
                  ? "Payment confirmed! The shop has been notified and will prepare your order."
                  : payStatus === "failed"
                  ? "Your order is saved. Please pay at the shop when you collect."
                  : "The shop has been notified. You'll be contacted when your order is ready."}
              </div>
              <div className="cv-oid-tag">🧾 #{lastOrder.order_id || lastOrder.id}</div>

              {payStatus === "verified" && paymentId && (
                <div className="cv-rzp-paid-tag">💳 Paid via Razorpay · {paymentId}</div>
              )}
              {payStatus === "failed" && (
                <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:10, padding:"10px 14px", fontSize:12, fontWeight:600, color:"#92400E", marginBottom:14 }}>
                  ⚠️ Online payment was not completed. Please pay {fmt(lastOrder.advance)} in cash at the shop.
                </div>
              )}

              <div className="cv-detail-card">
                {[
                  ["Customer",    lastOrder.customer_name],
                  ["Mobile",      `+91 ${lastOrder.customer_mobile}`],
                  ["Items",       `${(lastOrder.items || []).length} item(s)`],
                  ["Order Total", fmt(lastOrder.subtotal)],
                  ["Advance",     fmt(lastOrder.advance)],
                  ["Balance Due", Number(lastOrder.balance) > 0 ? fmt(lastOrder.balance) : "✓ Fully Paid"],
                  ...(paymentId ? [["Payment ID", paymentId]] : []),
                ].map(([l, v]) => (
                  <div key={l} className="cv-det-row">
                    <span className="cv-det-lbl">{l}</span>
                    <span className="cv-det-val" style={{
                      color: l === "Balance Due" && Number(lastOrder.balance) > 0 ? "var(--red)"
                           : l === "Advance" ? "var(--green)"
                           : l === "Payment ID" ? "var(--rzp)" : "var(--ink)",
                      fontSize: l === "Payment ID" ? 11 : undefined,
                      wordBreak:"break-all",
                    }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="cv-next">
                <div className="cv-next-h">📦 What happens next?</div>
                {[
                  "Shop owner has received your order",
                  "Your items are being packed",
                  payStatus === "verified"
                    ? (Number(lastOrder.balance) > 0 ? `Bring ${fmt(lastOrder.balance)} when you collect` : "Nothing to pay — just collect at the shop")
                    : (Number(lastOrder.advance) > 0 ? `Pay ${fmt(lastOrder.advance)} + ${fmt(lastOrder.balance)} balance at shop` : "Pay full amount at the shop"),
                ].map((s, i) => (
                  <div key={i} className="cv-next-item"><span className="cv-next-num">{i + 1}</span>{s}</div>
                ))}
              </div>

              <button className="cv-btn cv-btn-dark" onClick={() => { setModal(null); setTab("orders"); loadMyOrders(customer.mobile); }}>📦 Track My Order</button>
              <button className="cv-btn cv-btn-outline" onClick={() => { setModal(null); setPayStatus(null); setPaymentId(null); }}>🛒 Continue Shopping</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
