import React, { useState, useEffect } from "react";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductStats,
  getShopProfile,
} from "../../services/businessService";

// ─── UNIT SETS BY SHOP TYPE ───────────────────────────────────
const UNITS_BY_SHOP = {
  "Kirana Store":    ["bag","kg","gram","packet","litre","ml","dozen","piece"],
  "Clothing":        ["piece","set","pair","dozen"],
  "HardWare":        ["piece","box","set","kg","gram","metre","litre","ml","bag","roll","bundle"],
  "Medical":         ["strip","bottle","box","tube","sachet","vial","piece","ml","gram","kg"],
  "Gold and Silver": ["gram","kg","piece","set","pair"],
  "Resturants":      ["kg","gram","litre","ml","piece","packet","bag","dozen"],
  "Genral Store":    ["piece","kg","gram","litre","ml","bag","box","dozen","metre","set","packet"],
  "default":         ["piece","kg","gram","litre","ml","bag","box","dozen","metre","set","roll","bundle","packet","strip","bottle"],
};

// ─── CATEGORIES BY SHOP TYPE ──────────────────────────────────
const CATEGORIES_BY_SHOP = {
  "Kirana Store":    ["Atta & Rice","Dal & Pulses","Oil & Ghee","Sugar & Salt","Spices","Dry Fruits","Biscuits & Snacks","Beverages","Soap & Detergent","Dairy","Other"],
  "Clothing":        ["Men","Women","Boy","Girl","Unisex"],
  "HardWare":        ["Pipes & Fittings","Electrical","Paint & Primer","Cement & Sand","Tools","Bolts & Screws","Tiles","Wood & Ply","Safety Gear","Other"],
  "Medical":         ["Tablets","Syrups","Injections","Surgical","OTC Medicines","Vitamins & Supplements","Ayurvedic","Cosmetics","Baby Care","Other"],
  "Gold and Silver": ["Gold Jewellery","Silver Jewellery","Coins & Bars","Diamonds","Gemstones","Accessories","Other"],
  "Resturants":      ["Breakfast","Lunch","Dinner","Snacks","Beverages","Sweets","Bakery","Other"],
  "Genral Store":    ["Electronics","Grocery","Clothing","Hardware","Stationery","Toys","Sports","Home & Kitchen","Personal Care","Other"],
  "default":         ["General","Electronics","Grocery","Clothing","Hardware","Medical","Stationery","Food & Beverages","Other"],
};

const CLOTHING_TYPES  = ["Shirt","T-Shirt","Pant","Jeans","Kurta","Saree","Lehenga","Suit","Jacket","Pair","Set","Other"];
const CLOTHING_SIZES  = ["Free Size","XS","S","M","L","XL","XXL","XXXL","28","30","32","34","36","38","40","42"];
const CLOTHING_COLORS = ["Red","Blue","Green","Yellow","Black","White","Gray","Pink","Purple","Orange","Brown","Beige","Navy","Maroon","Teal","Olive","Coral","Turquoise","Lavender","Gold","Silver","Multi-color"];
const HW_BRANDS       = ["Asian Paints","Berger","Havells","Finolex","Astral","Prince","Supreme","Stanley","Other"];
const HW_MATERIALS    = ["Iron","Steel","Copper","PVC","CPVC","GI","Aluminium","Wood","Plastic","Other"];
const MED_COMPANIES   = ["Sun Pharma","Cipla","Dr. Reddy's","Mankind","Lupin","Abbott","Pfizer","Zydus","Alkem","Other"];
const MED_SCHEDULES   = ["OTC","Schedule H","Schedule H1","Schedule X","Ayurvedic","OTC-Cosmetic"];
const GOLD_PURITY     = ["24K (999)","22K (916)","18K (750)","14K (585)","Silver 999","Silver 925","Silver 800"];
const METAL_TYPES     = ["Gold","Silver","Platinum","Diamond","Gemstone","Mixed"];

// ─── FRONTEND FORM KEYS (camelCase) → BACKEND KEYS (snake_case) ──
// Frontend        Backend
// purchasePrice   purchase_price
// sellingPrice    selling_price
// minQtyAlert     min_qty_alert
// hsnCode         hsn_code
// shopType        shop_type
// clothingType    clothing_type
// clothingSize    clothing_size
// clothingColor   clothing_color
// clothingGender  clothing_gender
// hwBrand         hw_brand
// hwMaterial      hw_material
// hwModel         hw_model
// medCompany      med_company
// medSchedule     med_schedule
// medExpiry       med_expiry
// medBatch        med_batch
// goldPurity      gold_purity
// metalType       metal_type
// goldWeight      gold_weight
// makingCharges   making_charges
// is_low_stock    is_low_stock   (read-only from backend)
// stock_value     stock_value    (read-only from backend)

