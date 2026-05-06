/**
 * ShopQROrder.jsx — Owner / Admin View
 *
 * CHANGES IN THIS VERSION:
 *  1. order_id (customer-facing number) shown prominently in orders list
 *  2. "Collected" button opens PaymentModal asking how much customer paid
 *  3. Payment amount passed to invoice history (authAxios.post to invoices)
 *  4. After completing: WhatsApp opens with final receipt message
 *  5. Customer PDF auto-triggers for download/share after completion
 *  6. [NEW] Delete button for completed orders (local state only, no DB)
 *  7. [NEW] Professional notification redesign with per-item delete
 *  8. [NEW] Auto-delete notifications after 24 hours
 */

import React, {
  useState, useEffect, useRef, useCallback, memo, useMemo,
} from "react";
import { authAxios } from "../../services/api";
import QRCodeLib from "qrcode";
import CustomerView from "../business_billing/CustomerView";

// ─── Named Constants ──────────────────────────────────────────
const STOCK_KEY         = "mb_stock";
const ORDERS_KEY        = "mb_shop_orders";
const NOTIF_KEY         = "mb_shop_notifs";
const TOAST_DURATION_MS = 3500;
const MAX_ITEMS_PREVIEW = Infinity;
const NOTIF_TTL_MS      = 24 * 60 * 60 * 1000; // 24 hours

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const readLocalStock = () => {
  try {
    return (JSON.parse(localStorage.getItem(STOCK_KEY)) || []).filter(
      (s) => Number(s.qty) > 0,
    );
  } catch { return []; }
};

const loadOrders = () => { try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch { return []; } };
const saveOrders = (o) => localStorage.setItem(ORDERS_KEY, JSON.stringify(o));

// ── Notif helpers with 24h auto-prune ────────────────────────
const pruneOldNotifs = (notifs) => {
  const cutoff = Date.now() - NOTIF_TTL_MS;
  return notifs.filter((n) => new Date(n.time).getTime() > cutoff);
};
const loadNotifs = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTIF_KEY)) || [];
    return pruneOldNotifs(raw);
  } catch { return []; }
};
const saveNotifs = (n) => localStorage.setItem(NOTIF_KEY, JSON.stringify(n));

const SC = {
  new:       { label: "New Order",  bg: "#eff6ff", col: "#1e4fba", bdr: "#bfdbfe" },
  packing:   { label: "Packing",    bg: "#fffbeb", col: "#b45309", bdr: "#fde68a" },
  ready:     { label: "Ready",      bg: "#f0fdf4", col: "#15803d", bdr: "#bbf7d0" },
  completed: { label: "Completed",  bg: "#f8fafc", col: "#64748b", bdr: "#e2e8f0" },
  cancelled: { label: "Cancelled",  bg: "#fff5f5", col: "#dc2626", bdr: "#fecaca" },
};

// Notification type config — icon, accent, label
const NT = {
  new_order: { icon: "🛒", accent: "#1e4fba", bg: "#eff6ff", bdr: "#bfdbfe", label: "New Order"    },
  packing:   { icon: "📦", accent: "#b45309", bg: "#fffbeb", bdr: "#fde68a", label: "Packing"      },
  ready:     { icon: "✅", accent: "#15803d", bg: "#f0fdf4", bdr: "#bbf7d0", label: "Ready"        },
  completed: { icon: "💰", accent: "#7c3aed", bg: "#faf5ff", bdr: "#e9d5ff", label: "Completed"    },
  default:   { icon: "🔔", accent: "#64748b", bg: "#f8fafc", bdr: "#e2e8f0", label: "Notification" },
};

const ago = (iso) => {
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN");
};

const buildPackingMsg = (order, shop) => {
  const items = (order.items || [])
    .map((it, i) => `  ${i+1}. ${it.name} × ${it.qty} ${it.unit}`)
    .join("\n");
  return (
`🛍️ *${shop?.shop_name || "Our Shop"}*
━━━━━━━━━━━━━━━━━━━━

Hello *${order.customer_name}* 👋

Your order *#${order.order_id || order.id}* has been received and we've started packing it right away!

📦 *Items being packed:*
${items}

💰 *Order Summary:*
  • Total: ₹${order.subtotal}
  • Advance paid: ₹${order.advance}
  • Balance at pickup: ₹${order.balance}

⏳ We'll notify you as soon as your order is ready for pickup.

Thank you for shopping with us! 🙏
_${shop?.shop_name} · ${shop?.mobile || ""}_`
  );
};

const buildReadyMsg = (order, shop) => {
  return (
`✅ *${shop?.shop_name || "Our Shop"}*
━━━━━━━━━━━━━━━━━━━━

Hello *${order.customer_name}* 👋

Great news! Your order *#${order.order_id || order.id}* is packed and *READY FOR PICKUP* 🎉

🏪 *Visit us at:*
  ${shop?.address || "our shop"}

💵 *Amount to bring:*
  ${Number(order.balance) > 0
    ? `Balance due: *₹${order.balance}*`
    : `✅ Fully paid — nothing to pay!`}

📍 Please collect your order at your earliest convenience.

See you soon! 😊
_${shop?.shop_name} · ${shop?.mobile || ""}_`
  );
};

// ── Completion WhatsApp message — handles full, partial, overpaid ─
const buildCompletedMsg = (order, shop, amountPaid, isPartial = false) => {
  const items = (order.items || [])
    .map((it, i) => `  ${i+1}. ${it.name} × ${it.qty} ${it.unit}`)
    .join("\n");
  const balanceDue       = Number(order.balance || 0);
  const paid             = Number(amountPaid);
  const changeReturned   = order.change_returned || 0;
  const remainingBalance = order.remaining_balance || 0;

  if (isPartial) {
    return (
`🧾 *${shop?.shop_name || "Our Shop"} — Order Collected (Partial)*
━━━━━━━━━━━━━━━━━━━━

Hello *${order.customer_name}* 👋

Your order *#${order.order_id || order.id}* has been collected.

📦 *Items collected:*
${items}

💰 *Payment Summary:*
  • Order Total: ₹${order.subtotal}
  • Advance Paid: ₹${order.advance}
  • Balance Due: ₹${balanceDue}
  • Paid Now: ₹${paid}
  • ⚠️ Remaining Balance: *₹${remainingBalance.toFixed(2)}*

📌 *Please clear the remaining balance at your earliest convenience.*

Thank you for shopping with us! 🙏
_${shop?.shop_name} · ${shop?.mobile || ""}_`
    );
  }

  return (
`🧾 *${shop?.shop_name || "Our Shop"} — Order Complete*
━━━━━━━━━━━━━━━━━━━━

Hello *${order.customer_name}* 👋

Your order *#${order.order_id || order.id}* has been *COMPLETED* ✅

📦 *Items collected:*
${items}

💰 *Final Bill:*
  • Order Total: ₹${order.subtotal}
  • Advance Paid: ₹${order.advance}
  • Balance Paid: ₹${paid}${changeReturned > 0 ? `\n  • Change Returned: ₹${changeReturned.toFixed(2)}` : ""}

✅ *Fully settled — thank you!*

Thank you for shopping with us! 🙏
_${shop?.shop_name} · ${shop?.mobile || ""}_`
  );
};

const printViaIframe = (html, title) => {
  try {
    const existing = document.getElementById("__mb_print_frame");
    if (existing) existing.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "__mb_print_frame";
    iframe.style.cssText =
      "position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;";

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      console.warn("[Print] Unable to access iframe document");
      return;
    }

    doc.open();
    doc.write(`<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
          <style>
            *{box-sizing:border-box;margin:0;padding:0;}
            body{font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;background:#fff;}
            @page{size:A4;margin:14mm 12mm;}
          </style>
        </head>
        <body>${html}</body>
      </html>`);
    doc.close();

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) return;
        win.focus();
        win.print();
      } catch (err) {
        console.warn("[Print] iframe print failed:", err);
      }
    };
  } catch (err) {
    console.warn("[Print] Unexpected error:", err);
  }
};

