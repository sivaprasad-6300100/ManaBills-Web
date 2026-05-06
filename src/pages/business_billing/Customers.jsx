import React, { useEffect, useState, useCallback } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../services/businessService";
import { authAxios } from "../../services/api";

/* ─── Sync customers from invoices (background, best-effort) ─── */
const syncCustomersFromInvoices = async () => {
  try {
    const invoices = await authAxios.get("business/invoices/").then(r => r.data);
    if (!invoices?.length) return;
    const existing = await getCustomers("");
    const seen = new Set(existing.map(c => (c.mobile || "").replace(/\D/g, "").slice(-10)).filter(Boolean));
    const dedup = new Set();
    for (const inv of invoices) {
      const name   = (inv.customer_name   || "").trim();
      const mobile = (inv.customer_mobile || "").replace(/\D/g, "").slice(-10);
      if (!name || !mobile || seen.has(mobile) || dedup.has(mobile)) continue;
      dedup.add(mobile);
      try { await createCustomer({ name, mobile, email: inv.customer_email || "", gst_number: inv.customer_gst || "", address: inv.customer_address || "" }); }
      catch { /* ignore race-condition duplicates */ }
    }
  } catch { /* best-effort */ }
};

/* ─── Styles ─── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --ink:  #1a1410; --ink2: #3d3530; --ink3: #6b6560;
  --paper:#faf8f4; --paper2:#f2efe9; --paper3:#e8e4dc;
  --gold: #c17f3a; --gold2:#e8a020; --gold-light:rgba(193,127,58,0.10);
  --green:#2d7a4f; --red:#c0392b;   --blue:#1e4fd0;
  --bd:   rgba(26,20,16,0.09); --bd2:rgba(26,20,16,0.17);
  --r:    10px; --r2:16px; --r3:24px;
  --sh:   0 1px 6px rgba(26,20,16,0.06), 0 4px 14px rgba(26,20,16,0.05);
  --sh2:  0 8px 32px rgba(26,20,16,0.12);
  --font-serif: 'DM Serif Display', Georgia, serif;
  --font-sans:  'DM Sans', system-ui, sans-serif;
}

.cp { padding: 24px; max-width: 920px; margin: 0 auto; font-family: var(--font-sans); color: var(--ink); background: var(--paper); min-height: 100vh; }

/* ── header ── */
.cp-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.cp-title  { font-family: var(--font-serif); font-size: 1.9rem; color: var(--ink); letter-spacing: -0.025em; line-height: 1; }
.cp-title span { color: var(--gold); font-style: italic; }
.cp-sub    { font-size: 0.76rem; color: var(--ink3); margin-top: 5px; }

.cp-add-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-radius: var(--r2); border: none;
  background: var(--ink); color: #fff;
  font-family: var(--font-sans); font-size: 0.82rem; font-weight: 600;
  cursor: pointer; transition: background 0.18s, transform 0.18s, box-shadow 0.18s;
  box-shadow: var(--sh);
}
.cp-add-btn:hover { background: var(--ink2); transform: translateY(-1px); box-shadow: var(--sh2); }

/* ── form card ── */
.cp-form {
  background: #fff; border: 1px solid var(--bd2);
  border-radius: var(--r2); padding: 22px; margin-bottom: 20px;
  box-shadow: var(--sh2); animation: slideDown 0.22s ease;
}
@keyframes slideDown { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }

