import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const fetchPublicInvoice = async (invoiceId) => {
  const BASE = (process.env.REACT_APP_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
  const res  = await fetch(`${BASE}/business/invoices/public/${invoiceId}/`);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
};

const fmt       = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const badgeCls  = (s) => ({ paid:"paid", partial:"partial" }[(s||"").toLowerCase()] || "pending");
const badgeIcon = (s) => ({ paid:"✓", partial:"⚡" }[(s||"").toLowerCase()] || "⏳");

const PdfDocument = React.forwardRef(({ invoice }, ref) => {
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



        {invoice?.shop_name && (
          <div className="pdf-shop-block">
            <div className="pdf-shop-name">{invoice.shop_name}</div>
            {invoice.shop_owner   && <div className="pdf-shop-det">👤 {invoice.shop_owner}</div>}
            {invoice.shop_mobile  && <div className="pdf-shop-det">📞 {invoice.shop_mobile}</div>}
            {invoice.shop_address && <div className="pdf-shop-det">📍 {invoice.shop_address}</div>}
            {invoice.shop_gst     && <div className="pdf-shop-det">GSTIN: <strong>{invoice.shop_gst}</strong></div>}
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
              .sort(([a],[b]) => Number(a)-Number(b))
              .map(([rate, taxable]) => {
                const rateNum  = Number(rate);
                const gstTotal = Math.round(taxable * rateNum / 100);
                const half     = Math.round(gstTotal / 2);
                return (
                  <React.Fragment key={rate}>
                    <div className="pdf-total-row" style={{color:"#6b7280",fontSize:"0.75rem"}}>
                      <span>Taxable ({rateNum}%)</span><span>{fmt(taxable)}</span>
                    </div>
                    <div className="pdf-total-row">
                      <span>CGST ({rateNum/2}%)</span><span>{fmt(half)}</span>
                    </div>
                    <div className="pdf-total-row">
                      <span>SGST ({rateNum/2}%)</span><span>{fmt(half)}</span>
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
            <div><strong>Mana<span style={{color:"#c9963a"}}>Bills</span></strong></div>
            <div>manabills.in | support@manabills.in</div>
            <div style={{marginTop:"4px",fontSize:"0.62rem",color:"#d1d5db"}}>Thank you for your business 🙏</div>
          </div>
          <div className="pdf-powered">
            Generated by<br /><strong style={{color:"#c9963a"}}>ManaBills Platform</strong>
            <br />AP & Telangana's #1 Billing App
          </div>
        </div>

      </div>
    </div>
  );
});

const InvoiceView = () => {
  const { invoiceId }         = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const printRef              = useRef(null);

  useEffect(() => {
    fetchPublicInvoice(invoiceId)
      .then((data) => {
        setInvoice({ ...data, items: data.items || data.invoice_items || [] });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message === "404"
          ? "Invoice not found. Please check the link."
          : "Could not load invoice. Please try again.");
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
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;color:#000;background:#fff;}@page{size:A4;margin:18mm 16mm;}.pdf-doc{padding:32px;position:relative;overflow:hidden;}.pdf-watermark{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;overflow:hidden;}.pdf-wm-text{font-family:'Playfair Display',Georgia,serif;font-size:5.5rem;font-weight:900;color:rgba(201,150,58,0.06);transform:rotate(-30deg);white-space:nowrap;user-select:none;}.pdf-content{position:relative;z-index:1;}.pdf-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;margin-bottom:18px;border-bottom:2.5px solid #0e1b2e;}.pdf-brand-name{font-size:1.6rem;font-weight:900;font-family:'Playfair Display',Georgia,serif;color:#0e1b2e;}.pdf-brand-name span{color:#c9963a;}.pdf-brand-tag{font-size:0.65rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;}.pdf-inv-meta{text-align:right;}.pdf-inv-title{font-family:'Playfair Display',Georgia,serif;font-size:1.15rem;font-weight:800;color:#0e1b2e;}.pdf-gst-tag{display:inline-block;background:rgba(30,79,186,0.1);color:#1e4fba;font-size:0.6rem;font-weight:800;text-transform:uppercase;padding:2px 8px;border-radius:100px;border:1px solid rgba(30,79,186,0.2);margin-bottom:4px;}.pdf-inv-num{font-weight:800;color:#c9963a;font-size:0.9rem;}.pdf-inv-date{font-size:0.78rem;color:#6b7280;}.pdf-shop-block{margin-bottom:16px;}.pdf-shop-name{font-weight:800;color:#0e1b2e;font-size:0.88rem;}.pdf-shop-det{font-size:0.75rem;color:#6b7280;margin-top:1px;}.pdf-info-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8faf9;border-radius:8px;padding:14px 16px;margin-bottom:18px;border:1px solid #e5e7eb;}.pdf-info-lbl{font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;margin-bottom:3px;}.pdf-info-val{font-weight:700;color:#111827;font-size:0.82rem;}.pdf-table{width:100%;border-collapse:collapse;margin-bottom:18px;}.pdf-table th{background:#0e1b2e;color:#fff;padding:9px 11px;text-align:left;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;}.pdf-table th:last-child{text-align:right;}.pdf-table td{padding:9px 11px;border-bottom:1px solid #f1f5f9;font-size:0.8rem;}.pdf-table td:last-child{text-align:right;font-weight:700;}.pdf-table tbody tr:nth-child(even) td{background:#fafafa;}.pdf-totals{margin-left:auto;width:48%;margin-bottom:18px;}.pdf-total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:0.8rem;border-bottom:1px solid #f1f5f9;}.pdf-total-row.grand{font-weight:900;font-size:0.95rem;color:#0e1b2e;padding-top:10px;border-top:2.5px solid #0e1b2e;border-bottom:none;}.pdf-total-row.balance-row{color:#dc2626;font-weight:800;}.pdf-total-row.paid-row{color:#15803d;font-weight:800;}.pdf-pay-block{display:flex;gap:12px;align-items:center;margin-bottom:18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;}.pdf-pay-block.unpaid{background:#fff7ed;border-color:#fed7aa;}.pdf-status-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:100px;font-size:0.72rem;font-weight:800;background:#dcfce7;color:#166534;border:1px solid rgba(21,128,61,0.3);}.pdf-status-badge.partial{background:#fef3c7;color:#92400e;}.pdf-status-badge.pending{background:#fee2e2;color:#991b1b;}.pdf-footer{border-top:1.5px solid #e5e7eb;padding-top:14px;display:flex;justify-content:space-between;align-items:flex-end;}.pdf-footer-brand{font-size:0.65rem;color:#9ca3af;}.pdf-powered{font-size:0.6rem;color:#9ca3af;text-transform:uppercase;text-align:right;}.pdf-powered strong{color:#c9963a;}</style>
    </head><body>${content}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  };

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      <div style={{width:"36px",height:"36px",border:"3px solid #e2e8f0",borderTop:"3px solid #2563eb",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{color:"#64748b",marginTop:"16px"}}>Loading your invoice…</p>
    </div>
  );

  if (error) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",padding:"24px",textAlign:"center"}}>
      <div style={{fontSize:"3rem"}}>😕</div>
      <p style={{color:"#dc2626",fontWeight:600,marginTop:"12px"}}>{error}</p>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div style={{minHeight:"100vh",background:"#f0f2f7",paddingBottom:"40px"}}>
        <div style={{background:"#0e1b2e",padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,zIndex:100}} className="no-print">
          <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"1.2rem",fontWeight:900,color:"#fff"}}>
            Mana<span style={{color:"#c9963a"}}>Bills</span>
          </div>
          <button onClick={handlePrint} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:"8px",padding:"9px 18px",fontSize:"0.82rem",fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>
            🖨️ Download / Print PDF
          </button>
        </div>
        <div style={{maxWidth:"700px",margin:"28px auto 0",padding:"0 14px"}}>
          <div ref={printRef}>
            <PdfDocument invoice={invoice} />
          </div>
        </div>
        <div style={{maxWidth:"700px",margin:"16px auto 0",padding:"0 14px",display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}} className="no-print">
          <span style={{fontSize:"0.78rem",color:"#64748b"}}>📤 Share:</span>
          <button
            onClick={() => {
              const mob = invoice?.customer_mobile?.replace(/\D/g,"") || "";
              if (!mob) { alert("No mobile number on this invoice."); return; }
              const msg = [`Invoice ${invoice.invoice_id}`,`Date: ${invoice.date}`,``,`View your invoice:`,window.location.href].join("\n");
              window.open(`https://wa.me/91${mob.slice(-10)}?text=${encodeURIComponent(msg)}`,"_blank");
            }}
            style={{display:"flex",alignItems:"center",gap:"6px",background:"#25d366",color:"#fff",border:"none",borderRadius:"8px",padding:"9px 18px",fontSize:"0.82rem",fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}
          >
            💬 Share on WhatsApp
          </button>
        </div>
      </div>
    </>
  );
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media print { .no-print { display: none !important; } body { background: #fff !important; } }
  .pdf-doc{background:#fff;color:#000;padding:40px;border-radius:8px;border:1px solid #e5e7eb;position:relative;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;line-height:1.6;}
  .pdf-watermark{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0;overflow:hidden;}
  .pdf-wm-text{font-family:'Playfair Display',Georgia,serif;font-size:5.5rem;font-weight:900;color:rgba(201,150,58,0.06);transform:rotate(-30deg);white-space:nowrap;user-select:none;}
  .pdf-content{position:relative;z-index:1;}
  .pdf-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;margin-bottom:18px;border-bottom:2.5px solid #0e1b2e;}
  .pdf-brand-name{font-size:1.6rem;font-weight:900;font-family:'Playfair Display',Georgia,serif;color:#0e1b2e;}
  .pdf-brand-name span{color:#c9963a;}
  .pdf-brand-tag{font-size:0.65rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-top:1px;}
  .pdf-inv-meta{text-align:right;}
  .pdf-inv-title{font-family:'Playfair Display',Georgia,serif;font-size:1.15rem;font-weight:800;color:#0e1b2e;}
  .pdf-gst-tag{display:inline-block;background:rgba(30,79,186,0.1);color:#1e4fba;font-size:0.6rem;font-weight:800;text-transform:uppercase;padding:2px 8px;border-radius:100px;border:1px solid rgba(30,79,186,0.2);margin-bottom:4px;}
  .pdf-inv-num{font-weight:800;color:#c9963a;font-size:0.9rem;}
  .pdf-inv-date{font-size:0.78rem;color:#6b7280;}
  .pdf-shop-block{margin-bottom:16px;}
  .pdf-shop-name{font-weight:800;color:#0e1b2e;font-size:0.88rem;}
  .pdf-shop-det{font-size:0.75rem;color:#6b7280;margin-top:1px;}
  .pdf-info-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f8faf9;border-radius:8px;padding:14px 16px;margin-bottom:18px;border:1px solid #e5e7eb;}
  .pdf-info-lbl{font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;margin-bottom:3px;}
  .pdf-info-val{font-weight:700;color:#111827;font-size:0.82rem;}
  .pdf-table{width:100%;border-collapse:collapse;margin-bottom:18px;}
  .pdf-table th{background:#0e1b2e;color:#fff;padding:9px 11px;text-align:left;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;}
  .pdf-table th:last-child{text-align:right;}
  .pdf-table td{padding:9px 11px;border-bottom:1px solid #f1f5f9;font-size:0.8rem;}
  .pdf-table td:last-child{text-align:right;font-weight:700;}
  .pdf-table tbody tr:nth-child(even) td{background:#fafafa;}
  .pdf-totals{margin-left:auto;width:48%;margin-bottom:18px;}
  .pdf-total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:0.8rem;border-bottom:1px solid #f1f5f9;}
  .pdf-total-row.grand{font-weight:900;font-size:0.95rem;color:#0e1b2e;padding-top:10px;border-top:2.5px solid #0e1b2e;border-bottom:none;}
  .pdf-total-row.balance-row{color:#dc2626;font-weight:800;}
  .pdf-total-row.paid-row{color:#15803d;font-weight:800;}
  .pdf-pay-block{display:flex;gap:12px;align-items:center;margin-bottom:18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;}
  .pdf-pay-block.unpaid{background:#fff7ed;border-color:#fed7aa;}
  .pdf-status-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:100px;font-size:0.72rem;font-weight:800;background:#dcfce7;color:#166534;border:1px solid rgba(21,128,61,0.3);}
  .pdf-status-badge.partial{background:#fef3c7;color:#92400e;border-color:rgba(217,119,6,0.3);}
  .pdf-status-badge.pending{background:#fee2e2;color:#991b1b;border-color:rgba(220,38,38,0.25);}
  .pdf-footer{border-top:1.5px solid #e5e7eb;padding-top:14px;display:flex;justify-content:space-between;align-items:flex-end;}
  .pdf-footer-brand{font-size:0.65rem;color:#9ca3af;}
  .pdf-powered{font-size:0.6rem;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;text-align:right;}
  @media(max-width:640px){
  .pdf-doc{padding:16px 10px;overflow-x:hidden;}
  .pdf-header{flex-direction:column;gap:8px;}
  .pdf-inv-meta{text-align:left;}
  .pdf-info-row{grid-template-columns:1fr;gap:8px;}
  .pdf-totals{width:100%;}
  .pdf-footer{flex-direction:column;gap:8px;align-items:flex-start;}
  .pdf-table{table-layout:fixed;width:100%;}
  .pdf-table th{font-size:0.62rem;padding:7px 5px;letter-spacing:0;}
  .pdf-table td{font-size:0.75rem;padding:7px 5px;word-break:break-word;}
  .pdf-table th:nth-child(1),.pdf-table td:nth-child(1){width:20px;}
  .pdf-table th:nth-child(2),.pdf-table td:nth-child(2){width:auto;}
  .pdf-table th:nth-child(3),.pdf-table td:nth-child(3){width:36px;text-align:center;}
  .pdf-table th:nth-child(4),.pdf-table td:nth-child(4){width:36px;text-align:center;}
  .pdf-table th:nth-child(5),.pdf-table td:nth-child(5){width:56px;text-align:right;}
  .pdf-table th:nth-child(6),.pdf-table td:nth-child(6){width:62px;text-align:right;}
  .pdf-pay-block{flex-wrap:wrap;gap:8px;}
}
`;

export default InvoiceView;