// ─── Real QR Code component ───────────────────────────────────
const QRCode = memo(({ value = "", size = 150 }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#0e1b2e", light: "#ffffff" },
    }).catch((err) => console.warn("[QRCode] render error:", err));
  }, [value, size]);
  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: "block", borderRadius: 4 }}
    />
  );
});

// ══════════════════════════════════════════════════════════════
//   PAYMENT COLLECTION MODAL — shown when owner clicks "Collected"
// ══════════════════════════════════════════════════════════════
const PaymentModal = memo(({ order, onConfirm, onCancel }) => {
  const balanceDue  = Number(order?.balance || 0);
  const [amountPaid, setAmountPaid] = useState(String(balanceDue));
  const [err, setErr] = useState("");

  const paid            = Number(amountPaid) || 0;
  const change          = paid - balanceDue;
  const remainingBalance = balanceDue - paid;
  const isPartial       = paid > 0 && paid < balanceDue;
  const isExact         = paid === balanceDue;
  const isOverpaid      = paid > balanceDue;
  const isFullySettled  = paid >= balanceDue;

  const handleConfirm = () => {
    if (!amountPaid || isNaN(paid) || paid < 0) {
      setErr("Please enter a valid amount");
      return;
    }
    if (paid === 0) {
      setErr("Amount cannot be zero");
      return;
    }
    onConfirm(paid);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "rgba(14,27,46,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "32px 28px",
        width: "100%", maxWidth: 440,
        boxShadow: "0 24px 80px rgba(14,27,46,0.22)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        animation: "slideDown .25s ease",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0e1b2e" }}>Collect Payment</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Order <strong style={{ color: "#c9963a" }}>#{order?.order_id || order?.id}</strong> · {order?.customer_name}
          </div>
        </div>

        <div style={{
          background: "#f8fafc", borderRadius: 12, padding: "14px 16px",
          marginBottom: 18, border: "1.5px solid #e5e7eb",
        }}>
          {[
            ["Order Total",   fmt(order?.subtotal), "#0e1b2e"],
            ["Advance Paid",  fmt(order?.advance),  "#15803d"],
            ["Balance Due",   fmt(balanceDue),       "#dc2626"],
          ].map(([l, v, c]) => (
            <div key={l} style={{
              display: "flex", justifyContent: "space-between",
              padding: "5px 0", fontSize: 13,
              borderBottom: l === "Advance Paid" ? "1px dashed #e5e7eb" : "none",
            }}>
              <span style={{ color: "#64748b" }}>{l}</span>
              <span style={{ fontWeight: 800, color: c }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{
            fontSize: 12, fontWeight: 700, color: "#374151",
            textTransform: "uppercase", letterSpacing: ".06em",
            display: "block", marginBottom: 8,
          }}>
            Amount Customer Paid Now (₹)
          </label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 16, fontWeight: 800, color: "#0e1b2e",
            }}>₹</span>
            <input
              type="number"
              min={0}
              value={amountPaid}
              onChange={(e) => { setAmountPaid(e.target.value); setErr(""); }}
              onFocus={(e) => e.target.select()}
              autoFocus
              style={{
                width: "100%", padding: "13px 14px 13px 32px",
                fontSize: 22, fontWeight: 800, color: "#0e1b2e",
                border: `2px solid ${err ? "#fca5a5" : isPartial ? "#fde68a" : isFullySettled && paid > 0 ? "#bbf7d0" : "#e5e7eb"}`,
                borderRadius: 10, outline: "none", fontFamily: "inherit",
                background: "#fff", boxSizing: "border-box",
                transition: "border-color .15s",
              }}
            />
          </div>
          {err && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>{err}</div>}
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>
            Partial payment allowed — remaining balance will be saved in Invoice History
          </div>
        </div>

        {paid > 0 && (
          <div style={{ marginBottom: 16 }}>
            {isPartial && (
              <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e" }}>Partial Payment</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "#78350f" }}>
                  <span>Customer paying now</span>
                  <span style={{ fontWeight: 800 }}>{fmt(paid)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", color: "#dc2626", fontWeight: 900, borderTop: "1px dashed #fde68a", marginTop: 4 }}>
                  <span>📌 Remaining balance (saved in invoice)</span>
                  <span>{fmt(remainingBalance)}</span>
                </div>
              </div>
            )}
            {isExact && (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#15803d" }}>Exact amount — fully settled!</div>
                  <div style={{ fontSize: 11, color: "#166534", marginTop: 2 }}>No change to return · Invoice marked paid</div>
                </div>
              </div>
            )}
            {isOverpaid && (
              <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>🔄</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#15803d" }}>Overpaid — return change</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "#166534" }}>
                  <span>Balance due</span><span style={{ fontWeight: 700 }}>{fmt(balanceDue)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "#166534" }}>
                  <span>Customer paid</span><span style={{ fontWeight: 700 }}>{fmt(paid)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", color: "#15803d", fontWeight: 900, borderTop: "1.5px solid #bbf7d0", marginTop: 4 }}>
                  <span>💵 Return to customer</span><span>{fmt(change)}</span>
                </div>
                <div style={{ fontSize: 11, color: "#166534", marginTop: 4 }}>Invoice marked fully paid</div>
              </div>
            )}
          </div>
        )}

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#374151" }}>
          <strong style={{ color: "#1e4fba" }}>After confirming:</strong>
          <div style={{ marginTop: 4, lineHeight: 1.8 }}>
            {isPartial
              ? <>📌 Invoice saved with <strong style={{ color: "#dc2626" }}>remaining balance {fmt(remainingBalance)}</strong><br/>📄 Customer PDF prints with partial payment note<br/>💬 WhatsApp receipt sent to customer</>
              : <>✅ Invoice marked as <strong style={{ color: "#15803d" }}>Fully Settled</strong><br/>📄 Customer PDF prints with final receipt<br/>💬 WhatsApp receipt sent to customer</>
            }
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "transparent", fontWeight: 700, fontSize: 14, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleConfirm} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: isPartial ? "linear-gradient(135deg,#b45309,#d97706)" : "linear-gradient(135deg,#0e1b2e,#1a2d47)", fontWeight: 800, fontSize: 14, color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {isPartial ? "💰 Save Partial & Complete" : "💰 Confirm & Complete"}
          </button>
        </div>
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════
//   PDF COMPONENTS
// ══════════════════════════════════════════════════════════════

const CustomerOrderPdf = memo(React.forwardRef(({ order, shop, qrUrl, amountPaid }, ref) => {
  if (!order) return null;
  const balance          = Number(order.balance || 0);
  const finalPaid        = amountPaid != null ? Number(amountPaid) : null;
  const remainingBalance = order.remaining_balance != null ? Number(order.remaining_balance) : null;
  const changeReturned   = order.change_returned   != null ? Number(order.change_returned)   : null;
  const isPartial        = remainingBalance != null && remainingBalance > 0;
  const isFullySettled   = finalPaid != null && !isPartial;

  return (
    <div ref={ref} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fff", padding: "32px", color: "#111827", fontSize: "13px", lineHeight: 1.6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2.5px solid #0e1b2e", paddingBottom: "16px", marginBottom: "16px" }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 900, color: "#0e1b2e" }}>Mana<span style={{ color: "#c9963a" }}>Bills</span></div>
          <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>AP & Telangana's Billing Platform</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", fontWeight: 800, color: "#0e1b2e" }}>ORDER CONFIRMATION</div>
          <div style={{ fontWeight: 800, color: "#c9963a", fontSize: "1rem", marginTop: "2px" }}># {order.order_id || order.id}</div>
          {order.order_id && order.id !== order.order_id && (
            <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Ref: {order.id}</div>
          )}
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
            {new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#f9fafb", borderRadius: "8px", padding: "14px 16px", marginBottom: "18px", border: "1px solid #e5e7eb" }}>
        <div>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", color: "#9ca3af", marginBottom: "4px" }}>Shop</div>
          {shop ? (
            <>
              <div style={{ fontWeight: 800, color: "#0e1b2e" }}>{shop.shop_name}</div>
              {shop.mobile  && <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>📞 {shop.mobile}</div>}
              {shop.address && <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>📍 {shop.address}</div>}
            </>
          ) : <div style={{ color: "#6b7280" }}>—</div>}
        </div>
        <div>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", color: "#9ca3af", marginBottom: "4px" }}>Customer</div>
          <div style={{ fontWeight: 800, color: "#0e1b2e" }}>{order.customer_name}</div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>📞 {order.customer_mobile}</div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
        <thead>
          <tr style={{ background: "#0e1b2e", color: "#fff" }}>
            {["#", "Item", "Qty", "Unit", "Rate", "Amount"].map((h, i) => (
              <th key={h} style={{ padding: "8px 10px", textAlign: i === 0 || i === 1 ? "left" : i === 5 || i === 4 ? "right" : "center", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((it, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 1 ? "#fafafa" : "#fff" }}>
              <td style={{ padding: "8px 10px", color: "#9ca3af" }}>{i + 1}</td>
              <td style={{ padding: "8px 10px", fontWeight: 600 }}>{it.name}</td>
              <td style={{ padding: "8px 10px", textAlign: "center" }}>{it.qty}</td>
              <td style={{ padding: "8px 10px", textAlign: "center", color: "#6b7280", fontSize: "0.72rem" }}>{it.unit}</td>
              <td style={{ padding: "8px 10px", textAlign: "right" }}>₹{it.price}</td>
              <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>₹{(Number(it.qty) * Number(it.price)).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "18px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.82rem", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ color: "#6b7280" }}>Subtotal</span>
              <span style={{ fontWeight: 700 }}>{fmt(order.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.88rem", fontWeight: 900, color: "#0e1b2e", borderTop: "2px solid #0e1b2e", marginTop: "8px", paddingTop: "10px" }}>
              <span>Total</span><span>{fmt(order.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.82rem", color: "#15803d", fontWeight: 800 }}>
              <span>Advance Paid</span><span>{fmt(order.advance)}</span>
            </div>
            {finalPaid != null ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.82rem", color: "#15803d", fontWeight: 800 }}>
                  <span>Paid at Pickup</span><span>{fmt(finalPaid)}</span>
                </div>
                {changeReturned > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.82rem", color: "#6b7280", fontWeight: 700 }}>
                    <span>Change Returned</span><span>{fmt(changeReturned)}</span>
                  </div>
                )}
                {isPartial ? (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.92rem", color: "#dc2626", fontWeight: 900, borderTop: "1.5px dashed #fca5a5", marginTop: 6 }}>
                    <span>⚠️ Remaining Balance</span><span>{fmt(remainingBalance)}</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.92rem", color: "#15803d", fontWeight: 900, borderTop: "1.5px solid #bbf7d0", marginTop: 6 }}>
                    <span>✅ Fully Settled</span><span>{fmt(order.subtotal)}</span>
                  </div>
                )}
              </>
            ) : balance > 0 ? (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.88rem", color: "#dc2626", fontWeight: 800 }}>
                <span>Balance at Pickup</span><span>{fmt(balance)}</span>
              </div>
            ) : null}
          </div>
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px", background: isPartial ? "#fff7ed" : "#f0fdf4", border: `1px solid ${isPartial ? "#fed7aa" : "#bbf7d0"}`, borderRadius: "8px", padding: "10px 14px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: isPartial ? "#d97706" : "#15803d", flexShrink: 0 }} />
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isPartial ? "#92400e" : "#15803d" }}>
              {isPartial
                ? `⚠️ Partial — ₹${remainingBalance.toLocaleString("en-IN")} still due`
                : finalPaid != null
                  ? "Payment Collected ✓ Fully Settled"
                  : balance <= 0
                    ? "Fully Paid ✓"
                    : `Balance ₹${balance.toLocaleString("en-IN")} due at pickup`
              }
            </div>
          </div>
        </div>
        {qrUrl && (
          <div style={{ flexShrink: 0, textAlign: "center" }}>
            <div style={{ background: "#fff", border: "2px solid #0e1b2e", borderRadius: "10px", padding: "10px", display: "inline-block" }}>
              <QRCode value={qrUrl} size={110} />
            </div>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: "6px", maxWidth: "120px" }}>Scan to reorder or check status</div>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1.5px solid #e5e7eb", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "0.85rem", fontWeight: 800, color: "#0e1b2e" }}>Mana<span style={{ color: "#c9963a" }}>Bills</span></div>
          <div>manabills.in</div>
          <div>Thank you for your order 🙏</div>
        </div>
        <div style={{ fontSize: "0.6rem", color: "#9ca3af", textAlign: "right", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Order ID: <strong style={{ color: "#c9963a" }}>{order.order_id || order.id}</strong>
        </div>
      </div>
    </div>
  );
}));

const ShopInvoicePdf = memo(React.forwardRef(({ order, shop, qrUrl }, ref) => {
  if (!order) return null;
  return (
    <div ref={ref} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fff", padding: "32px", color: "#111827", fontSize: "13px", lineHeight: 1.6 }}>
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "5rem", fontWeight: 900, color: "rgba(201,150,58,0.06)", transform: "rotate(-30deg)", whiteSpace: "nowrap", userSelect: "none" }}>ManaBills</div>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2.5px solid #0e1b2e", paddingBottom: "16px", marginBottom: "16px" }}>
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 900, color: "#0e1b2e" }}>Mana<span style={{ color: "#c9963a" }}>Bills</span></div>
              <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Shop Order Slip</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", fontWeight: 800, color: "#0e1b2e" }}>SHOP ORDER</div>
              <div style={{ fontWeight: 800, color: "#c9963a", fontSize: "0.9rem" }}>#{order.order_id || order.id}</div>
              {order.order_id && order.id !== order.order_id && (
                <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>Ref: {order.id}</div>
              )}
              <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                {new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          {shop && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontWeight: 800, color: "#0e1b2e" }}>{shop.shop_name}</div>
              {shop.mobile  && <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>📞 {shop.mobile}</div>}
              {shop.address && <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>📍 {shop.address}</div>}
            </div>
          )}

          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px", display: "flex", gap: "20px" }}>
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", color: "#9ca3af", marginBottom: "3px" }}>Customer</div>
              <div style={{ fontWeight: 800 }}>{order.customer_name}</div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>📞 {order.customer_mobile}</div>
            </div>
            <div style={{ borderLeft: "1px solid #e5e7eb", paddingLeft: "20px" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", color: "#9ca3af", marginBottom: "3px" }}>Status</div>
              <div style={{ fontWeight: 800, color: "#1e4fba" }}>{(SC[order.status] || SC.new).label}</div>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
            <thead>
              <tr style={{ background: "#0e1b2e", color: "#fff" }}>
                {["#", "Item", "Qty", "Unit", "Rate", "Total"].map((h, i) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: i === 0 || i === 1 ? "left" : i >= 4 ? "right" : "center", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((it, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 1 ? "#fafafa" : "#fff" }}>
                  <td style={{ padding: "8px 10px", color: "#9ca3af" }}>{i + 1}</td>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>{it.name}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{it.qty}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: "#6b7280", fontSize: "0.72rem" }}>{it.unit}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>₹{it.price}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>₹{(Number(it.qty) * Number(it.price)).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
            <div style={{ flex: 1, maxWidth: "260px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "0.82rem", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#6b7280" }}>Total</span>
                <span style={{ fontWeight: 900, fontSize: "0.95rem", color: "#0e1b2e" }}>{fmt(order.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "0.82rem", color: "#15803d", fontWeight: 700 }}>
                <span>Advance Received</span><span>{fmt(order.advance)}</span>
              </div>
              {Number(order.balance || 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "0.88rem", color: "#dc2626", fontWeight: 800, borderTop: "1.5px dashed #fca5a5", marginTop: "6px", paddingTop: "8px" }}>
                  <span>Balance Due</span><span>{fmt(order.balance)}</span>
                </div>
              )}
            </div>
            {qrUrl && (
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <div style={{ background: "#fff", border: "2px solid #0e1b2e", borderRadius: "10px", padding: "8px", display: "inline-block" }}>
                  <QRCode value={qrUrl} size={100} />
                </div>
                <div style={{ fontSize: "0.6rem", color: "#6b7280", marginTop: "5px" }}>Shop QR Scanner</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}));

// ─── Static CSS ────────────────────────────────────────────────
const OWNER_STYLES = `
  @keyframes slideDown { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  @keyframes modalIn { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .sqo-layout { display:grid; grid-template-columns:260px 1fr; min-height:calc(100vh - 115px); }
  @media(max-width:900px){ .sqo-layout{ grid-template-columns:1fr; } }

  .sqo-panel { background:#fff; border-right:1.5px solid rgba(14,27,46,0.08); padding:20px 12px; display:flex; flex-direction:column; gap:3px; }
  @media(max-width:900px){ .sqo-panel{ display:none; } }
  .sqo-plabel { font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; padding:10px 12px 4px; margin-top:8px; }
  .sqo-ptab { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:10px; border:none; background:transparent; cursor:pointer; font-family:inherit; font-size:13.5px; font-weight:600; color:#64748b; text-align:left; width:100%; transition:all .15s; position:relative; }
  .sqo-ptab:hover { background:#f6f4f0; color:#0e1b2e; }
  .sqo-ptab.on { background:rgba(201,150,58,.10); color:#0e1b2e; font-weight:700; }
  .sqo-ptab.on::before { content:''; position:absolute; left:0; top:20%; bottom:20%; width:3px; background:#c9963a; border-radius:0 3px 3px 0; }
  .sqo-pbadge { margin-left:auto; background:#1e4fba; color:#fff; font-size:10px; font-weight:800; padding:2px 7px; border-radius:100px; }
  .sqo-pbadge.r { background:#dc2626; }

  .sqo-mobbar { display:none; overflow-x:auto; gap:6px; padding:10px 16px; background:#fff; border-bottom:1.5px solid rgba(14,27,46,0.08); scrollbar-width:none; }
  .sqo-mobbar::-webkit-scrollbar{ display:none; }
  @media(max-width:900px){ .sqo-mobbar{ display:flex; } }
  .sqo-mobtab { flex-shrink:0; padding:8px 16px; border-radius:100px; border:1.5px solid transparent; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; background:transparent; color:#64748b; white-space:nowrap; transition:all .15s; }
  .sqo-mobtab.on { background:rgba(201,150,58,.10); border-color:rgba(201,150,58,.30); color:#0e1b2e; }

  .sqo-content { padding:28px; overflow-y:auto; }
  @media(max-width:768px){ .sqo-content{ padding:16px; } }

  .sqo-demobar { background:#0e1b2e; padding:10px 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }

  .sqo-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:10px; border:none; font-weight:700; font-size:13px; cursor:pointer; font-family:inherit; transition:all .18s; }
  .sqo-btn:hover { opacity:.88; transform:translateY(-1px); }
  .sqo-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; }
  .sqo-btn-dark    { background:#0e1b2e; color:#fff; }
  .sqo-btn-outline { background:transparent; color:#0e1b2e; border:1.5px solid rgba(14,27,46,.2); }
  .sqo-btn-gold    { background:linear-gradient(135deg,#c9963a,#e8a020); color:#0e1b2e; }
  .sqo-btn-green   { background:#15803d; color:#fff; }
  .sqo-btn-blue    { background:#1e4fba; color:#fff; }
  .sqo-btn-purple  { background:#7c3aed; color:#fff; }
  .sqo-btn-wa      { background:#25D366; color:#fff; }
  .sqo-btn-danger  { background:transparent; color:#dc2626; border:1.5px solid #fca5a5; }
  .sqo-btn-danger:hover { background:#fee2e2; border-color:#ef4444; }

  .sqo-card { background:#fff; border-radius:16px; border:1.5px solid rgba(14,27,46,.07); box-shadow:0 2px 10px rgba(14,27,46,.05); padding:20px; margin-bottom:16px; }
  .sqo-order-card { background:#fff; border-radius:16px; border:1.5px solid rgba(14,27,46,.07); box-shadow:0 2px 10px rgba(14,27,46,.05); padding:18px; margin-bottom:12px; transition:box-shadow .2s; }
  .sqo-order-card:hover { box-shadow:0 6px 24px rgba(14,27,46,.1); }

  .sqo-stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:12px; margin-bottom:20px; }
  .sqo-stat { background:#fff; border-radius:14px; padding:16px; border:1.5px solid rgba(14,27,46,.07); }

  .sqo-badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:800; padding:4px 12px; border-radius:100px; border:1.5px solid; }

  .sqo-pills { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
  .sqo-pill { padding:7px 16px; border-radius:100px; font-size:12px; font-weight:700; cursor:pointer; border:1.5px solid rgba(14,27,46,.10); background:#fff; color:#64748b; transition:all .15s; }
  .sqo-pill.on { background:#0e1b2e; color:#fff; border-color:#0e1b2e; }

  .sqo-empty { text-align:center; padding:56px 24px; background:#fff; border-radius:18px; border:1.5px dashed rgba(14,27,46,.12); }

  .sqo-order-actions { display:flex; gap:7px; flex-wrap:wrap; }

  /* order_id highlight chip */
  .sqo-orderid-chip {
    display:inline-flex; align-items:center; gap:5px;
    background:linear-gradient(135deg,rgba(201,150,58,.12),rgba(201,150,58,.06));
    border:1.5px solid rgba(201,150,58,.35);
    border-radius:100px; padding:3px 10px;
    font-size:11px; font-weight:800; color:#92400e;
    letter-spacing:.03em;
  }

  /* ── Professional Notification card ── */
  .sqo-notif-card {
    background:#fff;
    border-radius:14px;
    border:1.5px solid rgba(14,27,46,.07);
    box-shadow:0 2px 8px rgba(14,27,46,.04);
    padding:16px 18px;
    margin-bottom:10px;
    display:flex;
    gap:14px;
    align-items:flex-start;
    cursor:pointer;
    transition:box-shadow .2s, transform .15s;
    animation:fadeInUp .25s ease;
    position:relative;
  }
  .sqo-notif-card:hover { box-shadow:0 6px 20px rgba(14,27,46,.09); transform:translateY(-1px); }
  .sqo-notif-card.unread { border-color:transparent; }

  .sqo-notif-icon {
    width:40px; height:40px; border-radius:12px;
    display:flex; align-items:center; justify-content:center;
    font-size:18px; flex-shrink:0;
  }
  .sqo-notif-delete {
    position:absolute; top:12px; right:14px;
    background:transparent; border:none; cursor:pointer;
    color:#cbd5e1; font-size:14px; padding:2px 6px;
    border-radius:6px; transition:all .15s; line-height:1;
    font-family:inherit;
  }
  .sqo-notif-delete:hover { background:#fee2e2; color:#ef4444; }

  .sqo-notif-type-pill {
    display:inline-block; font-size:9px; font-weight:800;
    text-transform:uppercase; letter-spacing:.07em;
    padding:2px 8px; border-radius:100px; margin-bottom:4px;
  }

  /* Notif header bar */
  .sqo-notif-header {
    display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;
  }
  .sqo-notif-actions { display:flex; gap:8px; align-items:center; }
  .sqo-notif-clear-all {
    font-size:12px; font-weight:700; color:#64748b;
    background:transparent; border:1.5px solid #e5e7eb;
    padding:6px 14px; border-radius:8px; cursor:pointer;
    font-family:inherit; transition:all .15s;
  }
  .sqo-notif-clear-all:hover { background:#f1f5f9; border-color:#cbd5e1; color:#0e1b2e; }
`;

if (typeof document !== "undefined" && !document.getElementById("__sqo_styles")) {
  const el = document.createElement("style");
  el.id = "__sqo_styles";
  el.textContent = OWNER_STYLES;
  document.head.appendChild(el);
}

// ══════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function ShopQROrder() {
  const [tab,         setTab]         = useState("scanner");
  const [orders,      setOrders]      = useState(loadOrders);
  const [notifs,      setNotifs]      = useState(loadNotifs);
  const [shopProfile, setShopProfile] = useState(null);
  const [scannerId,   setScannerId]   = useState("");
  const [scannerOn,   setScannerOn]   = useState(true);
  const [statusFilt,  setStatusFilt]  = useState("all");
  const [toast,       setToast]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [stockItems,  setStockItems]  = useState([]);
  const [demo,        setDemo]        = useState(false);

  // Payment modal state
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);

  // PDF print state
  const [shopPdfOrder,         setShopPdfOrder]         = useState(null);
  const [customerPdfOrder,     setCustomerPdfOrder]     = useState(null);
  const [customerPdfAmountPaid, setCustomerPdfAmountPaid] = useState(null);

  const shopPdfRef     = useRef(null);
  const customerPdfRef = useRef(null);

  const qrUrl = scannerId ? `http://192.168.31.11:3000/shop/${scannerId}` : "";

  // ── Toast helper ──────────────────────────────────────────
  const toast$ = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    const t = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  // ── Auto-prune notifications every hour ──────────────────
  useEffect(() => {
    const pruneInterval = setInterval(() => {
      setNotifs((prev) => {
        const pruned = pruneOldNotifs(prev);
        if (pruned.length !== prev.length) saveNotifs(pruned);
        return pruned;
      });
    }, 60 * 60 * 1000); // every hour
    return () => clearInterval(pruneInterval);
  }, []);

  // ── Load on mount ─────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const localStock = readLocalStock();
    if (localStock.length > 0) setStockItems(localStock);

    authAxios.get("business/shop-profile/")
      .then((r) => setShopProfile(r.data))
      .catch((err) => {
        console.warn("[ShopQROrder] shop-profile fetch failed:", err);
        try { setShopProfile(JSON.parse(localStorage.getItem("shopProfile") || "{}")); } catch {}
      });

    authAxios.get("business/scanner/")
      .then((r) => {
        if (r.data?.scanner_id) {
          setScannerId(r.data.scanner_id);
          setScannerOn(r.data.is_active ?? true);
        } else { generateLocalScannerId(); }
      })
      .catch((err) => {
        console.warn("[ShopQROrder] scanner fetch failed:", err);
        generateLocalScannerId();
      });

    authAxios.get("business/products/")
      .then((r) => {
        const apiStock = (r.data || [])
          .filter((p) => Number(p.qty) > 0 && p.is_active !== false)
          .map((p) => ({
            id:           p.id,
            name:         p.name,
            category:     p.category || "General",
            unit:         p.unit,
            sellingPrice: Number(p.selling_price),
            qty:          Number(p.qty),
            minQtyAlert:  Number(p.min_qty_alert || 5),
            _fromApi:     true,
          }));
        if (apiStock.length > 0) setStockItems(apiStock);
      })
      .catch((err) => console.warn("[ShopQROrder] products fetch failed:", err))
      .finally(() => setLoading(false));

    authAxios.get("business/orders/")
      .then((r) => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          setOrders(r.data);
          saveOrders(r.data);
        }
      })
      .catch((err) => console.warn("[ShopQROrder] orders fetch failed:", err));
  }, []);

  const generateLocalScannerId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setScannerId(`mb-${user.mobile_number || "shop"}-001`);
    } catch { setScannerId("mb-shop-001"); }
  };

  useEffect(() => { saveOrders(orders); }, [orders]);
  useEffect(() => { saveNotifs(notifs);  }, [notifs]);

  // ── useEffect-driven printing ─────────────────────────────
  useEffect(() => {
    if (shopPdfOrder && shopPdfRef.current) {
      printViaIframe(shopPdfRef.current.innerHTML, `Shop Order ${shopPdfOrder.order_id || shopPdfOrder.id}`);
    }
  }, [shopPdfOrder]);

  useEffect(() => {
    if (customerPdfOrder && customerPdfRef.current) {
      printViaIframe(customerPdfRef.current.innerHTML, `Order Confirmation ${customerPdfOrder.order_id || customerPdfOrder.id}`);
    }
  }, [customerPdfOrder]);

  useEffect(() => {
    const handler = (e) => setCustomerPdfOrder(e.detail);
    window.addEventListener("cust:printOrder", handler);
    return () => window.removeEventListener("cust:printOrder", handler);
  }, []);

  // ── Scanner toggle ────────────────────────────────────────
  const toggleScanner = useCallback(() => {
    setScannerOn((prev) => {
      const next = !prev;
      authAxios.patch("business/scanner/", { is_active: next })
        .catch((err) => console.warn("[ShopQROrder] scanner toggle failed:", err));
      toast$(next ? "Scanner activated" : "Scanner disabled", "info");
      return next;
    });
  }, [toast$]);

  // ── Order status update (non-completion) ──────────────────
  const updateStatus = useCallback((oid, st) => {
    setOrders((prev) => prev.map((o) => o.id === oid ? { ...o, status: st } : o));

    authAxios.patch(`business/orders/${oid}/`, { status: st })
      .catch((err) => console.warn(`[ShopQROrder] status update for ${oid} failed:`, err));

    setOrders((prev) => {
      const order = prev.find((x) => x.id === oid);

      if (st === "packing" && order) {
        const mob = order.customer_mobile?.replace(/\D/g, "") || "";
        if (mob) {
          const msg = buildPackingMsg(order, shopProfile);
          setTimeout(() => {
            window.open(`https://wa.me/91${mob.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
          }, 300);
        }
        toast$(`📦 Packing started — WhatsApp opening...`, "info");
        setNotifs((n) => [{
          id: Date.now(), type: "packing", read: false,
          msg: `Order #${order?.order_id || oid} is now being packed`,
          sub: `${order?.customer_name} · ${order?.items?.length || 0} item(s) · ${fmt(order?.subtotal)}`,
          time: new Date().toISOString(),
        }, ...n]);
      }

      if (st === "ready" && order) {
        const mob = order.customer_mobile?.replace(/\D/g, "") || "";
        if (mob) {
          const msg = buildReadyMsg(order, shopProfile);
          setTimeout(() => {
            window.open(`https://wa.me/91${mob.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
          }, 300);
        }
        toast$(`✅ Order ${order?.order_id || oid} marked Ready — WhatsApp opening...`);
        setNotifs((n) => [{
          id: Date.now(), type: "ready", read: false,
          msg: `Order #${order?.order_id || oid} is ready for pickup`,
          sub: `${order?.customer_name} · Balance due: ${fmt(order?.balance)}`,
          time: new Date().toISOString(),
        }, ...n]);
      }

      if (st === "cancelled") {
        toast$(`Order ${order?.order_id || oid} cancelled`, "error");
      }

      return prev;
    });
  }, [toast$, shopProfile]);

  // ── "Collected" clicked — open payment modal ──────────────
  const handleCollectedClick = useCallback((order) => {
    setPaymentModalOrder(order);
  }, []);

  // ── Payment confirmed in modal ────────────────────────────
  const handlePaymentConfirmed = useCallback((amountPaid) => {
    const order = paymentModalOrder;
    if (!order) return;
    setPaymentModalOrder(null);

    const oid        = order.id;
    const orderId    = order.order_id || order.id;
    const balanceDue = Number(order.balance || 0);
    const paid       = Number(amountPaid);

    const isPartial        = paid < balanceDue;
    const changeReturned   = paid > balanceDue ? paid - balanceDue : 0;
    const remainingBalance = isPartial ? balanceDue - paid : 0;
    const paymentStatus    = isPartial ? "partial" : "paid";

    // 1. Update order status to completed
    setOrders((prev) => prev.map((o) => o.id === oid
      ? {
          ...o,
          status:               "completed",
          amount_paid_at_pickup: paid,
          remaining_balance:    remainingBalance,
          payment_status:       paymentStatus,
        }
      : o
    ));

    // 2. API: update order
    authAxios.patch(`business/orders/${oid}/`, {
      status:               "completed",
      amount_paid_at_pickup: paid,
      remaining_balance:    remainingBalance,
      payment_status:       paymentStatus,
    }).catch((err) => console.warn(`[ShopQROrder] complete order ${oid} failed:`, err));

    // 3. API: post to invoice history
    const invoicePayload = {
      order_id:          oid,
      order_ref:         orderId,
      customer_name:     order.customer_name,
      customer_mobile:   order.customer_mobile,
      items:             order.items,
      subtotal:          order.subtotal,
      advance:           order.advance,
      balance_due:       balanceDue,
      amount_paid:       paid,
      change_returned:   changeReturned,
      remaining_balance: remainingBalance,
      payment_status:    paymentStatus,
      payment_date:      new Date().toISOString(),
      source:            "qr_order",
    };
    authAxios.post("business/invoice-history/", invoicePayload)
      .catch((err) => console.warn("[ShopQROrder] invoice-history post failed:", err));

    // 4. Notification — auto-deletes in 24h
    const notifSub = isPartial
      ? `${order.customer_name} · Paid ${fmt(paid)} · Balance remaining: ${fmt(remainingBalance)}`
      : changeReturned > 0
        ? `${order.customer_name} · Paid ${fmt(paid)} · Change returned: ${fmt(changeReturned)}`
        : `${order.customer_name} · ${fmt(paid)} collected · Fully settled`;

    setNotifs((n) => [{
      id: Date.now(), type: "completed", read: false,
      msg: `Order #${orderId} ${isPartial ? "partially paid" : "completed & settled"}`,
      sub: notifSub,
      time: new Date().toISOString(),
    }, ...n]);

    toast$(
      isPartial
        ? `⚠️ Order ${orderId} — ₹${paid} paid, ₹${remainingBalance} balance kept`
        : `💰 Order ${orderId} completed! ₹${paid} collected.`
    );

    // 5. Trigger customer PDF
    setCustomerPdfAmountPaid(paid);
    setCustomerPdfOrder({
      ...order,
      status:            "completed",
      remaining_balance: remainingBalance,
      payment_status:    paymentStatus,
      change_returned:   changeReturned,
    });

    // 6. Open WhatsApp
    setTimeout(() => {
      const mob = order.customer_mobile?.replace(/\D/g, "") || "";
      if (mob) {
        const msg = buildCompletedMsg(
          { ...order, remaining_balance: remainingBalance, change_returned: changeReturned },
          shopProfile, paid, isPartial,
        );
        window.open(`https://wa.me/91${mob.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
      }
    }, 800);

    // 7. Remove from active list after 2.5s
    setTimeout(() => {
      setOrders((prev) => prev.filter((o) => o.id !== oid));
    }, 2500);
  }, [paymentModalOrder, shopProfile, toast$]);

  // ── Notification helpers ──────────────────────────────────
  const markAllRead   = useCallback(() => setNotifs((p) => p.map((n) => ({ ...n, read: true }))), []);
  const deleteNotif   = useCallback((id) => setNotifs((p) => p.filter((n) => n.id !== id)), []);
  const clearAllNotifs = useCallback(() => setNotifs([]), []);
  const unread        = useMemo(() => notifs.filter((n) => !n.read).length, [notifs]);

  // ── Delete completed order (local only) ──────────────────

  const handleOrderPlaced = useCallback((newOrder) => {
    setOrders((prev) => {
      const already = prev.find((o) => o.id === newOrder.id || o.order_id === newOrder.order_id);
      if (already) return prev;
      return [newOrder, ...prev];
    });
    setNotifs((n) => [{
      id: Date.now(),
      type: "new_order",
      read: false,
      msg: `New order #${newOrder.order_id || newOrder.id} received`,
      sub: `${newOrder.customer_name} · ${fmt(newOrder.subtotal)} · ${newOrder.items?.length || 0} item(s)`,
      time: new Date().toISOString(),
    }, ...n]);
    toast$(`🛒 New order from ${newOrder.customer_name}!`);
  }, [toast$]);

  const handleStockRefresh = useCallback((freshStock) => setStockItems(freshStock), []);
  const printShopSlip      = useCallback((order) => setShopPdfOrder(order), []);
  const printCustomerSlip  = useCallback((order) => {
    setCustomerPdfAmountPaid(null);
    setCustomerPdfOrder(order);
  }, []);

  const oc = useMemo(() => ({
    all:       orders.length,
    new:       orders.filter((o) => o.status === "new").length,
    packing:   orders.filter((o) => o.status === "packing").length,
    ready:     orders.filter((o) => o.status === "ready").length,
    completed: orders.filter((o) => o.status === "completed").length,
  }), [orders]);

  const filteredOrders = useMemo(
    () => statusFilt === "all" ? orders : orders.filter((o) => o.status === statusFilt),
    [orders, statusFilt],
  );

  const shopName = shopProfile?.shop_name || "Your Shop";

  const QR_DISPLAY_ORDER = useMemo(() => ({
    id: "QR-DISPLAY", order_id: "QR-DISPLAY",
    customer_name: "Display Slip", customer_mobile: "",
    items: [], subtotal: 0, advance: 0, balance: 0,
    status: "new", created_at: new Date().toISOString(),
  }), []);

  // Poll every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      authAxios.get("business/orders/")
        .then((r) => {
          if (Array.isArray(r.data) && r.data.length > 0) {
            setOrders((prev) => {
              const prevIds = new Set(prev.map((o) => o.id));
              const newOnes = r.data.filter((o) => !prevIds.has(o.id));
              if (newOnes.length > 0) {
                toast$(`🛒 ${newOnes.length} new order(s) received!`);
                setNotifs((n) => [
                  ...newOnes.map((o) => ({
                    id: Date.now() + Math.random(),
                    type: "new_order",
                    read: false,
                    msg: `New order #${o.order_id || o.id} received`,
                    sub: `${o.customer_name} · ${fmt(o.subtotal)} · ${o.items?.length || 0} item(s)`,
                    time: new Date().toISOString(),
                  })),
                  ...n,
                ]);
              }
              return r.data;
            });
            saveOrders(r.data);
          }
        })
        .catch((err) => console.warn("[ShopQROrder] poll failed:", err));
    }, 15000);

    return () => clearInterval(interval);
  }, [toast$]);

  // ══════════════════════════════════════════════════════════
  //   RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", minHeight: "calc(100vh - 62px)", background: "#f6f4f0" }}>

      {/* ── Hidden PDF containers ── */}
      <div style={{ display: "none" }}>
        <ShopInvoicePdf    ref={shopPdfRef}     order={shopPdfOrder}     shop={shopProfile} qrUrl={qrUrl} />
        <CustomerOrderPdf  ref={customerPdfRef} order={customerPdfOrder} shop={shopProfile} qrUrl={qrUrl} amountPaid={customerPdfAmountPaid} />
      </div>

      {/* ── Payment Collection Modal ── */}
      {paymentModalOrder && (
        <PaymentModal
          order={paymentModalOrder}
          onConfirm={handlePaymentConfirmed}
          onCancel={() => setPaymentModalOrder(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, padding: "10px 22px", borderRadius: 100,
          font: "700 13px 'Plus Jakarta Sans',system-ui", whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(0,0,0,.18)", cursor: "pointer",
          background: toast.type === "success" ? "#0e1b2e" : toast.type === "info" ? "#1e4fba" : "#dc2626",
          color: "#fff", animation: "slideDown .3s ease",
        }} onClick={() => setToast(null)}>{toast.msg}</div>
      )}

      {/* Demo/Owner toggle bar */}

      {/* ════════════════════ CUSTOMER VIEW ════════════════════ */}
      {demo && (
        <CustomerView
          shopProfile={shopProfile}
          stockItems={stockItems}
          loading={loading}
          scannerId={scannerId}
          qrUrl={qrUrl}
          onOrderPlaced={handleOrderPlaced}
          onStockRefresh={handleStockRefresh}
          toast$={toast$}
        />
      )}

      {/* ════════════════════ OWNER VIEW ════════════════════ */}
      {!demo && (
        <>
          {/* Mobile tab bar */}
          <div className="sqo-mobbar">
            {[
              { k: "scanner",       l: "📲 QR Scanner" },
              { k: "orders",        l: `📦 Orders${oc.new > 0 ? ` (${oc.new})` : ""}` },
              { k: "notifications", l: `🔔 Notifs${unread > 0 ? ` (${unread})` : ""}` },
            ].map(({ k, l }) => (
              <button key={k} className={`sqo-mobtab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          <div className="sqo-layout">
            {/* ── Sidebar ── */}
            <div className="sqo-panel">
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", margin: "4px 0 8px" }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#0e1b2e" }}>{shopName}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{shopProfile?.shop_type || "General Store"}</div>
                <div style={{ fontSize: 11, color: scannerOn ? "#15803d" : "#dc2626", marginTop: 6, fontWeight: 700 }}>
                  {scannerOn ? "● Scanner Active" : "○ Scanner Off"}
                </div>
              </div>
              <div className="sqo-plabel">Navigation</div>
              {[
                { k: "scanner",       i: "📲", l: "QR Scanner",   b: null,           r: false },
                { k: "orders",        i: "📦", l: "Orders",        b: oc.new || null, r: false },
                { k: "notifications", i: "🔔", l: "Notifications", b: unread || null, r: true  },
              ].map(({ k, i, l, b, r }) => (
                <button key={k} className={`sqo-ptab${tab === k ? " on" : ""}`} onClick={() => setTab(k)}>
                  <span style={{ fontSize: 16 }}>{i}</span> {l}
                  {b && <span className={`sqo-pbadge${r ? " r" : ""}`}>{b}</span>}
                </button>
              ))}
              <div className="sqo-plabel">Quick Stats</div>
              {[
                { l: "Stock Items",  v: stockItems.length },
                { l: "Orders Today", v: orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString()).length },
                { l: "Pending",      v: orders.filter((o) => ["new", "packing"].includes(o.status)).length },
              ].map(({ l, v }) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", borderRadius: "8px", background: "#f8fafc", margin: "2px 0", fontSize: 12 }}>
                  <span style={{ color: "#64748b" }}>{l}</span>
                  <span style={{ fontWeight: 800, color: "#0e1b2e" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* ── Main content area ── */}
            <div className="sqo-content">

              {/* ── SCANNER TAB ── */}
              {tab === "scanner" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#0e1b2e" }}>Shop QR Scanner</h2>
                      <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Display at your counter. Customers scan → browse → order.</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="sqo-btn sqo-btn-outline" onClick={toggleScanner}>{scannerOn ? "⏸ Disable" : "▶ Enable"}</button>
                      <button className="sqo-btn sqo-btn-dark" onClick={() => printShopSlip(QR_DISPLAY_ORDER)}>🖨️ Print QR</button>
                    </div>
                  </div>

                  <div className="sqo-stats">
                    {[
                      { l: "Stock Items",     v: stockItems.length, c: "#1e4fba" },
                      { l: "Orders Received", v: orders.length,     c: "#c9963a" },
                      { l: "Ready Pickup",    v: oc.ready,          c: "#15803d" },
                      { l: "Completed Today", v: orders.filter((o) => o.status === "completed" && new Date(o.created_at).toDateString() === new Date().toDateString()).length, c: "#7c3aed" },
                    ].map(({ l, v, c }) => (
                      <div key={l} className="sqo-stat" style={{ borderLeft: `4px solid ${c}` }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>{l}</div>
                        <div style={{ fontSize: "22px", fontWeight: 900, marginTop: 4, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="sqo-card" style={{ overflow: "hidden", padding: 0 }}>
                    <div style={{ background: "linear-gradient(135deg,#0e1b2e,#1a2d47)", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,150,58,.2),transparent 70%)" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
                        <div>
                          <div style={{ color: "rgba(255,255,255,.45)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Shop Scanner</div>
                          <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>{shopName}</div>
                          <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11, marginTop: 3, fontFamily: "monospace" }}>{scannerId || "loading..."}</div>
                        </div>
                        <div style={{ background: scannerOn ? "rgba(21,128,61,.3)" : "rgba(220,38,38,.3)", border: `1px solid ${scannerOn ? "#86efac" : "#fca5a5"}`, color: scannerOn ? "#86efac" : "#fca5a5", padding: "5px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700 }}>
                          {scannerOn ? "● ACTIVE" : "○ DISABLED"}
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: 24 }}>
                      <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
                        <div style={{ flexShrink: 0 }}>
                          <div style={{ background: "#fff", border: "2.5px solid #0e1b2e", borderRadius: 14, padding: 12, display: "inline-block" }}>
                            {scannerId && <QRCode value={qrUrl} size={160} />}
                            <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "#64748b", fontWeight: 700 }}>{shopName}</div>
                            <div style={{ textAlign: "center", fontSize: 9, color: "#94a3b8", wordBreak: "break-all", maxWidth: 160 }}>{qrUrl}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button className="sqo-btn sqo-btn-dark" style={{ flex: 1, justifyContent: "center" }} onClick={() => printShopSlip(QR_DISPLAY_ORDER)}>🖨️ Print</button>
                            <button className="sqo-btn sqo-btn-gold" style={{ flex: 1, justifyContent: "center" }} onClick={() => navigator.clipboard?.writeText(qrUrl).then(() => toast$("Link copied!", "success")).catch(() => toast$("Copy failed", "error"))}>📤 Copy Link</button>
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0e1b2e", marginBottom: 10 }}>How it works:</div>
                          {[
                            ["🔍", "Customer scans QR code"],
                            ["🛒", "Browses your live stock"],
                            ["💰", "Pays advance to confirm order"],
                            ["🔔", "You get notified instantly"],
                            ["📦", "Pack items → mark Ready"],
                            ["✅", "Customer collects & pays balance"],
                          ].map(([ic, t]) => (
                            <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(14,27,46,.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{ic}</div>
                              <span style={{ fontSize: 13, color: "#374151" }}>{t}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!loading && stockItems.length > 0 && (
                    <div className="sqo-card">
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0e1b2e", marginBottom: 14 }}>📦 Visible to Customers ({stockItems.length} items)</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                        {stockItems.map((p) => (
                          <div key={p.id} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#0e1b2e" }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{p.qty} {p.unit} · {p.category || "General"}</div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: "#15803d", flexShrink: 0 }}>{fmt(p.sellingPrice)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!loading && stockItems.length === 0 && (
                    <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 12 }}>
                      <span style={{ fontSize: 20 }}>⚠️</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 3 }}>No stock items found</div>
                        <div style={{ fontSize: 13, color: "#b45309", lineHeight: 1.6 }}>Go to <strong>Stock Entry</strong> and add products. They'll appear here automatically.</div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── ORDERS TAB ── */}
              {tab === "orders" && (
                <>
                  <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#0e1b2e" }}>Customer Orders</h2>
                  <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>Orders placed via QR scanner.</p>

                  <div className="sqo-pills">
                    {[
                      { k: "all",       l: "All",       c: oc.all },
                      { k: "new",       l: "🆕 New",     c: oc.new },
                      { k: "packing",   l: "📦 Packing", c: oc.packing },
                      { k: "ready",     l: "✅ Ready",   c: oc.ready },
                      { k: "completed", l: "Done",       c: oc.completed },
                    ].map(({ k, l, c }) => (
                      <button key={k} className={`sqo-pill${statusFilt === k ? " on" : ""}`} onClick={() => setStatusFilt(k)}>
                        {l} <span style={{ opacity: .65 }}>({c})</span>
                      </button>
                    ))}
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="sqo-empty">
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0e1b2e", marginBottom: 4 }}>No orders yet</div>
                      <div style={{ fontSize: 13, color: "#94a3b8" }}>Orders placed via QR appear here in real time</div>
                    </div>
                  ) : filteredOrders.map((order) => {
                    const sc = SC[order.status] || SC.new;
                    const isCompleted = order.status === "completed";
                    return (
                      <div key={order.id} className="sqo-order-card" style={isCompleted ? { opacity: 0.82, borderColor: "#e2e8f0" } : {}}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span className="sqo-orderid-chip">🎫 #{order.order_id || order.id}</span>
                              <span className="sqo-badge" style={{ background: sc.bg, color: sc.col, borderColor: sc.bdr }}>{sc.label}</span>
                            </div>
                            {order.order_id && String(order.order_id) !== String(order.id) && (
                              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Ref: {order.id}</div>
                            )}
                            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>👤 {order.customer_name} · 📱 {order.customer_mobile}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>🕐 {ago(order.created_at)}</div>
                          </div>
                          <div style={{ fontWeight: 900, fontSize: 18, color: "#0e1b2e" }}>{fmt(order.subtotal)}</div>
                        </div>

                        {/* Items */}
                        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                          {(order.items || []).map((it, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#374151", padding: "3px 0", borderBottom: i < (order.items.length - 1) ? "0.5px solid #f1f5f9" : "none" }}>
                              <span>{it.name} <span style={{ color: "#94a3b8" }}>×{it.qty} {it.unit}</span></span>
                              <span style={{ fontWeight: 700 }}>{fmt(Number(it.qty) * Number(it.price))}</span>
                            </div>
                          ))}
                        </div>

                        {/* Financials */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
                          {[
                            ["Total",   fmt(order.subtotal), "#0e1b2e"],
                            ["Advance", fmt(order.advance),  "#15803d"],
                            ["Balance", Number(order.balance) > 0 ? fmt(order.balance) : "✓ Paid", Number(order.balance) > 0 ? "#dc2626" : "#15803d"],
                          ].map(([l, v, c]) => (
                            <div key={l} style={{ textAlign: "center", background: "#f8fafc", borderRadius: 8, padding: "8px 6px" }}>
                              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{l}</div>
                              <div style={{ fontWeight: 800, fontSize: 14, color: c, marginTop: 2 }}>{v}</div>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="sqo-order-actions">
                          {order.status === "new" && (
                            <>
                              <button className="sqo-btn sqo-btn-blue" onClick={() => updateStatus(order.id, "packing")}>📦 Start Packing</button>
                              <button className="sqo-btn sqo-btn-outline" style={{ color: "#dc2626", borderColor: "#fca5a5" }} onClick={() => updateStatus(order.id, "cancelled")}>✕ Cancel</button>
                              <button className="sqo-btn sqo-btn-outline" onClick={() => printShopSlip(order)}>🖨️ Shop Slip</button>
                              <button className="sqo-btn sqo-btn-purple" onClick={() => printCustomerSlip(order)}>📄 Customer PDF</button>
                            </>
                          )}
                          {order.status === "packing" && (
                            <>
                              <button className="sqo-btn sqo-btn-green" onClick={() => updateStatus(order.id, "ready")}>✅ Mark Ready</button>
                              <button className="sqo-btn sqo-btn-outline" onClick={() => printShopSlip(order)}>🖨️ Shop Slip</button>
                              <button className="sqo-btn sqo-btn-purple" onClick={() => printCustomerSlip(order)}>📄 Customer PDF</button>
                            </>
                          )}
                          {order.status === "ready" && (
                            <>
                              <button className="sqo-btn sqo-btn-dark" onClick={() => handleCollectedClick(order)}>💰 Collected</button>
                              <button className="sqo-btn sqo-btn-outline" onClick={() => printShopSlip(order)}>🖨️ Shop Slip</button>
                              <button className="sqo-btn sqo-btn-purple" onClick={() => printCustomerSlip(order)}>📄 Customer PDF</button>
                            </>
                          )}                          
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── NOTIFICATIONS TAB ── */}
              {tab === "notifications" && (
                <>
                  {/* Header */}
                  <div className="sqo-notif-header">
                    <div>
                      <h2 style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 800, color: "#0e1b2e" }}>Notifications</h2>
                      <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
                        {unread > 0
                          ? <><span style={{ fontWeight: 700, color: "#1e4fba" }}>{unread} unread</span> · Auto-cleared after 24 hrs</>
                          : "All caught up · Auto-cleared after 24 hrs"
                        }
                      </p>
                    </div>
                    <div className="sqo-notif-actions">
                      {unread > 0 && (
                        <button className="sqo-notif-clear-all" onClick={markAllRead}>✓ Mark all read</button>
                      )}
                      {notifs.length > 0 && (
                        <button className="sqo-notif-clear-all" style={{ color: "#dc2626", borderColor: "#fecaca" }} onClick={clearAllNotifs}>
                          🗑️ Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  {notifs.length === 0 ? (
                    <div className="sqo-empty">
                      <div style={{ fontSize: 44, marginBottom: 12 }}>🔔</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0e1b2e", marginBottom: 6 }}>No notifications</div>
                      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                        Order alerts, status updates and payment confirmations<br/>will appear here in real time.
                      </div>
                    </div>
                  ) : notifs.map((n) => {
                    const cfg = NT[n.type] || NT.default;
                    return (
                      <div
                        key={n.id}
                        className={`sqo-notif-card${!n.read ? " unread" : ""}`}
                        style={!n.read ? { borderLeft: `4px solid ${cfg.accent}`, background: cfg.bg, borderColor: cfg.bdr } : {}}
                        onClick={() => setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                      >
                        {/* Icon */}
                        <div className="sqo-notif-icon" style={{ background: n.read ? "#f1f5f9" : cfg.bg, border: `1.5px solid ${n.read ? "#e2e8f0" : cfg.bdr}` }}>
                          {cfg.icon}
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 28 }}>
                          {/* Type pill */}
                          <span
                            className="sqo-notif-type-pill"
                            style={{ background: n.read ? "#f1f5f9" : cfg.bg, color: cfg.accent, border: `1px solid ${n.read ? "#e2e8f0" : cfg.bdr}` }}
                          >
                            {cfg.label}
                          </span>
                          {/* Message */}
                          <div style={{ fontSize: 13.5, fontWeight: n.read ? 600 : 800, color: "#0e1b2e", marginBottom: 3, lineHeight: 1.4 }}>
                            {n.msg}
                          </div>
                          {/* Sub text */}
                          {n.sub && (
                            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{n.sub}</div>
                          )}
                          {/* Footer: time + unread dot */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>🕐 {ago(n.time)}</span>
                            {!n.read && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, color: cfg.accent, background: cfg.bg, border: `1px solid ${cfg.bdr}`, padding: "1px 7px", borderRadius: 100 }}>
                                ● NEW
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ── Per-notification delete button ── */}
                        <button
                          className="sqo-notif-delete"
                          onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                          title="Dismiss notification"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}

                  {/* Footer hint */}
                  {notifs.length > 0 && (
                    <div style={{ textAlign: "center", fontSize: 11, color: "#cbd5e1", marginTop: 20, padding: "12px 0", borderTop: "1px solid #f1f5f9" }}>
                      Notifications older than 24 hours are automatically removed
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}