.cp-form-title { font-family: var(--font-serif); font-size: 1.15rem; color: var(--ink); margin-bottom: 18px; }
.cp-form-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cp-field      { display: flex; flex-direction: column; gap: 5px; }
.cp-field.full { grid-column: 1 / -1; }
.cp-label      { font-size: 0.67rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink3); }
.cp-input, .cp-textarea {
  padding: 10px 12px; border: 1.5px solid var(--bd2); border-radius: var(--r);
  font-family: var(--font-sans); font-size: 0.88rem; color: var(--ink);
  background: var(--paper2); outline: none; width: 100%; transition: border-color 0.15s, box-shadow 0.15s;
}
.cp-input:focus, .cp-textarea:focus { border-color: var(--gold); background: #fff; box-shadow: 0 0 0 3px rgba(193,127,58,0.1); }
.cp-textarea { resize: vertical; }
.cp-form-btns { display: flex; gap: 10px; margin-top: 16px; }
.cp-save-btn   { padding: 10px 24px; border: none; border-radius: var(--r); background: var(--ink); color: #fff; font-family: var(--font-sans); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
.cp-save-btn:hover { background: var(--gold); }
.cp-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.cp-cancel-btn { padding: 10px 18px; border: 1.5px solid var(--bd2); border-radius: var(--r); background: transparent; color: var(--ink3); font-family: var(--font-sans); font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.cp-cancel-btn:hover { border-color: var(--ink); color: var(--ink); }

/* ── search ── */
.cp-search-wrap { position: relative; margin-bottom: 18px; }
.cp-search-wrap input {
  width: 100%; padding: 11px 16px 11px 42px;
  border: 1.5px solid var(--bd2); border-radius: var(--r2);
  background: #fff; font-family: var(--font-sans); font-size: 0.88rem; color: var(--ink);
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.cp-search-wrap input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(193,127,58,0.1); }
.cp-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--ink3); font-size: 16px; pointer-events: none; line-height: 1; }

/* ── grid ── */
.cp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }

/* ── card ── */
.cp-card {
  background: #fff; border: 1px solid var(--bd);
  border-radius: var(--r2); padding: 0;
  box-shadow: var(--sh); transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  display: flex; flex-direction: column; overflow: hidden; position: relative;
}
.cp-card:hover { transform: translateY(-2px); box-shadow: var(--sh2); border-color: var(--bd2); }

/* gold accent line on hover */
.cp-card::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--gold), var(--gold2));
  opacity: 0; transition: opacity 0.2s;
}
.cp-card:hover::after { opacity: 1; }

.cp-card-body { padding: 16px 18px; flex: 1; }

