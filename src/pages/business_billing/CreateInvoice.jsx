import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createInvoice,
  searchProducts,
  getProductStats,
} from "../../services/businessService";

// ─── Invoice ID generator (frontend still generates for display) ──
const genInvoiceId = () => {
  const now = new Date();
  const yy  = String(now.getFullYear()).slice(-2);
  const mm  = String(now.getMonth() + 1).padStart(2, "0");
  const dd  = String(now.getDate()).padStart(2, "0");
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${yy}${mm}${dd}-${seq}`;
};

// ─── Empty item shape ─────────────────────────────────────────
const emptyItem = () => ({
  productId:   null,
  name:        "",
  qty:         1,
  price:       0,
  unit:        "piece",
  maxQty:      Infinity,
  isStockItem: false,
});

// ─── Date helper DD/MM/YYYY ───────────────────────────────────
const todayStr = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

const CreateInvoice = () => {
  const [isGST,       setIsGST]       = useState(false);
  const [customer,    setCustomer]    = useState({ name: "", mobile: "", gst: "" });
  const [items,       setItems]       = useState([emptyItem()]);
  const [discount,    setDiscount]    = useState(0);
  const [advance,     setAdvance]     = useState(0);
  const [payment,     setPayment]     = useState("Cash");
  const [suggestions, setSuggestions] = useState([]);
  const [activeRow,   setActiveRow]   = useState(null);
  const [toast,       setToast]       = useState(null);
  const [lowAlerts,   setLowAlerts]   = useState([]);
  const [stockStats,  setStockStats]  = useState({});
  const [saving,      setSaving]      = useState(false);
  const [invoiceId]                   = useState(genInvoiceId());

  const lastInputRef = useRef(null);

  // ── Load stock stats on mount ─────────────────────────────
  useEffect(() => {
    getProductStats()
      .then(setStockStats)
      .catch(() => {});
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Calculations ──────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + Number(i.qty) * Number(i.price), 0);
  const gstAmt   = isGST ? Math.round(subtotal * 0.05) : 0;
  const total    = subtotal + gstAmt - Number(discount);
  const balance  = total - Number(advance);

  // ── Item row management ───────────────────────────────────
  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
    setTimeout(() => lastInputRef.current?.focus(), 50);
  };

  const removeItem = (i) => {
    if (items.length > 1) setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateItem = (i, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      if (field === "qty" && copy[i].isStockItem) {
        const val = Number(value);
        if (val > copy[i].maxQty) {
          copy[i].qty = copy[i].maxQty;
          showToast(`Max available: ${copy[i].maxQty} ${copy[i].unit}`, "error");
        }
      }
      return copy;
    });
  };

  // ── Autocomplete: search API ──────────────────────────────
  const handleNameChange = async (i, value) => {
    updateItem(i, "name",        value);
    updateItem(i, "productId",   null);
    updateItem(i, "isStockItem", false);
    setActiveRow(i);

    if (value.trim().length >= 1) {
      try {
        const results = await searchProducts(value.trim());
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  // ── Pick a suggestion from autocomplete ───────────────────
  // Backend product fields: id, name, selling_price, unit, qty
  const pickSuggestion = (i, product) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[i] = {
        ...copy[i],
        productId:   product.id,
        name:        product.name,
        price:       Number(product.selling_price),
        unit:        product.unit,
        maxQty:      Number(product.qty),
        isStockItem: true,
        qty:         1,
      };
      return copy;
    });
    setSuggestions([]);
    setActiveRow(null);
  };

  // ── Build API payload ─────────────────────────────────────
  const buildPayload = () => ({
    invoice_id:      invoiceId,

    // Customer
    customer_name:   customer.name,
    customer_mobile: customer.mobile,
    customer_gst:    customer.gst,

    // Shop snapshot — backend reads from the user's ShopProfile automatically
    // but we can also pass it explicitly if needed; leave empty to let
    // backend fill from the saved ShopProfile
    shop_name:    "",
    shop_address: "",
    shop_gst:     "",

    // Amounts
    subtotal,
    gst_amt:  gstAmt,
    discount: Number(discount),
    advance:  Number(advance),
    total,
    is_gst:   isGST,
    payment,
    date:     todayStr(),   // DD/MM/YYYY

    // Line items — backend validates stock and deducts automatically
    items: items
      .filter((i) => i.name.trim())
      .map((i) => ({
        product:       i.isStockItem ? i.productId : null,
        name:          i.name,
        qty:           Number(i.qty),
        price:         Number(i.price),
        unit:          i.unit,
        is_stock_item: i.isStockItem,
      })),
  });

  // ── Generate invoice ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!customer.name.trim()) {
      showToast("Enter customer name", "error");
      return;
    }
    if (items.every((i) => !i.name.trim())) {
      showToast("Add at least one item", "error");
      return;
    }
    if (saving) return;

    setSaving(true);
    try {
      const result = await createInvoice(buildPayload());

      // Refresh stock stats after successful invoice (backend deducted stock)
      getProductStats()
        .then(setStockStats)
        .catch(() => {});

      showToast(`Invoice ${invoiceId} saved successfully`);

      // Reset form
      setItems([emptyItem()]);
      setCustomer({ name: "", mobile: "", gst: "" });
      setDiscount(0);
      setAdvance(0);
      setPayment("Cash");
      setLowAlerts([]);

    } catch (err) {
      // Backend returns validation errors as { stock: [...] } or { items: "..." }
      const errData = err?.response?.data;
      if (errData?.stock) {
        showToast(errData.stock.join(" | "), "error");
      } else if (errData?.items) {
        showToast(errData.items, "error");
      } else {
        showToast("Failed to generate invoice. Please try again.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && !e.ctrlKey) {
        if (activeRow !== null) return;
        e.preventDefault();
        addItem();
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, customer, discount, advance, payment, activeRow, saving]);

  // ─────────────────────────────────────────────────────────
  return (
    <div className="invoice-page-full">

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "72px", left: "50%",
          transform: "translateX(-50%)", zIndex: 9999,
          padding: "10px 24px", borderRadius: "100px",
          fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap",
          background: toast.type === "success" ? "#0e1b2e" : "#dc2626",
          color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Invoice header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "6px",
      }}>
        <h2>Create Invoice</h2>
        <span style={{
          fontSize: "0.8rem", fontWeight: 600, color: "#64748b",
          background: "#f1f5f9", padding: "6px 12px", borderRadius: "8px",
        }}>
          {invoiceId}
        </span>
      </div>

      {/* Stock mini-bar */}
      {stockStats.total_items > 0 && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: "10px", padding: "10px 16px", marginBottom: "18px",
          display: "flex", gap: "20px", flexWrap: "wrap",
        }}>
          <span style={{ fontSize: "0.8rem", color: "#15803d" }}>
            {stockStats.total_items} products in stock
          </span>
          {stockStats.low_stock_count > 0 && (
            <span style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 600 }}>
              {stockStats.low_stock_count} low-stock items
            </span>
          )}
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
            💡 Type a product name below to auto-fill price from stock
          </span>
        </div>
      )}

      {/* Customer row */}
      <div className="top-grid">
        <input
          placeholder="Customer Name *"
          value={customer.name}
          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
        />
        <input
          placeholder="Mobile Number"
          value={customer.mobile}
          onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
        />
        <label className="gst-toggle">
          <input
            type="checkbox"
            checked={isGST}
            onChange={() => setIsGST(!isGST)}
          />
          GST Invoice (5%)
        </label>
        {isGST && (
          <input
            placeholder="Customer GST Number"
            value={customer.gst}
            onChange={(e) => setCustomer({ ...customer, gst: e.target.value })}
          />
        )}
      </div>

      {/* Two-column layout */}
      <div className="invoice-layout">

        {/* LEFT — Items table */}
        <div className="items-section">
          <table className="items-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Item</th>
                <th>Qty</th>
                <th>Price ₹</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ position: "relative" }}>

                  {/* Item name with autocomplete */}
                  <td style={{ position: "relative" }}>
                    <input
                      ref={i === items.length - 1 ? lastInputRef : null}
                      value={item.name}
                      placeholder="Product name…"
                      onChange={(e) => handleNameChange(i, e.target.value)}
                      onFocus={() => {
                        if (item.name.trim().length >= 1) {
                          searchProducts(item.name).then(setSuggestions).catch(() => {});
                          setActiveRow(i);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => { setSuggestions([]); setActiveRow(null); }, 180);
                      }}
                      style={{ borderColor: item.isStockItem ? "#22c55e" : undefined }}
                    />
                    {item.isStockItem && (
                      <span style={{
                        position: "absolute", top: "4px", right: "6px",
                        fontSize: "0.6rem", fontWeight: 700,
                        background: "#dcfce7", color: "#15803d",
                        padding: "1px 6px", borderRadius: "100px",
                      }}>
                        Stock
                      </span>
                    )}
                    {activeRow === i && suggestions.length > 0 && (
                      <div style={{
                        position: "absolute", top: "100%", left: 0, right: 0,
                        background: "#fff", border: "1px solid #e2e8f0",
                        borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        zIndex: 500, overflow: "hidden",
                      }}>
                        {suggestions.map((s) => (
                          <div
                            key={s.id}
                            onMouseDown={() => pickSuggestion(i, s)}
                            style={{
                              padding: "10px 14px", cursor: "pointer",
                              borderBottom: "1px solid #f1f5f9",
                              display: "flex", justifyContent: "space-between",
                              alignItems: "center",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                          >
                            <div>
                              <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>
                                {s.name}
                              </strong>
                              <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "8px" }}>
                                {s.category}
                              </span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#2563eb" }}>
                                ₹{s.selling_price}
                              </div>
                              <div style={{
                                fontSize: "0.72rem",
                                color: Number(s.qty) <= Number(s.min_qty_alert) ? "#dc2626" : "#16a34a",
                              }}>
                                {s.qty} {s.unit} left
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Qty */}
                  <td>
                    <input
                      type="number"
                      value={item.qty}
                      min="1"
                      max={item.maxQty !== Infinity ? item.maxQty : undefined}
                      placeholder="Qty"
                      onChange={(e) => updateItem(i, "qty", e.target.value)}
                    />
                    {item.isStockItem && (
                      <div style={{ fontSize: "0.65rem", color: "#64748b", textAlign: "center", marginTop: "2px" }}>
                        max {item.maxQty}
                      </div>
                    )}
                  </td>

                  {/* Price */}
                  <td>
                    <input
                      type="number"
                      value={item.price}
                      placeholder="Price"
                      onChange={(e) => updateItem(i, "price", e.target.value)}
                    />
                  </td>

                  {/* Amount */}
                  <td style={{ fontWeight: 600, textAlign: "center" }}>
                    ₹{(Number(item.qty) * Number(item.price)).toLocaleString("en-IN")}
                  </td>

                  {/* Remove */}
                  <td>
                    {items.length > 1 && (
                      <button className="remove-btn" onClick={() => removeItem(i)}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="add-btn" onClick={addItem} style={{ marginTop: "14px" }}>
            + Add Item &nbsp;<span style={{ opacity: 0.6, fontSize: "0.75rem" }}>Enter</span>
          </button>
        </div>

        {/* RIGHT — Summary */}
        <div className="summary-panel">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          {isGST && (
            <div className="summary-row">
              <span>GST (5%)</span>
              <span>₹{gstAmt.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Discount ₹</span>
            <input
              type="number"
              value={discount}
              min="0"
              onChange={(e) => setDiscount(e.target.value)}
              style={{ width: "90px", textAlign: "right" }}
            />
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>

          <select
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            style={{ width: "100%", marginTop: "10px" }}
          >
            {["Cash", "UPI", "PhonePe", "GooglePay", "Card", "Cheque", "Credit"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Advance Paid ₹"
            value={advance}
            min="0"
            onChange={(e) => setAdvance(e.target.value)}
            style={{ marginTop: "12px" }}
          />

          {/* Auto-status preview */}
          <div style={{
            marginTop: "10px", fontSize: "0.78rem",
            color: "#64748b", display: "flex", alignItems: "center", gap: "6px",
          }}>
            Status will be:&nbsp;
            <span style={{
              fontWeight: 700,
              color: Number(advance) >= total ? "#16a34a"
                : Number(advance) > 0 ? "#d97706"
                : "#dc2626",
            }}>
              {Number(advance) >= total ? "✅ Paid"
                : Number(advance) > 0  ? "⚡ Partial"
                : "⏳ Pending"}
            </span>
          </div>

          <div className="balance" style={{ marginTop: "14px" }}>
            Balance: <strong>₹{balance.toLocaleString("en-IN")}</strong>
          </div>

          {items.some((i) => i.isStockItem) && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: "8px", padding: "10px 12px", marginTop: "12px",
              fontSize: "0.78rem", color: "#15803d",
            }}>
              📦 Stock will be deducted automatically when you generate this invoice.
            </div>
          )}

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={saving}
            style={{ marginTop: "14px", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving…" : "Generate Invoice"}
            {!saving && (
              <span style={{ opacity: 0.7, fontSize: "0.78rem" }}>&nbsp;Ctrl+Enter</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;
