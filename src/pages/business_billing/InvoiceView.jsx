import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

/* ═══════════════════════════════════════════════
   PUBLIC FETCH HELPER (no auth — same pattern as CustomerView.jsx)
═══════════════════════════════════════════════ */
const publicFetch = async (url) => {
  const base = (typeof window !== "undefined" && window.__API_BASE__)
    || process.env.REACT_APP_API_BASE
    || "/api";
  const fullUrl = url.startsWith("http") ? url : `${base}/${url.replace(/^\//, "")}`;
  const res = await fetch(fullUrl);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.detail || `HTTP ${res.status}`), { status: res.status, data: err });
  }
  return res.json();
};

/* ═══════════════════════════════════════════════
   HELPERS — copied verbatim from InvoiceHistory.jsx
═══════════════════════════════════════════════ */
const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const badgeCls  = (s) => ({ paid:"paid", partial:"partial" }[(s||"Pending").toLowerCase()] || "pending");
const badgeIcon = (s) => ({ paid:"✓", partial:"⚡" }[(s||"Pending").toLowerCase()] || "⏳");

/* ═══════════════════════════════════════════════
   STYLES — only the pieces needed for the PDF doc + page chrome
   (pdf-* classes copied verbatim from InvoiceHistory.jsx STYLES)
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

  * { box-sizing:border-box; }

  .piv-page { min-height:100vh; background:var(--bg); font-family:var(--font-b); padding:1.25rem; }

  .piv-topbar {
    max-width:760px; margin:0 auto 14px; display:flex; align-items:center;
    justify-content:space-between; gap:10px; flex-wrap:wrap;
  }
  .piv-brand { display:flex; align-items:center; gap:8px; }
  .piv-brand-text { font-family:var(--font-d); font-size:1.3rem; font-weight:900; color:var(--navy); }
  .piv-brand-text span { color:var(--gold); }
  .piv-actions { display:flex; gap:8px; flex-wrap:wrap; }

  .pdf-action-btn {
    padding:8px 16px; border-radius:var(--r-md); border:none;
    font-family:var(--font-b); font-size:0.82rem; font-weight:700;
    cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:6px;
  }
  .pdf-action-btn.print { background:var(--navy); color:#fff; }
  .pdf-action-btn.print:hover { background:var(--navy2); transform:translateY(-1px); }
  .pdf-action-btn.wa-btn { background:#25D366; color:#fff; }
  .pdf-action-btn.wa-btn:hover { filter:brightness(1.08); transform:translateY(-1px); }
  .pdf-action-btn.dl { background:#2563eb; color:#fff; }
  .pdf-action-btn.dl:hover { filter:brightness(1.08); transform:translateY(-1px); }

  .piv-doc-wrap { max-width:760px; margin:0 auto; }

  /* PDF DOCUMENT — copied verbatim from InvoiceHistory.jsx */
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

  .piv-state { max-width:520px; margin:80px auto; text-align:center; background:#fff;
    border:1.5px dashed var(--border2); border-radius:var(--r-xl); padding:48px 24px; }
  .piv-state-icon { font-size:3rem; margin-bottom:1rem; }
  .piv-state h3 { font-family:var(--font-d); color:var(--navy); margin-bottom:6px; }
  .piv-state p { color:var(--muted); font-size:0.88rem; }

  @media (max-width:640px) {
    .piv-page { padding:0.65rem; }
    .pdf-doc { padding:20px 14px; }
    .pdf-header { flex-direction:column; gap:8px; }
    .pdf-inv-meta { text-align:left; }
    .pdf-info-row { grid-template-columns:1fr; gap:8px; }
    .pdf-totals { width:100%; }
    .pdf-footer { flex-direction:column; gap:8px; align-items:flex-start; }
    .piv-actions { width:100%; }
    .pdf-action-btn { flex:1; justify-content:center; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("__piv_styles")) {
  const el = document.createElement("style");
  el.id = "__piv_styles";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

/* ═══════════════════════════════════════════════
   PDF DOCUMENT — copied verbatim (same logic & conditions)
   from InvoiceHistory.jsx, no changes
═══════════════════════════════════════════════ */
const PdfDocument = React.forwardRef(({ invoice, shop }, ref) => {
  const items    = invoice?.items  || [];
  const status   = invoice?.status || "Pending";
  const balance  = Number(invoice?.balance  || 0);
  const advance  = Number(invoice?.advance  || 0);
  const total    = Number(invoice?.total    || 0);
  const discount = Number(invoice?.discount || 0);
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
          {invoice?.is_gst && (() => {
            const gstGroups = {};
            (invoice.items || []).forEach(item => {
              const rate = Number(item.gst_rate || 0);
              if (rate === 0) return;
              if (!gstGroups[rate]) gstGroups[rate] = 0;
              gstGroups[rate] += Number(item.qty) * Number(item.price);
            });
            return Object.entries(gstGroups)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([rate, taxable]) => {
                const rateNum  = Number(rate);
                const gstTotal = Math.round(taxable * rateNum / 100);
                const half     = Math.round(gstTotal / 2);
                return (
                  <React.Fragment key={rate}>
                    <div className="pdf-total-row" style={{color:"#6b7280",fontSize:"0.75rem"}}>
                      <span>Taxable ({rateNum}%)</span>
                      <span>{fmt(taxable)}</span>
                    </div>
                    <div className="pdf-total-row">
                      <span>CGST ({rateNum / 2}%)</span>
                      <span>{fmt(half)}</span>
                    </div>
                    <div className="pdf-total-row">
                      <span>SGST ({rateNum / 2}%)</span>
                      <span>{fmt(half)}</span>
                    </div>
                  </React.Fragment>
                );
              });
          })()}

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
   PRINT / DOWNLOAD CSS — same as PdfPreviewModal in InvoiceHistory.jsx
═══════════════════════════════════════════════ */
const PRINT_CSS = `*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;color:#000;background:#fff;}@page{size:A4;margin:18mm 16mm;}.pdf-doc{padding:32px;position:relative;overflow:hidden;}.pdf-watermark{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;overflow:hidden;}.pdf-wm-text{font-family:'Playfair Display',Georgia,serif;font-size:5.5rem;font-weight:900;color:rgba(201,150,58,0.06);transform:rotate(-30deg);white-space:nowrap;user-select:none;}.pdf-content{position:relative;z-index:1;}.pdf-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;margin-bottom:18px;border-bottom:2.5px solid #0e1b2e;}.pdf-brand-name{font-size:1.6rem;font-weight:900;font-family:'Playfair Display',Georgia,serif;color:#0e1b2e;}.pdf-brand-name span{color:#c9963a;}.pdf-brand-tag{font-size:0.65rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;}.pdf-inv-meta{text-align:right;}.pdf-inv-title{font-family:'Playfair Display',Georgia,serif;font-size:1.15rem;font-weight:800;color:#0e1b2e;}.pdf-gst-tag{display:inline-block;background:rgba(30,79,186,0.1);color:#1e4fba;font-size:0.6rem;font-weight:800;text-transform:uppercase;padding:2px 8px;border-radius:100px;border:1px solid rgba(30,79,186,0.2);margin-bottom:4px;}.pdf-inv-num{font-weight:800;color:#c9963a;font-size:0.9rem;}.pdf-inv-date{font-size:0.78rem;color:#6b7280;}.pdf-shop-block{margin-bottom:16px;}.pdf-shop-name{font-weight:800;color:#0e1b2e;font-size:0.88rem;}.pdf-shop-det{font-size:0.75rem;color:#6b7280;margin-top:1px;}.pdf-info-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8faf9;border-radius:8px;padding:14px 16px;margin-bottom:18px;border:1px solid #e5e7eb;}.pdf-info-lbl{font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;margin-bottom:3px;}.pdf-info-val{font-weight:700;color:#111827;font-size:0.82rem;}.pdf-table{width:100%;border-collapse:collapse;margin-bottom:18px;}.pdf-table th{background:#0e1b2e;color:#fff;padding:9px 11px;text-align:left;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;}.pdf-table th:last-child{text-align:right;}.pdf-table td{padding:9px 11px;border-bottom:1px solid #f1f5f9;font-size:0.8rem;}.pdf-table td:last-child{text-align:right;font-weight:700;}.pdf-table tbody tr:nth-child(even) td{background:#fafafa;}.pdf-totals{margin-left:auto;width:48%;margin-bottom:18px;}.pdf-total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:0.8rem;border-bottom:1px solid #f1f5f9;}.pdf-total-row.grand{font-weight:900;font-size:0.95rem;color:#0e1b2e;padding-top:10px;border-top:2.5px solid #0e1b2e;border-bottom:none;}.pdf-total-row.balance-row{color:#dc2626;font-weight:800;}.pdf-total-row.paid-row{color:#15803d;font-weight:800;}.pdf-pay-block{display:flex;gap:12px;align-items:center;margin-bottom:18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;}.pdf-pay-block.unpaid{background:#fff7ed;border-color:#fed7aa;}.pdf-status-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:100px;font-size:0.72rem;font-weight:800;background:#dcfce7;color:#166534;border:1px solid rgba(21,128,61,0.3);}.pdf-status-badge.partial{background:#fef3c7;color:#92400e;}.pdf-status-badge.pending{background:#fee2e2;color:#991b1b;}.pdf-footer{border-top:1.5px solid #e5e7eb;padding-top:14px;display:flex;justify-content:space-between;align-items:flex-end;}.pdf-footer-brand{font-size:0.65rem;color:#9ca3af;}.pdf-footer-brand strong{font-family:'Playfair Display',Georgia,serif;color:#0e1b2e;font-size:0.85rem;}.pdf-footer-brand strong span{color:#c9963a;}.pdf-powered{font-size:0.6rem;color:#9ca3af;text-transform:uppercase;text-align:right;}.pdf-powered strong{color:#c9963a;}`;

const FONT_LINK = `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>`;

/* ═══════════════════════════════════════════════
   MAIN — PUBLIC INVOICE VIEW
   Route: /invoice/:invoiceId
═══════════════════════════════════════════════ */
const PublicInvoiceView = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [shop,    setShop]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true); setError(null);
    publicGet(`business/invoices/public/${invoiceId}/`)
      .then((data) => {
        setInvoice(data.invoice || data);
        setShop(data.shop || null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.status === 404
          ? "Invoice not found. Please check the link and try again."
          : "Could not load invoice. Please check your connection and try again.");
        setLoading(false);
      });
  }, [invoiceId]);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open("", "_blank", "width=800,height=700");
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Invoice ${invoice?.invoice_id}</title>
      ${FONT_LINK}
      <style>${PRINT_CSS}body{padding:0;}</style>
    </head><body>${content}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  };

  const handleDownload = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Invoice ${invoice?.invoice_id}</title>
      ${FONT_LINK}
      <style>${PRINT_CSS}</style>
    </head><body>${content}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `Invoice-${invoice?.invoice_id || "download"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWa = () => {
    const mob = invoice?.customer_mobile?.replace(/\D/g, "") || "";
    const msg = `🧾 Invoice ${invoice?.invoice_id} — ${fmt(invoice?.total)}\n\n${window.location.href}`;
    const url = mob
      ? `https://wa.me/91${mob.slice(-10)}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="piv-page">
        <div className="piv-state">
          <div className="piv-state-icon">⏳</div>
          <h3>Loading invoice…</h3>
          <p>Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="piv-page">
        <div className="piv-state">
          <div className="piv-state-icon">⚠️</div>
          <h3>Could not load invoice</h3>
          <p>{error || "This invoice link is invalid."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="piv-page">
      <div className="piv-topbar">
        <div className="piv-brand">
          <span className="piv-brand-text">Mana<span>Bills</span></span>
        </div>
        <div className="piv-actions">
          <button className="pdf-action-btn wa-btn" onClick={handleWa}>💬 WhatsApp</button>
          <button className="pdf-action-btn print" onClick={handlePrint}>🖨️ Print / PDF</button>
          <button className="pdf-action-btn dl" onClick={handleDownload}>⬇️ Download</button>
        </div>
      </div>

      <div className="piv-doc-wrap">
        <div ref={printRef}>
          <PdfDocument invoice={invoice} shop={shop} />
        </div>
      </div>
    </div>
  );
};

/* local publicGet (kept inline so this file is self-contained) */
const publicGet = (url) => publicFetch(url);

export default InvoiceView;