/* avatar + name row — no overlapping flex children */
.cp-card-top {
  display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px;
}
.cp-avatar {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  background: var(--gold-light); border: 2px solid rgba(193,127,58,0.22);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-serif); font-size: 1.1rem; color: var(--gold);
  line-height: 1;
}
.cp-card-name-block { flex: 1; min-width: 0; }
.cp-card-name  { font-weight: 600; font-size: 0.94rem; color: var(--ink); line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-card-meta  { font-size: 0.69rem; color: var(--ink3); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* info rows */
.cp-card-fields { display: flex; flex-direction: column; gap: 7px; }
.cp-card-field  { display: flex; align-items: flex-start; gap: 9px; font-size: 0.79rem; color: var(--ink2); line-height: 1.4; }
.cp-field-icon  { font-size: 13px; width: 18px; text-align: center; flex-shrink: 0; margin-top: 1px; }
.cp-field-text  { flex: 1; min-width: 0; word-break: break-word; }
.cp-mobile-btn  {
  background: none; border: none; border-bottom: 1px dashed rgba(30,79,208,0.35);
  color: var(--blue); font-weight: 600; cursor: pointer;
  font-family: var(--font-sans); font-size: 0.79rem; padding: 0; line-height: inherit;
  transition: color 0.15s, border-bottom-color 0.15s;
}
.cp-mobile-btn:hover { color: var(--gold); border-bottom-color: rgba(193,127,58,0.5); }

/* card footer actions */
.cp-card-foot { border-top: 1px solid var(--bd); display: flex; }
.cp-act-btn {
  flex: 1; padding: 9px 0; border: none; background: transparent;
  color: var(--ink3); font-family: var(--font-sans); font-size: 0.75rem; font-weight: 600;
  cursor: pointer; transition: background 0.15s, color 0.15s; display: flex; align-items: center; justify-content: center; gap: 5px;
}
.cp-act-btn + .cp-act-btn { border-left: 1px solid var(--bd); }
.cp-act-btn:hover       { background: var(--paper2); color: var(--ink); }
.cp-act-btn.del:hover   { background: rgba(192,57,43,0.07); color: var(--red); }

/* ── empty ── */
.cp-empty { grid-column: 1/-1; text-align: center; padding: 60px 24px; background: #fff; border: 1.5px dashed var(--bd2); border-radius: var(--r2); }
.cp-empty-ico { font-size: 2.4rem; opacity: 0.45; margin-bottom: 12px; }
.cp-empty p   { font-size: 0.95rem; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
.cp-empty small { font-size: 0.79rem; color: var(--ink3); }

/* ── loading spinner ── */
.cp-spinner { grid-column:1/-1; text-align:center; padding:60px 0; color:var(--ink3); font-size:0.88rem; }

/* ── toast ── */
.cp-toast {
  position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
  z-index: 9999; padding: 10px 22px; border-radius: 100px;
  font-family: var(--font-sans); font-size: 0.82rem; font-weight: 600; white-space: nowrap;
  background: var(--ink); color: #fff; box-shadow: var(--sh2);
  animation: toastIn 0.22s ease; pointer-events: none;
}
.cp-toast.error { background: var(--red); }
@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(-8px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }

/* ══════════════════════════════════════
   VISIT DRAWER
══════════════════════════════════════ */
.vd-overlay {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(26,20,16,0.52); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: fadeIn 0.18s ease;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }

.vd-panel {
  background: #fff; border-radius: var(--r3);
  width: 100%; max-width: 500px; max-height: 88vh;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 72px rgba(26,20,16,0.22);
  animation: panelIn 0.26s cubic-bezier(0.34,1.32,0.64,1);
  overflow: hidden;
}
@keyframes panelIn { from{opacity:0;transform:scale(0.95) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }

.vd-head { padding: 20px 22px 0; flex-shrink: 0; }

.vd-head-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
.vd-info { display: flex; align-items: center; gap: 12px; min-width: 0; }
.vd-avatar { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; background: var(--gold-light); border: 2px solid rgba(193,127,58,0.28); display: flex; align-items: center; justify-content: center; font-family: var(--font-serif); font-size: 1.25rem; color: var(--gold); line-height:1; }
.vd-name  { font-weight: 600; font-size: 1rem; color: var(--ink); white-space: nowrap; overflow:hidden; text-overflow:ellipsis; }
.vd-phone { font-size: 0.77rem; color: var(--gold); font-weight: 600; margin-top: 2px; }
.vd-close { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--bd2); background: var(--paper2); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 13px; color: var(--ink3); transition: all 0.15s; flex-shrink: 0; }
.vd-close:hover { background: var(--ink); color: #fff; border-color: var(--ink); }

/* inline edit fields */
.vd-edit-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
.vd-edit-input {
  flex: 1; padding: 8px 11px; border: 1.5px solid var(--gold);
  border-radius: var(--r); font-family: var(--font-sans); font-size: 0.87rem; color: var(--ink);
  background: #fff; outline: none; min-width: 0;
}
.vd-email-input {
  flex: 1; padding: 8px 11px; border: 1.5px solid var(--bd2);
  border-radius: var(--r); font-family: var(--font-sans); font-size: 0.82rem; color: var(--ink);
  background: var(--paper2); outline: none; transition: border-color 0.15s; min-width: 0;
}
.vd-email-input:focus { border-color: var(--gold); background: #fff; }
.vd-mini-btn {
  padding: 7px 12px; border-radius: var(--r); border: 1px solid var(--bd2);
  background: var(--paper2); color: var(--ink2);
  font-family: var(--font-sans); font-size: 0.71rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
}
.vd-mini-btn:hover         { background: var(--ink); color: #fff; border-color: var(--ink); }
.vd-mini-btn.gold:hover    { background: var(--gold); color: #fff; border-color: var(--gold); }

/* stats */
.vd-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 9px; padding: 14px 22px; border-bottom: 1px solid var(--bd); }
.vd-stat  { background: var(--paper2); border-radius: var(--r); padding: 10px 12px; text-align: center; }
.vd-stat-num { font-family: var(--font-serif); font-size: 1.3rem; color: var(--ink); line-height: 1; }
.vd-stat-lbl { font-size: 0.63rem; color: var(--ink3); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 3px; }

/* year tabs */
.vd-tabs { display: flex; gap: 6px; flex-wrap: wrap; padding: 14px 22px 0; }
.vd-tab  { padding: 5px 13px; border-radius: 100px; border: 1px solid var(--bd2); background: var(--paper2); color: var(--ink3); font-size: 0.71rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.vd-tab.active { background: var(--ink); color: #fff; border-color: var(--ink); }

/* visits list */
.vd-body { flex: 1; overflow-y: auto; padding: 14px 22px 22px; }
.vd-body::-webkit-scrollbar { width: 4px; }
.vd-body::-webkit-scrollbar-thumb { background: var(--bd2); border-radius: 4px; }

.vd-section-label { font-size: 0.67rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink3); margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.vd-section-label::after { content:''; flex:1; height:1px; background:var(--bd); }

.vd-year-lbl  { font-family: var(--font-serif); font-size: 1.05rem; color: var(--gold); margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid var(--bd); }
.vd-month-lbl { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink3); padding: 6px 0 4px; position: sticky; top: 0; background: #fff; z-index: 2; }
.vd-year-group  { margin-bottom: 18px; }
.vd-month-group { margin-bottom: 4px; }

.vd-visit { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--bd); }
.vd-visit:last-child { border-bottom: none; }
.vd-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.vd-dot.paid    { background: var(--green); }
.vd-dot.partial { background: var(--gold); }
.vd-dot.pending { background: var(--red); }
.vd-visit-meta  { flex: 1; min-width: 0; }
.vd-visit-date  { font-size: 0.79rem; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
.vd-visit-items { font-size: 0.73rem; color: var(--ink3); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vd-visit-row   { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.vd-visit-amt   { font-size: 0.84rem; font-weight: 700; color: var(--ink); }
.vd-badge { font-size: 0.63rem; font-weight: 700; padding: 2px 8px; border-radius: 100px; display: inline-flex; align-items: center; gap: 3px; }
.vd-badge.paid    { background: rgba(45,122,79,0.1);   color: #166534; }
.vd-badge.partial { background: rgba(193,127,58,0.13); color: #7a4f10; }
.vd-badge.pending { background: rgba(192,57,43,0.1);   color: #9b1c1c; }
.vd-bal { font-size: 0.7rem; color: var(--red); font-weight: 600; }

.vd-empty { text-align: center; padding: 32px; color: var(--ink3); font-size: 0.84rem; }

/* ── responsive ── */
@media (max-width: 580px) {
  .cp { padding: 14px; }
  .cp-title { font-size: 1.5rem; }
  .cp-form-grid { grid-template-columns: 1fr; }
  .cp-grid { grid-template-columns: 1fr; }
  .vd-overlay { padding: 0; align-items: flex-end; }
  .vd-panel { border-radius: var(--r2) var(--r2) 0 0; max-height: 94vh; }
}
`;

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_M  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt      = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const statusKey  = (s) => ({ paid:'paid', partial:'partial' }[(s||'').toLowerCase()] ?? 'pending');
const statusIcon = (s) => ({ paid:'●', partial:'◑' }[(s||'').toLowerCase()] ?? '○');
const BLANK = { name:'', mobile:'', email:'', address:'', gst_number:'' };

/* ════════════════════════════════════════
   VISIT ITEM
════════════════════════════════════════ */
const VisitItem = ({ inv }) => {
  const d  = new Date(inv.date);
  const sk = statusKey(inv.status);
  return (
    <div className="vd-visit">
      <div className={`vd-dot ${sk}`} />
      <div className="vd-visit-meta">
        <div className="vd-visit-date">{d.getDate()} {SHORT_M[d.getMonth()]} — {inv.invoice_id || inv.inv || '—'}</div>
        {inv.items?.length > 0 && (
          <div className="vd-visit-items">
            {inv.items.map(it => it.name).join(', ')}
          </div>
        )}
        <div className="vd-visit-row">
          <span className="vd-visit-amt">{fmt(inv.total)}</span>
          <span className={`vd-badge ${sk}`}>{statusIcon(inv.status)} {inv.status || 'Pending'}</span>
          {Number(inv.balance || 0) > 0 && (
            <span className="vd-bal">Bal: {fmt(inv.balance)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   VISIT DRAWER — fetches real invoices for the mobile number
════════════════════════════════════════ */
const VisitDrawer = ({ customer, onClose, onSaveName, onSaveEmail }) => {
  const [nameVal,  setNameVal]  = useState(customer.name);
  const [emailVal, setEmailVal] = useState(customer.email || '');
  const [yearTab,  setYearTab]  = useState('All');
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  /* fetch this customer's invoices from the real API */
  useEffect(() => {
    const load = async () => {
      try {
        const data = await authAxios
          .get('business/invoices/', { params: { search: customer.mobile } })
          .then(r => r.data);
        /* each invoice may have items array or invoice_items */
        const normalised = (data || []).map(inv => ({
          ...inv,
          items: inv.items || inv.invoice_items || [],
        }));
        setInvoices(normalised.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customer.mobile]);

  const totalSpent = invoices.reduce((s, i) => s + Number(i.total  || 0), 0);
  const totalPaid  = invoices.reduce((s, i) => s + Number(i.advance || 0), 0);
  const years = [...new Set(invoices.map(i => i.date?.split('-')[0]).filter(Boolean))].sort((a,b) => b-a);
  const filtered = yearTab === 'All' ? invoices : invoices.filter(i => i.date?.startsWith(yearTab));

  const renderVisits = () => {
    if (loading)         return <div className="vd-empty">Loading visits…</div>;
    if (!filtered.length) return <div className="vd-empty">No visits found for this period.</div>;

    if (yearTab !== 'All') {
      const byMonth = {};
      filtered.forEach(inv => {
        const mk = new Date(inv.date).getMonth();
        (byMonth[mk] = byMonth[mk] || []).push(inv);
      });
      return Object.keys(byMonth).sort((a,b)=>b-a).map(mk => (
        <div key={mk} className="vd-month-group">
          <div className="vd-month-lbl">{MONTHS[mk]}</div>
          {byMonth[mk].map(inv => <VisitItem key={inv.id} inv={inv} />)}
        </div>
      ));
    } else {
      const byYear = {};
      filtered.forEach(inv => {
        const yr = inv.date?.split('-')[0];
        (byYear[yr] = byYear[yr] || []).push(inv);
      });
      return Object.keys(byYear).sort((a,b)=>b-a).map(yr => (
        <div key={yr} className="vd-year-group">
          <div className="vd-year-lbl">{yr}</div>
          {byYear[yr].map(inv => <VisitItem key={inv.id} inv={inv} />)}
        </div>
      ));
    }
  };

  return (
    <div className="vd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vd-panel">

        {/* ── head ── */}
        <div className="vd-head">
          <div className="vd-head-row">
            <div className="vd-info">
              <div className="vd-avatar">{customer.name.charAt(0).toUpperCase()}</div>
              <div style={{ minWidth:0 }}>
                <div className="vd-name">{customer.name}</div>
                <div className="vd-phone">{customer.mobile}</div>
              </div>
            </div>
            <button className="vd-close" onClick={onClose}>✕</button>
          </div>

          {/* editable name */}
          <div className="vd-edit-row">
            <input
              className="vd-edit-input"
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              placeholder="Customer name"
            />
            <button className="vd-mini-btn gold" onClick={() => onSaveName(customer.id, nameVal)}>
              Save name
            </button>
          </div>

          {/* editable email */}
          <div className="vd-edit-row" style={{ marginBottom: 14 }}>
            <input
              className="vd-email-input"
              type="email"
              value={emailVal}
              onChange={e => setEmailVal(e.target.value)}
              placeholder="Add or update email…"
            />
            <button className="vd-mini-btn" onClick={() => onSaveEmail(customer.id, emailVal)}>
              + Email
            </button>
          </div>
        </div>

        {/* ── stats ── */}
        <div className="vd-stats">
          <div className="vd-stat">
            <div className="vd-stat-num">{loading ? '…' : invoices.length}</div>
            <div className="vd-stat-lbl">Visits</div>
          </div>
          <div className="vd-stat">
            <div className="vd-stat-num" style={{ fontSize:'0.95rem' }}>{loading ? '…' : fmt(totalSpent)}</div>
            <div className="vd-stat-lbl">Total</div>
          </div>
          <div className="vd-stat">
            <div className="vd-stat-num" style={{ fontSize:'0.95rem' }}>{loading ? '…' : fmt(totalPaid)}</div>
            <div className="vd-stat-lbl">Paid</div>
          </div>
        </div>

        {/* ── year tabs ── */}
        {!loading && years.length > 0 && (
          <div className="vd-tabs">
            {['All', ...years].map(y => (
              <button key={y} className={`vd-tab${yearTab === y ? ' active' : ''}`} onClick={() => setYearTab(y)}>{y}</button>
            ))}
          </div>
        )}

        {/* ── visit list ── */}
        <div className="vd-body">
          <div className="vd-section-label">Visit history</div>
          {renderVisits()}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   CUSTOMER CARD
════════════════════════════════════════ */
const CustomerCard = ({ c, onEdit, onDelete, onPhoneClick }) => (
  <div className="cp-card">
    <div className="cp-card-body">
      {/* avatar + name — clean isolated flex */}
      <div className="cp-card-top">
        <div className="cp-avatar">{c.name.charAt(0).toUpperCase()}</div>
        <div className="cp-card-name-block">
          <div className="cp-card-name">{c.name}</div>
          <div className="cp-card-meta">
            {c.gst_number ? `GST · ${c.gst_number}` : 'No GST registered'}
          </div>
        </div>
      </div>

      {/* detail rows */}
      <div className="cp-card-fields">
        <div className="cp-card-field">
          <span className="cp-field-icon">📱</span>
          <span className="cp-field-text">
            <button className="cp-mobile-btn" onClick={() => onPhoneClick(c)}>
              {c.mobile}
            </button>
          </span>
        </div>
        {c.email && (
          <div className="cp-card-field">
            <span className="cp-field-icon">✉</span>
            <span className="cp-field-text" style={{ color:'var(--ink3)', fontSize:'0.77rem' }}>{c.email}</span>
          </div>
        )}
        {c.address && (
          <div className="cp-card-field">
            <span className="cp-field-icon">📍</span>
            <span className="cp-field-text" style={{ color:'var(--ink3)', fontSize:'0.76rem' }}>{c.address}</span>
          </div>
        )}
      </div>
    </div>

    <div className="cp-card-foot">
      <button className="cp-act-btn" onClick={() => onEdit(c)}>✏ Edit</button>
      <button className="cp-act-btn del" onClick={() => onDelete(c.id)}>✕ Delete</button>
    </div>
  </div>
);

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
const Customers = () => {
  const [customers,  setCustomers]  = useState([]);
  const [form,       setForm]       = useState(BLANK);
  const [editId,     setEditId]     = useState(null);
  const [search,     setSearch]     = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [drawerCust, setDrawerCust] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [syncing,    setSyncing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── load from real API ── */
  const loadCustomers = useCallback(async (q = '') => {
    try {
      const data = await getCustomers(q);
      setCustomers(data || []);
    } catch {
      showToast('Failed to load customers.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setSyncing(true);
      await syncCustomersFromInvoices();
      setSyncing(false);
      await loadCustomers();
    };
    init();
  }, [loadCustomers]);

  /* debounced search */
  useEffect(() => {
    const t = setTimeout(() => loadCustomers(search), 300);
    return () => clearTimeout(t);
  }, [search, loadCustomers]);

  /* ── form ── */
  const openAdd = () => { setEditId(null); setForm(BLANK); setShowForm(true); };
  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(BLANK); };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.mobile.trim()) { showToast('Name and mobile are required.', 'error'); return; }
    setSaving(true);
    try {
      if (editId !== null) {
        const updated = await updateCustomer(editId, form);
        setCustomers(prev => prev.map(c => c.id === editId ? updated : c));
        showToast('Customer updated ✓');
        setEditId(null);
      } else {
        const created = await createCustomer(form);
        setCustomers(prev => [created, ...prev]);
        showToast('Customer saved ✓');
      }
      setForm(BLANK);
      setShowForm(false);
    } catch {
      showToast('Failed to save customer.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, mobile: c.mobile || '', email: c.email || '', address: c.address || '', gst_number: c.gst_number || '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      showToast('Customer deleted.');
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  /* ── drawer: inline name / email save ── */
  const handleSaveName = async (id, name) => {
    if (!name.trim()) { showToast('Name cannot be empty.', 'error'); return; }
    try {
      const updated = await updateCustomer(id, { name });
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, name } : c));
      setDrawerCust(prev => prev ? { ...prev, name } : prev);
      showToast('Name updated ✓');
    } catch {
      showToast('Failed to update name.', 'error');
    }
  };

  const handleSaveEmail = async (id, email) => {
    try {
      await updateCustomer(id, { email });
      setCustomers(prev => prev.map(c => c.id === id ? { ...c, email } : c));
      setDrawerCust(prev => prev ? { ...prev, email } : prev);
      showToast(email ? 'Email saved ✓' : 'Email removed.');
    } catch {
      showToast('Failed to save email.', 'error');
    }
  };

  /* ── render ── */
  return (
    <>
      <style>{STYLES}</style>

      <div className="cp">

        {toast && <div className={`cp-toast${toast.type === 'error' ? ' error' : ''}`}>{toast.msg}</div>}

        {/* header */}
        <div className="cp-header">
          <div>
            <div className="cp-title">Custo<span>mers</span></div>
            <div className="cp-sub">
              {syncing ? '⟳ Syncing from invoices…' : `${customers.length} customer${customers.length !== 1 ? 's' : ''} saved`}
            </div>
          </div>
          {!showForm && (
            <button className="cp-add-btn" onClick={openAdd}>
              <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add Customer
            </button>
          )}
        </div>

        {/* form */}
        {showForm && (
          <div className="cp-form">
            <div className="cp-form-title">{editId ? 'Edit Customer' : 'New Customer'}</div>
            <div className="cp-form-grid">
              <div className="cp-field">
                <label className="cp-label">Full Name *</label>
                <input className="cp-input" name="name"   value={form.name}   onChange={handleChange} placeholder="Customer name" />
              </div>
              <div className="cp-field">
                <label className="cp-label">Mobile Number *</label>
                <input className="cp-input" name="mobile" value={form.mobile} onChange={handleChange} placeholder="10-digit mobile" maxLength={10} />
              </div>
              <div className="cp-field">
                <label className="cp-label">Email</label>
                <input className="cp-input" name="email"  type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
              </div>
              <div className="cp-field">
                <label className="cp-label">GST Number</label>
                <input className="cp-input" name="gst_number" value={form.gst_number} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div className="cp-field full">
                <label className="cp-label">Address</label>
                <textarea className="cp-textarea" name="address" value={form.address} onChange={handleChange} rows={2} placeholder="Full address" />
              </div>
            </div>
            <div className="cp-form-btns">
              <button className="cp-save-btn" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : editId ? 'Update Customer' : 'Save Customer'}
              </button>
              <button className="cp-cancel-btn" onClick={cancelForm}>Cancel</button>
            </div>
          </div>
        )}

        {/* search */}
        <div className="cp-search-wrap">
          <span className="cp-search-icon">⌕</span>
          <input
            placeholder="Search by name or mobile…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* grid */}
        <div className="cp-grid">
          {loading ? (
            <div className="cp-spinner">
              {syncing ? 'Syncing customers from invoices…' : 'Loading customers…'}
            </div>
          ) : customers.length === 0 ? (
            <div className="cp-empty">
              <div className="cp-empty-ico">◎</div>
              <p>{search ? 'No customers match your search.' : 'No customers yet.'}</p>
              <small>{search ? 'Try a different search term.' : 'Click Add Customer to get started.'}</small>
            </div>
          ) : (
            customers.map(c => (
              <CustomerCard
                key={c.id}
                c={c}
                onEdit={startEdit}
                onDelete={handleDelete}
                onPhoneClick={setDrawerCust}
              />
            ))
          )}
        </div>

      </div>

      {/* visit drawer */}
      {drawerCust && (
        <VisitDrawer
          customer={drawerCust}
          onClose={() => setDrawerCust(null)}
          onSaveName={handleSaveName}
          onSaveEmail={handleSaveEmail}
        />
      )}
    </>
  );
};

export default Customers;