// ─── BASE EMPTY FORM (frontend camelCase) ─────────────────────
const BASE_EMPTY_FORM = {
  name: "", category: "General", unit: "piece",
  purchasePrice: "", sellingPrice: "", qty: "", minQtyAlert: "5", hsnCode: "",
  clothingType: "", clothingSize: "", clothingColor: "", clothingGender: "",
  hwBrand: "", hwMaterial: "", hwModel: "",
  medCompany: "", medSchedule: "OTC", medExpiry: "", medBatch: "",
  goldPurity: "", metalType: "Gold", goldWeight: "", makingCharges: "",
};

const getEmptyForm = (shopType) => {
  const base = { ...BASE_EMPTY_FORM };
  switch (shopType) {
    case "Kirana Store":    return { ...base, category: "Atta & Rice",      unit: "bag"   };
    case "Clothing":        return { ...base, category: "Men",              unit: "piece" };
    case "HardWare":        return { ...base, category: "Pipes & Fittings", unit: "piece" };
    case "Medical":         return { ...base, category: "Tablets",          unit: "strip", minQtyAlert: "10" };
    case "Gold and Silver": return { ...base, category: "Gold Jewellery",   unit: "gram",  minQtyAlert: "1"  };
    case "Resturants":      return { ...base, category: "Breakfast",        unit: "kg"    };
    default:                return { ...base, category: "General",          unit: "piece" };
  }
};

// ─── Convert backend snake_case product → frontend camelCase ──
const fromApi = (p) => ({
  id:             p.id,
  name:           p.name           || "",
  category:       p.category       || "General",
  unit:           p.unit           || "piece",
  purchasePrice:  p.purchase_price != null ? String(p.purchase_price) : "",
  sellingPrice:   p.selling_price  != null ? String(p.selling_price)  : "",
  qty:            p.qty            != null ? Number(p.qty)             : 0,
  minQtyAlert:    p.min_qty_alert  != null ? Number(p.min_qty_alert)   : 5,
  hsnCode:        p.hsn_code       || "",
  shopType:       p.shop_type      || "",
  isLowStock:     p.is_low_stock   || false,
  // Clothing
  clothingType:   p.clothing_type   || "",
  clothingSize:   p.clothing_size   || "",
  clothingColor:  p.clothing_color  || "",
  clothingGender: p.clothing_gender || "",
  // Hardware
  hwBrand:    p.hw_brand    || "",
  hwMaterial: p.hw_material || "",
  hwModel:    p.hw_model    || "",
  // Medical
  medCompany:  p.med_company  || "",
  medSchedule: p.med_schedule || "OTC",
  medExpiry:   p.med_expiry   || "",
  medBatch:    p.med_batch    || "",
  // Gold
  goldPurity:    p.gold_purity    || "",
  metalType:     p.metal_type     || "",
  goldWeight:    p.gold_weight    || "",
  makingCharges: p.making_charges != null ? Number(p.making_charges) : 0,
});

// ─── Convert frontend form → backend payload (snake_case) ─────
const toApi = (form, shopType, finalName) => ({
  name:           finalName,
  category:       form.category,
  unit:           form.unit,
  purchase_price: Number(form.purchasePrice) || 0,
  selling_price:  Number(form.sellingPrice),
  qty:            Number(form.qty),
  min_qty_alert:  Number(form.minQtyAlert) || 5,
  hsn_code:       form.hsnCode?.trim() || "",
  shop_type:      shopType,
  // Clothing
  clothing_type:   shopType === "Clothing"        ? form.clothingType   : "",
  clothing_size:   shopType === "Clothing"        ? form.clothingSize   : "",
  clothing_color:  shopType === "Clothing"        ? form.clothingColor  : "",
  clothing_gender: shopType === "Clothing"        ? form.clothingGender : "",
  // Hardware
  hw_brand:    shopType === "HardWare"        ? form.hwBrand    : "",
  hw_material: shopType === "HardWare"        ? form.hwMaterial : "",
  hw_model:    shopType === "HardWare"        ? form.hwModel    : "",
  // Medical
  med_company:  shopType === "Medical"         ? form.medCompany  : "",
  med_schedule: shopType === "Medical"         ? form.medSchedule : "",
  med_expiry:   shopType === "Medical"         ? form.medExpiry   : "",
  med_batch:    shopType === "Medical"         ? form.medBatch    : "",
  // Gold
  gold_purity:    shopType === "Gold and Silver" ? form.goldPurity    : "",
  metal_type:     shopType === "Gold and Silver" ? form.metalType     : "",
  gold_weight:    shopType === "Gold and Silver" ? form.goldWeight    : "",
  making_charges: shopType === "Gold and Silver" ? Number(form.makingCharges) || 0 : 0,
});

