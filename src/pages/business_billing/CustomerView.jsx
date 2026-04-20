/**
 * CustomerView.jsx — Public QR Customer View (Fixed)
 *
 * KEY FIXES:
 * 1. Public QR flow uses /api/public/shop/<scanner_id>/ — NO auth needed
 * 2. Authenticated owner flow uses authAxios as before
 * 3. scannerId reliably extracted from URL or prop
 * 4. Orders submitted to public API → stored server-side, visible on any phone
 * 5. "My Orders" fetches from server by mobile number, not localStorage
 * 6. localStorage used only as cache/fallback, never as source of truth
 */

import React, {
  useState, useCallback, useMemo, useEffect, useRef, memo,
} from "react";
import { authAxios } from "../../services/api";

// ─── Constants ────────────────────────────────────────────────
const TOAST_MS = 3500;
const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// ─── Detect if this is a public QR page (no auth) ────────────
// Returns scanner_id from URL like /shop/<scanner_id> or /scan/<scanner_id>
// or /customer/<scanner_id>, etc.
const extractScannerIdFromUrl = () => {
  try {
    const path   = window.location.pathname;
    const search = window.location.search;
    // ?scanner=xxx
    const qp = new URLSearchParams(search);
    if (qp.get("scanner")) return qp.get("scanner");
    if (qp.get("scanner_id")) return qp.get("scanner_id");
    // /shop/SCANNER_ID or /scan/SCANNER_ID or /public/shop/SCANNER_ID
    const segments = path.split("/").filter(Boolean);
    const markers  = ["shop", "scan", "public", "qr", "customer"];
    for (let i = 0; i < segments.length; i++) {
      if (markers.includes(segments[i]) && segments[i + 1]) {
        return segments[i + 1];
      }
    }
    // last path segment if looks like a UUID/code
    const last = segments[segments.length - 1];
    if (last && last.length > 4 && last !== "shop") return last;
  } catch { /* ignore */ }
  return null;
};

// ─── API helpers ──────────────────────────────────────────────
// Public fetch — no Authorization header, works on any phone
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

const publicGet  = (url)          => publicFetch(url);
const publicPost = (url, body)    => publicFetch(url, { method: "POST", body: JSON.stringify(body) });

