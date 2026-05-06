import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  getInvoices,
  getInvoiceDetail,
  markInvoicePaid,
  deleteInvoice,
  getShopProfile,
  searchProducts,
  getCustomers,
  createCustomer,
} from "../../services/businessService";
import { authAxios } from "../../services/api";

/* ═══════════════════════════════════════════════
   AUTO-SYNC: push invoice customers → Customers DB
   Called after invoices load. Skips if mobile exists.
═══════════════════════════════════════════════ */
const syncInvoiceCustomers = async (invoices) => {
  try {
    // 1. Fetch all existing customers (load all, search="")
    const existing = await getCustomers("");
    const existingMobiles = new Set(
      existing.map((c) => (c.mobile || "").replace(/\D/g, "").slice(-10)).filter(Boolean)
    );

    // 2. Deduplicate invoice customers by mobile
    const seen = new Set();
    const toCreate = [];
    for (const inv of invoices) {
      const name   = (inv.customer_name   || "").trim();
      const mobile = (inv.customer_mobile || "").replace(/\D/g, "").slice(-10);
      if (!name || !mobile) continue;                  // skip anonymous
      if (seen.has(mobile))        continue;           // dedup within invoices
      if (existingMobiles.has(mobile)) continue;       // already in Customers
      seen.add(mobile);
      toCreate.push({
        name,
        mobile,
        email:      inv.customer_email   || "",
        gst_number: inv.customer_gst     || "",
        address:    inv.customer_address || "",
      });
    }

    // 3. Create missing customers one by one
    for (const payload of toCreate) {
      try {
        await createCustomer(payload);
      } catch {
        // ignore per-customer errors (e.g. duplicate race condition)
      }
    }
  } catch {
    // Sync is best-effort; don't surface errors to user
  }
};

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --navy:#0e1b2e; --navy2:#1a2d47; --gold:#c9963a; --gold2:#e8a020;
    --green:#15803d; --red:#dc2626; --orange:#d97706;
    --bg:#f6f4f0; --white:#ffffff;
    --border:rgba(14,27,46,0.09); --border2:rgba(14,27,46,0.16);
    --muted:#6b7280; --text:#0e1b2e;
    --sh-sm:0 4px 16px rgba(14,27,46,0.08);
    --sh-md:0 8px 32px rgba(14,27,46,0.12);
    --sh-lg:0 20px 60px rgba(14,27,46,0.18);
    --r-sm:8px; --r-md:14px; --r-lg:20px; --r-xl:28px;
    --font-d:'Playfair Display',Georgia,serif;
    --font-b:'Plus Jakarta Sans',sans-serif;
  }

  .ih-page { padding:1.75rem; background:var(--bg); min-height:100%; font-family:var(--font-b); }

  /* TOAST */
  .ih-toast {
    position:fixed; top:72px; left:50%; transform:translateX(-50%);
    z-index:9999; padding:10px 26px; border-radius:100px;
    font-weight:600; font-size:0.85rem; white-space:nowrap;
    box-shadow:var(--sh-md); animation:toastIn 0.3s ease;
    max-width:calc(100vw - 2rem); text-align:center;
  }
  .ih-toast.success { background:var(--navy); color:#fff; }
  .ih-toast.error   { background:var(--red);  color:#fff; }
  .ih-toast.info    { background:#1e4fba;     color:#fff; }
  @keyframes toastIn {
    from { opacity:0; transform:translateX(-50%) translateY(-8px); }
    to   { opacity:1; transform:translateX(-50%) translateY(0); }
  }

  /* HEADER */
  .ih-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
  .ih-title  { font-family:var(--font-d); font-size:1.6rem; font-weight:800; color:var(--navy); letter-spacing:-0.025em; margin-bottom:4px; }
  .ih-subtitle { font-size:0.82rem; color:var(--muted); font-weight:600; }

  /* KPI */
  .ih-kpi-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
  .ih-kpi {
    background:var(--white); border:1px solid var(--border);
    border-radius:var(--r-lg); padding:1rem 1.2rem; box-shadow:var(--sh-sm);
    display:flex; flex-direction:column; gap:5px; position:relative; overflow:hidden; transition:all 0.22s;
  }
  .ih-kpi:hover { transform:translateY(-2px); box-shadow:var(--sh-md); }
  .ih-kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:var(--r-lg) var(--r-lg) 0 0; }
  .ih-kpi.blue::before   { background:linear-gradient(90deg,var(--navy),var(--navy2)); }
  .ih-kpi.green::before  { background:linear-gradient(90deg,#15803d,#22c55e); }
  .ih-kpi.orange::before { background:linear-gradient(90deg,#d97706,#f59e0b); }
  .ih-kpi span   { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); }
  .ih-kpi strong { font-family:var(--font-d); font-size:1.3rem; font-weight:900; color:var(--navy); }
  .ih-kpi.green strong  { color:var(--green); }
  .ih-kpi.orange strong { color:var(--orange); }

  /* FILTERS */
  .ih-filters {
    background:var(--white); border:1px solid var(--border);
    border-radius:var(--r-lg); padding:14px;
    display:flex; align-items:center; gap:10px; flex-wrap:wrap;
    box-shadow:var(--sh-sm); margin-bottom:14px;
  }
  .ih-search {
    flex:1; min-width:220px; padding:10px 14px;
    border:1.5px solid var(--border2); border-radius:var(--r-md);
    background:var(--bg); font-family:var(--font-b);
    font-size:0.88rem; color:var(--text); outline:none; transition:all 0.18s;
  }
  .ih-search:focus { border-color:var(--gold); background:var(--white); box-shadow:0 0 0 3px rgba(201,150,58,0.1); }
  .ih-tab-row { display:flex; gap:5px; flex-wrap:wrap; }
  .ih-tab {
    padding:7px 14px; border-radius:100px;
    border:1.5px solid var(--border2); background:var(--white);
    color:var(--muted); font-family:var(--font-b); font-size:0.78rem; font-weight:700;
    cursor:pointer; transition:all 0.18s;
  }
  .ih-tab:hover { border-color:var(--navy); color:var(--navy); }
  .ih-tab.active { background:rgba(201,150,58,0.1); border-color:rgba(201,150,58,0.35); color:var(--navy); font-weight:800; }

  /* TABLE */
  .ih-table-wrap { background:var(--white); border:1px solid var(--border); border-radius:var(--r-xl); overflow:hidden; box-shadow:var(--sh-sm); }
  .ih-table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
  .ih-table { width:100%; min-width:900px; border-collapse:separate; border-spacing:0; }
  .ih-table thead th {
    padding:11px 14px; text-align:left;
    font-size:0.68rem; font-weight:900; text-transform:uppercase;
    letter-spacing:0.08em; color:var(--muted);
    background:linear-gradient(180deg,var(--white) 0%,#fafaf8 100%);
    border-bottom:1.5px solid var(--border); white-space:nowrap;
    position:sticky; top:0; z-index:2;
  }
  .ih-table tbody td { padding:13px 14px; font-size:0.86rem; font-weight:500; color:var(--text); border-bottom:1px solid rgba(14,27,46,0.05); vertical-align:middle; }
  .ih-table tbody tr:hover td { background:rgba(201,150,58,0.03); }
  .ih-table tbody tr:last-child td { border-bottom:none; }
  .ih-inv-id { font-weight:800; font-size:0.8rem; color:var(--navy); }
  .ih-customer-name { font-weight:700; color:var(--navy); }
  .ih-customer-mobile { font-size:0.72rem; color:var(--muted); display:block; margin-top:2px; }
  .ih-amount { font-weight:900; font-family:var(--font-d); font-size:1rem; color:var(--navy); }
  .ih-disc { font-size:0.66rem; color:var(--green); margin-top:2px; }
  .ih-bal { font-weight:700; font-size:0.88rem; }
  .ih-bal.red { color:var(--red); }
  .ih-bal.green { color:var(--green); }

  /* BADGES */
  .ih-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:5px 11px; border-radius:100px; font-size:0.72rem; font-weight:800;
    border:1.5px solid transparent; white-space:nowrap;
  }
  .ih-badge.paid    { background:rgba(21,128,61,0.1); color:#166534; border-color:rgba(21,128,61,0.25); }
  .ih-badge.partial { background:rgba(217,119,6,0.1); color:#92400e; border-color:rgba(217,119,6,0.25); }
  .ih-badge.pending { background:rgba(220,38,38,0.1); color:#991b1b; border-color:rgba(220,38,38,0.22); }
  .ih-gst-badge {
    display:inline-block; margin-left:6px;
    font-size:0.58rem; font-weight:800; text-transform:uppercase;
    background:rgba(30,79,186,0.1); color:#1e4fba;
    padding:1px 6px; border-radius:100px; border:1px solid rgba(30,79,186,0.2);
  }

  /* ACTION BUTTONS */
  .ih-actions-cell { white-space:nowrap; }
  .ih-actions { display:flex; gap:6px; align-items:center; }
  .ih-btn {
    padding:6px 11px; border-radius:var(--r-sm); border:1.5px solid transparent;
    font-family:var(--font-b); font-size:0.72rem; font-weight:800;
    cursor:pointer; transition:all 0.18s; display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
  }
  .ih-btn:hover { transform:translateY(-1px); }
  .ih-btn.edit  { background:rgba(201,150,58,0.1); color:#8a6420; border-color:rgba(201,150,58,0.3); }
  .ih-btn.edit:hover  { background:var(--gold); color:#fff; }
  .ih-btn.wa    { background:rgba(37,211,102,0.1); color:#15803d; border-color:rgba(37,211,102,0.3); }
  .ih-btn.wa:hover    { background:#25D366; color:#fff; border-color:#25D366; }
  .ih-btn.paid  { background:rgba(21,128,61,0.1); color:#166534; border-color:rgba(21,128,61,0.28); }
  .ih-btn.paid:hover  { background:var(--green); color:#fff; }
  .ih-btn.del   { background:rgba(220,38,38,0.08); color:var(--red); border-color:rgba(220,38,38,0.22); }
  .ih-btn.del:hover   { background:var(--red); color:#fff; }
  .ih-btn.pdf   { background:rgba(14,27,46,0.06); color:var(--navy); border-color:var(--border2); }
  .ih-btn.pdf:hover   { background:var(--navy); color:#fff; }
  .ih-btn:disabled { opacity:0.45; cursor:not-allowed; transform:none !important; }

  /* EMPTY */
  .ih-empty { padding:60px 24px; text-align:center; background:var(--white); border:1.5px dashed var(--border2); border-radius:var(--r-xl); margin-top:14px; }
  .ih-empty-icon { font-size:3rem; margin-bottom:1rem; opacity:0.6; }
  .ih-empty p     { font-size:1rem; font-weight:700; color:var(--navy); margin-bottom:4px; }
  .ih-empty small { font-size:0.82rem; color:var(--muted); }

  /* ═══════════════════════════════════════════════════
     EDIT MODAL — FULL FEATURED WITH ITEMS
  ═══════════════════════════════════════════════════ */
  .em-overlay {
    position:fixed; inset:0; z-index:600;
    background:rgba(14,27,46,0.7); backdrop-filter:blur(10px);
    display:flex; align-items:center; justify-content:center; padding:1rem;
    animation:emFadeIn 0.2s ease;
  }
  @keyframes emFadeIn { from{opacity:0} to{opacity:1} }

  .em-modal {
    background:var(--white); border-radius:var(--r-xl);
    width:100%; max-width:760px; max-height:92vh;
    display:flex; flex-direction:column;
    box-shadow:var(--sh-lg); position:relative;
    animation:emPop 0.28s cubic-bezier(0.34,1.36,0.64,1);
  }
  @keyframes emPop {
    from { opacity:0; transform:translateY(18px) scale(0.96); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  .em-head {
    padding:1.25rem 1.5rem 1rem;
    border-bottom:1px solid var(--border);
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    flex-shrink:0;
  }
  .em-head-left { display:flex; flex-direction:column; gap:3px; }
  .em-head-title { font-family:var(--font-d); font-size:1.25rem; font-weight:800; color:var(--navy); }
  .em-head-sub   { font-size:0.75rem; color:var(--muted); }
  .em-close {
    width:34px; height:34px; border-radius:var(--r-sm);
    background:var(--bg); border:1px solid var(--border);
    display:flex; align-items:center; justify-content:center;
    font-size:1rem; cursor:pointer; color:var(--muted);
    transition:all 0.18s; flex-shrink:0;
  }
  .em-close:hover { background:var(--navy); color:#fff; border-color:var(--navy); }

  .em-stock-banner {
    margin:0 1.5rem; padding:8px 14px; border-radius:var(--r-md);
    font-size:0.8rem; font-weight:600; display:flex; align-items:center; gap:8px;
    flex-shrink:0;
  }
  .em-stock-banner.restore { background:#f0fdf4; border:1px solid #86efac; color:#15803d; margin-top:12px; }
  .em-stock-banner.deduct  { background:#fffbeb; border:1px solid #fde68a; color:#92400e; margin-top:8px; }

  .em-body { flex:1; overflow-y:auto; padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:18px; }
  .em-body::-webkit-scrollbar { width:4px; }
  .em-body::-webkit-scrollbar-thumb { background:var(--border2); border-radius:4px; }

  .em-section-title {
    font-size:0.68rem; font-weight:800; text-transform:uppercase;
    letter-spacing:0.08em; color:var(--muted); margin-bottom:10px;
    display:flex; align-items:center; gap:8px;
  }
  .em-section-title::after { content:''; flex:1; height:1px; background:var(--border); }

  .em-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .em-grid.three { grid-template-columns:1fr 1fr 1fr; }
  .em-field { display:flex; flex-direction:column; gap:5px; }
  .em-field.full { grid-column:1/-1; }
  .em-label { font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); }
  .em-input {
    padding:10px 12px; border:1.5px solid var(--border2); border-radius:var(--r-md);
    font-family:var(--font-b); font-size:0.88rem; color:var(--text);
    background:var(--bg); outline:none; transition:all 0.18s; width:100%;
  }
  .em-input:focus { border-color:var(--gold); background:var(--white); box-shadow:0 0 0 3px rgba(201,150,58,0.1); }
  .em-input:disabled { opacity:0.5; cursor:not-allowed; }

  .em-items-wrap {
    background:var(--bg); border:1px solid var(--border);
    border-radius:var(--r-lg); overflow:hidden;
  }
  .em-items-header {
    display:grid; grid-template-columns:2fr 1fr 1.2fr 1fr 36px;
    gap:8px; padding:8px 14px;
    background:var(--navy); color:rgba(255,255,255,0.7);
    font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em;
  }
  .em-item-row {
    display:grid; grid-template-columns:2fr 1fr 1.2fr 1fr 36px;
    gap:8px; padding:10px 14px; align-items:center;
    border-bottom:1px solid var(--border); background:var(--white);
    transition:background 0.15s; position:relative;
  }
  .em-item-row:last-child { border-bottom:none; }
  .em-item-row:hover { background:rgba(201,150,58,0.03); }
  .em-item-row.is-stock { border-left:3px solid #22c55e; }
  .em-item-row.is-new   { border-left:3px solid #c9963a; }
  .em-item-row.is-removed { opacity:0.5; background:#fff5f5; border-left:3px solid var(--red); text-decoration:line-through; }

  .em-item-input {
    width:100%; padding:7px 10px; border:1.5px solid var(--border);
    border-radius:var(--r-sm); font-family:var(--font-b);
    font-size:0.84rem; color:var(--text); background:var(--white); outline:none; transition:all 0.15s;
  }
  .em-item-input:focus { border-color:var(--gold); box-shadow:0 0 0 2px rgba(201,150,58,0.1); }
  .em-item-input.stock-linked { border-color:#22c55e; background:#f0fdf4; }

  .em-suggest {
    position:absolute; top:calc(100% + 2px); left:14px; right:14px; z-index:100;
    background:var(--white); border:1px solid var(--border2); border-radius:var(--r-md);
    box-shadow:var(--sh-md); overflow:hidden; max-height:200px; overflow-y:auto;
  }
  .em-suggest-item {
    display:flex; justify-content:space-between; align-items:center;
    padding:9px 13px; cursor:pointer; border-bottom:1px solid var(--border);
    transition:background 0.12s;
  }
  .em-suggest-item:last-child { border-bottom:none; }
  .em-suggest-item:hover { background:rgba(201,150,58,0.06); }
  .em-suggest-name { font-weight:700; font-size:0.85rem; color:var(--navy); }
  .em-suggest-cat  { font-size:0.72rem; color:var(--muted); }
  .em-suggest-right { text-align:right; }
  .em-suggest-price { font-weight:800; font-size:0.85rem; color:#1e4fba; }
  .em-suggest-stock { font-size:0.7rem; }
  .em-suggest-stock.low { color:var(--red); font-weight:700; }
  .em-suggest-stock.ok  { color:var(--green); }

  .em-item-remove {
    width:30px; height:30px; border-radius:var(--r-sm);
    background:#fee2e2; border:none; color:var(--red);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; font-size:0.85rem; transition:all 0.15s; flex-shrink:0;
  }
  .em-item-remove:hover { background:var(--red); color:#fff; }

  .em-add-item-btn {
    width:100%; padding:10px; border:1.5px dashed rgba(201,150,58,0.4);
    border-radius:var(--r-md); background:rgba(201,150,58,0.05);
    color:#8a6420; font-family:var(--font-b); font-size:0.84rem; font-weight:700;
    cursor:pointer; transition:all 0.18s; margin-top:8px;
  }
  .em-add-item-btn:hover { background:rgba(201,150,58,0.1); border-color:rgba(201,150,58,0.6); }

  .em-summary {
    background:var(--bg); border:1px solid var(--border);
    border-radius:var(--r-lg); padding:14px 16px;
  }
  .em-sum-row { display:flex; justify-content:space-between; align-items:center; font-size:0.84rem; color:var(--muted); padding:4px 0; }
  .em-sum-row.total { font-size:1rem; font-weight:900; color:var(--navy); padding-top:10px; margin-top:6px; border-top:2px solid var(--navy); }
  .em-sum-row.balance { color:var(--red); font-weight:800; font-size:0.88rem; }
  .em-sum-row.paid-row { color:var(--green); font-weight:700; }

  .em-stock-diff {
    background:#fffbeb; border:1px solid #fde68a;
    border-radius:var(--r-md); padding:12px 14px;
  }
  .em-stock-diff-title { font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:#92400e; margin-bottom:8px; }
  .em-stock-diff-item { display:flex; justify-content:space-between; font-size:0.8rem; color:#78350f; padding:2px 0; }
  .em-stock-diff-item .restore { color:var(--green); font-weight:700; }
  .em-stock-diff-item .deduct  { color:var(--red); font-weight:700; }

  .em-foot {
    padding:1rem 1.5rem;
    border-top:1px solid var(--border);
    display:flex; align-items:center; gap:10px; flex-shrink:0; flex-wrap:wrap;
  }
  .em-save {
    flex:1; padding:0.85rem; border-radius:var(--r-md); border:none;
    background:var(--navy); color:#fff; font-family:var(--font-b);
    font-size:0.92rem; font-weight:800; cursor:pointer; transition:all 0.22s;
    box-shadow:var(--sh-sm);
  }
  .em-save:hover:not(:disabled) { background:var(--navy2); transform:translateY(-1px); }
  .em-save:disabled { opacity:0.55; cursor:not-allowed; transform:none; }
  .em-cancel {
    padding:0.85rem 1.5rem; border-radius:var(--r-md);
    border:1.5px solid var(--border2); background:var(--white);
    color:var(--muted); font-family:var(--font-b); font-size:0.88rem; font-weight:600;
    cursor:pointer; transition:all 0.18s;
  }
  .em-cancel:hover { border-color:var(--navy); color:var(--navy); }

  .em-stock-pill {
    display:inline-flex; align-items:center; gap:3px;
    font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.04em;
    padding:2px 7px; border-radius:100px;
  }
  .em-stock-pill.linked { background:#dcfce7; color:#15803d; border:1px solid #86efac; }
  .em-stock-pill.manual { background:#f1f5f9; color:var(--muted); border:1px solid var(--border); }
  .em-stock-pill.new    { background:rgba(201,150,58,0.12); color:#8a6420; border:1px solid rgba(201,150,58,0.3); }

  /* PDF MODAL */
  .pdf-overlay {
    position:fixed; inset:0; z-index:700;
    background:rgba(14,27,46,0.65); backdrop-filter:blur(10px);
    display:flex; align-items:center; justify-content:center; padding:1rem;
    animation:emFadeIn 0.2s ease;
  }
  .pdf-modal {
    background:var(--white); border-radius:var(--r-xl);
    width:100%; max-width:680px; max-height:90vh;
    display:flex; flex-direction:column; box-shadow:var(--sh-lg);
    animation:emPop 0.28s cubic-bezier(0.34,1.36,0.64,1);
  }
  .pdf-modal-head {
    padding:1.25rem 1.5rem 1rem; border-bottom:1px solid var(--border);
    display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-shrink:0; flex-wrap:wrap;
  }
  .pdf-modal-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .pdf-action-btn {
    padding:8px 16px; border-radius:var(--r-md); border:none;
    font-family:var(--font-b); font-size:0.82rem; font-weight:700;
    cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:6px;
  }
  .pdf-action-btn.print { background:var(--navy); color:#fff; }
  .pdf-action-btn.print:hover { background:var(--navy2); transform:translateY(-1px); }
  .pdf-action-btn.wa-btn { background:#25D366; color:#fff; }
  .pdf-action-btn.wa-btn:hover { filter:brightness(1.08); transform:translateY(-1px); }
  .pdf-modal-body { overflow-y:auto; flex:1; padding:1.5rem 1.75rem; }

  /* PDF DOCUMENT */
  .pdf-doc {
    background:#fff; color:#000; padding:40px; border-radius:8px;
    border:1px solid #e5e7eb; position:relative; overflow:hidden;
    font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; line-height:1.6;
  }
  .pdf-watermark {
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    pointer-events:none; z-index:0; overflow:hidden;
  }
  .pdf-wm-text {
    font-family:'Playfair Display',Georgia,serif; font-size:5.5rem; font-weight:900;
    color:rgba(201,150,58,0.06); transform:rotate(-30deg); white-space:nowrap; user-select:none;
  }
  .pdf-content { position:relative; z-index:1; }
  .pdf-header {
    display:flex; justify-content:space-between; align-items:flex-start;
    padding-bottom:18px; margin-bottom:18px; border-bottom:2.5px solid #0e1b2e;
  }
  .pdf-brand-name { font-size:1.6rem; font-weight:900; font-family:'Playfair Display',Georgia,serif; color:#0e1b2e; }
  .pdf-brand-name span { color:#c9963a; }
  .pdf-brand-tag { font-size:0.65rem; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.08em; margin-top:1px; }
  .pdf-inv-meta { text-align:right; }
  .pdf-inv-title { font-family:'Playfair Display',Georgia,serif; font-size:1.15rem; font-weight:800; color:#0e1b2e; }
  .pdf-gst-tag {
    display:inline-block; background:rgba(30,79,186,0.1); color:#1e4fba;
    font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em;
    padding:2px 8px; border-radius:100px; border:1px solid rgba(30,79,186,0.2); margin-bottom:4px;
  }
  .pdf-inv-num  { font-weight:800; color:#c9963a; font-size:0.9rem; }
  .pdf-inv-date { font-size:0.78rem; color:#6b7280; }
  .pdf-shop-block { margin-bottom:16px; }
  .pdf-shop-name { font-weight:800; color:#0e1b2e; font-size:0.88rem; }
  .pdf-shop-det  { font-size:0.75rem; color:#6b7280; margin-top:1px; }
  .pdf-info-row {
    display:grid; grid-template-columns:1fr 1fr; gap:16px;
    background:#f8faf9; border-radius:8px; padding:14px 16px;
    margin-bottom:18px; border:1px solid #e5e7eb;
  }
  .pdf-info-lbl { font-size:0.62rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#9ca3af; margin-bottom:3px; }
  .pdf-info-val { font-weight:700; color:#111827; font-size:0.82rem; }
  .pdf-table { width:100%; border-collapse:collapse; margin-bottom:18px; }
  .pdf-table th { background:#0e1b2e; color:#fff; padding:9px 11px; text-align:left; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; }
  .pdf-table th:last-child { text-align:right; }
  .pdf-table td { padding:9px 11px; border-bottom:1px solid #f1f5f9; font-size:0.8rem; }
  .pdf-table td:last-child { text-align:right; font-weight:700; }
  .pdf-table tbody tr:nth-child(even) td { background:#fafafa; }
  .pdf-totals { margin-left:auto; width:48%; margin-bottom:18px; }
  .pdf-total-row { display:flex; justify-content:space-between; padding:5px 0; font-size:0.8rem; border-bottom:1px solid #f1f5f9; }
  .pdf-total-row.grand { font-weight:900; font-size:0.95rem; color:#0e1b2e; padding-top:10px; border-top:2.5px solid #0e1b2e; border-bottom:none; }
  .pdf-total-row.balance-row { color:#dc2626; font-weight:800; }
  .pdf-total-row.paid-row    { color:#15803d; font-weight:800; }
  .pdf-pay-block { display:flex; gap:12px; align-items:center; margin-bottom:18px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:10px 14px; }
  .pdf-pay-block.unpaid { background:#fff7ed; border-color:#fed7aa; }
  .pdf-status-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:5px 12px; border-radius:100px; font-size:0.72rem; font-weight:800;
    background:#dcfce7; color:#166534; border:1px solid rgba(21,128,61,0.3);
  }
  .pdf-status-badge.partial { background:#fef3c7; color:#92400e; border-color:rgba(217,119,6,0.3); }
  .pdf-status-badge.pending { background:#fee2e2; color:#991b1b; border-color:rgba(220,38,38,0.25); }
  .pdf-footer { border-top:1.5px solid #e5e7eb; padding-top:14px; display:flex; justify-content:space-between; align-items:flex-end; }
  .pdf-footer-brand { font-size:0.65rem; color:#9ca3af; }
  .pdf-footer-brand strong { font-family:'Playfair Display',Georgia,serif; color:#0e1b2e; font-size:0.85rem; }
  .pdf-footer-brand strong span { color:#c9963a; }
  .pdf-powered { font-size:0.6rem; color:#9ca3af; text-transform:uppercase; letter-spacing:0.08em; text-align:right; }
  .pdf-powered strong { color:#c9963a; }

  @media (max-width:640px) {
    .ih-page { padding:0.85rem; }
    .ih-kpi-row { grid-template-columns:repeat(3,1fr); gap:7px; margin-bottom:14px; }
    .ih-kpi { padding:0.65rem 0.7rem; border-radius:var(--r-md); gap:3px; }
    .ih-kpi span   { font-size:0.6rem; }
    .ih-kpi strong { font-size:0.95rem; }
    .ih-title    { font-size:1.25rem; }
    .ih-subtitle { font-size:0.75rem; }
    .ih-filters { flex-direction:column; gap:8px; padding:10px; border-radius:var(--r-md); }
    .ih-search  { min-width:0; width:100%; }
    .ih-tab-row { width:100%; }
    .ih-tab { flex:1; text-align:center; padding:6px 8px; font-size:0.72rem; }
    .ih-table-wrap { background:transparent; border:none; box-shadow:none; border-radius:0; }
    .ih-table-scroll { overflow:visible; }
    .ih-table { display:block; min-width:unset; width:100%; }
    .ih-table thead { display:none; }
    .ih-table tbody { display:flex; flex-direction:column; gap:10px; }
    .ih-table tbody tr { display:block; background:var(--white); border:1px solid var(--border); border-radius:var(--r-lg); padding:14px; box-shadow:var(--sh-sm); }
    .ih-table tbody tr:hover td { background:transparent; }
    .ih-table tbody td { display:none; padding:0; border:none; font-size:0.84rem; }
    .em-overlay { padding:0; align-items:flex-end; }
    .em-modal { max-width:100%; border-radius:var(--r-lg) var(--r-lg) 0 0; max-height:95vh; }
    .em-head { padding:1rem 1.1rem 0.85rem; }
    .em-head-title { font-size:1.05rem; }
    .em-body { padding:1rem 1.1rem; gap:14px; }
    .em-grid { grid-template-columns:1fr 1fr; gap:10px; }
    .em-grid.three { grid-template-columns:1fr 1fr; }
    .em-items-header { grid-template-columns:2fr 80px 90px 70px 32px; gap:5px; font-size:0.58rem; padding:7px 10px; }
    .em-item-row { grid-template-columns:2fr 80px 90px 70px 32px; gap:5px; padding:8px 10px; }
    .em-foot { padding:0.85rem 1.1rem; flex-direction:column; }
    .em-save   { width:100%; }
    .em-cancel { width:100%; text-align:center; }
    .pdf-overlay { padding:0; align-items:flex-end; }
    .pdf-modal { max-width:100%; border-radius:var(--r-lg) var(--r-lg) 0 0; max-height:95vh; }
    .pdf-modal-head { flex-direction:column; gap:10px; padding:1rem 1rem 0.75rem; }
    .pdf-modal-actions { width:100%; }
    .pdf-action-btn { flex:1; justify-content:center; }
    .pdf-modal-body { padding:0.85rem; }
    .pdf-doc { padding:20px 14px; }
    .pdf-header { flex-direction:column; gap:8px; }
    .pdf-inv-meta { text-align:left; }
    .pdf-info-row { grid-template-columns:1fr; gap:8px; }
    .pdf-totals { width:100%; }
    .pdf-footer { flex-direction:column; gap:8px; align-items:flex-start; }
  }

  @media (min-width:641px) and (max-width:900px) {
    .ih-page { padding:1.25rem; }
    .em-grid.three { grid-template-columns:1fr 1fr; }
    .pdf-info-row { grid-template-columns:1fr; gap:8px; }
    .pdf-totals { width:100%; }
    .pdf-header { flex-direction:column; gap:8px; }
    .pdf-inv-meta { text-align:left; }
  }
`;

const MOBILE_CARD_STYLES = `
  @media (min-width:641px) {
    .m-card { display:table-cell !important; white-space:nowrap; }
    .m-card .m-card-top, .m-card .m-card-info { display:none !important; }
    .m-card .ih-actions { display:flex; }
  }
  @media (max-width:640px) {
    .ih-table tbody td:not(.m-card) { display:none !important; }
    .m-card { display:block !important; width:100% !important; padding:0 !important; }
    .m-card::before { display:none !important; }
    .m-card-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--border); }
    .m-card-info { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border); }
    .m-card .ih-actions { flex-wrap:wrap; gap:6px; }
    .m-card .ih-actions .ih-btn { flex:1; min-width:calc(50% - 6px); justify-content:center; padding:8px 6px; font-size:0.73rem; }
  }
`;

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const badgeCls = (s) => ({ paid:"paid", partial:"partial" }[(s||"Pending").toLowerCase()] || "pending");
const badgeIcon = (s) => ({ paid:"✓", partial:"⚡" }[(s||"Pending").toLowerCase()] || "⏳");
const emptyItem = () => ({ id: Date.now() + Math.random(), name:"", qty:1, price:0, unit:"piece", productId:null, isStockItem:false, maxQty:Infinity, _new:true });

/* ═══════════════════════════════════════════════
   PDF DOCUMENT
═══════════════════════════════════════════════ */
const PdfDocument = React.forwardRef(({ invoice, shop }, ref) => {
  const items    = invoice?.items  || [];
  const status   = invoice?.status || "Pending";
  const balance  = Number(invoice?.balance  || 0);
  const advance  = Number(invoice?.advance  || 0);
  const total    = Number(invoice?.total    || 0);
  const discount = Number(invoice?.discount || 0);
  const gstAmt   = Number(invoice?.gst_amt  || 0);
  const subtotal = Number(invoice?.subtotal || 0);

  return (
    <div className="pdf-doc" ref={ref}>
      <div className="pdf-watermark" aria-hidden="true">
        <div className="pdf-wm-text">ManaBills</div>
      </div>
      <div className="pdf-content">
        <div className="pdf-header">
          <div>
            <div className="pdf-brand-name">Mana<span>Bills</span></div>
            <div className="pdf-brand-tag">AP & Telangana's Billing Platform</div>
          </div>
          <div className="pdf-inv-meta">
            {invoice?.is_gst && <div className="pdf-gst-tag">GST Invoice</div>}
            <div className="pdf-inv-title">{invoice?.is_gst ? "TAX INVOICE" : "INVOICE"}</div>
            <div className="pdf-inv-num"># {invoice?.invoice_id}</div>
            <div className="pdf-inv-date">Date: {invoice?.date}</div>
          </div>
        </div>

        {shop && (
          <div className="pdf-shop-block">
            <div className="pdf-shop-name">{shop.shop_name}</div>
            {shop.owner_name  && <div className="pdf-shop-det">Owner: {shop.owner_name}</div>}
            {shop.mobile      && <div className="pdf-shop-det">📞 {shop.mobile}{shop.extra_mobile ? ` / ${shop.extra_mobile}` : ""}</div>}
            {shop.address     && <div className="pdf-shop-det">📍 {shop.address}</div>}
            {shop.gst_enabled && shop.gst_number && <div className="pdf-shop-det">GSTIN: <strong>{shop.gst_number}</strong></div>}
          </div>
        )}

        <div className="pdf-info-row">
          <div>
            <div className="pdf-info-lbl">Bill To</div>
            <div className="pdf-info-val">{invoice?.customer_name || "—"}</div>
            {invoice?.customer_mobile && <div style={{fontSize:"0.75rem",color:"#6b7280"}}>📞 {invoice.customer_mobile}</div>}
            {invoice?.customer_gst    && <div style={{fontSize:"0.75rem",color:"#6b7280"}}>GSTIN: {invoice.customer_gst}</div>}
          </div>
          <div>
            <div className="pdf-info-lbl">Invoice Details</div>
            <div className="pdf-info-val">#{invoice?.invoice_id}</div>
            <div style={{fontSize:"0.75rem",color:"#6b7280"}}>Date: {invoice?.date}</div>
            <div style={{fontSize:"0.75rem",color:"#6b7280",marginTop:"3px"}}>Payment: {invoice?.payment}</div>
          </div>
        </div>

        <table className="pdf-table">
          <thead>
            <tr>
              <th style={{width:"28px"}}>#</th>
              <th>Description</th>
              <th style={{textAlign:"center"}}>Qty</th>
              <th style={{textAlign:"center"}}>Unit</th>
              <th style={{textAlign:"right"}}>Rate</th>
              <th style={{textAlign:"right"}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={6} style={{color:"#9ca3af",textAlign:"center"}}>No items</td></tr>
              : items.map((item, i) => (
                <tr key={i}>
                  <td style={{color:"#9ca3af"}}>{i+1}</td>
                  <td style={{fontWeight:600}}>{item.name}</td>
                  <td style={{textAlign:"center"}}>{item.qty}</td>
                  <td style={{textAlign:"center",color:"#6b7280",fontSize:"0.72rem"}}>{item.unit}</td>
                  <td style={{textAlign:"right"}}>₹{item.price}</td>
                  <td>₹{(Number(item.qty)*Number(item.price)).toLocaleString("en-IN")}</td>
                </tr>
              ))
            }
          </tbody>
        </table>

        <div className="pdf-totals">
          <div className="pdf-total-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          {invoice?.is_gst && <div className="pdf-total-row"><span>GST (5%)</span><span>{fmt(gstAmt)}</span></div>}
          {discount > 0 && <div className="pdf-total-row" style={{color:"#15803d"}}><span>Discount</span><span>- {fmt(discount)}</span></div>}
          <div className="pdf-total-row grand"><span>Grand Total</span><span>{fmt(total)}</span></div>
          {advance > 0  && <div className="pdf-total-row paid-row"><span>Paid (Advance)</span><span>{fmt(advance)}</span></div>}
          {balance > 0  && <div className="pdf-total-row balance-row"><span>Balance Due</span><span>{fmt(balance)}</span></div>}
        </div>

        <div className={`pdf-pay-block ${status !== "Paid" ? "unpaid" : ""}`}>
          <span className={`pdf-status-badge ${badgeCls(status)}`}>{badgeIcon(status)} {status}</span>
          <span style={{fontSize:"0.8rem",color:"#6b7280"}}>Payment mode: <strong style={{color:"#111827"}}>{invoice?.payment}</strong></span>
          {balance > 0 && <span style={{fontSize:"0.8rem",color:"#dc2626",fontWeight:700,marginLeft:"auto"}}>Balance: {fmt(balance)}</span>}
        </div>

        <div className="pdf-footer">
          <div className="pdf-footer-brand">
            <div><strong>Mana<span>Bills</span></strong></div>
            <div>manabills.in | support@manabills.in</div>
            <div style={{marginTop:"4px",fontSize:"0.62rem",color:"#d1d5db"}}>Thank you for your business 🙏</div>
          </div>
          <div className="pdf-powered">
            Generated by<br /><strong>ManaBills Platform</strong><br />AP & Telangana's #1 Billing App
          </div>
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   PDF PREVIEW MODAL
═══════════════════════════════════════════════ */
const PdfPreviewModal = ({ invoice, shop, onClose }) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open("","_blank","width=800,height=700");
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Invoice ${invoice?.invoice_id}</title>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;color:#000;background:#fff;padding:0;}@page{size:A4;margin:18mm 16mm;}.pdf-doc{padding:32px;position:relative;overflow:hidden;}.pdf-watermark{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;overflow:hidden;}.pdf-wm-text{font-family:'Playfair Display',Georgia,serif;font-size:5.5rem;font-weight:900;color:rgba(201,150,58,0.06);transform:rotate(-30deg);white-space:nowrap;user-select:none;}.pdf-content{position:relative;z-index:1;}.pdf-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;margin-bottom:18px;border-bottom:2.5px solid #0e1b2e;}.pdf-brand-name{font-size:1.6rem;font-weight:900;font-family:'Playfair Display',Georgia,serif;color:#0e1b2e;}.pdf-brand-name span{color:#c9963a;}.pdf-brand-tag{font-size:0.65rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;}.pdf-inv-meta{text-align:right;}.pdf-inv-title{font-family:'Playfair Display',Georgia,serif;font-size:1.15rem;font-weight:800;color:#0e1b2e;}.pdf-gst-tag{display:inline-block;background:rgba(30,79,186,0.1);color:#1e4fba;font-size:0.6rem;font-weight:800;text-transform:uppercase;padding:2px 8px;border-radius:100px;border:1px solid rgba(30,79,186,0.2);margin-bottom:4px;}.pdf-inv-num{font-weight:800;color:#c9963a;font-size:0.9rem;}.pdf-inv-date{font-size:0.78rem;color:#6b7280;}.pdf-shop-block{margin-bottom:16px;}.pdf-shop-name{font-weight:800;color:#0e1b2e;font-size:0.88rem;}.pdf-shop-det{font-size:0.75rem;color:#6b7280;margin-top:1px;}.pdf-info-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8faf9;border-radius:8px;padding:14px 16px;margin-bottom:18px;border:1px solid #e5e7eb;}.pdf-info-lbl{font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;margin-bottom:3px;}.pdf-info-val{font-weight:700;color:#111827;font-size:0.82rem;}.pdf-table{width:100%;border-collapse:collapse;margin-bottom:18px;}.pdf-table th{background:#0e1b2e;color:#fff;padding:9px 11px;text-align:left;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;}.pdf-table th:last-child{text-align:right;}.pdf-table td{padding:9px 11px;border-bottom:1px solid #f1f5f9;font-size:0.8rem;}.pdf-table td:last-child{text-align:right;font-weight:700;}.pdf-table tbody tr:nth-child(even) td{background:#fafafa;}.pdf-totals{margin-left:auto;width:48%;margin-bottom:18px;}.pdf-total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:0.8rem;border-bottom:1px solid #f1f5f9;}.pdf-total-row.grand{font-weight:900;font-size:0.95rem;color:#0e1b2e;padding-top:10px;border-top:2.5px solid #0e1b2e;border-bottom:none;}.pdf-total-row.balance-row{color:#dc2626;font-weight:800;}.pdf-total-row.paid-row{color:#15803d;font-weight:800;}.pdf-pay-block{display:flex;gap:12px;align-items:center;margin-bottom:18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;}.pdf-pay-block.unpaid{background:#fff7ed;border-color:#fed7aa;}.pdf-status-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:100px;font-size:0.72rem;font-weight:800;background:#dcfce7;color:#166534;border:1px solid rgba(21,128,61,0.3);}.pdf-status-badge.partial{background:#fef3c7;color:#92400e;}.pdf-status-badge.pending{background:#fee2e2;color:#991b1b;}.pdf-footer{border-top:1.5px solid #e5e7eb;padding-top:14px;display:flex;justify-content:space-between;align-items:flex-end;}.pdf-footer-brand{font-size:0.65rem;color:#9ca3af;}.pdf-footer-brand strong{font-family:'Playfair Display',Georgia,serif;color:#0e1b2e;font-size:0.85rem;}.pdf-footer-brand strong span{color:#c9963a;}.pdf-powered{font-size:0.6rem;color:#9ca3af;text-transform:uppercase;text-align:right;}.pdf-powered strong{color:#c9963a;}</style>
    </head><body>${content}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  };

  const handleWa = () => {
    const mob = invoice?.customer_mobile?.replace(/\D/g,"") || "";
    if (!mob) return;
    const items = (invoice?.items||[]).map((it,i)=>`${i+1}. ${it.name} × ${it.qty} = ₹${(Number(it.qty)*Number(it.price)).toLocaleString("en-IN")}`).join("\n");
    const msg = `*${shop?.shop_name||"ManaBills"}*\n━━━━━━━━━━━━━\n🧾 *Invoice: ${invoice?.invoice_id}*\n📅 ${invoice?.date}\n\n*Bill To:* ${invoice?.customer_name}\n\n*Items:*\n${items}\n\n━━━━━━━━━━━━━\n💰 *Total: ${fmt(invoice?.total)}*\n${Number(invoice?.balance||0)>0?`🔴 Balance: ${fmt(invoice?.balance)}`:"✅ FULLY PAID"}\n\n_ManaBills · manabills.in_`;
    window.open(`https://wa.me/91${mob.slice(-10)}?text=${encodeURIComponent(msg)}`,"_blank");
  };

  return (
    <div className="pdf-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="pdf-modal">
        <div className="pdf-modal-head">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",gap:8}}>
            <div>
              <div style={{fontFamily:"var(--font-d)",fontSize:"1.2rem",fontWeight:800,color:"var(--navy)"}}>Invoice Preview</div>
              <div style={{fontSize:"0.75rem",color:"var(--muted)",marginTop:2}}>{invoice?.invoice_id} · {invoice?.date}</div>
            </div>
            <button className="em-close" onClick={onClose} style={{flexShrink:0}}>✕</button>
          </div>
          <div className="pdf-modal-actions">
            <button className="pdf-action-btn wa-btn" onClick={handleWa}>💬 WhatsApp</button>
            <button className="pdf-action-btn print" onClick={handlePrint}>🖨️ Print / PDF</button>
          </div>
        </div>
        <div className="pdf-modal-body">
          <div ref={printRef}><PdfDocument invoice={invoice} shop={shop} /></div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   SINGLE ITEM ROW inside Edit Modal
═══════════════════════════════════════════════ */
const ItemRow = ({ item, idx, onChange, onRemove, originalItems }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const debounceRef = useRef(null);

  const isNew = item._new && !item._originalId;

  const handleNameChange = (val) => {
    onChange(idx, "name", val);
    onChange(idx, "productId", null);
    onChange(idx, "isStockItem", false);
    clearTimeout(debounceRef.current);
    if (val.trim().length >= 1) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await searchProducts(val.trim());
          setSuggestions(res || []);
          setShowSuggest(true);
        } catch { setSuggestions([]); }
      }, 250);
    } else {
      setSuggestions([]);
      setShowSuggest(false);
    }
  };

  const pickSuggestion = (prod) => {
    onChange(idx, "name",        prod.name);
    onChange(idx, "price",       Number(prod.selling_price));
    onChange(idx, "unit",        prod.unit);
    onChange(idx, "productId",   prod.id);
    onChange(idx, "isStockItem", true);
    onChange(idx, "maxQty",      Number(prod.qty));
    setSuggestions([]); setShowSuggest(false);
  };

  const rowCls = [
    "em-item-row",
    item.isStockItem && !isNew ? "is-stock" : "",
    isNew            ? "is-new"   : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={rowCls} style={{position:"relative"}}>
      <div style={{position:"relative"}}>
        <input
          className={`em-item-input${item.isStockItem ? " stock-linked" : ""}`}
          placeholder="Product name…"
          value={item.name}
          onChange={e => handleNameChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowSuggest(true); }}
          onBlur={() => setTimeout(() => setShowSuggest(false), 180)}
        />
        {showSuggest && suggestions.length > 0 && (
          <div className="em-suggest">
            {suggestions.map(s => (
              <div key={s.id} className="em-suggest-item" onMouseDown={() => pickSuggestion(s)}>
                <div>
                  <div className="em-suggest-name">{s.name}</div>
                  <div className="em-suggest-cat">{s.category}</div>
                </div>
                <div className="em-suggest-right">
                  <div className="em-suggest-price">₹{s.selling_price}</div>
                  <div className={`em-suggest-stock ${Number(s.qty) <= Number(s.min_qty_alert||5) ? "low" : "ok"}`}>
                    {s.qty} {s.unit} left
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{marginTop:3,display:"flex",gap:4,flexWrap:"wrap"}}>
          {item.isStockItem && <span className="em-stock-pill linked">● Stock</span>}
          {isNew && <span className="em-stock-pill new">+ New</span>}
          {!item.isStockItem && !isNew && <span className="em-stock-pill manual">Manual</span>}
        </div>
      </div>

      <div>
        <input
          className="em-item-input"
          type="number" min="1"
          max={item.maxQty !== Infinity ? item.maxQty : undefined}
          value={item.qty}
          onChange={e => {
            const v = Number(e.target.value);
            if (item.isStockItem && v > item.maxQty) return;
            onChange(idx, "qty", v);
          }}
          style={{textAlign:"right"}}
        />
        {item.isStockItem && item.maxQty !== Infinity && (
          <div style={{fontSize:"0.6rem",color:"var(--muted)",textAlign:"right",marginTop:2}}>max {item.maxQty}</div>
        )}
      </div>

      <input
        className="em-item-input"
        type="number" min="0" step="0.01"
        value={item.price}
        onChange={e => onChange(idx, "price", e.target.value)}
        style={{textAlign:"right"}}
      />

      <div style={{fontWeight:800,fontSize:"0.88rem",color:"var(--navy)",textAlign:"right",display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
        {fmt(Number(item.qty||0)*Number(item.price||0))}
      </div>

      <button className="em-item-remove" onClick={() => onRemove(idx)} title="Remove item">✕</button>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   EDIT MODAL
═══════════════════════════════════════════════ */
const EditModal = ({ invoice, shop, onClose, onSaved }) => {
  const [form, setForm] = useState({
    customer_name:   invoice?.customer_name   || "",
    customer_mobile: invoice?.customer_mobile || "",
    customer_gst:    invoice?.customer_gst    || "",
    payment:         invoice?.payment         || "Cash",
    advance:         invoice?.advance         || 0,
    discount:        invoice?.discount        || 0,
    status:          invoice?.status          || "Pending",
    is_gst:          invoice?.is_gst          || false,
  });

  const [items, setItems] = useState(() =>
    (invoice?.items || []).map((it, i) => ({
      ...it,
      id: it.id || (Date.now() + i),
      _originalId: it.id || (Date.now() + i),
      _new: false,
      productId:   it.product || null,
      isStockItem: !!it.is_stock_item,
      maxQty:      Infinity,
      unit:        it.unit || "piece",
    }))
  );
  const originalItems = useRef([...items]).current;
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleItemRemove = (idx) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddItem = () => setItems(prev => [...prev, emptyItem()]);

  const subtotal = items.filter(i=>i.name.trim()).reduce((s,i) => s + Number(i.qty||0)*Number(i.price||0), 0);
  const gstAmt   = form.is_gst ? Math.round(subtotal * 0.05) : 0;
  const total    = subtotal + gstAmt - Number(form.discount||0);
  const balance  = total - Number(form.advance||0);

  const stockDiff = (() => {
    const diff = [];
    originalItems.forEach(orig => {
      if (!orig.isStockItem || !orig.productId) return;
      const current = items.find(i => i._originalId === orig._originalId);
      if (!current) {
        diff.push({ name: orig.name, type:"restore", qty: Number(orig.qty), unit: orig.unit });
      } else {
        const delta = Number(orig.qty) - Number(current.qty);
        if (delta > 0) diff.push({ name: orig.name, type:"restore", qty: delta, unit: orig.unit });
        if (delta < 0) diff.push({ name: orig.name, type:"deduct",  qty: -delta, unit: orig.unit });
      }
    });
    items.forEach(item => {
      if (item._new && item.isStockItem && item.productId) {
        diff.push({ name: item.name, type:"deduct", qty: Number(item.qty), unit: item.unit });
      }
    });
    return diff;
  })();

  const handleSave = async () => {
    if (!form.customer_name.trim()) return;
    if (items.filter(i => i.name.trim()).length === 0) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        advance:  Number(form.advance),
        discount: Number(form.discount),
        subtotal,
        gst_amt: gstAmt,
        total,
        balance,
        items: items
          .filter(i => i.name.trim())
          .map(i => ({
            id:            i._originalId || undefined,
            product:       i.productId   || null,
            name:          i.name,
            qty:           Number(i.qty),
            price:         Number(i.price),
            unit:          i.unit,
            is_stock_item: i.isStockItem,
            _new:          i._new || false,
          })),
      };
      const { data } = await authAxios.patch(`business/invoices/${invoice.id}/`, payload);
      onSaved(data);
    } catch (err) {
      console.error("Edit invoice failed", err);
      alert(err?.response?.data?.detail || err?.response?.data?.items || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="em-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="em-modal">
        <div className="em-head">
          <div className="em-head-left">
            <div className="em-head-title">Edit Invoice</div>
            <div className="em-head-sub">
              {invoice?.invoice_id} · {invoice?.date}
              {invoice?.is_gst && <span className="ih-gst-badge" style={{marginLeft:8}}>GST</span>}
            </div>
          </div>
          <button className="em-close" onClick={onClose}>✕</button>
        </div>

        {stockDiff.length > 0 && (
          <div style={{padding:"0 1.5rem",marginTop:10,flexShrink:0}}>
            <div className="em-stock-diff">
              <div className="em-stock-diff-title">📦 Stock will be adjusted automatically</div>
              {stockDiff.map((d, i) => (
                <div key={i} className="em-stock-diff-item">
                  <span>{d.name}</span>
                  <span className={d.type}>
                    {d.type === "restore" ? `+${d.qty} ${d.unit} restored` : `-${d.qty} ${d.unit} deducted`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="em-body">
          <div>
            <div className="em-section-title">Customer Details</div>
            <div className="em-grid">
              <div className="em-field">
                <label className="em-label">Customer Name *</label>
                <input className="em-input" name="customer_name" value={form.customer_name} onChange={handleFieldChange} placeholder="Customer name" />
              </div>
              <div className="em-field">
                <label className="em-label">Mobile Number</label>
                <input className="em-input" name="customer_mobile" value={form.customer_mobile} onChange={handleFieldChange} placeholder="10-digit mobile" />
              </div>
              {form.is_gst && (
                <div className="em-field full">
                  <label className="em-label">Customer GST Number</label>
                  <input className="em-input" name="customer_gst" value={form.customer_gst} onChange={handleFieldChange} placeholder="22AAAAA0000A1Z5" />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="em-section-title">Payment & Billing</div>
            <div className="em-grid three">
              <div className="em-field">
                <label className="em-label">Payment Mode</label>
                <select className="em-input" name="payment" value={form.payment} onChange={handleFieldChange}>
                  {["Cash","UPI","PhonePe","GooglePay","Card","Cheque","Credit"].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="em-field">
                <label className="em-label">Status</label>
                <select className="em-input" name="status" value={form.status} onChange={handleFieldChange}>
                  <option>Pending</option>
                  <option>Partial</option>
                  <option>Paid</option>
                </select>
              </div>
              <div className="em-field">
                <label className="em-label">Discount ₹</label>
                <input className="em-input" type="number" name="discount" value={form.discount} onChange={handleFieldChange} min="0" />
              </div>
              <div className="em-field">
                <label className="em-label">Advance Paid ₹</label>
                <input className="em-input" type="number" name="advance" value={form.advance} onChange={handleFieldChange} min="0" />
              </div>
              <div className="em-field" style={{display:"flex",alignItems:"center",gap:10,paddingTop:24}}>
                <input type="checkbox" id="em-gst" name="is_gst" checked={form.is_gst} onChange={handleFieldChange} style={{accentColor:"var(--gold)",width:16,height:16}} />
                <label htmlFor="em-gst" style={{fontSize:"0.84rem",fontWeight:700,color:"var(--navy)",cursor:"pointer"}}>GST Invoice (5%)</label>
              </div>
            </div>
          </div>

          <div>
            <div className="em-section-title">
              Items
              <span style={{fontSize:"0.72rem",fontWeight:600,color:"var(--gold)",marginLeft:4}}>
                — Type product name to auto-fill from stock
              </span>
            </div>
            <div className="em-items-wrap">
              <div className="em-items-header">
                <div>Product / Item</div>
                <div style={{textAlign:"right"}}>Qty</div>
                <div style={{textAlign:"right"}}>Price ₹</div>
                <div style={{textAlign:"right"}}>Amount</div>
                <div></div>
              </div>
              {items.map((item, i) => (
                <ItemRow
                  key={item.id || i}
                  item={item}
                  idx={i}
                  onChange={handleItemChange}
                  onRemove={handleItemRemove}
                  originalItems={originalItems}
                />
              ))}
            </div>
            <button className="em-add-item-btn" onClick={handleAddItem}>+ Add Item</button>
          </div>

          <div>
            <div className="em-section-title">Invoice Summary</div>
            <div className="em-summary">
              <div className="em-sum-row"><span>Subtotal</span><span style={{fontWeight:700,color:"var(--navy)"}}>{fmt(subtotal)}</span></div>
              {form.is_gst && <div className="em-sum-row"><span>GST (5%)</span><span>{fmt(gstAmt)}</span></div>}
              {Number(form.discount||0) > 0 && <div className="em-sum-row"><span>Discount</span><span style={{color:"var(--green)"}}>- {fmt(form.discount)}</span></div>}
              <div className="em-sum-row total"><span>Total</span><span>{fmt(total)}</span></div>
              {Number(form.advance||0) > 0 && <div className="em-sum-row paid-row"><span>Advance Paid</span><span>{fmt(form.advance)}</span></div>}
              <div className="em-sum-row balance">
                <span>Balance Due</span>
                <span style={{color:balance>0?"var(--red)":"var(--green)",fontWeight:800}}>
                  {balance > 0 ? fmt(balance) : "✓ Cleared"}
                </span>
              </div>
              <div style={{marginTop:8,fontSize:"0.78rem",color:"var(--muted)"}}>
                Status will be:&nbsp;
                <strong style={{color: Number(form.advance||0)>=total?"var(--green)":Number(form.advance||0)>0?"var(--orange)":"var(--red)"}}>
                  {Number(form.advance||0)>=total?"✅ Paid":Number(form.advance||0)>0?"⚡ Partial":"⏳ Pending"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="em-foot">
          <button className="em-cancel" onClick={onClose}>Cancel</button>
          <button className="em-save" onClick={handleSave} disabled={saving || !form.customer_name.trim()}>
            {saving ? "Saving…" : "💾 Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   MOBILE INVOICE CARD ROW
═══════════════════════════════════════════════ */
const InvoiceRow = ({ inv, idx, onPreview, onEdit, onSendWa, onMarkPaid, onDelete, confirmDel, onConfirmDel, onCancelDel }) => {
  const balance = Number(inv.balance || 0);
  return (
    <tr>
      <td style={{color:"var(--muted)",fontSize:"0.78rem"}}>{idx+1}</td>
      <td><div className="ih-inv-id">{inv.invoice_id||"—"}{inv.is_gst&&<span className="ih-gst-badge">GST</span>}</div></td>
      <td><div className="ih-customer-name">{inv.customer_name||"—"}</div>{inv.customer_mobile&&<span className="ih-customer-mobile">{inv.customer_mobile}</span>}</td>
      <td style={{fontSize:"0.8rem",color:"var(--muted)"}}>{inv.date||"—"}</td>
      <td style={{fontSize:"0.82rem"}}>{inv.payment||"—"}</td>
      <td><div className="ih-amount">{fmt(inv.total)}</div>{Number(inv.discount||0)>0&&<div className="ih-disc">- {fmt(inv.discount)} disc</div>}</td>
      <td><div className={`ih-bal ${balance>0?"red":"green"}`}>{fmt(balance)}</div></td>
      <td><span className={`ih-badge ${badgeCls(inv.status)}`}>{badgeIcon(inv.status)} {inv.status||"Pending"}</span></td>

      <td className="ih-actions-cell m-card">
        <div className="m-card-top">
          <div>
            <span className="ih-inv-id" style={{fontSize:"0.85rem"}}>{inv.invoice_id||"—"}{inv.is_gst&&<span className="ih-gst-badge">GST</span>}</span>
            <span style={{fontSize:"0.72rem",color:"var(--muted)",marginLeft:6}}>{inv.date}</span>
          </div>
          <span className={`ih-badge ${badgeCls(inv.status)}`}>{badgeIcon(inv.status)} {inv.status||"Pending"}</span>
        </div>
        <div className="m-card-info">
          <div>
            <div style={{fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--muted)",marginBottom:2}}>Customer</div>
            <div className="ih-customer-name" style={{fontSize:"0.86rem"}}>{inv.customer_name||"—"}</div>
            {inv.customer_mobile&&<span className="ih-customer-mobile">{inv.customer_mobile}</span>}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--muted)",marginBottom:2}}>Amount</div>
            <div className="ih-amount" style={{fontSize:"1rem"}}>{fmt(inv.total)}</div>
            {balance>0?<div className="ih-bal red" style={{fontSize:"0.78rem"}}>Bal: {fmt(balance)}</div>:<div className="ih-bal green" style={{fontSize:"0.78rem"}}>✓ Cleared</div>}
            <div style={{fontSize:"0.7rem",color:"var(--muted)",marginTop:2}}>{inv.payment}</div>
          </div>
        </div>
        <div className="ih-actions">
          <button className="ih-btn pdf"  onClick={()=>onPreview(inv)}>📄 View</button>
          <button className="ih-btn edit" onClick={()=>onEdit(inv)}>✏️ Edit</button>
          <button className="ih-btn wa"   onClick={()=>onSendWa(inv)} disabled={!inv.customer_mobile}>💬 WA</button>
          {inv.status!=="Paid"&&<button className="ih-btn paid" onClick={()=>onMarkPaid(inv.id)}>✓ Paid</button>}
          {confirmDel===inv.id
            ? <><button className="ih-btn del" onClick={()=>onDelete(inv.id)}>Confirm</button><button className="ih-btn" style={{background:"var(--bg)",border:"1.5px solid var(--border2)",color:"var(--muted)"}} onClick={onCancelDel}>Cancel</button></>
            : <button className="ih-btn del" onClick={()=>onConfirmDel(inv.id)}>🗑</button>
          }
        </div>
      </td>
    </tr>
  );
};

/* ═══════════════════════════════════════════════
   MAIN — INVOICE HISTORY
═══════════════════════════════════════════════ */
const InvoiceHistory = () => {
  const [invoices,       setInvoices]       = useState([]);
  const [shop,           setShop]           = useState(null);
  const [search,         setSearch]         = useState("");
  const [filterStatus,   setFilterStatus]   = useState("All");
  const [filterPayment,  setFilterPayment]  = useState("All");
  const [loading,        setLoading]        = useState(true);
  const [toast,          setToast]          = useState(null);
  const [editInvoice,    setEditInvoice]    = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [confirmDel,     setConfirmDel]     = useState(null);
  const [loadingEdit,    setLoadingEdit]    = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const [invData, shopData] = await Promise.allSettled([
        authAxios.get("business/invoices/", { params }).then(r=>r.data),
        getShopProfile(),
      ]);
      if (invData.status  === "fulfilled") {
        const invoiceList = invData.value;
        setInvoices(invoiceList);
        // ── AUTO-SYNC: push new invoice customers → Customers DB ──
        // Run in background; don't block or show errors to user
        syncInvoiceCustomers(invoiceList);
      }
      if (shopData.status === "fulfilled") setShop(shopData.value);
    } catch { showToast("Failed to load invoices.", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const params = {};
    if (search)               params.search  = search;
    if (filterStatus  !=="All") params.status  = filterStatus;
    if (filterPayment !=="All") params.payment = filterPayment;
    const t = setTimeout(() => loadData(params), 350);
    return () => clearTimeout(t);
  }, [search, filterStatus, filterPayment, loadData]);

  const handleOpenEdit = async (inv) => {
    setLoadingEdit(true);
    showToast("Loading invoice details…", "info");
    try {
      const detail = await authAxios.get(`business/invoices/${inv.id}/`).then(r=>r.data);
      const items  = detail.items || detail.invoice_items || [];
      setEditInvoice({ ...detail, items });
    } catch {
      showToast("Failed to load invoice details.", "error");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleOpenPreview = async (inv) => {
    try {
      const detail = await authAxios.get(`business/invoices/${inv.id}/`).then(r=>r.data);
      const items  = detail.items || detail.invoice_items || [];
      setPreviewInvoice({ ...detail, items });
    } catch {
      setPreviewInvoice(inv);
    }
  };

  const handleEditSaved = (updated) => {
    setInvoices(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
    setEditInvoice(null);
    showToast("Invoice updated successfully ✓");
    // Re-sync customers after edit (customer name/mobile may have changed)
    syncInvoiceCustomers([updated]);
  };

  const handleMarkPaid = async (id) => {
    try {
      const updated = await markInvoicePaid(id);
      setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
      showToast("Invoice marked as Paid ✓");
    } catch { showToast("Failed to update.", "error"); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInvoice(id);
      setInvoices(prev => prev.filter(i => i.id !== id));
      setConfirmDel(null);
      showToast("Invoice deleted.");
    } catch { showToast("Failed to delete.", "error"); }
  };

  const sendWhatsApp = (inv) => {
    const mob = inv.customer_mobile?.replace(/\D/g,"") || "";
    if (!mob) return;
    const msg = `*${shop?.shop_name||"ManaBills"}*\n━━━━━━━━━━━━━\n🧾 *Invoice: ${inv.invoice_id}*\n📅 ${inv.date}\n\n*Bill To:* ${inv.customer_name}\n\n💰 *Total: ${fmt(inv.total)}*\n${Number(inv.balance||0)>0?`🔴 Balance: ${fmt(inv.balance)}`:"✅ FULLY PAID"}\n💳 ${inv.payment}\n\n_ManaBills · manabills.in_`;
    window.open(`https://wa.me/91${mob.slice(-10)}?text=${encodeURIComponent(msg)}`,"_blank");
  };

  const totalBilling = invoices.reduce((s,i)=>s+Number(i.total||0),0);
  const totalPaid    = invoices.reduce((s,i)=>s+Number(i.advance||0),0);
  const totalPending = invoices.reduce((s,i)=>s+Number(i.balance||0),0);
  const paymentModes = ["All",...new Set(invoices.map(i=>i.payment).filter(Boolean))];

  return (
    <>
      <style>{STYLES}</style>
      <style>{MOBILE_CARD_STYLES}</style>

      <div className="ih-page">

        {toast && <div className={`ih-toast ${toast.type}`}>{toast.msg}</div>}

        <div className="ih-header">
          <div>
            <div className="ih-title">Invoice History</div>
            <div className="ih-subtitle">
              {loading ? "Loading…" : `${invoices.length} invoice${invoices.length!==1?"s":""} found`}
            </div>
          </div>
        </div>

        <div className="ih-kpi-row">
          <div className="ih-kpi blue">
            <span>Total Billed</span>
            <strong>{fmt(totalBilling)}</strong>
          </div>
          <div className="ih-kpi green">
            <span>Collected</span>
            <strong>{fmt(totalPaid)}</strong>
          </div>
          <div className="ih-kpi orange">
            <span>Pending</span>
            <strong>{fmt(totalPending)}</strong>
          </div>
        </div>

        <div className="ih-filters">
          <input
            className="ih-search"
            placeholder="🔍  Search customer, invoice no or mobile…"
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          <div className="ih-tab-row">
            {["All","Paid","Partial","Pending"].map(s=>(
              <button key={s} className={`ih-tab${filterStatus===s?" active":""}`} onClick={()=>setFilterStatus(s)}>{s}</button>
            ))}
          </div>
          {paymentModes.length > 2 && (
            <select value={filterPayment} onChange={e=>setFilterPayment(e.target.value)}
              style={{padding:"7px 12px",borderRadius:"var(--r-sm)",border:"1.5px solid var(--border2)",background:"var(--white)",fontFamily:"var(--font-b)",fontSize:"0.78rem",color:"var(--text)"}}>
              {paymentModes.map(m=><option key={m} value={m}>{m==="All"?"All Payments":m}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="ih-empty">
            <div className="ih-empty-icon">⏳</div>
            <p>Loading invoices…</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="ih-empty">
            <div className="ih-empty-icon">📄</div>
            <p>No invoices found.</p>
            <small>Try adjusting your filters above.</small>
          </div>
        ) : (
          <div className="ih-table-wrap">
            <div className="ih-table-scroll">
              <table className="ih-table">
                <thead>
                  <tr>
                    <th>#</th><th>Invoice No</th><th>Customer</th><th>Date</th>
                    <th>Payment</th><th>Amount</th><th>Balance</th><th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <InvoiceRow
                      key={inv.id}
                      inv={inv}
                      idx={i}
                      onPreview={handleOpenPreview}
                      onEdit={handleOpenEdit}
                      onSendWa={sendWhatsApp}
                      onMarkPaid={handleMarkPaid}
                      onDelete={handleDelete}
                      confirmDel={confirmDel}
                      onConfirmDel={setConfirmDel}
                      onCancelDel={()=>setConfirmDel(null)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && invoices.length > 0 && (
          <p style={{textAlign:"center",fontSize:"0.75rem",color:"var(--muted)",marginTop:12,fontStyle:"italic"}}>
            📄 Tap any row's Edit button to modify items and customer details
          </p>
        )}

      </div>

      {editInvoice && (
        <EditModal
          invoice={editInvoice}
          shop={shop}
          onClose={() => setEditInvoice(null)}
          onSaved={handleEditSaved}
        />
      )}

      {previewInvoice && (
        <PdfPreviewModal
          invoice={previewInvoice}
          shop={shop}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </>
  );
};

export default InvoiceHistory;