// ─── SHOP THEME CONFIG ────────────────────────────────────────
const SHOP_THEME = {
  "Kirana Store":    { icon: "🛒", color: "#16a34a", label: "Kirana Store",    hint: "Groceries, FMCG, Provisions" },
  "Clothing":        { icon: "👗", color: "#7c3aed", label: "Clothing Store",  hint: "Apparels, Fashion, Textiles" },
  "HardWare":        { icon: "🔧", color: "#ea580c", label: "Hardware Store",  hint: "Pipes, Electrical, Tools, Paint" },
  "Medical":         { icon: "💊", color: "#0284c7", label: "Medical Store",   hint: "Medicines, Surgical, Health" },
  "Gold and Silver": { icon: "💍", color: "#d97706", label: "Gold & Silver",   hint: "Jewellery, Coins, Precious Metals" },
  "Resturants":      { icon: "🍽️", color: "#dc2626", label: "Restaurant",      hint: "Raw materials, Ingredients" },
  "Genral Store":    { icon: "🏪", color: "#2563eb", label: "General Store",   hint: "Multi-category retail" },
  "default":         { icon: "📦", color: "#2563eb", label: "Stock Entry",     hint: "" },
};
const theme = (shopType) => SHOP_THEME[shopType] || SHOP_THEME["default"];

// ─── REUSABLE FIELD WRAPPER ───────────────────────────────────
const Field = ({ label, children, full }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "5px", gridColumn: full ? "1 / -1" : undefined }}>
    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {label}
    </label>
    {children}
  </div>
);

const inputStyle  = { padding: "10px 13px", borderRadius: "9px", border: "1.5px solid #e2e8f0", fontSize: "14px", background: "#fff", outline: "none", transition: "border-color 0.15s" };
const selectStyle = { ...inputStyle, cursor: "pointer" };

