import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  createInvoice,
  searchProducts,
  getProductStats,
  getShopProfile,        // ← ADD THIS to your businessService
} from "../../services/businessService";
import { useContext } from "react";
import { BusinessStatsContext } from "../../context/BusinessStatsContext";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { authAxios } from "../../services/api";

const emptyItem = () => ({
  productId: null, name: "", qty: 1, price: 0,
  unit: "piece", maxQty: Infinity, isStockItem: false,
  gst_rate: 0,
});

const todayStr = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString().padStart(2, "0")}/${d.getFullYear()}`;
};

const isValidMobile = (mob) => mob.replace(/\D/g, "").length === 10;

const isValidGST = (gst) => {
  if (!gst || gst.trim().length === 0) return true;
  const gstRegex = /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  return gstRegex.test(gst.trim().toUpperCase());
};

// ─── Mobile detection ─────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
};

// ─── Styles (unchanged from your original) ───────────────────
const S = {
  page: { fontFamily:"'DM Sans','Segoe UI',sans-serif", background:"#f0f2f7", minHeight:"100vh", paddingBottom:"100px", boxSizing:"border-box", overflowX:"hidden", width:"100%" },
  headerBar: { background:"#0f172a", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:100, width:"100%", boxSizing:"border-box" },
  headerTitle: { fontSize:"1.1rem", fontWeight:700, color:"#fff", letterSpacing:"-0.3px", margin:0 },
  invoiceBadge: { fontSize:"0.68rem", fontWeight:600, color:"#94a3b8", background:"rgba(255,255,255,0.1)", padding:"5px 10px", borderRadius:"20px", letterSpacing:"0.5px", fontFamily:"monospace", flexShrink:0 },
  content: { padding:"14px 14px 0", boxSizing:"border-box", width:"100%" },
  stockBar: { background:"#ecfdf5", border:"1px solid #bbf7d0", borderRadius:"13px", padding:"12px 14px", marginBottom:"14px", boxSizing:"border-box", width:"100%" },
  stockBarRow: { display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap", marginBottom:"4px" },
  stockBadge: { fontSize:"0.78rem", fontWeight:700, color:"#15803d" },
  stockLowBadge: { fontSize:"0.7rem", fontWeight:600, color:"#dc2626", background:"#fee2e2", padding:"2px 8px", borderRadius:"20px" },
  stockHint: { fontSize:"0.73rem", color:"#64748b" },
  card: { background:"#fff", borderRadius:"16px", padding:"16px 14px", marginBottom:"12px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", boxSizing:"border-box", width:"100%" },
  sectionLabel: { fontSize:"0.65rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:"12px" },
  input: { display:"block", width:"100%", border:"1.5px solid #e8eaf0", borderRadius:"11px", padding:"12px 14px", fontSize:"0.88rem", color:"#0f172a", background:"#fafafa", outline:"none", boxSizing:"border-box", marginBottom:"10px", WebkitAppearance:"none", fontFamily:"inherit" },
  gstRow: { display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", background:"#f8fafc", borderRadius:"11px", border:"1.5px solid #e8eaf0", marginBottom:"10px", cursor:"pointer", boxSizing:"border-box", width:"100%" },
  gstCheckbox: { width:"18px", height:"18px", accentColor:"#3b82f6", cursor:"pointer", flexShrink:0 },
  gstLabel: { fontSize:"0.88rem", color:"#334155", fontWeight:500, flex:1 },
  gstTag: { fontSize:"0.7rem", fontWeight:700, color:"#3b82f6", background:"#eff6ff", padding:"2px 8px", borderRadius:"20px", flexShrink:0 },
  itemRow: { background:"#fafafa", border:"1.5px solid #e8eaf0", borderRadius:"13px", padding:"13px 13px 10px", marginBottom:"10px", boxSizing:"border-box", width:"100%" },
  itemRowActive: { borderColor:"#22c55e", background:"#f0fdf4" },
  itemNameRow: { display:"flex", alignItems:"flex-end", gap:"8px", marginBottom:"10px", width:"100%", boxSizing:"border-box", overflow:"hidden" },
  itemNameInput: { flex:1, minWidth:0, border:"none", borderBottom:"1.5px solid #e2e8f0", background:"transparent", padding:"2px 0 8px", fontSize:"0.9rem", fontWeight:600, color:"#0f172a", outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
  stockChip: { flexShrink:0, fontSize:"0.58rem", fontWeight:700, background:"#dcfce7", color:"#15803d", padding:"2px 7px", borderRadius:"20px", letterSpacing:"0.3px", marginBottom:"8px", whiteSpace:"nowrap" },
  itemRowFooter: { display:"flex", alignItems:"center", gap:"8px", width:"100%", boxSizing:"border-box" },
  itemNumInput: { flex:1, minWidth:0, border:"1.5px solid #e8eaf0", borderRadius:"9px", padding:"9px 8px", fontSize:"0.85rem", color:"#0f172a", background:"#fff", outline:"none", textAlign:"right", WebkitAppearance:"none", MozAppearance:"textfield", boxSizing:"border-box", fontFamily:"inherit", width:"100%" },
  itemAmtBox: { flexShrink:0, width:"64px", textAlign:"right", fontSize:"0.85rem", fontWeight:700, color:"#0f172a", whiteSpace:"nowrap" },
  itemMaxHint: { fontSize:"0.6rem", color:"#94a3b8", textAlign:"center", marginTop:"3px" },
  removeBtn: { flexShrink:0, width:"28px", height:"28px", borderRadius:"50%", border:"none", background:"#fee2e2", color:"#dc2626", fontSize:"0.8rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  dropdown: { position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:"13px", boxShadow:"0 12px 32px rgba(0,0,0,0.14)", zIndex:500, overflow:"hidden", marginTop:"4px" },
  dropdownItem: { padding:"11px 14px", cursor:"pointer", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center", gap:"8px" },
  dropdownName: { fontSize:"0.88rem", fontWeight:600, color:"#0f172a" },
  dropdownCat: { fontSize:"0.72rem", color:"#94a3b8", marginTop:"2px" },
  dropdownPrice: { fontSize:"0.9rem", fontWeight:700, color:"#2563eb", flexShrink:0 },
  dropdownQty: { fontSize:"0.7rem", textAlign:"right", marginTop:"2px" },
  addBtn: { display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", width:"100%", boxSizing:"border-box", background:"transparent", border:"1.5px dashed #cbd5e1", borderRadius:"12px", padding:"13px", fontSize:"0.85rem", fontWeight:600, color:"#64748b", cursor:"pointer", marginTop:"4px", fontFamily:"inherit" },
  summaryRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f1f5f9" },
  summaryLabel: { fontSize:"0.84rem", color:"#64748b" },
  summaryVal: { fontSize:"0.88rem", fontWeight:600, color:"#0f172a" },
  summaryTotalRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0 4px" },
  summaryTotalLabel: { fontSize:"1rem", fontWeight:700, color:"#0f172a" },
  summaryTotalVal: { fontSize:"1.2rem", fontWeight:800, color:"#0f172a" },
  discountInput: { border:"1.5px solid #e8eaf0", borderRadius:"9px", padding:"6px 10px", fontSize:"0.85rem", color:"#0f172a", background:"#fafafa", outline:"none", width:"90px", textAlign:"right", WebkitAppearance:"none", MozAppearance:"textfield", fontFamily:"inherit" },
  select: { display:"block", width:"100%", boxSizing:"border-box", border:"1.5px solid #e8eaf0", borderRadius:"11px", padding:"12px 14px", fontSize:"0.88rem", color:"#0f172a", background:"#fafafa", outline:"none", marginTop:"12px", WebkitAppearance:"none", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center", fontFamily:"inherit" },
  statusRow: { marginTop:"12px", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"#f8fafc", borderRadius:"10px", fontSize:"0.78rem", color:"#64748b" },
  balanceBox: { marginTop:"12px", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", background:"#0f172a", borderRadius:"13px", width:"100%", boxSizing:"border-box" },
  balanceLabel: { fontSize:"0.82rem", color:"#94a3b8", fontWeight:500 },
  balanceVal: { fontSize:"1.1rem", fontWeight:800, color:"#fff" },
  stockNote: { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:"10px", padding:"10px 12px", marginTop:"12px", fontSize:"0.75rem", color:"#15803d", fontWeight:500, lineHeight:1.5, boxSizing:"border-box", width:"100%" },

  // ── Share banner (was WhatsApp-only, now WhatsApp/SMS) ─────
  waBanner: { background:"#f0fdf4", border:"1px solid #86efac", borderRadius:"13px", padding:"12px 14px", marginBottom:"14px", display:"flex", alignItems:"center", gap:"10px", boxSizing:"border-box", width:"100%" },
  waIcon: { width:"36px", height:"36px", borderRadius:"50%", background:"#25d366", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"18px" },
  waText: { flex:1, fontSize:"0.78rem", color:"#15803d", lineHeight:1.5 },
  waToggle: { flexShrink:0, display:"flex", alignItems:"center", gap:"6px", fontSize:"0.75rem", color:"#15803d", fontWeight:600, cursor:"pointer" },

  generateBtn: { display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", width:"100%", boxSizing:"border-box", background:"linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)", color:"#fff", border:"none", borderRadius:"14px", padding:"16px", fontSize:"0.95rem", fontWeight:700, letterSpacing:"-0.2px", cursor:"pointer", marginTop:"16px", boxShadow:"0 4px 18px rgba(37,99,235,0.3)", fontFamily:"inherit" },
  toast: (type) => ({ position:"fixed", top:"72px", left:"50%", transform:"translateX(-50%)", zIndex:9999, padding:"11px 22px", borderRadius:"100px", fontWeight:600, fontSize:"0.82rem", whiteSpace:"nowrap", background: type === "success" ? "#0f172a" : type === "whatsapp" ? "#25d366" : "#dc2626", color:"#fff", boxShadow:"0 6px 24px rgba(0,0,0,0.22)", maxWidth:"calc(100vw - 32px)" }),

  // ── Share method picker buttons ─────────────────────────────
  pickerWrap: { display:"flex", gap:"8px", marginBottom:"14px" },
  pickerBtn: (active, color, bg) => ({
    flex:1, padding:"10px", borderRadius:"10px", fontSize:"0.8rem", fontWeight:600,
    border: active ? `2px solid ${color}` : "1.5px solid #e2e8f0",
    background: active ? bg : "#fff",
    color: active ? color : "#64748b",
    cursor:"pointer", fontFamily:"inherit",
  }),
};

const CreateInvoice = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { refetch } = useContext(BusinessStatsContext);
  const { subscriptions } = useContext(SubscriptionContext);
  const isExpired = subscriptions?.["business"]?.status === "expired";

  const trialEnded = subscriptions?.["business"]?.plan_key === "free_trial"
                      && subscriptions?.["business"]?.status === "expired";

  const [isGST,        setIsGST]        = useState(false);
  const [customer,     setCustomer]     = useState({ name: "", mobile: "", gst: "" });
  const [items,        setItems]        = useState([emptyItem()]);
  const [discount,     setDiscount]     = useState(0);
  const [advance,      setAdvance]      = useState(0);
  const [payment,      setPayment]      = useState("Cash");
  const [suggestions,  setSuggestions]  = useState([]);
  const [activeRow,    setActiveRow]    = useState(null);
  const [toast,        setToast]        = useState(null);
  const [stockStats,   setStockStats]   = useState({});
  const [saving,       setSaving]       = useState(false);
  const [invoiceId, setInvoiceId] = useState("Loading…");
  const [shopProfile,  setShopProfile]  = useState({ name: "ManaBills Shop", mobile: "" });

  // ★ Share method — owner picks WhatsApp / SMS / Don't Send, per invoice
  const [shareMethod, setShareMethod] = useState("whatsapp"); // "whatsapp" | "sms" | "none"
  const [shareConfirm, setShareConfirm] = useState(null); // { url, method } | null

  const lastInputRef = useRef(null);

  // ── Load shop profile + stock stats on mount ──────────────
  useEffect(() => {
    getProductStats().then(setStockStats).catch(() => {});

    authAxios.get("business/invoices/next-id/")
    .then(r => setInvoiceId(r.data.invoice_id))
    .catch(() => setInvoiceId("INV-ERR"));

    if (typeof getShopProfile === "function") {
      getShopProfile().then((data) => {
        setShopProfile(data);
        if (data?.gst_enabled) setIsGST(true);
      }).catch(() => {});
    }
  }, []);

  // ── Toast helper ──────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Calculations ──────────────────────────────────────────
  const subtotal = items.reduce((s, i) => s + Number(i.qty) * Number(i.price), 0);
  const applyGST = isGST;
  const gstAmt = applyGST
  ? Math.round(items.reduce((s, i) =>
      s + Number(i.qty) * Number(i.price) * Number(i.gst_rate || 0) / 100, 0))
  : 0;
  const total    = subtotal + gstAmt - Number(discount);
  const balance  = total - Number(advance);

  // ── Item helpers ──────────────────────────────────────────
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

  // ── Autocomplete ──────────────────────────────────────────
  const handleNameChange = async (i, value) => {
    updateItem(i, "name", value);
    updateItem(i, "productId", null);
    updateItem(i, "isStockItem", false);
    setActiveRow(i);
    if (value.trim().length >= 1) {
      try { setSuggestions(await searchProducts(value.trim())); }
      catch { setSuggestions([]); }
    } else { setSuggestions([]); }
  };

  const pickSuggestion = (i, product) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], productId: product.id, name: product.name, price: Number(product.selling_price), unit: product.unit, maxQty: Number(product.qty), isStockItem: true, qty: 1, gst_rate: Number(product.gst_rate || 0), };
      return copy;
    });
    setSuggestions([]);
    setActiveRow(null);
  };

  // ─────────────────────────────────────────────────────────
  // ★  GENERATE INVOICE  (WhatsApp OR SMS OR neither)
  // ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!customer.name.trim()) { showToast("Enter customer name", "error"); return; }
    if (!customer.mobile.trim() || !isValidMobile(customer.mobile)) {
      showToast("Enter valid 10-digit mobile number", "error"); return;
    }
    if (customer.gst.trim() && !isValidGST(customer.gst)) {
      showToast("Invalid GST number. Format: 29ABCDE1234F1Z5", "error"); return;
    }
    if (items.every((i) => !i.name.trim())) { showToast("Add at least one item", "error"); return; }
    if (saving) return;

    setSaving(true);

    const wantsShare = shareMethod !== "none" && customer.mobile?.trim() && !isExpired;

    // ★ Only WhatsApp needs a pre-opened blank tab (popup-blocker workaround).
    //   SMS uses the sms: link which opens reliably without this trick.

    try {
      const payload = {
        invoice_id:      invoiceId,
        customer_name:   customer.name,
        customer_mobile: customer.mobile,
        customer_gst:    customer.gst,
        shop_name:       shopProfile?.name    || "",
        shop_address:    shopProfile?.address || "",
        shop_gst:        shopProfile?.gst_number || "",
        subtotal,
        gst_amt:         gstAmt,
        discount:        Number(discount),
        advance:         Number(advance),
        total,
        is_gst:          applyGST,
        payment,
        date:            todayStr(),

        items: items
          .filter((i) => i.name.trim())
          .map((i) => ({
            product:       i.isStockItem ? i.productId : null,
            name:          i.name,
            qty:           Number(i.qty),
            price:         Number(i.price),
            unit:          i.unit,
            is_stock_item: i.isStockItem,
            gst_rate:      Number(i.gst_rate || 0),
          })),
      };

      const savedInvoice = await createInvoice(payload);
      const publicToken = savedInvoice?.public_token || invoiceId;

      refetch();
      showToast(`✅ Invoice ${invoiceId} saved!`);

      authAxios.get("business/invoices/next-id/")
        .then(r => setInvoiceId(r.data.invoice_id))
        .catch(() => {});

      // ★ Build the shared message once, then send via whichever method was picked
      if (wantsShare) {
        const invoiceUrl = `${process.env.REACT_APP_BASE_URL}/invoice/${publicToken}`;
        const cleaned    = customer.mobile.replace(/\D/g, "").replace(/^91/, "").slice(-10);

        const msg = [
          `Hello ${customer.name}! 👋`,
          ``,
          `Welcome to *${shopProfile?.name || "ManaBills Shop"}*`,
          ``,
          `Your invoice has been generated:`,
          `🧾 Invoice No: *${invoiceId}*`,
          `💰 Total Amount: *₹${Number(total).toLocaleString("en-IN")}*`,
          `📅 Date: ${todayStr()}`,
          ``,
          `👇 View & Download your invoice:`,
          `${invoiceUrl}`,
          ``,
          `Thank you for shopping with us! 🙏`,
        ].join("\n");

        if (shareMethod === "whatsapp") {
          const waUrl = `https://wa.me/91${cleaned}?text=${encodeURIComponent(msg)}`;
          setShareConfirm({ url: waUrl, method: "whatsapp" });
        }
        
        if (shareMethod === "sms") {
          const smsUrl = `sms:+91${cleaned}?body=${encodeURIComponent(msg)}`;
          setShareConfirm({ url: smsUrl, method: "sms" });
        }

      }

      // Reset form
      getProductStats().then(setStockStats).catch(() => {});
      setItems([emptyItem()]);
      setCustomer({ name: "", mobile: "", gst: "" });
      setDiscount(0);
      setAdvance(0);
      setPayment("Cash");

      } catch (err) {
        const errData = err?.response?.data;
      if (errData?.stock)      showToast(errData.stock.join(" | "), "error");
      else if (errData?.items) showToast(errData.items, "error");
      else                     showToast("Failed to save invoice. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && !e.ctrlKey && activeRow === null) { e.preventDefault(); addItem(); }
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleGenerate(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, customer, discount, advance, payment, activeRow, saving, shareMethod]);

  // ─────────────────────────────────────────────────────────
  // ★  Block invoice creation if Free Trial has expired
  // ─────────────────────────────────────────────────────────
  if (trialEnded) {
    return (
      <div style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.7 }}>🔒</div>
        <h3 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "1.2rem",
          fontWeight: 800,
          color: "#0e1b2e",
          marginBottom: "0.5rem",
        }}>
          Plan Required
        </h3>
        <p style={{ fontSize: "0.88rem", color: "#64748b", maxWidth: "320px", lineHeight: 1.6 }}>
          You haven't taken a plan. Please upgrade to access invoice creation.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // ★  Share method picker — WhatsApp / SMS / Don't Send
  //    Used in BOTH mobile and desktop views.
  // ─────────────────────────────────────────────────────────
  const ShareMethodPicker = () => {
    if (!customer.mobile || customer.mobile.trim().length < 6) return null;

    if (isExpired) {
      return (
        <div style={{ ...S.waBanner, background:"#fef2f2", border:"1px solid #fecaca" }}>
          <div style={{ flex:1, fontSize:"0.78rem", color:"#dc2626", fontWeight:600 }}>
            🔒 Auto-sharing is locked. Renew your plan to share invoices automatically. Invoice will still be saved normally.
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={S.pickerWrap}>
          <button type="button" style={S.pickerBtn(shareMethod === "whatsapp", "#15803d", "#f0fdf4")} onClick={() => setShareMethod("whatsapp")}>
            💬 WhatsApp
          </button>
          <button type="button" style={S.pickerBtn(shareMethod === "sms", "#2563eb", "#eff6ff")} onClick={() => setShareMethod("sms")}>
            ✉️ SMS
          </button>
          <button type="button" style={S.pickerBtn(shareMethod === "none", "#334155", "#f8fafc")} onClick={() => setShareMethod("none")}>
            🚫 Don't Send
          </button>
        </div>
        {shareMethod !== "none" && (
          <div style={{ fontSize:"0.75rem", color:"#64748b", padding:"0 2px 10px" }}>
            {shareMethod === "whatsapp"
              ? `WhatsApp will open with the invoice link after saving.`
              : `SMS app will open with the invoice link after saving.`}
          </div>
        )}
      </div>
    );
  };
  const ShareConfirmPopup = () => {
  if (!shareConfirm) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:"#fff", borderRadius:"16px", padding:"24px 20px", maxWidth:"320px", width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:"2rem", marginBottom:"10px" }}>{shareConfirm.method === "whatsapp" ? "💬" : "✉️"}</div>
        <p style={{ fontSize:"0.95rem", fontWeight:700, color:"#0f172a", marginBottom:"6px" }}>Invoice saved!</p>
        <p style={{ fontSize:"0.82rem", color:"#64748b", marginBottom:"18px" }}>Send it to the customer now?</p>
        <div style={{ display:"flex", gap:"10px" }}>
          <button
            onClick={() => setShareConfirm(null)}
            style={{ flex:1, padding:"12px", borderRadius:"10px", border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b", fontWeight:600, cursor:"pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              window.open(shareConfirm.url, "_blank");
              setShareConfirm(null);
            }}
            style={{ flex:1, padding:"12px", borderRadius:"10px", border:"none", background: shareConfirm.method === "whatsapp" ? "#25d366" : "#2563eb", color:"#fff", fontWeight:700, cursor:"pointer" }}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

  // ─────────────────────────────────────────────────────────
  // ── MOBILE VIEW ──────────────────────────────────────────
  // ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={S.page}>
        {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
        <ShareConfirmPopup />

        <div style={S.headerBar}>
          <p style={S.headerTitle}>Create Invoice</p>
          <span style={S.invoiceBadge}>{invoiceId}</span>
        </div>

        <div style={S.content}>
          {stockStats.total_items > 0 && (
            <div style={S.stockBar}>
              <div style={S.stockBarRow}>
                <span style={S.stockBadge}>📦 {stockStats.total_items} products in stock</span>
                {stockStats.low_stock_count > 0 && (
                  <span style={S.stockLowBadge}>{stockStats.low_stock_count} low stock</span>
                )}
              </div>
              <span style={S.stockHint}>💡 Type product name to auto-fill price</span>
            </div>
          )}

          {/* Customer card */}
          <div style={S.card}>
            <p style={S.sectionLabel}>Customer Details</p>
            <input style={S.input} placeholder="Customer Name *" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
            <input
              style={{ ...S.input, marginBottom:4,
                borderColor: customer.mobile && !isValidMobile(customer.mobile) ? "#dc2626"
                           : customer.mobile && isValidMobile(customer.mobile) ? "#22c55e"
                           : undefined
              }}
              placeholder="Mobile Number *"
              value={customer.mobile}
              inputMode="numeric"
              maxLength={10}
              onChange={(e) => setCustomer({ ...customer, mobile: e.target.value.replace(/\D/g,"") })}
            />
            {!customer.mobile && (
              <div style={{ fontSize:"0.72rem", color:"#dc2626", marginBottom:8, paddingLeft:4 }}>⚠️ Mobile number is required</div>
            )}
            {customer.mobile && !isValidMobile(customer.mobile) && (
              <div style={{ fontSize:"0.72rem", color:"#dc2626", marginBottom:8, paddingLeft:4 }}>❌ Enter valid 10-digit number</div>
            )}
            {customer.mobile && isValidMobile(customer.mobile) && (
              <div style={{ fontSize:"0.72rem", color:"#15803d", marginBottom:8, paddingLeft:4 }}>✓ Valid mobile number</div>
            )}

            {/* ★ Share method picker (WhatsApp / SMS / Don't Send) */}
            <ShareMethodPicker />

            {shopProfile?.gst_enabled && (
              <>
                <div style={{ ...S.gstRow, cursor: "default", background: "#f0fdf4", borderColor: "#86efac" }}>
                  <span style={{ fontSize: "1rem" }}>✅</span>
                  <span style={S.gstLabel}>GST Invoice</span>
                  <span style={{ ...S.gstTag, background: "#dcfce7", color: "#15803d" }}>
                    {shopProfile.gst_number || "GST On"}
                  </span>
                </div>
                <input
                  style={{ ...S.input, marginBottom:4,
                    borderColor: customer.gst.trim() && !isValidGST(customer.gst) ? "#dc2626"
                                : customer.gst.trim() && isValidGST(customer.gst) ? "#22c55e"
                                : undefined
                  }}
                  placeholder="Customer GST Number (optional)"
                  value={customer.gst}
                  onChange={(e) => setCustomer({ ...customer, gst: e.target.value.toUpperCase() })}
                />
                {customer.gst.trim() && !isValidGST(customer.gst) && (
                  <div style={{ fontSize:"0.72rem", color:"#dc2626", paddingLeft:4 }}>❌ Invalid GST — format: 29ABCDE1234F1Z5</div>
                )}
                {customer.gst.trim() && isValidGST(customer.gst) && (
                  <div style={{ fontSize:"0.72rem", color:"#15803d", paddingLeft:4 }}>✓ Valid GST number</div>
                )}
              </>
            )}
          </div>

          {/* Items card */}
          <div style={S.card}>
            <p style={S.sectionLabel}>Items</p>
            {items.map((item, i) => (
              <div key={i} style={{ ...S.itemRow, ...(item.isStockItem ? S.itemRowActive : {}) }}>
                <div style={{ position: "relative" }}>
                  <div style={S.itemNameRow}>
                    <input
                      ref={i === items.length - 1 ? lastInputRef : null}
                      style={S.itemNameInput}
                      value={item.name}
                      placeholder="Product name…"
                      onChange={(e) => handleNameChange(i, e.target.value)}
                      onFocus={() => { if (item.name.trim().length >= 1) { searchProducts(item.name).then(setSuggestions).catch(() => {}); setActiveRow(i); } }}
                      onBlur={() => { setTimeout(() => { setSuggestions([]); setActiveRow(null); }, 180); }}
                    />
                    {item.isStockItem && <span style={S.stockChip}>STOCK</span>}
                    {items.length > 1 && <button style={S.removeBtn} onClick={() => removeItem(i)}>✕</button>}
                  </div>
                  {activeRow === i && suggestions.length > 0 && (
                    <div style={S.dropdown}>
                      {suggestions.map((s) => (
                        <div key={s.id} style={S.dropdownItem} onMouseDown={() => pickSuggestion(i, s)}>
                          <div><div style={S.dropdownName}>{s.name}</div><div style={S.dropdownCat}>{s.category}</div></div>
                          <div><div style={S.dropdownPrice}>₹{s.selling_price}</div><div style={{ ...S.dropdownQty, color: Number(s.qty) <= Number(s.min_qty_alert) ? "#dc2626" : "#16a34a" }}>{s.qty} {s.unit} left</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={S.itemRowFooter}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input type="number" style={S.itemNumInput} value={item.qty}
                     min="1" max={item.maxQty !== Infinity ? item.maxQty : undefined} placeholder="Qty" onChange={(e) => updateItem(i, "qty", e.target.value)} />
                    {item.isStockItem && <div style={S.itemMaxHint}>max {item.maxQty}</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input type="number" style={S.itemNumInput} value={item.price} placeholder="Price ₹" onChange={(e) => updateItem(i, "price", e.target.value)} />
                  </div>

                   {applyGST && (
                      <select
                        style={{ ...S.itemNumInput, width: "70px" }}
                        value={item.gst_rate}
                        onChange={(e) => updateItem(i, "gst_rate", e.target.value)}
                      >
                        {[0, 3, 5, 12, 18, 28].map(r => (
                          <option key={r} value={r}>{r}%</option>
                        ))}
                      </select>
                    )}

                  <div style={S.itemAmtBox}>₹{(Number(item.qty) * Number(item.price)).toLocaleString("en-IN")}</div>
                </div>
              </div>
            ))}
            <button style={S.addBtn} onClick={addItem}>+ Add Item</button>
          </div>

          {/* Summary card */}
          <div style={S.card}>
            <p style={S.sectionLabel}>Summary</p>
            <div style={S.summaryRow}><span style={S.summaryLabel}>Subtotal</span><span style={S.summaryVal}>₹{subtotal.toLocaleString("en-IN")}</span></div>
            {applyGST && gstAmt > 0 && <div style={S.summaryRow}><span style={S.summaryLabel}>GST</span><span style={S.summaryVal}>₹{gstAmt.toLocaleString("en-IN")}</span></div>}
            <div style={S.summaryRow}>
              <span style={S.summaryLabel}>Discount ₹</span>
              <input type="number" style={S.discountInput} value={discount} min="0" onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div style={S.summaryTotalRow}><span style={S.summaryTotalLabel}>Total</span><span style={S.summaryTotalVal}>₹{total.toLocaleString("en-IN")}</span></div>
            <select style={S.select} value={payment} onChange={(e) => setPayment(e.target.value)}>
              {["Cash", "UPI", "PhonePe", "GooglePay", "Card", "Cheque", "Credit"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="number" style={{ ...S.input, marginTop: "10px", marginBottom: 0 }} placeholder="Advance Paid ₹" value={advance} min="0" onChange={(e) => setAdvance(e.target.value)} />
            <div style={S.statusRow}>
              <span>Status will be:</span>
              <span style={{ fontWeight: 700, color: Number(advance) >= total ? "#16a34a" : Number(advance) > 0 ? "#d97706" : "#dc2626" }}>
                {Number(advance) >= total ? "✅ Paid" : Number(advance) > 0 ? "⚡ Partial" : "⏳ Pending"}
              </span>
            </div>
            <div style={S.balanceBox}>
              <span style={S.balanceLabel}>Balance Due</span>
              <span style={S.balanceVal}>₹{balance.toLocaleString("en-IN")}</span>
            </div>
            {items.some((i) => i.isStockItem) && <div style={S.stockNote}>📦 Stock will be deducted automatically when you generate this invoice.</div>}

            {/* ★ Generate button — shows WhatsApp or SMS icon based on selection */}
            <button style={{ ...S.generateBtn, opacity: saving ? 0.7 : 1 }} onClick={handleGenerate} disabled={saving}>
              {saving ? "Saving…" : (
                <>
                  Generate Invoice
                  {shareMethod !== "none" && customer.mobile?.trim() && (
                    <span style={{ fontSize: "0.78rem", opacity: 0.85, display: "flex", alignItems: "center", gap: "4px" }}>
                      {shareMethod === "whatsapp" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      ) : "✉️"}
                      + {shareMethod === "whatsapp" ? "WhatsApp" : "SMS"}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // ── DESKTOP VIEW ─────────────────────────────────────────
  // ─────────────────────────────────────────────────────────
  return (
    <div className="invoice-page-full">
      {toast && (
        <div style={{ position:"fixed", top:"72px", left:"50%", transform:"translateX(-50%)", zIndex:9999, padding:"10px 24px", borderRadius:"100px", fontWeight:600, fontSize:"0.85rem", whiteSpace:"nowrap", background: toast.type === "whatsapp" ? "#25d366" : toast.type === "success" ? "#0e1b2e" : "#dc2626", color:"#fff", boxShadow:"0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}
      <ShareConfirmPopup />

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
        <h2>Create Invoice</h2>
        <span style={{ fontSize:"0.8rem", fontWeight:600, color:"#64748b", background:"#f1f5f9", padding:"6px 12px", borderRadius:"8px" }}>{invoiceId}</span>
      </div>

      {stockStats.total_items > 0 && (
        <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:"10px", padding:"10px 16px", marginBottom:"18px", display:"flex", gap:"20px", flexWrap:"wrap" }}>
          <span style={{ fontSize:"0.8rem", color:"#15803d" }}>{stockStats.total_items} products in stock</span>
          {stockStats.low_stock_count > 0 && <span style={{ fontSize:"0.8rem", color:"#dc2626", fontWeight:600 }}>{stockStats.low_stock_count} low-stock items</span>}
          <span style={{ fontSize:"0.8rem", color:"#64748b" }}>💡 Type a product name below to auto-fill price from stock</span>
        </div>
      )}

      <div className="top-grid">
        <input placeholder="Customer Name *" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
        <div>
          <input
            placeholder="Mobile Number *"
            value={customer.mobile}
            inputMode="numeric"
            maxLength={10}
            style={{
              borderColor: customer.mobile && !isValidMobile(customer.mobile) ? "#dc2626"
                         : customer.mobile && isValidMobile(customer.mobile) ? "#22c55e"
                         : undefined
            }}
            onChange={(e) => setCustomer({ ...customer, mobile: e.target.value.replace(/\D/g,"") })}
          />
          {customer.mobile && !isValidMobile(customer.mobile) && (
            <div style={{ fontSize:"0.72rem", color:"#dc2626", marginTop:4 }}>❌ Enter valid 10-digit number</div>
          )}
          {customer.mobile && isValidMobile(customer.mobile) && (
            <div style={{ fontSize:"0.72rem", color:"#15803d", marginTop:4 }}>✓ Valid</div>
          )}
        </div>
        {shopProfile?.gst_enabled && (
          <>
            <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "8px", fontSize: "0.85rem", color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
              ✅ GST Invoice &nbsp;
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 400 }}>
                Shop GST: {shopProfile.gst_number || "Registered"}
              </span>
            </div>
            <div>
              <input
                placeholder="Customer GST Number (optional)"
                value={customer.gst}
                style={{
                  borderColor: customer.gst.trim() && !isValidGST(customer.gst) ? "#dc2626"
                             : customer.gst.trim() && isValidGST(customer.gst) ? "#22c55e"
                             : undefined
                }}
                onChange={(e) => setCustomer({ ...customer, gst: e.target.value.toUpperCase() })}
              />
              {customer.gst.trim() && !isValidGST(customer.gst) && (
                <div style={{ fontSize:"0.72rem", color:"#dc2626", marginTop:4 }}>❌ Invalid GST — format: 29ABCDE1234F1Z5</div>
              )}
              {customer.gst.trim() && isValidGST(customer.gst) && (
                <div style={{ fontSize:"0.72rem", color:"#15803d", marginTop:4 }}>✓ Valid GST number</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ★ Share method picker — desktop */}
      {customer.mobile?.trim().length >= 6 && (
        <div style={{ marginBottom: "18px" }}>
          <ShareMethodPicker />
        </div>
      )}

      <div className="invoice-layout">
        {/* LEFT — Items */}
        <div className="items-section">
          <table className="items-table">
            <thead>
              <tr><th style={{ textAlign:"left" }}>Item</th><th>Qty</th><th>Price ₹</th><th>Amount</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ position:"relative" }}>
                  <td style={{ position:"relative" }}>
                    <input
                      ref={i === items.length - 1 ? lastInputRef : null}
                      value={item.name} placeholder="Product name…"
                      onChange={(e) => handleNameChange(i, e.target.value)}
                      onFocus={() => { if (item.name.trim().length >= 1) { searchProducts(item.name).then(setSuggestions).catch(() => {}); setActiveRow(i); } }}
                      onBlur={() => { setTimeout(() => { setSuggestions([]); setActiveRow(null); }, 180); }}
                      style={{ borderColor: item.isStockItem ? "#22c55e" : undefined }}
                    />
                    {item.isStockItem && <span style={{ position:"absolute", top:"4px", right:"6px", fontSize:"0.6rem", fontWeight:700, background:"#dcfce7", color:"#15803d", padding:"1px 6px", borderRadius:"100px" }}>Stock</span>}
                    {activeRow === i && suggestions.length > 0 && (
                      <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#fff", border:"1px solid #e2e8f0", borderRadius:"10px", boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:500, overflow:"hidden" }}>
                        {suggestions.map((s) => (
                          <div key={s.id} onMouseDown={() => pickSuggestion(i, s)} style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }} onMouseEnter={(e) => e.currentTarget.style.background="#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background="#fff"}>
                            <div><strong style={{ fontSize:"0.88rem", color:"#0f172a" }}>{s.name}</strong><span style={{ fontSize:"0.75rem", color:"#64748b", marginLeft:"8px" }}>{s.category}</span></div>
                            <div style={{ textAlign:"right" }}><div style={{ fontSize:"0.88rem", fontWeight:700, color:"#2563eb" }}>₹{s.selling_price}</div><div style={{ fontSize:"0.72rem", color: Number(s.qty) <= Number(s.min_qty_alert) ? "#dc2626" : "#16a34a" }}>{s.qty} {s.unit} left</div></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <input type="number" value={item.qty} min="1" max={item.maxQty !== Infinity ? item.maxQty : undefined} placeholder="Qty" onChange={(e) => updateItem(i, "qty", e.target.value)} />
                    {item.isStockItem && <div style={{ fontSize:"0.65rem", color:"#64748b", textAlign:"center", marginTop:"2px" }}>max {item.maxQty}</div>}
                  </td>
                  <td><input type="number" value={item.price} placeholder="Price" onChange={(e) => updateItem(i, "price", e.target.value)} /></td>
                  <td style={{ fontWeight:600, textAlign:"center" }}>₹{(Number(item.qty) * Number(item.price)).toLocaleString("en-IN")}</td>
                  <td>{items.length > 1 && <button className="remove-btn" onClick={() => removeItem(i)}>✕</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="add-btn" onClick={addItem} style={{ marginTop:"14px" }}>+ Add Item &nbsp;<span style={{ opacity:0.6, fontSize:"0.75rem" }}>Enter</span></button>
        </div>

        {/* RIGHT — Summary */}
        <div className="summary-panel">
          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
          {applyGST && gstAmt > 0 && <div className="summary-row"><span>GST</span><span>₹{gstAmt.toLocaleString("en-IN")}</span></div>}
          <div className="summary-row">
            <span>Discount ₹</span>
            <input type="number" value={discount} min="0" onChange={(e) => setDiscount(e.target.value)} style={{ width:"90px", textAlign:"right" }} />
          </div>
          <div className="summary-total"><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
          <select value={payment} onChange={(e) => setPayment(e.target.value)} style={{ width:"100%", marginTop:"10px" }}>
            {["Cash", "UPI", "PhonePe", "GooglePay", "Card", "Cheque", "Credit"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="number" placeholder="Advance Paid ₹" value={advance} min="0" onChange={(e) => setAdvance(e.target.value)} style={{ marginTop:"12px" }} />
          <div style={{ marginTop:"10px", fontSize:"0.78rem", color:"#64748b", display:"flex", alignItems:"center", gap:"6px" }}>
            Status will be:&nbsp;
            <span style={{ fontWeight:700, color: Number(advance) >= total ? "#16a34a" : Number(advance) > 0 ? "#d97706" : "#dc2626" }}>
              {Number(advance) >= total ? "✅ Paid" : Number(advance) > 0 ? "⚡ Partial" : "⏳ Pending"}
            </span>
          </div>
          <div className="balance" style={{ marginTop:"14px" }}>Balance: <strong>₹{balance.toLocaleString("en-IN")}</strong></div>
          {items.some((i) => i.isStockItem) && (
            <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:"8px", padding:"10px 12px", marginTop:"12px", fontSize:"0.78rem", color:"#15803d" }}>
              📦 Stock will be deducted automatically.
            </div>
          )}
          <button className="generate-btn" onClick={handleGenerate} disabled={saving} style={{ marginTop:"14px", opacity: saving ? 0.7 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
            {saving ? "Saving…" : (
              <>
                Generate Invoice
                {shareMethod !== "none" && customer.mobile?.trim() && (
                  <span style={{ fontSize:"0.75rem", opacity:0.85, background:"rgba(255,255,255,0.2)", padding:"2px 8px", borderRadius:"20px" }}>
                    + {shareMethod === "whatsapp" ? "WhatsApp" : "SMS"}
                  </span>
                )}
                {!saving && <span style={{ opacity:0.6, fontSize:"0.75rem" }}>Ctrl+Enter</span>}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;