// ─── Sanitize helpers ─────────────────────────────────────────
const sanitizeName   = (v) => v.replace(/[^a-zA-Z\s.'-]/g, "").slice(0, 60);
const sanitizeMobile = (v) => v.replace(/\D/g, "").slice(0, 10);

// ─── Shop open/close status ───────────────────────────────────
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

// ─── CSS ─────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

  :root {
    --ink:   #0A0F1E; --ink2: #3D4660; --ink3: #8892A4;
    --bg:    #F4F2EF; --bg2:  #ECEAE6; --white:#FFFFFF;
    --gold:  #C9841A; --gold2:#E8A020;
    --green: #15803D; --red:  #DC2626; --blue: #1E40AF;
    --r:18px; --sh:0 2px 12px rgba(10,15,30,.07); --sh2:0 8px 32px rgba(10,15,30,.13);
  }

  @keyframes slideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes popIn    { 0%{transform:scale(.8);opacity:0} 65%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes toastIn  { from{opacity:0;transform:translate(-50%,-14px)} to{opacity:1;transform:translate(-50%,0)} }
  @keyframes barUp    { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

  *,*::before,*::after { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }

  .cv-root { min-height:100vh; background:var(--bg); font-family:'DM Sans',system-ui,sans-serif; color:var(--ink); padding-bottom:110px; }

  /* Header */
  .cv-hdr { background:var(--ink); padding:16px 18px 14px; position:sticky; top:0; z-index:100; box-shadow:0 2px 20px rgba(10,15,30,.3); }
  .cv-hdr-inner { max-width:760px; margin:0 auto; }
  .cv-hdr-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; gap:10px; }
  .cv-brand { display:flex; align-items:center; gap:11px; }
  .cv-brand-icon { width:40px; height:40px; background:linear-gradient(135deg,var(--gold),var(--gold2)); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
  .cv-brand-name { font-family:'Sora',sans-serif; font-size:18px; font-weight:800; color:#fff; letter-spacing:-.3px; line-height:1.1; }
  .cv-brand-name em { color:var(--gold2); font-style:normal; }
  .cv-brand-shop { font-size:11px; color:rgba(255,255,255,.38); font-weight:400; margin-top:1px; }
  .cv-hdr-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
  .cv-open-badge { padding:5px 12px; border-radius:100px; font-size:11px; font-weight:700; white-space:nowrap; }
  .cv-open-badge.open   { background:rgba(21,128,61,.22); color:#4ADE80; border:1px solid rgba(74,222,128,.2); }
  .cv-open-badge.closed { background:rgba(220,38,38,.22); color:#FCA5A5; border:1px solid rgba(252,165,165,.2); }
  .cv-cart-pill { display:flex; align-items:center; gap:7px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.13); border-radius:14px; padding:8px 14px; cursor:pointer; transition:all .18s; }
  .cv-cart-pill:hover { background:rgba(255,255,255,.17); }
  .cv-cart-pill-txt { font-size:13px; font-weight:600; color:#fff; }
  .cv-cart-pill-badge { background:var(--gold2); color:var(--ink); font-size:10px; font-weight:800; min-width:20px; height:20px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center; padding:0 5px; }
  .cv-cart-pill-amt { font-size:12px; color:rgba(255,255,255,.5); border-left:1px solid rgba(255,255,255,.13); padding-left:9px; margin-left:1px; }
  .cv-search-wrap { position:relative; }
  .cv-search-ico { position:absolute; left:14px; top:50%; transform:translateY(-50%); font-size:14px; pointer-events:none; opacity:.35; }
  .cv-search { width:100%; padding:11px 14px 11px 40px; border-radius:12px; border:1px solid rgba(255,255,255,.1); font-size:14px; font-family:inherit; background:rgba(255,255,255,.08); color:#fff; outline:none; transition:all .2s; }
  .cv-search::placeholder { color:rgba(255,255,255,.3); }
  .cv-search:focus { background:rgba(255,255,255,.13); border-color:rgba(255,255,255,.2); }

  /* Tabs */
  .cv-tabs { display:flex; background:var(--white); border-bottom:1px solid rgba(10,15,30,.06); position:sticky; top:0; z-index:90; }
  .cv-tab { flex:1; padding:13px 0 11px; border:none; font-family:'DM Sans',sans-serif; font-weight:600; font-size:13px; cursor:pointer; transition:all .15s; border-bottom:2.5px solid transparent; background:none; color:var(--ink3); }
  .cv-tab.on { color:var(--ink); background:var(--bg); border-bottom-color:var(--gold2); }

  /* Category pills */
  .cv-cats { display:flex; gap:7px; overflow-x:auto; padding:12px 16px; background:var(--white); border-bottom:1px solid rgba(10,15,30,.05); scrollbar-width:none; }
  .cv-cats::-webkit-scrollbar { display:none; }
  .cv-cat { flex-shrink:0; padding:7px 16px; border-radius:100px; font-size:12px; font-weight:600; cursor:pointer; border:1.5px solid transparent; background:var(--bg2); color:var(--ink2); font-family:inherit; transition:all .18s; white-space:nowrap; }
  .cv-cat:hover:not(.on) { background:#E2DFD9; }
  .cv-cat.on { color:#fff; box-shadow:0 4px 14px rgba(0,0,0,.18); }

  /* Grid */
  .cv-section-lbl { font-size:11px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.08em; padding:16px 16px 8px; max-width:760px; margin:0 auto; }
  .cv-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(162px,1fr)); gap:12px; padding:0 16px 20px; max-width:760px; margin:0 auto; }
  @media(max-width:420px){ .cv-grid{grid-template-columns:repeat(2,1fr);gap:10px;} }

  /* Product card */
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
  .cv-now-btn { padding:9px 5px; border-radius:10px; border:none; font-weight:800; font-size:11px; cursor:pointer; font-family:inherit; transition:all .18s; background:linear-gradient(135deg,var(--gold),var(--gold2)); color:var(--ink); display:flex; align-items:center; justify-content:center; gap:3px; box-shadow:0 3px 10px rgba(201,132,26,.28); }
  .cv-now-btn:hover:not(:disabled) { filter:brightness(1.06); transform:translateY(-1px); box-shadow:0 5px 16px rgba(201,132,26,.4); }
  .cv-now-btn:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }

  /* Cart bar */
  .cv-bar { position:fixed; bottom:0; left:0; right:0; z-index:200; padding:10px 14px 18px; animation:barUp .25s cubic-bezier(.34,1.4,.64,1); }
  .cv-bar-inner { max-width:500px; margin:0 auto; background:var(--ink); border-radius:20px; padding:14px 18px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 -2px 40px rgba(10,15,30,.3); }
  .cv-bar-count { font-size:11px; color:rgba(255,255,255,.4); font-weight:500; }
  .cv-bar-total { font-family:'Sora',sans-serif; font-size:20px; font-weight:800; color:#fff; margin-top:1px; }
  .cv-bar-btn { background:linear-gradient(135deg,var(--gold),var(--gold2)); border:none; border-radius:14px; padding:12px 22px; font-weight:800; font-size:14px; font-family:inherit; color:var(--ink); cursor:pointer; transition:all .18s; white-space:nowrap; }
  .cv-bar-btn:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(232,160,32,.4); }

  /* Modal */
  .cv-overlay { position:fixed; inset:0; background:rgba(10,15,30,.6); backdrop-filter:blur(5px); z-index:300; display:flex; align-items:flex-end; justify-content:center; animation:fadeIn .22s ease; }
  .cv-sheet { background:var(--white); border-radius:26px 26px 0 0; width:100%; max-width:520px; animation:slideUp .3s cubic-bezier(.34,1.15,.64,1); max-height:94vh; overflow-y:auto; overscroll-behavior:contain; }
  @media(min-width:600px){ .cv-overlay{align-items:center} .cv-sheet{border-radius:24px;max-height:88vh} }
  .cv-drag { width:38px; height:4px; background:rgba(10,15,30,.1); border-radius:2px; margin:12px auto 0; }
  .cv-sheet-head { padding:16px 18px 14px; border-bottom:1px solid rgba(10,15,30,.06); display:flex; align-items:center; gap:10px; }
  .cv-back-btn { width:36px; height:36px; border-radius:10px; border:1.5px solid rgba(10,15,30,.1); background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--ink2); font-size:16px; transition:all .15s; flex-shrink:0; }
  .cv-back-btn:hover { background:var(--bg2); }
  .cv-sheet-title { font-family:'Sora',sans-serif; font-size:17px; font-weight:700; color:var(--ink); margin:0; flex:1; }
  .cv-close-btn { width:36px; height:36px; border-radius:10px; border:none; background:var(--bg2); cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--ink2); font-size:18px; transition:all .15s; flex-shrink:0; }
  .cv-close-btn:hover { background:var(--bg); color:var(--ink); }
  .cv-body { padding:18px 18px 28px; }

  /* Cart modal */
  .cv-cart-row { display:flex; align-items:center; gap:11px; padding:12px 0; border-bottom:1px solid rgba(10,15,30,.05); animation:slideUp .2s ease; }
  .cv-cart-row:last-child { border-bottom:none; }
  .cv-cart-ico { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
  .cv-cart-info { flex:1; min-width:0; }
  .cv-cart-name { font-size:14px; font-weight:600; color:var(--ink); }
  .cv-cart-rate { font-size:12px; color:var(--ink3); margin-top:2px; }
  .cv-cart-ctrl { display:flex; align-items:center; gap:7px; flex-shrink:0; }
  .cv-cart-line { font-family:'Sora',sans-serif; font-weight:800; font-size:15px; color:var(--ink); min-width:58px; text-align:right; flex-shrink:0; }
  .cv-summary { background:var(--bg); border-radius:14px; padding:13px 15px; margin-top:8px; }
  .cv-sum-row { display:flex; justify-content:space-between; font-size:13px; color:var(--ink2); padding:4px 0; }
  .cv-sum-row.total { font-family:'Sora',sans-serif; font-weight:800; font-size:17px; color:var(--ink); border-top:1px solid rgba(10,15,30,.08); margin-top:8px; padding-top:11px; }

  /* Steps */
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

  /* Review step */
  .cv-rev-item { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid rgba(10,15,30,.05); }
  .cv-rev-item:last-child { border-bottom:none; }
  .cv-rev-name { font-size:13px; font-weight:600; color:var(--ink); }
  .cv-rev-qty  { font-size:11px; color:var(--ink3); margin-top:2px; }
  .cv-rev-price { font-family:'Sora',sans-serif; font-weight:700; font-size:14px; color:var(--ink); flex-shrink:0; }

  /* Form */
  .cv-field { margin-bottom:14px; }
  .cv-lbl { font-size:11px; font-weight:700; color:var(--ink3); text-transform:uppercase; letter-spacing:.07em; margin-bottom:7px; display:block; }
  .cv-inp-wrap { position:relative; }
  .cv-inp-ico { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:16px; pointer-events:none; }
  .cv-inp { width:100%; padding:13px 14px 13px 42px; border-radius:12px; border:1.5px solid rgba(10,15,30,.12); font-size:15px; font-family:inherit; color:var(--ink); outline:none; transition:all .2s; background:var(--white); }
  .cv-inp:focus { border-color:var(--gold2); box-shadow:0 0 0 3px rgba(232,160,32,.12); }
  .cv-inp.no-ico { padding-left:14px; }
  .cv-hint { font-size:11px; color:var(--ink3); margin-top:5px; padding-left:2px; }

  /* Advance slider */
  .cv-adv-row { display:flex; align-items:center; gap:12px; margin-bottom:6px; }
  .cv-adv-amt { font-family:'Sora',sans-serif; font-size:16px; font-weight:700; color:var(--ink); min-width:70px; }
  .cv-slider { flex:1; -webkit-appearance:none; height:5px; border-radius:3px; outline:none; cursor:pointer; }
  .cv-slider::-webkit-slider-thumb { -webkit-appearance:none; width:22px; height:22px; border-radius:50%; background:var(--gold2); cursor:pointer; border:3px solid #fff; box-shadow:0 1px 7px rgba(0,0,0,.22); }
  .cv-slider::-moz-range-thumb { width:22px; height:22px; border-radius:50%; background:var(--gold2); cursor:pointer; border:3px solid #fff; }
  .cv-adv-pct { font-size:12px; color:var(--ink3); min-width:34px; text-align:right; }

  /* Payment card */
  .cv-pay-card { border-radius:14px; overflow:hidden; border:1.5px solid rgba(10,15,30,.07); margin-bottom:16px; }
  .cv-pay-row { display:flex; justify-content:space-between; align-items:center; padding:12px 15px; font-size:13px; border-bottom:1px solid rgba(10,15,30,.05); }
  .cv-pay-row:last-child { border-bottom:none; }
  .cv-pay-row.sub  { background:var(--bg); }
  .cv-pay-row.adv  { background:#F0FDF4; }
  .cv-pay-row.bal  { background:#FFF7ED; }
  .cv-pay-row.full { background:#F0FDF4; }

  /* Customer summary */
  .cv-cust-summary { background:var(--bg); border-radius:13px; padding:13px 15px; margin-bottom:16px; }
  .cv-cust-row { display:flex; justify-content:space-between; font-size:13px; padding:5px 0; border-bottom:1px solid rgba(10,15,30,.05); }
  .cv-cust-row:last-child { border-bottom:none; }

  /* Buttons */
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

  /* Error banner */
  .cv-error-box { background:#FEF2F2; border:1.5px solid #FECACA; border-radius:14px; padding:16px 18px; margin:16px; text-align:center; }
  .cv-error-box h3 { color:var(--red); font-family:'Sora',sans-serif; font-size:15px; margin:0 0 6px; }
  .cv-error-box p  { color:#7F1D1D; font-size:13px; margin:0 0 12px; }

  /* Success */
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

  /* My Orders */
  .cv-ocard { background:var(--white); border-radius:16px; border:1.5px solid rgba(10,15,30,.06); padding:15px; margin-bottom:12px; box-shadow:var(--sh); }
  .cv-ocard-hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
  .cv-oid { font-family:'Sora',sans-serif; font-weight:700; font-size:14px; color:var(--ink); }
  .cv-odate { font-size:11px; color:var(--ink3); margin-top:2px; }
  .cv-status { font-size:10px; font-weight:800; padding:4px 12px; border-radius:100px; text-transform:uppercase; letter-spacing:.04em; }
  .cv-oitems { background:var(--bg); border-radius:10px; padding:10px 12px; margin-bottom:10px; }
  .cv-oitem { display:flex; justify-content:space-between; font-size:13px; color:var(--ink2); padding:3px 0; }
  .cv-ofoot { display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid rgba(10,15,30,.06); }

  /* Util */
  .cv-empty { text-align:center; padding:60px 20px; animation:fadeIn .4s ease; }
  .cv-empty-ico { font-size:52px; margin-bottom:16px; }
  .cv-empty-h { font-family:'Sora',sans-serif; font-size:18px; font-weight:700; color:var(--ink); margin-bottom:8px; }
  .cv-empty-p { font-size:13px; color:var(--ink3); line-height:1.6; }
  .cv-closed { background:#7F1D1D; color:#FCA5A5; text-align:center; padding:10px 16px; font-size:13px; font-weight:700; }
  .cv-toast { position:fixed; top:72px; left:50%; transform:translateX(-50%); z-index:9999; padding:11px 22px 11px 14px; border-radius:100px; font-weight:700; font-size:13px; white-space:nowrap; box-shadow:0 6px 24px rgba(0,0,0,.22); cursor:pointer; animation:toastIn .3s cubic-bezier(.34,1.3,.64,1); font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:8px; max-width:calc(100vw - 32px); }
  .cv-toast-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .cv-shimmer { background:linear-gradient(90deg,var(--bg2) 25%,var(--bg) 50%,var(--bg2) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:16px; }
`;

if (typeof document !== "undefined" && !document.getElementById("__cv_v4")) {
  const el = document.createElement("style");
  el.id = "__cv_v4";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

// ─── Step Indicator ───────────────────────────────────────────
const Steps = ({ current }) => {
  const labels = ["Review", "Details", "Confirm"];
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

// ─── ProductCard ──────────────────────────────────────────────
const ProductCard = memo(({ item, qty, onAdd, onRemove, onOrderNow, color, delay }) => {
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

// ─── CartRow ──────────────────────────────────────────────────
const CartRow = memo(({ item, maxQty, onAdd, onRemove }) => {
  const lineTotal  = Number(item.qty) * Number(item.price);
  const maxReached = item.qty >= (maxQty ?? Infinity);
  return (
    <div className="cv-cart-row">
      <div className="cv-cart-ico" style={{ background:"#F1F5F9" }}>{getCatIcon(item.category || "")}</div>
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
  // Owner-dashboard props (optional — when embedded in owner app)
  shopProfile:  propShopProfile = null,
  stockItems:   propStockItems  = null,
  loading:      propLoading     = null,
  scannerId:    propScannerId   = null,
  onOrderPlaced,
  onStockRefresh,
  toast$:       propToast$      = null,
}) {
  // ── Detect mode ──────────────────────────────────────────────
  // isPublic = true  → customer scanned QR on their own phone (no auth)
  // isPublic = false → shop owner viewing their own customer page (has auth)
  const urlScannerId = extractScannerIdFromUrl();
  const effectiveScannerId = propScannerId || urlScannerId || "";
  // If we have a scanner ID from the URL and no prop overrides, assume public
  const isPublic = !propShopProfile && !propStockItems && !!urlScannerId;

  // ── State ────────────────────────────────────────────────────
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
  const [custName,     setCustName]     = useState("");
  const [custMob,      setCustMob]      = useState("");
  const [advPct,       setAdvPct]       = useState(0);
  const [placing,      setPlacing]      = useState(false);
  const [lastOrder,    setLastOrder]    = useState(null);
  const [myOrders,     setMyOrders]     = useState([]);
  const [ordersLoading,setOrdersLoading]= useState(false);
  const [lookupMob,    setLookupMob]    = useState("");

  const stockRef = useRef(stockItems);
  useEffect(() => { stockRef.current = stockItems; }, [stockItems]);

  // ── Toast helper ─────────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    if (propToast$) { propToast$(msg, type); return; }
    setLocalToast({ msg, type });
    setTimeout(() => setLocalToast(null), TOAST_MS);
  }, [propToast$]);

  // ── Load data ────────────────────────────────────────────────
  useEffect(() => {
    // If parent is passing data directly, skip fetching
    if (propShopProfile && propStockItems) {
      setShopProfile(propShopProfile);
      setStockItems(propStockItems);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    if (isPublic && effectiveScannerId) {
      // ══════════════════════════════════════════════════════
      // PUBLIC PATH — customer scanned QR on their own phone
      // Uses the unauthenticated public API endpoint
      // ══════════════════════════════════════════════════════
      publicGet(`public/shop/${effectiveScannerId}/`)
        .then((data) => {
          // data = { shop: {...}, products: [...], scanner_id: "..." }
          setShopProfile(data.shop);
          setStockItems(
            (data.products || []).filter((p) => Number(p.qty) > 0)
          );
          setScannerId(data.scanner_id || effectiveScannerId);
          setLoading(false);
        })
        .catch((err) => {
          if (err.status === 404) {
            setLoadError("This shop link is no longer active. Please ask the shop for a new QR code.");
          } else {
            setLoadError("Could not load shop. Please check your internet connection and try again.");
          }
          setLoading(false);
        });
    } else {
      // ══════════════════════════════════════════════════════
      // OWNER PATH — viewing via authenticated dashboard
      // Uses authAxios with login session
      // ══════════════════════════════════════════════════════
      Promise.all([
        authAxios.get("business/shop-profile/").catch(() => ({ data: null })),
        authAxios.get("business/products/").catch(() => ({ data: [] })),
        authAxios.get("business/scanner/").catch(() => ({ data: null })),
      ]).then(([profileRes, productsRes, scannerRes]) => {
        setShopProfile(profileRes.data);
        const items = (productsRes.data || [])
          .filter((p) => Number(p.qty) > 0 && p.is_active !== false);
        setStockItems(items);
        if (scannerRes.data?.scanner_id) setScannerId(scannerRes.data.scanner_id);
        setLoading(false);
      }).catch(() => {
        setLoadError("Failed to load shop data.");
        setLoading(false);
      });
    }
  }, [isPublic, effectiveScannerId, propShopProfile, propStockItems]);

  // ── Derived data ─────────────────────────────────────────────
  const shopStatus = useMemo(() => getShopStatus(shopProfile?.timings), [shopProfile]);

  const categories = useMemo(() =>
    ["All", ...new Set(stockItems.map((s) => s.category || "General"))],
    [stockItems]
  );

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

  // ── Cart operations ───────────────────────────────────────────
  const addToCart = useCallback((item) => {
    const sid = String(item.id);
    setCart((prev) => {
      const existing = prev[sid];
      const stock    = stockRef.current.find((s) => String(s.id) === sid);
      const stockQty = stock ? Number(stock.qty) : Infinity;
      const current  = existing?.qty || 0;
      if (current >= stockQty) {
        showToast(`Only ${stockQty} ${item.unit} available`, "error");
        return prev;
      }
      return {
        ...prev,
        [sid]: {
          id:    item.id,
          name:  item.name,
          unit:  item.unit,
          price: Number(item.selling_price),
          qty:   current + 1,
        },
      };
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

  const handleOrderNow = useCallback((item) => {
    const sid   = String(item.id);
    const stock = stockRef.current.find((s) => String(s.id) === sid);
    if (!stock || Number(stock.qty) <= 0) {
      showToast(`"${item.name}" is out of stock`, "error");
      return;
    }
    setCart({ [sid]: { id:item.id, name:item.name, unit:item.unit, price:Number(item.selling_price), qty:1 } });
    setCheckStep(0);
    setModal("checkout");
  }, [showToast]);

  // ── Load My Orders from server ────────────────────────────────
  // FIX: Queries server by mobile number, works on any phone
  const loadMyOrders = useCallback(async (mobile) => {
    if (!mobile || mobile.length !== 10) return;
    setOrdersLoading(true);

    try {
      if (isPublic) {
        // Public endpoint: GET /api/public/shop/<scanner_id>/orders/?mobile=XXXXXXXXXX
        const data = await publicGet(`public/shop/${scannerId}/orders/?mobile=${mobile}`);
        setMyOrders(Array.isArray(data) ? data : data.results || []);
      } else {
        // Owner authenticated endpoint (filtered by mobile)
        const res = await authAxios.get(`business/orders/?mobile=${mobile}`);
        setMyOrders(Array.isArray(res.data) ? res.data : res.data?.results || []);
      }
    } catch {
      // Fallback: empty list with a helpful message
      setMyOrders([]);
      showToast("Could not load orders. Check your connection.", "error");
    } finally {
      setOrdersLoading(false);
    }
  }, [isPublic, scannerId, showToast]);

  // ── Place Order ───────────────────────────────────────────────
  // FIX: Sends to public API — no auth needed, works on customer's phone
  const handlePlaceOrder = useCallback(async () => {
    const name   = custName.trim();
    const mobile = custMob.trim();

    if (!name)                { showToast("Please enter your name", "error");        return; }
    if (mobile.length !== 10) { showToast("Enter valid 10-digit mobile", "error");   return; }
    if (!cartItems.length)    { showToast("Cart is empty", "error");                  return; }

    setPlacing(true);

    const orderPayload = {
      customer_name:   name,
      customer_mobile: mobile,
      advance:         advAmt,
      items: cartItems.map((ci) => ({
        product_id: ci.id,
        qty:        ci.qty,
      })),
    };

    try {
      let placedOrder;

      if (isPublic) {
        // ── PUBLIC: POST /api/public/shop/<scanner_id>/order/ ──
        // No auth needed — this is the correct endpoint for QR customers
        placedOrder = await publicPost(
          `public/shop/${scannerId}/order/`,
          orderPayload
        );
      } else {
        // ── OWNER PREVIEW: POST /api/business/orders/ ──
        const res = await authAxios.post("business/orders/", orderPayload);
        placedOrder = res.data;
      }

      // Notify parent (owner dashboard) if callback provided
      onOrderPlaced?.(placedOrder);

      // Update stock display (remove items that are now sold)
      const updatedStock = stockRef.current.map((s) => {
        const cartItem = cartItems.find((ci) => String(ci.id) === String(s.id));
        if (cartItem) return { ...s, qty: Math.max(0, Number(s.qty) - Number(cartItem.qty)) };
        return s;
      }).filter((s) => Number(s.qty) > 0);

      setStockItems(updatedStock);
      onStockRefresh?.(updatedStock);

      setLastOrder(placedOrder);
      clearCart();
      setCustName("");
      setCustMob("");
      setAdvPct(0);
      setModal("success");
      showToast(`✅ Order ${placedOrder.order_id || placedOrder.id} placed!`);

    } catch (err) {
      const msg = err?.data?.stock
        ? err.data.stock.join(" · ")
        : err?.data?.detail || err?.message || "Order failed. Please try again.";
      showToast(msg, "error");
    } finally {
      setPlacing(false);
    }
  }, [
    custName, custMob, advAmt, cartItems,
    isPublic, scannerId,
    onOrderPlaced, onStockRefresh,
    clearCart, showToast,
  ]);

  // ── Toast colors ──────────────────────────────────────────────
  const toastColors = {
    success: { bg:"#0A0F1E", dot:"#4ADE80" },
    error:   { bg:"#7F1D1D", dot:"#FCA5A5" },
    info:    { bg:"#1E3A8A", dot:"#93C5FD" },
  };
  const tc = toastColors[localToast?.type] || toastColors.success;
  const shopName = shopProfile?.shop_name || "Shop";

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="cv-root">

      {/* Toast */}
      {localToast && (
        <div className="cv-toast" style={{ background:tc.bg, color:"#fff" }}
          onClick={() => setLocalToast(null)}>
          <div className="cv-toast-dot" style={{ background:tc.dot }} />
          {localToast.msg}
        </div>
      )}

      {/* Closed banner */}
      {!shopStatus.open && shopStatus.label && (
        <div className="cv-closed">🔒 {shopStatus.label}</div>
      )}

      {/* Header */}
      <div className="cv-hdr">
        <div className="cv-hdr-inner">
          <div className="cv-hdr-top">
            <div className="cv-brand">
              <div>
                <div className="cv-brand-name">Mana<em>Bills</em></div>
                <div className="cv-brand-shop">{shopName}</div>
                <div className="cv-brand-shop">{shopProfile?.owner_name}</div>

                {shopProfile?.address && (
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.28)", marginTop:1 }}>
                    📍 {shopProfile.address}
                  </div>
                )}
                {shopProfile?.mobile && (
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.28)", marginTop:1 }}>
                    📱 {shopProfile.mobile}
                  </div>
                )}
              </div>  
            </div>
            <div className="cv-hdr-actions">
              {shopStatus.label && (
                <span className={`cv-open-badge ${shopStatus.open ? "open" : "closed"}`}>
                  {shopStatus.open ? "● Open" : "○ Closed"}
                </span>
              )}
              {cartCount > 0 && (
                <button className="cv-cart-pill" onClick={() => setModal("cart")}>
                  <span style={{ fontSize:17 }}>🛒</span>
                  <span className="cv-cart-pill-txt">Cart</span>
                  <span className="cv-cart-pill-badge">{cartCount}</span>
                  <span className="cv-cart-pill-amt">{fmt(cartTotal)}</span>
                </button>
              )}
            </div>
          </div>
          <div className="cv-search-wrap">
            <span className="cv-search-ico">🔍</span>
            <input className="cv-search" type="text" placeholder="Search products…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="cv-tabs">
        {[{ k:"shop", l:"🛒 Shop" }, { k:"orders", l:"📦 My Orders" }].map(({ k, l }) => (
          <button key={k} className={`cv-tab${tab === k ? " on" : ""}`}
            onClick={() => { setTab(k); }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── SHOP TAB ── */}
      {tab === "shop" && (
        <>
          {/* Error state */}
          {loadError && !loading && (
            <div className="cv-error-box" style={{ margin:20 }}>
              <h3>⚠️ Could not load shop</h3>
              <p>{loadError}</p>
              <button className="cv-btn cv-btn-dark" style={{ width:"auto", padding:"10px 24px" }}
                onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          )}

          {/* Category pills */}
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

          {/* Loading skeletons */}
          {loading && (
            <div style={{ padding:"16px", maxWidth:760, margin:"0 auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(162px,1fr))", gap:12 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ height:220 }} className="cv-shimmer" />
                ))}
              </div>
            </div>
          )}

          {/* Empty / no products */}
          {!loading && !loadError && filtered.length === 0 && (
            <div className="cv-empty">
              <div className="cv-empty-ico">🛒</div>
              <div className="cv-empty-h">{stockItems.length === 0 ? "No products available" : "Nothing found"}</div>
              <div className="cv-empty-p">
                {stockItems.length === 0
                  ? "The shop hasn't added stock yet."
                  : "Try a different search or category."}
              </div>
              {search && (
                <button className="cv-btn cv-btn-outline"
                  style={{ marginTop:20, width:"auto", padding:"10px 24px" }}
                  onClick={() => { setSearch(""); setCategory("All"); }}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Product grid */}
          {!loading && !loadError && filtered.length > 0 && (
            <>
              <div className="cv-section-lbl">
                {filtered.length} item{filtered.length !== 1 ? "s" : ""} available
              </div>
              <div className="cv-grid">
                {filtered.map((item, idx) => (
                  <ProductCard
                    key={String(item.id)}
                    item={item}
                    qty={cart[String(item.id)]?.qty || 0}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                    onOrderNow={handleOrderNow}
                    color={catColorMap[item.category || "General"] || "#E8A020"}
                    delay={idx}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── MY ORDERS TAB ── */}
      {tab === "orders" && (
        <div style={{ maxWidth:640, margin:"0 auto", padding:16 }}>
          {myOrders.length === 0 && !ordersLoading ? (
            <div className="cv-empty">
              <div className="cv-empty-ico">📦</div>
              <div className="cv-empty-h">Find your orders</div>
              <div className="cv-empty-p" style={{ marginBottom:24 }}>
                Enter the mobile number you used to place the order.
              </div>
              <div style={{ maxWidth:300, margin:"0 auto" }}>
                <div className="cv-field">
                  <label className="cv-lbl">Mobile Number</label>
                  <div className="cv-inp-wrap">
                    <span className="cv-inp-ico">📱</span>
                    <input className="cv-inp" type="tel" placeholder="10-digit number"
                      inputMode="numeric" value={lookupMob}
                      onChange={(e) => setLookupMob(sanitizeMobile(e.target.value))}
                      onKeyDown={(e) => { if (e.key === "Enter" && lookupMob.length === 10) loadMyOrders(lookupMob); }} />
                  </div>
                </div>
                <button className="cv-btn cv-btn-dark"
                  disabled={lookupMob.length !== 10 || ordersLoading}
                  onClick={() => loadMyOrders(lookupMob)}>
                  {ordersLoading ? <><div className="cv-spin" /> Searching…</> : "🔍 Find My Orders"}
                </button>
              </div>
            </div>
          ) : ordersLoading ? (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div className="cv-spin" style={{ margin:"0 auto 16px" }} />
              <div style={{ color:"var(--ink3)", fontSize:13 }}>Loading your orders…</div>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontFamily:"'Sora',sans-serif", fontSize:15, fontWeight:700 }}>
                  {myOrders.length} order{myOrders.length !== 1 ? "s" : ""}
                </div>
                <button style={{ background:"none", border:"none", fontSize:12, color:"var(--ink3)", cursor:"pointer", fontFamily:"inherit", padding:"6px 10px" }}
                  onClick={() => { setMyOrders([]); setLookupMob(""); }}>
                  ✕ Clear
                </button>
              </div>
              {myOrders.map((o) => {
                const sc = ORDER_STATUS_STYLE[o.status] || ORDER_STATUS_STYLE.new;
                const orderId   = o.order_id || o.id;
                const orderDate = o.created_at
                  ? new Date(o.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
                  : "—";
                return (
                  <div key={orderId} className="cv-ocard">
                    <div className="cv-ocard-hdr">
                      <div>
                        <div className="cv-oid">#{orderId}</div>
                        <div className="cv-odate">{orderDate}</div>
                      </div>
                      <span className="cv-status" style={{ background:sc.bg, color:sc.c }}>
                        {(o.status || "new").toUpperCase()}
                      </span>
                    </div>
                    <div className="cv-oitems">
                      {(o.items || []).map((it, i) => (
                        <div key={i} className="cv-oitem">
                          <span>{it.name} × {it.qty} {it.unit}</span>
                          <span style={{ fontWeight:700 }}>{fmt(Number(it.qty) * Number(it.price ?? it.amount / it.qty ?? 0))}</span>
                        </div>
                      ))}
                    </div>
                    <div className="cv-ofoot">
                      <div>
                        <div style={{ fontSize:11, color:"var(--ink3)" }}>Advance paid</div>
                        <div style={{ fontSize:14, fontWeight:700, color:"var(--green)" }}>{fmt(o.advance)}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:11, color:"var(--ink3)" }}>
                          {Number(o.balance) > 0 ? "Balance due" : "Total paid"}
                        </div>
                        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:16, fontWeight:800, color:Number(o.balance) > 0 ? "var(--red)" : "var(--green)" }}>
                          {Number(o.balance) > 0 ? fmt(o.balance) : fmt(o.subtotal)}
                        </div>
                      </div>
                    </div>
                    {o.status === "ready" && (
                      <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"10px 14px", marginTop:10, fontSize:12, fontWeight:700, color:"var(--green)" }}>
                        ✅ Your order is ready for pickup! Bring {fmt(o.balance)} if balance due.
                      </div>
                    )}
                    {o.status === "completed" && (
                      <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"9px 13px", marginTop:10, fontSize:12, fontWeight:700, color:"var(--green)" }}>
                        ✓ Completed — Thank you for shopping!
                      </div>
                    )}
                    {o.status === "cancelled" && (
                      <div style={{ background:"#FFF5F5", border:"1px solid #FECACA", borderRadius:10, padding:"9px 13px", marginTop:10, fontSize:12, fontWeight:700, color:"var(--red)" }}>
                        ✕ This order was cancelled.
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {cartCount > 0 && <div style={{ height:100 }} />}

      {/* Floating cart bar */}
      {cartCount > 0 && modal === null && (
        <div className="cv-bar">
          <div className="cv-bar-inner">
            <div>
              <div className="cv-bar-count">{cartCount} item{cartCount !== 1 ? "s" : ""} in cart</div>
              <div className="cv-bar-total">{fmt(cartTotal)}</div>
            </div>
            <button className="cv-bar-btn" onClick={() => setModal("cart")}>View Cart →</button>
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
                    return (
                      <CartRow key={String(ci.id)} item={ci}
                        maxQty={se ? Number(se.qty) : Infinity}
                        onAdd={addToCart} onRemove={removeFromCart} />
                    );
                  })}
                  <div className="cv-summary">
                    <div className="cv-sum-row">
                      <span>Subtotal ({cartCount} items)</span>
                      <span style={{ fontWeight:700 }}>{fmt(cartTotal)}</span>
                    </div>
                    <div className="cv-sum-row total">
                      <span>Total</span><span>{fmt(cartTotal)}</span>
                    </div>
                  </div>
                  <div style={{ marginTop:16 }}>
                    <button className="cv-btn cv-btn-primary"
                      onClick={() => { setCheckStep(0); setModal("checkout"); }}>
                      Proceed to Checkout →
                    </button>
                    <button className="cv-btn cv-btn-red"
                      onClick={() => { clearCart(); setModal(null); }}>
                      🗑 Clear Cart
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CHECKOUT MODAL — 3 steps ── */}
      {modal === "checkout" && (
        <div className="cv-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) { checkStep > 0 ? setCheckStep(s => s - 1) : setModal("cart"); } }}>
          <div className="cv-sheet">
            <div className="cv-drag" />
            <div className="cv-sheet-head">
              <button className="cv-back-btn"
                onClick={() => { checkStep > 0 ? setCheckStep(s => s - 1) : setModal("cart"); }}>←</button>
              <div className="cv-sheet-title">
                {["Review Order", "Your Details", "Confirm & Pay"][checkStep]}
              </div>
            </div>

            <Steps current={checkStep} />

            <div className="cv-body" style={{ paddingTop:6 }}>

              {/* Step 0 — Review */}
              {checkStep === 0 && (
                <>
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
                  <div className="cv-summary" style={{ marginBottom:20 }}>
                    <div className="cv-sum-row"><span>Items</span><span>{cartCount}</span></div>
                    <div className="cv-sum-row total"><span>Order Total</span><span>{fmt(cartTotal)}</span></div>
                  </div>
                  <button className="cv-btn cv-btn-primary" onClick={() => setCheckStep(1)}>
                    Continue — Enter Your Details →
                  </button>
                  <button className="cv-btn cv-btn-outline" onClick={() => setModal("cart")}>
                    ← Edit Cart
                  </button>
                </>
              )}

              {/* Step 1 — Details */}
              {checkStep === 1 && (
                <>
                  <div className="cv-field">
                    <label className="cv-lbl">Your Name *</label>
                    <div className="cv-inp-wrap">
                      <span className="cv-inp-ico">👤</span>
                      <input className="cv-inp" type="text" placeholder="Full Name"
                        value={custName} onChange={(e) => setCustName(sanitizeName(e.target.value))}
                        autoComplete="name" />
                    </div>
                  </div>
                  <div className="cv-field">
                    <label className="cv-lbl">Mobile Number *</label>
                    <div className="cv-inp-wrap">
                      <span className="cv-inp-ico">📱</span>
                      <input className="cv-inp" type="tel" placeholder="10-digit mobile"
                        inputMode="numeric" value={custMob}
                        onChange={(e) => setCustMob(sanitizeMobile(e.target.value))}
                        autoComplete="tel" />
                    </div>
                    <div className="cv-hint">We'll notify you when your order is ready</div>
                  </div>
                  <div className="cv-field">
                    <label className="cv-lbl">
                      Advance Payment
                      <span style={{ fontWeight:400, textTransform:"none", fontSize:10, color:"var(--ink3)", marginLeft:4 }}>
                        (optional — drag slider)
                      </span>
                    </label>
                    <div className="cv-adv-row">
                      <span className="cv-adv-amt">{fmt(advAmt)}</span>
                      <input className="cv-slider" type="range" min="0" max="100" step="5"
                        value={advPct} onChange={(e) => setAdvPct(Number(e.target.value))}
                        style={{ background:`linear-gradient(to right,var(--gold2) ${advPct}%,var(--bg2) ${advPct}%)` }} />
                      <span className="cv-adv-pct">{advPct}%</span>
                    </div>
                    <div className="cv-hint">
                      {advPct === 0
                        ? "Pay full amount at pickup"
                        : advPct === 100
                        ? "Paying in full now"
                        : `Pay ${fmt(advAmt)} now · ${fmt(balance)} at pickup`}
                    </div>
                  </div>
                  <button className="cv-btn cv-btn-primary"
                    disabled={!custName.trim() || custMob.length !== 10}
                    onClick={() => setCheckStep(2)}>
                    Review & Confirm →
                  </button>
                  <button className="cv-btn cv-btn-outline" onClick={() => setCheckStep(0)}>
                    ← Back
                  </button>
                </>
              )}

              {/* Step 2 — Confirm */}
              {checkStep === 2 && (
                <>
                  <div className="cv-cust-summary">
                    <div className="cv-cust-row">
                      <span style={{ color:"var(--ink3)" }}>Name</span>
                      <span style={{ fontWeight:700 }}>{custName}</span>
                    </div>
                    <div className="cv-cust-row">
                      <span style={{ color:"var(--ink3)" }}>Mobile</span>
                      <span style={{ fontWeight:700 }}>{custMob}</span>
                    </div>
                    <div className="cv-cust-row">
                      <span style={{ color:"var(--ink3)" }}>Items</span>
                      <span style={{ fontWeight:700 }}>{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  <div className="cv-pay-card">
                    <div className="cv-pay-row sub">
                      <span style={{ color:"var(--ink2)" }}>Order Total</span>
                      <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:17 }}>{fmt(cartTotal)}</span>
                    </div>
                    {advAmt > 0 && (
                      <div className="cv-pay-row adv">
                        <div>
                          <div style={{ fontWeight:700, color:"var(--green)" }}>✓ Paying Now</div>
                          <div style={{ fontSize:11, color:"var(--ink3)", marginTop:2 }}>{advPct}% advance</div>
                        </div>
                        <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:17, color:"var(--green)" }}>
                          {fmt(advAmt)}
                        </span>
                      </div>
                    )}
                    {balance > 0 ? (
                      <div className="cv-pay-row bal">
                        <div>
                          <div style={{ fontWeight:700, color:"#B45309" }}>Balance at Pickup</div>
                          <div style={{ fontSize:11, color:"var(--ink3)", marginTop:2 }}>Bring this to the shop</div>
                        </div>
                        <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:17, color:"#B45309" }}>
                          {fmt(balance)}
                        </span>
                      </div>
                    ) : (
                      <div className="cv-pay-row full">
                        <span style={{ fontWeight:700, color:"var(--green)" }}>✅ Fully Paid</span>
                        <span style={{ fontWeight:600, color:"var(--green)", fontSize:13 }}>Nothing due at pickup</span>
                      </div>
                    )}
                  </div>

                  <button className="cv-btn cv-btn-primary" onClick={handlePlaceOrder} disabled={placing}>
                    {placing
                      ? <><div className="cv-spin" />Placing Order…</>
                      : advAmt > 0
                        ? `✅ Confirm & Pay ${fmt(advAmt)}`
                        : "✅ Confirm Order"}
                  </button>
                  <button className="cv-btn cv-btn-outline" onClick={() => setCheckStep(1)} disabled={placing}>
                    ← Edit Details
                  </button>
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
              <div className="cv-success-ring">✓</div>
              <div className="cv-success-h">Order Placed!</div>
              <div className="cv-success-p">
                The shop has been notified. You'll be contacted when your order is ready.
              </div>
              <div className="cv-oid-tag">🧾 #{lastOrder.order_id || lastOrder.id}</div>

              <div className="cv-detail-card">
                {[
                  ["Customer",     lastOrder.customer_name],
                  ["Mobile",       lastOrder.customer_mobile],
                  ["Items",        `${(lastOrder.items || []).length} item(s)`],
                  ["Order Total",  fmt(lastOrder.subtotal)],
                  ["Advance Paid", fmt(lastOrder.advance)],
                  ["Balance Due",  Number(lastOrder.balance) > 0 ? fmt(lastOrder.balance) : "✓ Fully Paid"],
                ].map(([l, v]) => (
                  <div key={l} className="cv-det-row">
                    <span className="cv-det-lbl">{l}</span>
                    <span className="cv-det-val"
                      style={{
                        color: l === "Balance Due" && Number(lastOrder.balance) > 0
                          ? "var(--red)"
                          : l === "Advance Paid"
                          ? "var(--green)"
                          : "var(--ink)",
                      }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>

              <div className="cv-next">
                <div className="cv-next-h">📦 What happens next?</div>
                {[
                  "Shop owner has received your order",
                  "Your items are being packed",
                  Number(lastOrder.balance) > 0
                    ? `Bring ${fmt(lastOrder.balance)} when you collect`
                    : "Nothing to pay — just collect at the shop",
                ].map((s, i) => (
                  <div key={i} className="cv-next-item">
                    <span className="cv-next-num">{i + 1}</span>{s}
                  </div>
                ))}
              </div>

              <button className="cv-btn cv-btn-dark"
                onClick={() => { setModal(null); setTab("orders"); setLookupMob(lastOrder.customer_mobile || ""); loadMyOrders(lastOrder.customer_mobile); }}>
                📦 Track My Order
              </button>
              <button className="cv-btn cv-btn-outline" onClick={() => setModal(null)}>
                🛒 Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