// ═════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
const Products = () => {
  const [stock,       setStock]       = useState([]);   // camelCase after fromApi()
  const [form,        setForm]        = useState(BASE_EMPTY_FORM);
  const [search,      setSearch]      = useState("");
  const [filterCat,   setFilterCat]   = useState("All");
  const [toast,       setToast]       = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [stats,       setStats]       = useState({});
  const [lowStock,    setLowStock]    = useState([]);
  const [tab,         setTab]         = useState("list");
  const [shopProfile, setShopProfile] = useState(null);  // { shop_type, ... }
  const [editingId,   setEditingId]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  // shop_type from API — backend field name is shop_type
  const shopType  = shopProfile?.shop_type || "default";
  const t         = theme(shopType);
  const units     = UNITS_BY_SHOP[shopType]     || UNITS_BY_SHOP["default"];
  const categories= CATEGORIES_BY_SHOP[shopType] || CATEGORIES_BY_SHOP["default"];

  // ── Load everything on mount ───────────────────────────────
  useEffect(() => {
    loadAll();
  }, []);

  // ── Reset form when shop type changes ─────────────────────
  useEffect(() => {
    if (!editingId) setForm(getEmptyForm(shopType));
  }, [shopType]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profileData, productData, statsData, lowStockData] = await Promise.all([
        getShopProfile().catch(() => null),
        getProducts(),
        getProductStats(),
        getLowStockProducts(),
      ]);
      if (profileData) setShopProfile(profileData);
      setStock(productData.map(fromApi));
      setStats(statsData);
      setLowStock(lowStockData.map(fromApi));
    } catch {
      showToast("Failed to load stock data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const refreshStock = async () => {
    try {
      const [productData, statsData, lowStockData] = await Promise.all([
        getProducts(),
        getProductStats(),
        getLowStockProducts(),
      ]);
      setStock(productData.map(fromApi));
      setStats(statsData);
      setLowStock(lowStockData.map(fromApi));
    } catch {}
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Auto-build clothing name ───────────────────────────────
  const buildClothingName = () => {
    const parts = [form.clothingGender, form.clothingType, form.clothingColor, form.clothingSize].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : form.name;
  };

  // ── Auto-build gold name ───────────────────────────────────
  const buildGoldName = () => {
    return [form.metalType, form.goldPurity, form.name].filter(Boolean).join(" - ");
  };

  // ── SAVE / UPDATE ──────────────────────────────────────────
  const handleAddStock = async () => {
    let finalName = form.name.trim();
    if (shopType === "Clothing" && !finalName) {
      finalName = buildClothingName();
      if (!finalName) { showToast("Enter item name or select Type/Color/Size", "error"); return; }
    }
    if (shopType === "Gold and Silver" && !finalName) {
      finalName = buildGoldName();
    }
    if (!finalName)                                { showToast("Item name is required", "error");         return; }
    if (!form.qty || Number(form.qty) <= 0)        { showToast("Enter a valid quantity", "error");        return; }
    if (!form.sellingPrice || Number(form.sellingPrice) <= 0) { showToast("Enter a valid selling price", "error"); return; }
    if (shopType === "Medical" && !form.medExpiry) { showToast("Expiry date is required for medicines", "error"); return; }

    const payload = toApi(form, shopType, finalName);
    setSaving(true);
    try {
      if (editingId) {
        // UPDATE — PATCH to /api/business/products/<id>/
        await updateProduct(editingId, payload);
        showToast(`"${finalName}" updated successfully`);
        setEditingId(null);
      } else {
        // CREATE — POST to /api/business/products/
        // Backend auto-merges if same name exists and returns { merged: true/false }
        const result = await addProduct(payload);
        if (result.merged) {
          showToast(`"${result.name}" qty updated — stock merged`);
        } else {
          showToast(`"${result.name}" added to stock`);
        }
      }
      setForm(getEmptyForm(shopType));
      setTab("list");
      await refreshStock();
    } catch (err) {
      const msg = err?.response?.data?.name?.[0]
        || err?.response?.data?.detail
        || "Failed to save. Please try again.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE (soft delete — backend sets is_active=False) ───
  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setStock((prev) => prev.filter((s) => s.id !== id));
      setConfirmDel(null);
      showToast("Item removed from stock");
      await refreshStock();
    } catch {
      showToast("Failed to remove item.", "error");
    }
  };

  // ── EDIT — populate form with backend data ─────────────────
  const handleEdit = (item) => {
    setForm({
      ...BASE_EMPTY_FORM,
      name:           item.name,
      category:       item.category,
      unit:           item.unit,
      purchasePrice:  item.purchasePrice != null ? String(item.purchasePrice) : "",
      sellingPrice:   item.sellingPrice  != null ? String(item.sellingPrice)  : "",
      qty:            item.qty           != null ? String(item.qty)           : "",
      minQtyAlert:    item.minQtyAlert   != null ? String(item.minQtyAlert)   : "5",
      hsnCode:        item.hsnCode       || "",
      clothingType:   item.clothingType  || "",
      clothingSize:   item.clothingSize  || "",
      clothingColor:  item.clothingColor || "",
      clothingGender: item.clothingGender|| "",
      hwBrand:        item.hwBrand       || "",
      hwMaterial:     item.hwMaterial    || "",
      hwModel:        item.hwModel       || "",
      medCompany:     item.medCompany    || "",
      medSchedule:    item.medSchedule   || "OTC",
      medExpiry:      item.medExpiry     || "",
      medBatch:       item.medBatch      || "",
      goldPurity:     item.goldPurity    || "",
      metalType:      item.metalType     || "Gold",
      goldWeight:     item.goldWeight    || "",
      makingCharges:  item.makingCharges != null ? String(item.makingCharges) : "",
    });
    setEditingId(item.id);
    setTab("add");
  };

  const handleCancelEdit = () => {
    setForm(getEmptyForm(shopType));
    setEditingId(null);
    setTab("list");
  };

  // ── Filter (client-side on already-loaded data) ────────────
  const filtered = stock.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = filterCat === "All" || s.category === filterCat;
    return matchSearch && matchCat;
  });

  const allCategories = ["All", ...new Set(stock.map((s) => s.category))];

  const margin = form.purchasePrice && form.sellingPrice
    ? (Number(form.sellingPrice) - Number(form.purchasePrice)).toFixed(2)
    : null;

  const goldTotalValue = shopType === "Gold and Silver" && form.sellingPrice && form.qty
    ? (Number(form.sellingPrice) * Number(form.qty || 1)) + Number(form.makingCharges || 0)
    : null;

  // ── Stats mapping: backend uses snake_case ─────────────────
  // stats.total_items, stats.total_value, stats.low_stock_count, stats.total_qty

  // ═══════════════════════════════════════════════════════════
  //   RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="stock-page">

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

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
        <h2 style={{ margin: 0 }}>Stock Entry</h2>
        {shopProfile && (
          <span style={{
            background: t.color + "18", color: t.color,
            border: `1.5px solid ${t.color}44`,
            padding: "4px 12px", borderRadius: "100px",
            fontSize: "0.76rem", fontWeight: 700,
          }}>
            {t.icon} {t.label}
          </span>
        )}
      </div>
      {t.hint && <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: "#64748b" }}>{t.hint}</p>}

      {/* No shop profile warning */}
      {!shopProfile && !loading && (
        <div style={{
          background: "#fffbeb", border: "1px solid #fcd34d",
          borderRadius: "12px", padding: "12px 18px", marginBottom: "18px",
          fontSize: "0.83rem", color: "#92400e",
        }}>
          ⚠️ <strong>Shop Profile not set.</strong> Go to <strong>Shop Profile</strong> to select your business type.
        </div>
      )}

      {/* Stats row — backend: total_items, total_value, low_stock_count, total_qty */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        {[
          { label: "Total Products",   value: stats.total_items     || 0,      color: t.color },
          { label: "Stock Value",      value: `₹${(stats.total_value || 0).toLocaleString("en-IN")}`, color: "#16a34a" },
          { label: "Low Stock Alerts", value: stats.low_stock_count  || 0,      color: (stats.low_stock_count || 0) > 0 ? "#dc2626" : "#16a34a" },
          { label: "Total Units",      value: stats.total_qty        || 0,      color: "#7c3aed" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#fff", borderRadius: "12px", padding: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.color}`,
          }}>
            <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginBottom: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Low stock banner */}
      {lowStock.length > 0 && (
        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa",
          borderRadius: "12px", padding: "14px 18px", marginBottom: "20px",
        }}>
          <strong style={{ color: "#c2410c", fontSize: "0.88rem" }}>
            ⚠️ Low Stock — {lowStock.length} item{lowStock.length > 1 ? "s" : ""} need restocking
          </strong>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {lowStock.map((s) => (
              <span key={s.id} style={{
                background: "#fee2e2", color: "#991b1b",
                padding: "3px 10px", borderRadius: "100px",
                fontSize: "0.73rem", fontWeight: 600,
              }}>
                {s.name} — {s.qty} {s.unit} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="sub-nav">
        {[
          { key: "list", label: "📋 Stock List" },
          { key: "add",  label: editingId ? "✏️ Edit Stock" : "➕ Add Stock" },
        ].map((tb) => (
          <button
            key={tb.key}
            className={`sub-link${tab === tb.key ? " active" : ""}`}
            onClick={() => { setTab(tb.key); if (tb.key === "list" && editingId) handleCancelEdit(); }}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          ADD / EDIT STOCK TAB
      ══════════════════════════════════════ */}
      {tab === "add" && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ margin: "0 0 4px" }}>
            {editingId ? "Edit Stock Item" : `Add Stock — ${t.icon} ${t.label}`}
          </h3>
          <p style={{ fontSize: "0.83rem", color: "#64748b", marginBottom: "20px" }}>
            {editingId ? "Update the details below and click Update Stock." : "Same item name will auto-merge quantity."}
          </p>

          {/* ── KIRANA / RESTAURANT / GENERAL / DEFAULT FORM ── */}
          {(shopType === "Kirana Store" || shopType === "Resturants" || shopType === "Genral Store" || shopType === "default" || !shopProfile) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
              <Field label="Item Name *" full>
                <input name="name" placeholder="e.g. Basmati Rice, Toor Dal..." value={form.name} onChange={handleChange} style={inputStyle} />
              </Field>
              <Field label="Category">
                <select name="category" value={form.category} onChange={handleChange} style={selectStyle}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Unit">
                <select name="unit" value={form.unit} onChange={handleChange} style={selectStyle}>
                  {units.map((u) => <option key={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Quantity *">
                <input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={inputStyle} />
              </Field>
              <Field label="Purchase Price ₹">
                <input name="purchasePrice" type="number" placeholder="Cost price" value={form.purchasePrice} onChange={handleChange} min="0" style={inputStyle} />
              </Field>
              <Field label="Selling Price ₹ *">
                <input name="sellingPrice" type="number" placeholder="Sale price" value={form.sellingPrice} onChange={handleChange} min="0" style={inputStyle} />
              </Field>
              <Field label="Low Stock Alert at Qty">
                <input name="minQtyAlert" type="number" placeholder="5" value={form.minQtyAlert} onChange={handleChange} min="0" style={inputStyle} />
              </Field>
              <Field label="HSN Code (GST)">
                <input name="hsnCode" placeholder="e.g. 1006" value={form.hsnCode} onChange={handleChange} style={inputStyle} />
              </Field>
            </div>
          )}

          {/* ── CLOTHING FORM ── */}
          {shopType === "Clothing" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>👗 Clothing Details</div>
                <div style={{ height: "2px", background: t.color + "22", borderRadius: "2px" }} />
              </div>
              <Field label="Gender / Category *">
                <select name="clothingGender" value={form.clothingGender} onChange={handleChange} style={selectStyle}>
                  <option value="">Select...</option>
                  {["Men","Women","Boy","Girl","Unisex"].map(g => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Type *">
                <select name="clothingType" value={form.clothingType} onChange={handleChange} style={selectStyle}>
                  <option value="">Select...</option>
                  {CLOTHING_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Color">
                <select name="clothingColor" value={form.clothingColor} onChange={handleChange} style={selectStyle}>
                  <option value="">Select...</option>
                  {CLOTHING_COLORS.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Size">
                <select name="clothingSize" value={form.clothingSize} onChange={handleChange} style={selectStyle}>
                  <option value="">Select...</option>
                  {CLOTHING_SIZES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Custom Name (optional)" full>
                <input name="name" placeholder="Auto-built from above — or type custom name" value={form.name} onChange={handleChange} style={inputStyle} />
                {(form.clothingGender || form.clothingType) && !form.name && (
                  <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "3px" }}>
                    Will save as: <strong>{buildClothingName()}</strong>
                  </span>
                )}
              </Field>
              <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>💰 Pricing & Stock</div>
                <div style={{ height: "2px", background: t.color + "22", borderRadius: "2px" }} />
              </div>
              <Field label="Unit"><select name="unit" value={form.unit} onChange={handleChange} style={selectStyle}>{units.map(u => <option key={u}>{u}</option>)}</select></Field>
              <Field label="Quantity *"><input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Purchase Price ₹"><input name="purchasePrice" type="number" placeholder="Cost price" value={form.purchasePrice} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Selling Price ₹ *"><input name="sellingPrice" type="number" placeholder="MRP / Sale price" value={form.sellingPrice} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Low Stock Alert at"><input name="minQtyAlert" type="number" placeholder="5" value={form.minQtyAlert} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="HSN Code (GST)"><input name="hsnCode" placeholder="e.g. 6205" value={form.hsnCode} onChange={handleChange} style={inputStyle} /></Field>
            </div>
          )}

          {/* ── HARDWARE FORM ── */}
          {shopType === "HardWare" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>🔧 Hardware Item Details</div>
                <div style={{ height: "2px", background: t.color + "22", borderRadius: "2px" }} />
              </div>
              <Field label="Item Name *" full><input name="name" placeholder="e.g. 1/2 inch PVC Pipe, 6A Switch..." value={form.name} onChange={handleChange} style={inputStyle} /></Field>
              <Field label="Category *"><select name="category" value={form.category} onChange={handleChange} style={selectStyle}>{categories.map(c => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Brand"><select name="hwBrand" value={form.hwBrand} onChange={handleChange} style={selectStyle}><option value="">Select / Other</option>{HW_BRANDS.map(b => <option key={b}>{b}</option>)}</select></Field>
              <Field label="Material"><select name="hwMaterial" value={form.hwMaterial} onChange={handleChange} style={selectStyle}><option value="">Select...</option>{HW_MATERIALS.map(m => <option key={m}>{m}</option>)}</select></Field>
              <Field label="Model / Size / Spec"><input name="hwModel" placeholder="e.g. 1/2 inch, 4mm, 100W" value={form.hwModel} onChange={handleChange} style={inputStyle} /></Field>
              <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>📦 Stock & Pricing</div>
                <div style={{ height: "2px", background: t.color + "22", borderRadius: "2px" }} />
              </div>
              <Field label="Unit"><select name="unit" value={form.unit} onChange={handleChange} style={selectStyle}>{units.map(u => <option key={u}>{u}</option>)}</select></Field>
              <Field label="Quantity *"><input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Purchase Price ₹"><input name="purchasePrice" type="number" placeholder="Cost price" value={form.purchasePrice} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Selling Price ₹ *"><input name="sellingPrice" type="number" placeholder="Sale price" value={form.sellingPrice} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Low Stock Alert at"><input name="minQtyAlert" type="number" placeholder="5" value={form.minQtyAlert} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="HSN Code (GST)"><input name="hsnCode" placeholder="e.g. 7307" value={form.hsnCode} onChange={handleChange} style={inputStyle} /></Field>
            </div>
          )}

          {/* ── MEDICAL FORM ── */}
          {shopType === "Medical" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>💊 Medicine / Product Details</div>
                <div style={{ height: "2px", background: t.color + "22", borderRadius: "2px" }} />
              </div>
              <Field label="Medicine / Product Name *" full><input name="name" placeholder="e.g. Dolo 650mg, Crocin, Omez D..." value={form.name} onChange={handleChange} style={inputStyle} /></Field>
              <Field label="Category *"><select name="category" value={form.category} onChange={handleChange} style={selectStyle}>{categories.map(c => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Company / Manufacturer"><select name="medCompany" value={form.medCompany} onChange={handleChange} style={selectStyle}><option value="">Select / Other</option>{MED_COMPANIES.map(c => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Schedule / Type"><select name="medSchedule" value={form.medSchedule} onChange={handleChange} style={selectStyle}>{MED_SCHEDULES.map(s => <option key={s}>{s}</option>)}</select></Field>
              <Field label="Batch Number"><input name="medBatch" placeholder="Batch No." value={form.medBatch} onChange={handleChange} style={inputStyle} /></Field>
              <Field label="Expiry Date *">
                <input name="medExpiry" type="month" value={form.medExpiry} onChange={handleChange}
                  style={{ ...inputStyle, borderColor: !form.medExpiry ? "#fca5a5" : "#e2e8f0" }} />
              </Field>
              <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>📦 Stock & Pricing</div>
                <div style={{ height: "2px", background: t.color + "22", borderRadius: "2px" }} />
              </div>
              <Field label="Unit"><select name="unit" value={form.unit} onChange={handleChange} style={selectStyle}>{units.map(u => <option key={u}>{u}</option>)}</select></Field>
              <Field label="Quantity *"><input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Purchase Price ₹ (MRP)"><input name="purchasePrice" type="number" placeholder="Cost / MRP" value={form.purchasePrice} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Selling Price ₹ *"><input name="sellingPrice" type="number" placeholder="Your selling price" value={form.sellingPrice} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Low Stock Alert at"><input name="minQtyAlert" type="number" placeholder="10" value={form.minQtyAlert} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="HSN Code (GST)"><input name="hsnCode" placeholder="e.g. 3004" value={form.hsnCode} onChange={handleChange} style={inputStyle} /></Field>
              {form.medExpiry && new Date(`${form.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                <div style={{ gridColumn: "1 / -1", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "10px", padding: "10px 14px", fontSize: "0.8rem", color: "#92400e" }}>
                  ⚠️ <strong>Expiry soon!</strong> This medicine expires within 90 days. Monitor carefully.
                </div>
              )}
            </div>
          )}

          {/* ── GOLD & SILVER FORM ── */}
          {shopType === "Gold and Silver" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>💍 Jewellery / Metal Details</div>
                <div style={{ height: "2px", background: t.color + "22", borderRadius: "2px" }} />
              </div>
              <Field label="Metal Type *"><select name="metalType" value={form.metalType} onChange={handleChange} style={selectStyle}>{METAL_TYPES.map(m => <option key={m}>{m}</option>)}</select></Field>
              <Field label="Purity / Karat"><select name="goldPurity" value={form.goldPurity} onChange={handleChange} style={selectStyle}><option value="">Select...</option>{GOLD_PURITY.map(p => <option key={p}>{p}</option>)}</select></Field>
              <Field label="Item Name / Description *" full><input name="name" placeholder="e.g. Necklace, Bangle, Ring, Coin..." value={form.name} onChange={handleChange} style={inputStyle} /></Field>
              <Field label="Category *"><select name="category" value={form.category} onChange={handleChange} style={selectStyle}>{categories.map(c => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Weight (grams) *"><input name="goldWeight" type="number" placeholder="Weight in grams" value={form.goldWeight} onChange={handleChange} min="0" step="0.01" style={inputStyle} /></Field>
              <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>💰 Pricing</div>
                <div style={{ height: "2px", background: t.color + "22", borderRadius: "2px" }} />
              </div>
              <Field label="Unit"><select name="unit" value={form.unit} onChange={handleChange} style={selectStyle}>{units.map(u => <option key={u}>{u}</option>)}</select></Field>
              <Field label="Quantity *"><input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Rate per gram / unit ₹ *"><input name="sellingPrice" type="number" placeholder="Rate per gram" value={form.sellingPrice} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Purchase Rate ₹"><input name="purchasePrice" type="number" placeholder="Your cost rate" value={form.purchasePrice} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Making Charges ₹"><input name="makingCharges" type="number" placeholder="Making charges" value={form.makingCharges} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="Low Stock Alert at"><input name="minQtyAlert" type="number" placeholder="1" value={form.minQtyAlert} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="HSN Code (GST)"><input name="hsnCode" placeholder="e.g. 7113" value={form.hsnCode} onChange={handleChange} style={inputStyle} /></Field>
              {goldTotalValue && (
                <div style={{ gridColumn: "1 / -1", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "0.83rem", color: "#78350f" }}>
                  <span>💍 Item Value: <strong>₹{(Number(form.sellingPrice) * Number(form.qty || 1)).toLocaleString("en-IN")}</strong></span>
                  <span>🔨 Making Charges: <strong>₹{Number(form.makingCharges || 0).toLocaleString("en-IN")}</strong></span>
                  <span>✅ Total: <strong>₹{goldTotalValue.toLocaleString("en-IN")}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Live margin preview */}
          {shopType !== "Gold and Silver" && margin !== null && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "14px 18px", marginTop: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Margin per {form.unit}:{" "}
                <strong style={{ color: Number(margin) >= 0 ? "#16a34a" : "#dc2626" }}>₹{margin}</strong>
              </span>
              {form.purchasePrice > 0 && (
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Margin %: <strong style={{ color: "#16a34a" }}>
                    {(((Number(form.sellingPrice) - Number(form.purchasePrice)) / Number(form.purchasePrice)) * 100).toFixed(1)}%
                  </strong>
                </span>
              )}
              {form.qty && (
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Batch value: <strong style={{ color: t.color }}>
                    ₹{(Number(form.qty) * Number(form.sellingPrice)).toLocaleString("en-IN")}
                  </strong>
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button
              onClick={handleAddStock}
              disabled={saving}
              style={{ padding: "12px 28px", borderRadius: "10px", border: "none", background: t.color, color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving…" : editingId ? "✅ Update Stock" : "✅ Add Stock"}
            </button>
            {editingId && (
              <button
                onClick={handleCancelEdit}
                style={{ padding: "12px 20px", borderRadius: "10px", border: "1.5px solid #cbd5e1", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}
              >
                ✕ Cancel Edit
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          STOCK LIST TAB
      ══════════════════════════════════════ */}
      {tab === "list" && (
        <>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", margin: "20px 0 16px" }}>
            <input
              placeholder="🔍 Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: "180px", ...inputStyle }}
            />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              style={{ ...selectStyle, minWidth: "160px" }}
            >
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="empty-box">Loading stock…</div>
          ) : (
            <>
              <h3 style={{ margin: "0 0 14px" }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""} in stock</h3>

              {filtered.length === 0 ? (
                <div className="empty-box">
                  {stock.length === 0
                    ? "No stock added yet. Go to '➕ Add Stock' tab to begin."
                    : "No items match your search or filter."}
                </div>
              ) : (
                <ul>
                  {filtered.map((s) => (
                    <li key={s.id}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                          <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{s.name}</strong>

                          {/* Low stock badge — backend: is_low_stock */}
                          {s.isLowStock && (
                            <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase" }}>
                              Low Stock
                            </span>
                          )}

                          {/* Medical expiry badge */}
                          {s.medExpiry && new Date(`${s.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                            <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: "100px" }}>
                              ⏰ Exp: {s.medExpiry}
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            Qty: <strong style={{ color: s.isLowStock ? "#dc2626" : "#16a34a" }}>{s.qty} {s.unit}</strong>
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            Price: <strong style={{ color: t.color }}>₹{s.sellingPrice}</strong>
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            Cat: <strong style={{ color: "#7c3aed" }}>{s.category}</strong>
                          </span>
                          {/* Clothing */}
                          {s.clothingSize  && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Size: <strong>{s.clothingSize}</strong></span>}
                          {s.clothingColor && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Color: <strong>{s.clothingColor}</strong></span>}
                          {/* Hardware */}
                          {s.hwBrand    && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Brand: <strong>{s.hwBrand}</strong></span>}
                          {s.hwMaterial && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Material: <strong>{s.hwMaterial}</strong></span>}
                          {s.hwModel    && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Spec: <strong>{s.hwModel}</strong></span>}
                          {/* Medical */}
                          {s.medCompany  && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Co: <strong>{s.medCompany}</strong></span>}
                          {s.medSchedule && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Sch: <strong>{s.medSchedule}</strong></span>}
                          {s.medBatch    && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Batch: <strong>{s.medBatch}</strong></span>}
                          {/* Gold */}
                          {s.goldPurity    && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Purity: <strong>{s.goldPurity}</strong></span>}
                          {s.goldWeight    && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Wt: <strong>{s.goldWeight}g</strong></span>}
                          {s.makingCharges > 0 && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Making: <strong>₹{s.makingCharges}</strong></span>}
                          {s.hsnCode && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>HSN: <strong>{s.hsnCode}</strong></span>}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          onClick={() => handleEdit(s)}
                          style={{ padding: "6px 12px", borderRadius: "6px", background: t.color, color: "#fff", border: "none", fontSize: "12px", cursor: "pointer" }}
                        >
                          Edit
                        </button>
                        {confirmDel === s.id ? (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button onClick={() => handleDelete(s.id)} style={{ padding: "6px 10px", borderRadius: "6px", background: "#dc2626", color: "#fff", border: "none", fontSize: "12px", cursor: "pointer" }}>
                              Yes, Remove
                            </button>
                            <button onClick={() => setConfirmDel(null)} style={{ padding: "6px 10px", borderRadius: "6px", background: "#f1f5f9", color: "#64748b", border: "none", fontSize: "12px", cursor: "pointer" }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDel(s.id)}>Remove</button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
