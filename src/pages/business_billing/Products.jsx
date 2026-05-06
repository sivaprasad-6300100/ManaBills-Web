import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductStats,
  getShopProfile,
} from "../../services/businessService";
import { S } from "../../styles/business/Products";
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
  "Kirana Store":    ["Atta & Rice","Dal & Pulses","Oil & Ghee","Sugar & Salt","Spices","Dry Fruits","Biscuits & Snacks","Beverages","shampoo","Soap & Detergent","Dairy","Other"],
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

// ─── GST RATES ────────────────────────────────────────────────
const GST_RATES = [0, 5, 12, 18, 28];

// Default GST rate per shop type (sensible defaults for Indian GST)
const DEFAULT_GST_BY_SHOP = {
  "Kirana Store":    5,
  "Clothing":        5,
  "HardWare":        18,
  "Medical":         12,
  "Gold and Silver": 3,
  "Resturants":      5,
  "Genral Store":    18,
  "default":         18,
};

const BASE_EMPTY_FORM = {
  name: "", category: "General", unit: "piece",
  purchasePrice: "", sellingPrice: "", qty: "", minQtyAlert: "5", hsnCode: "",
  gstRate: 18,
  // ── ADD THESE 6 NEW FIELDS ──
  purchaseGst: "",
  supplierGstin: "",
  purchaseInvoice: "",
  purchaseDate: "",
  saleType: "intra",
  gstInclusive: true,

  clothingType: "", clothingSize: "", clothingColor: "", clothingGender: "",
  hwBrand: "", hwMaterial: "", hwModel: "",
  medCompany: "", medSchedule: "OTC", medExpiry: "", medBatch: "",
  goldPurity: "", metalType: "Gold", goldWeight: "", makingCharges: "",
};

const getEmptyForm = (shopType) => {
  const base = { ...BASE_EMPTY_FORM, gstRate: DEFAULT_GST_BY_SHOP[shopType] ?? 18 };
  switch (shopType) {
    case "Kirana Store":    return { ...base, category: "Atta & Rice",      unit: "bag",   gstRate: 5  };
    case "Clothing":        return { ...base, category: "Men",              unit: "piece", gstRate: 5  };
    case "HardWare":        return { ...base, category: "Pipes & Fittings", unit: "piece", gstRate: 18 };
    case "Medical":         return { ...base, category: "Tablets",          unit: "strip", minQtyAlert: "10", gstRate: 12 };
    case "Gold and Silver": return { ...base, category: "Gold Jewellery",   unit: "gram",  minQtyAlert: "1",  gstRate: 3  };
    case "Resturants":      return { ...base, category: "Breakfast",        unit: "kg",    gstRate: 5  };
    default:                return { ...base, category: "General",          unit: "piece", gstRate: 18 };
  }
};

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
  gstRate:        p.gst_rate       != null ? Number(p.gst_rate)        : 18,
  purchaseGst:     p.purchase_gst      != null ? String(p.purchase_gst)   : "",
  supplierGstin:   p.supplier_gstin    || "",
  purchaseInvoice: p.purchase_invoice  || "",
  purchaseDate:    p.purchase_date     || "",
  saleType:        p.sale_type         || "intra",
  gstInclusive:    p.gst_inclusive     != null ? Boolean(p.gst_inclusive) : true,
  shopType:       p.shop_type      || "",
  isLowStock:     p.is_low_stock   || false,
  clothingType:   p.clothing_type   || "",
  clothingSize:   p.clothing_size   || "",
  clothingColor:  p.clothing_color  || "",
  clothingGender: p.clothing_gender || "",
  hwBrand:    p.hw_brand    || "",
  hwMaterial: p.hw_material || "",
  hwModel:    p.hw_model    || "",
  medCompany:  p.med_company  || "",
  medSchedule: p.med_schedule || "OTC",
  medExpiry:   p.med_expiry   || "",
  medBatch:    p.med_batch    || "",
  goldPurity:    p.gold_purity    || "",
  metalType:     p.metal_type     || "",
  goldWeight:    p.gold_weight    || "",
  makingCharges: p.making_charges != null ? Number(p.making_charges) : 0,
});

const toApi = (form, shopType, finalName) => ({
  name:           finalName,
  category:       form.category,
  unit:           form.unit,
  purchase_price: Number(form.purchasePrice) || 0,
  selling_price:  Number(form.sellingPrice),
  qty:            Number(form.qty),
  min_qty_alert:  Number(form.minQtyAlert) || 5,
  hsn_code:       form.hsnCode?.trim() || "",
  gst_rate:       Number(form.gstRate) || 0,
  purchase_gst:     Number(form.purchaseGst) || 0,
  supplier_gstin:   form.supplierGstin?.trim() || "",
  purchase_invoice: form.purchaseInvoice?.trim() || "",
  purchase_date:    form.purchaseDate || "",
  sale_type:        form.saleType || "intra",
  gst_inclusive:    form.gstInclusive,
  shop_type:      shopType,
  clothing_type:   shopType === "Clothing"        ? form.clothingType   : "",
  clothing_size:   shopType === "Clothing"        ? form.clothingSize   : "",
  clothing_color:  shopType === "Clothing"        ? form.clothingColor  : "",
  clothing_gender: shopType === "Clothing"        ? form.clothingGender : "",
  hw_brand:    shopType === "HardWare"        ? form.hwBrand    : "",
  hw_material: shopType === "HardWare"        ? form.hwMaterial : "",
  hw_model:    shopType === "HardWare"        ? form.hwModel    : "",
  med_company:  shopType === "Medical"         ? form.medCompany  : "",
  med_schedule: shopType === "Medical"         ? form.medSchedule : "",
  med_expiry:   shopType === "Medical"         ? form.medExpiry   : "",
  med_batch:    shopType === "Medical"         ? form.medBatch    : "",
  gold_purity:    shopType === "Gold and Silver" ? form.goldPurity    : "",
  metal_type:     shopType === "Gold and Silver" ? form.metalType     : "",
  gold_weight:    shopType === "Gold and Silver" ? form.goldWeight    : "",
  making_charges: shopType === "Gold and Silver" ? Number(form.makingCharges) || 0 : 0,
});

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

// ─── Desktop-only Field wrapper (unchanged) ───────────────────
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

// ─── Mobile isMobile hook ────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};


// ═════════════════════════════════════════════════════════════
//   MOBILE FIELD — reusable within mobile render
// ═════════════════════════════════════════════════════════════

const MField = ({ label, children, full }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px", ...(full ? { gridColumn: "1 / -1" } : {}) }}>
    <span style={S.fieldLabel}>{label}</span>
    {children}
  </div>
);

// ─── GST Rate Select (reusable) ────────────────────────────────
const GstRateSelect = ({ value, onChange, style }) => (
  <select name="gstRate" value={value} onChange={onChange} style={style}>
    {GST_RATES.map((r) => (
      <option key={r} value={r}>{r}% GST</option>
    ))}
  </select>
);

// ─── GST Preview Calculator (non-gold) ────────────────────────
// Returns { taxableValue, gstAmount, totalWithGst } or null
// const calcGst = (sellingPrice, gstRate) => {
  // const sp  = Number(sellingPrice);
  // const gst = Number(gstRate);
  // if (!sp || isNaN(sp) || sp <= 0) return null;
  // Selling price is assumed to be GST-inclusive (MRP)
  // const taxableValue = sp / (1 + gst / 100);
  // const gstAmount    = sp - taxableValue;
  // return {
    // taxableValue: taxableValue.toFixed(2),
    // gstAmount:    gstAmount.toFixed(2),
    // totalWithGst: sp.toFixed(2),
  // };
// };



const calcGst = (sellingPrice, gstRate, inclusive = true) => {
  const sp  = Number(sellingPrice);
  const gst = Number(gstRate);
  if (!sp || isNaN(sp) || sp <= 0) return null;

  if (inclusive) {
    // Price already includes GST (MRP style)
    const taxableValue = sp / (1 + gst / 100);
    const gstAmount    = sp - taxableValue;
    return {
      taxableValue: taxableValue.toFixed(2),
      gstAmount:    gstAmount.toFixed(2),
      totalWithGst: sp.toFixed(2),
    };
  } else {
    // Price is GST-exclusive, GST added on top
    const gstAmount    = (sp * gst) / 100;
    const totalWithGst = sp + gstAmount;
    return {
      taxableValue: sp.toFixed(2),
      gstAmount:    gstAmount.toFixed(2),
      totalWithGst: totalWithGst.toFixed(2),
    };
  }
};
// ─── Gold GST Calculator ────────────────────────────────────────
// Gold: 3% on metal value, 5% on making charges (hardcoded per Indian GST rules)
const GOLD_METAL_GST  = 3;
const GOLD_MAKING_GST = 5;

const calcGoldGst = (sellingPrice, qty, makingCharges) => {
  const rate    = Number(sellingPrice);
  const q       = Number(qty) || 1;
  const making  = Number(makingCharges) || 0;
  if (!rate || rate <= 0) return null;
  const metalValue      = rate * q;
  const metalGstAmt     = (metalValue * GOLD_METAL_GST)  / 100;
  const makingGstAmt    = (making    * GOLD_MAKING_GST)  / 100;
  const totalGst        = metalGstAmt + makingGstAmt;
  const grandTotal      = metalValue + making + totalGst;
  return {
    metalValue:   metalValue.toFixed(2),
    metalGstAmt:  metalGstAmt.toFixed(2),
    makingGstAmt: makingGstAmt.toFixed(2),
    totalGst:     totalGst.toFixed(2),
    grandTotal:   grandTotal.toFixed(2),
  };
};

// ═════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
const Products = () => {
  const [stock,       setStock]       = useState([]);
  const [form,        setForm]        = useState(BASE_EMPTY_FORM);
  const [search,      setSearch]      = useState("");
  const [filterCat,   setFilterCat]   = useState("All");
  const [toast,       setToast]       = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [stats,       setStats]       = useState({});
  const [lowStock,    setLowStock]    = useState([]);
  const [tab,         setTab]         = useState("list");
  const [shopProfile, setShopProfile] = useState(null);
  const [editingId,   setEditingId]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  const isMobile  = useIsMobile();
  const navigate  = useNavigate();

  const shopType  = shopProfile?.shop_type || "default";
  const t         = theme(shopType);
  const units     = UNITS_BY_SHOP[shopType]     || UNITS_BY_SHOP["default"];
  const categories= CATEGORIES_BY_SHOP[shopType] || CATEGORIES_BY_SHOP["default"];

  useEffect(() => { loadAll(); }, []);

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

  const buildClothingName = () => {
    const parts = [form.clothingGender, form.clothingType, form.clothingColor, form.clothingSize].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : form.name;
  };

  const buildGoldName = () => {
    return [form.metalType, form.goldPurity, form.name].filter(Boolean).join(" - ");
  };

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
        await updateProduct(editingId, payload);
        showToast(`"${finalName}" updated successfully`);
        setEditingId(null);
      } else {
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
      gstRate:        item.gstRate       != null ? Number(item.gstRate)       : 18,
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

  const filtered = stock.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = filterCat === "All" || s.category === filterCat;
    return matchSearch && matchCat;
  });

  const allCategories = ["All", ...new Set(stock.map((s) => s.category))];

  const margin = form.purchasePrice && form.sellingPrice
    ? (Number(form.sellingPrice) - Number(form.purchasePrice)).toFixed(2)
    : null;

  const autoPurchaseGst =
  form.purchasePrice && form.gstRate
    ? ((Number(form.purchasePrice) * Number(form.gstRate)) / 100).toFixed(2)
    : null;

  const goldTotalValue = shopType === "Gold and Silver" && form.sellingPrice && form.qty
    ? (Number(form.sellingPrice) * Number(form.qty || 1)) + Number(form.makingCharges || 0)
    : null;

  // ── GST calculations ─────────────────────────────────────────
  const gstCalc = shopType !== "Gold and Silver" ? calcGst(form.sellingPrice, form.gstRate, form.gstInclusive) : null;
  const goldGstCalc = shopType === "Gold and Silver"  ? calcGoldGst(form.sellingPrice, form.qty, form.makingCharges) : null;

  // ─── Shared tab definitions ───────────────────────────────────
  const TAB_LIST = [
    { key: "list", label: "📋 Stock List" },
    { key: "add",  label: editingId ? "✏️ Edit Stock" : "➕ Add Stock" },
    { key: "job-services", label: "🛠️ Job Services" },
  ];

  // ─── Shared tab click handler ─────────────────────────────────
  const handleTabClick = (key) => {
    if (key === "job-services") {
      navigate("/dashboard/business/job-services");
      return;
    }
    setTab(key);
    if (key === "list" && editingId) handleCancelEdit();
  };

  // ═══════════════════════════════════════════════════════════
  //   MOBILE RENDER
  // ═══════════════════════════════════════════════════════════
  if (isMobile) {
    const renderFormFields = () => {
      const isKiranaType = shopType === "Kirana Store" || shopType === "Resturants" || shopType === "Genral Store" || shopType === "default" || !shopProfile;

      return (
        <div style={S.formCard}>
          {/* ── Kirana / Restaurant / General / Default ── */}
          {isKiranaType && (
            <>
              <div style={S.sectionDivider(t.color)}>{t.icon} Item Details</div>
              <div style={S.fieldGrid}>
                <MField label="Item Name *" full>
                  <input name="name" placeholder="e.g. Basmati Rice…" value={form.name} onChange={handleChange} style={S.mInput} />
                </MField>
                <MField label="Category">
                  <select name="category" value={form.category} onChange={handleChange} style={S.mSelect}>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </MField>
                <MField label="Unit">
                  <select name="unit" value={form.unit} onChange={handleChange} style={S.mSelect}>
                    {units.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </MField>
                <MField label="Quantity *">
                  <input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Purchase ₹">
                  <input name="purchasePrice" type="number" placeholder="Cost" value={form.purchasePrice} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Purchase GST / ITC ₹">
                <input name="purchaseGst"type="number"placeholder="ITC amount"value={form.purchaseGst}onChange={handleChange} style={S.mInput}/>
                {autoPurchaseGst && !form.purchaseGst && (
    <span style={{ fontSize: "0.68rem", color: "#16a34a", marginTop: "3px" }}>
      Auto: ₹{autoPurchaseGst}
    </span>
  )}
</MField>
                <MField label="Selling ₹ *">
                  <input name="sellingPrice" type="number" placeholder="Sale" value={form.sellingPrice} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                {/* ── GST Rate ── */}
                <MField label="GST Rate" full>
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    <GstRateSelect value={form.gstRate} onChange={handleChange} style={{ ...S.mSelect, flex: 1 }} />
    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
      <input
        type="checkbox"
        checked={form.gstInclusive}
        onChange={(e) => setForm((prev) => ({ ...prev, gstInclusive: e.target.checked }))}
      />
      Incl. GST
    </label>
  </div>
</MField>
                <MField label="Low Stock At">
                  <input name="minQtyAlert" type="number" placeholder="5" value={form.minQtyAlert} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="HSN Code" full>
                  <input name="hsnCode" placeholder="e.g. 1006" value={form.hsnCode} onChange={handleChange} style={S.mInput} />
                </MField>
                <MField label="Supplier GSTIN (for ITC)" full>
  <input
    name="supplierGstin"
    placeholder="15-digit GSTIN"
    value={form.supplierGstin}
    onChange={handleChange}
    maxLength={15}
    style={S.mInput}
  />
</MField>

<MField label="Invoice No.">
  <input
    name="purchaseInvoice"
    placeholder="Bill / Invoice No."
    value={form.purchaseInvoice}
    onChange={handleChange}
    style={S.mInput}
  />
</MField>

<MField label="Purchase Date">
  <input
    name="purchaseDate"
    type="date"
    value={form.purchaseDate}
    onChange={handleChange}
    style={S.mInput}
  />
</MField>
              </div>
            </>
          )}

          {/* ── Clothing ── */}
          {shopType === "Clothing" && (
            <>
              <div style={S.sectionDivider(t.color)}>👗 Clothing Details</div>
              <div style={S.fieldGrid}>
                <MField label="Gender *">
                  <select name="clothingGender" value={form.clothingGender} onChange={handleChange} style={S.mSelect}>
                    <option value="">Select…</option>
                    {["Men","Women","Boy","Girl","Unisex"].map(g => <option key={g}>{g}</option>)}
                  </select>
                </MField>
                <MField label="Type *">
                  <select name="clothingType" value={form.clothingType} onChange={handleChange} style={S.mSelect}>
                    <option value="">Select…</option>
                    {CLOTHING_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </MField>
                <MField label="Color">
                  <select name="clothingColor" value={form.clothingColor} onChange={handleChange} style={S.mSelect}>
                    <option value="">Select…</option>
                    {CLOTHING_COLORS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </MField>
                <MField label="Size">
                  <select name="clothingSize" value={form.clothingSize} onChange={handleChange} style={S.mSelect}>
                    <option value="">Select…</option>
                    {CLOTHING_SIZES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </MField>
                <MField label="Custom Name" full>
                  <input name="name" placeholder="Auto-built or type custom name" value={form.name} onChange={handleChange} style={S.mInput} />
                  {(form.clothingGender || form.clothingType) && !form.name && (
                    <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "3px" }}>
                      Will save as: <strong>{buildClothingName()}</strong>
                    </span>
                  )}
                </MField>
              </div>

              <div style={{ ...S.sectionDivider(t.color), marginTop: "14px" }}>💰 Pricing & Stock</div>
              <div style={S.fieldGrid}>
                <MField label="Unit">
                  <select name="unit" value={form.unit} onChange={handleChange} style={S.mSelect}>
                    {units.map(u => <option key={u}>{u}</option>)}
                  </select>
                </MField>
                <MField label="Quantity *">
                  <input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Purchase ₹">
                  <input name="purchasePrice" type="number" placeholder="Cost" value={form.purchasePrice} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Purchase GST / ITC ₹">
  <input
    name="purchaseGst"
    type="number"
    placeholder="ITC amount"
    value={form.purchaseGst}
    onChange={handleChange}
    style={S.mInput}
  />
  {autoPurchaseGst && !form.purchaseGst && (
    <span style={{ fontSize: "0.68rem", color: "#16a34a", marginTop: "3px" }}>
      Auto: ₹{autoPurchaseGst}
    </span>
  )}
</MField>
                <MField label="Selling ₹ *">
                  <input name="sellingPrice" type="number" placeholder="MRP" value={form.sellingPrice} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                {/* ── GST Rate ── */}
                <MField label="GST Rate" full>
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    <GstRateSelect value={form.gstRate} onChange={handleChange} style={{ ...S.mSelect, flex: 1 }} />
    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
      <input
        type="checkbox"
        checked={form.gstInclusive}
        onChange={(e) => setForm((prev) => ({ ...prev, gstInclusive: e.target.checked }))}
      />
      Incl. GST
    </label>
  </div>
</MField>
                <MField label="Low Stock At">
                  <input name="minQtyAlert" type="number" placeholder="5" value={form.minQtyAlert} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="HSN Code" full>
                  <input name="hsnCode" placeholder="e.g. 6205" value={form.hsnCode} onChange={handleChange} style={S.mInput} />
                </MField>
                <MField label="Supplier GSTIN (for ITC)" full>
  <input
    name="supplierGstin"
    placeholder="15-digit GSTIN"
    value={form.supplierGstin}
    onChange={handleChange}
    maxLength={15}
    style={S.mInput}
  />
</MField>

<MField label="Invoice No.">
  <input
    name="purchaseInvoice"
    placeholder="Bill / Invoice No."
    value={form.purchaseInvoice}
    onChange={handleChange}
    style={S.mInput}
  />
</MField>

<MField label="Purchase Date">
  <input
    name="purchaseDate"
    type="date"
    value={form.purchaseDate}
    onChange={handleChange}
    style={S.mInput}
  />
</MField>
              </div>
            </>
          )}

          {/* ── Hardware ── */}
          {shopType === "HardWare" && (
            <>
              <div style={S.sectionDivider(t.color)}>🔧 Hardware Details</div>
              <div style={S.fieldGrid}>
                <MField label="Item Name *" full>
                  <input name="name" placeholder="e.g. 1/2 inch PVC Pipe…" value={form.name} onChange={handleChange} style={S.mInput} />
                </MField>
                <MField label="Category *">
                  <select name="category" value={form.category} onChange={handleChange} style={S.mSelect}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </MField>
                <MField label="Brand">
                  <select name="hwBrand" value={form.hwBrand} onChange={handleChange} style={S.mSelect}>
                    <option value="">Select…</option>
                    {HW_BRANDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </MField>
                <MField label="Material">
                  <select name="hwMaterial" value={form.hwMaterial} onChange={handleChange} style={S.mSelect}>
                    <option value="">Select…</option>
                    {HW_MATERIALS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </MField>
                <MField label="Model / Spec" full>
                  <input name="hwModel" placeholder="e.g. 1/2 inch, 4mm, 100W" value={form.hwModel} onChange={handleChange} style={S.mInput} />
                </MField>
              </div>

              <div style={{ ...S.sectionDivider(t.color), marginTop: "14px" }}>📦 Stock & Pricing</div>
              <div style={S.fieldGrid}>
                <MField label="Unit">
                  <select name="unit" value={form.unit} onChange={handleChange} style={S.mSelect}>
                    {units.map(u => <option key={u}>{u}</option>)}
                  </select>
                </MField>
                <MField label="Quantity *">
                  <input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Purchase ₹">
                  <input name="purchasePrice" type="number" placeholder="Cost" value={form.purchasePrice} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Purchase GST / ITC ₹">
  <input
    name="purchaseGst"
    type="number"
    placeholder="ITC amount"
    value={form.purchaseGst}
    onChange={handleChange}
    style={S.mInput}
  />
  {autoPurchaseGst && !form.purchaseGst && (
    <span style={{ fontSize: "0.68rem", color: "#16a34a", marginTop: "3px" }}>
      Auto: ₹{autoPurchaseGst}
    </span>
  )}
</MField>
                <MField label="Selling ₹ *">
                  <input name="sellingPrice" type="number" placeholder="Sale" value={form.sellingPrice} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                {/* ── GST Rate ── */}
                <MField label="GST Rate" full>
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    <GstRateSelect value={form.gstRate} onChange={handleChange} style={{ ...S.mSelect, flex: 1 }} />
    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
      <input
        type="checkbox"
        checked={form.gstInclusive}
        onChange={(e) => setForm((prev) => ({ ...prev, gstInclusive: e.target.checked }))}
      />
      Incl. GST
    </label>
  </div>
</MField>
                <MField label="Low Stock At">
                  <input name="minQtyAlert" type="number" placeholder="5" value={form.minQtyAlert} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="HSN Code" full>
                  <input name="hsnCode" placeholder="e.g. 7307" value={form.hsnCode} onChange={handleChange} style={S.mInput} />
                </MField>
                <MField label="Supplier GSTIN (for ITC)" full>
  <input
    name="supplierGstin"
    placeholder="15-digit GSTIN"
    value={form.supplierGstin}
    onChange={handleChange}
    maxLength={15}
    style={S.mInput}
  />
</MField>

<MField label="Invoice No.">
  <input
    name="purchaseInvoice"
    placeholder="Bill / Invoice No."
    value={form.purchaseInvoice}
    onChange={handleChange}
    style={S.mInput}
  />
</MField>

<MField label="Purchase Date">
  <input
    name="purchaseDate"
    type="date"
    value={form.purchaseDate}
    onChange={handleChange}
    style={S.mInput}
  />
</MField>
              </div>
            </>
          )}

          {/* ── Medical ── */}
          {shopType === "Medical" && (
            <>
              <div style={S.sectionDivider(t.color)}>💊 Medicine Details</div>
              <div style={S.fieldGrid}>
                <MField label="Medicine Name *" full>
                  <input name="name" placeholder="e.g. Dolo 650mg…" value={form.name} onChange={handleChange} style={S.mInput} />
                </MField>
                <MField label="Category *">
                  <select name="category" value={form.category} onChange={handleChange} style={S.mSelect}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </MField>
                <MField label="Company">
                  <select name="medCompany" value={form.medCompany} onChange={handleChange} style={S.mSelect}>
                    <option value="">Select…</option>
                    {MED_COMPANIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </MField>
                <MField label="Schedule">
                  <select name="medSchedule" value={form.medSchedule} onChange={handleChange} style={S.mSelect}>
                    {MED_SCHEDULES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </MField>
                <MField label="Batch No.">
                  <input name="medBatch" placeholder="Batch No." value={form.medBatch} onChange={handleChange} style={S.mInput} />
                </MField>
                <MField label="Expiry Date *">
                  <input name="medExpiry" type="month" value={form.medExpiry} onChange={handleChange}
                    style={{ ...S.mInput, borderColor: !form.medExpiry ? "#fca5a5" : "#e2e8f0" }} />
                </MField>
              </div>

              {form.medExpiry && new Date(`${form.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                <div style={{ ...S.expiryWarning, marginTop: "10px" }}>
                  ⚠️ <strong>Expiry soon!</strong> Within 90 days. Monitor carefully.
                </div>
              )}

              <div style={{ ...S.sectionDivider(t.color), marginTop: "14px" }}>📦 Stock & Pricing</div>
              <div style={S.fieldGrid}>
                <MField label="Unit">
                  <select name="unit" value={form.unit} onChange={handleChange} style={S.mSelect}>
                    {units.map(u => <option key={u}>{u}</option>)}
                  </select>
                </MField>
                <MField label="Quantity *">
                  <input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Purchase ₹">
                  <input name="purchasePrice" type="number" placeholder="MRP / Cost" value={form.purchasePrice} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Purchase GST / ITC ₹">
  <input
    name="purchaseGst"
    type="number"
    placeholder="ITC amount"
    value={form.purchaseGst}
    onChange={handleChange}
    style={S.mInput}
  />
  {autoPurchaseGst && !form.purchaseGst && (
    <span style={{ fontSize: "0.68rem", color: "#16a34a", marginTop: "3px" }}>
      Auto: ₹{autoPurchaseGst}
    </span>
  )}
</MField>
                <MField label="Selling ₹ *">
                  <input name="sellingPrice" type="number" placeholder="Your price" value={form.sellingPrice} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                {/* ── GST Rate ── */}
                <MField label="GST Rate" full>
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    <GstRateSelect value={form.gstRate} onChange={handleChange} style={{ ...S.mSelect, flex: 1 }} />
    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
      <input
        type="checkbox"
        checked={form.gstInclusive}
        onChange={(e) => setForm((prev) => ({ ...prev, gstInclusive: e.target.checked }))}
      />
      Incl. GST
    </label>
  </div>
</MField>
                <MField label="Low Stock At">
                  <input name="minQtyAlert" type="number" placeholder="10" value={form.minQtyAlert} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="HSN Code" full>
                  <input name="hsnCode" placeholder="e.g. 3004" value={form.hsnCode} onChange={handleChange} style={S.mInput} />
                </MField>
                <MField label="Supplier GSTIN (for ITC)" full>
  <input
    name="supplierGstin"
    placeholder="15-digit GSTIN"
    value={form.supplierGstin}
    onChange={handleChange}
    maxLength={15}
    style={S.mInput}
  />
</MField>

<MField label="Invoice No.">
  <input
    name="purchaseInvoice"
    placeholder="Bill / Invoice No."
    value={form.purchaseInvoice}
    onChange={handleChange}
    style={S.mInput}
  />
</MField>

<MField label="Purchase Date">
  <input
    name="purchaseDate"
    type="date"
    value={form.purchaseDate}
    onChange={handleChange}
    style={S.mInput}
  />
</MField>
              </div>
            </>
          )}

          {/* ── Gold & Silver ── */}
          {shopType === "Gold and Silver" && (
            <>
              <div style={S.sectionDivider(t.color)}>💍 Jewellery Details</div>
              <div style={S.fieldGrid}>
                <MField label="Metal Type *">
                  <select name="metalType" value={form.metalType} onChange={handleChange} style={S.mSelect}>
                    {METAL_TYPES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </MField>
                <MField label="Purity / Karat">
                  <select name="goldPurity" value={form.goldPurity} onChange={handleChange} style={S.mSelect}>
                    <option value="">Select…</option>
                    {GOLD_PURITY.map(p => <option key={p}>{p}</option>)}
                  </select>
                </MField>
                <MField label="Item Name *" full>
                  <input name="name" placeholder="e.g. Necklace, Ring, Coin…" value={form.name} onChange={handleChange} style={S.mInput} />
                </MField>
                <MField label="Category *">
                  <select name="category" value={form.category} onChange={handleChange} style={S.mSelect}>
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </MField>
                <MField label="Weight (grams) *">
                  <input name="goldWeight" type="number" placeholder="0.00" value={form.goldWeight} onChange={handleChange} min="0" step="0.01" style={S.mInput} />
                </MField>
              </div>

              <div style={{ ...S.sectionDivider(t.color), marginTop: "14px" }}>💰 Pricing</div>
              <div style={S.fieldGrid}>
                <MField label="Unit">
                  <select name="unit" value={form.unit} onChange={handleChange} style={S.mSelect}>
                    {units.map(u => <option key={u}>{u}</option>)}
                  </select>
                </MField>
                <MField label="Quantity *">
                  <input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Rate/gram ₹ *">
                  <input name="sellingPrice" type="number" placeholder="Rate" value={form.sellingPrice} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Purchase ₹">
                  <input name="purchasePrice" type="number" placeholder="Cost rate" value={form.purchasePrice} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Purchase GST / ITC ₹">
  <input
    name="purchaseGst"
    type="number"
    placeholder="ITC amount"
    value={form.purchaseGst}
    onChange={handleChange}
    style={S.mInput}
  />
  {autoPurchaseGst && !form.purchaseGst && (
    <span style={{ fontSize: "0.68rem", color: "#16a34a", marginTop: "3px" }}>
      Auto: ₹{autoPurchaseGst}
    </span>
  )}
</MField>
                <MField label="Making Charges ₹">
                  <input name="makingCharges" type="number" placeholder="Making" value={form.makingCharges} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="Low Stock At">
                  <input name="minQtyAlert" type="number" placeholder="1" value={form.minQtyAlert} onChange={handleChange} min="0" style={S.mInput} />
                </MField>
                <MField label="HSN Code" full>
                  <input name="hsnCode" placeholder="e.g. 7113" value={form.hsnCode} onChange={handleChange} style={S.mInput} />
                </MField>
                <MField label="Supplier GSTIN (for ITC)" full>
  <input
    name="supplierGstin"
    placeholder="15-digit GSTIN"
    value={form.supplierGstin}
    onChange={handleChange}
    maxLength={15}
    style={S.mInput}
  />
</MField>

<MField label="Invoice No.">
  <input
    name="purchaseInvoice"
    placeholder="Bill / Invoice No."
    value={form.purchaseInvoice}
    onChange={handleChange}
    style={S.mInput}
  />
</MField>

<MField label="Purchase Date">
  <input
    name="purchaseDate"
    type="date"
    value={form.purchaseDate}
    onChange={handleChange}
    style={S.mInput}
  />
</MField>
              </div>

              {goldTotalValue && (
                <div style={S.goldTotal}>
                  <span>💍 Value: <strong>₹{(Number(form.sellingPrice) * Number(form.qty || 1)).toLocaleString("en-IN")}</strong></span>
                  <span>🔨 Making: <strong>₹{Number(form.makingCharges || 0).toLocaleString("en-IN")}</strong></span>
                  <span>✅ Total: <strong>₹{goldTotalValue.toLocaleString("en-IN")}</strong></span>
                </div>
              )}

              {/* ── Gold GST Preview ── */}
              {goldGstCalc && (
                <div style={S.goldGstPreview}>
                  <span style={{ fontWeight: 800, width: "100%", fontSize: "0.75rem", color: "#92400e" }}>
                    🧾 GST Breakdown (Metal {GOLD_METAL_GST}% + Making {GOLD_MAKING_GST}%)
                  </span>
                  <span>Metal Value: <strong>₹{Number(goldGstCalc.metalValue).toLocaleString("en-IN")}</strong></span>
                  <span>Metal GST ({GOLD_METAL_GST}%): <strong>₹{Number(goldGstCalc.metalGstAmt).toLocaleString("en-IN")}</strong></span>
                  <span>Making GST ({GOLD_MAKING_GST}%): <strong>₹{Number(goldGstCalc.makingGstAmt).toLocaleString("en-IN")}</strong></span>
                  <span>Total GST: <strong>₹{Number(goldGstCalc.totalGst).toLocaleString("en-IN")}</strong></span>
                  <span>Grand Total: <strong style={{ color: "#d97706" }}>₹{Number(goldGstCalc.grandTotal).toLocaleString("en-IN")}</strong></span>
                </div>
              )}
            </>
          )}

          {/* Margin preview */}
          {shopType !== "Gold and Silver" && margin !== null && (
            <div style={S.marginPreview}>
              <span style={S.marginLabel}>
                Margin: <strong style={{ color: Number(margin) >= 0 ? "#16a34a" : "#dc2626" }}>₹{margin}</strong>
              </span>
              {form.purchasePrice > 0 && (
                <span style={S.marginLabel}>
                  %: <strong style={{ color: "#16a34a" }}>
                    {(((Number(form.sellingPrice) - Number(form.purchasePrice)) / Number(form.purchasePrice)) * 100).toFixed(1)}%
                  </strong>
                </span>
              )}
              {form.qty && (
                <span style={S.marginLabel}>
                  Batch: <strong style={{ color: t.color }}>₹{(Number(form.qty) * Number(form.sellingPrice)).toLocaleString("en-IN")}</strong>
                </span>
              )}
            </div>
          )}

          {/* ── GST Preview (non-gold) ── */}
          {shopType !== "Gold and Silver" && gstCalc && (
  <div style={S.gstPreview}>
    {/* Sale type toggle */}
    <div style={{ width: "100%", display: "flex", gap: "8px", marginBottom: "4px" }}>
      {["intra", "inter"].map((type) => (
        <button
          key={type}
          onClick={() => setForm((prev) => ({ ...prev, saleType: type }))}
          style={{
            padding: "4px 12px", borderRadius: "100px", border: "none",
            fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
            background: form.saleType === type ? "#15803d" : "#e2e8f0",
            color: form.saleType === type ? "#fff" : "#64748b",
          }}
        >
          {type === "intra" ? "Intra-state" : "Inter-state"}
        </button>
      ))}
    </div>

    <span style={{ fontWeight: 800, width: "100%", fontSize: "0.75rem", color: "#15803d" }}>
      🧾 GST Preview — {form.gstRate}% ({form.gstInclusive ? "inclusive" : "exclusive"})
    </span>
    <span style={S.gstPreviewLabel}>Taxable Value: <strong>₹{Number(gstCalc.taxableValue).toLocaleString("en-IN")}</strong></span>

    {form.saleType === "intra" ? (
      <>
        <span style={S.gstPreviewLabel}>CGST ({form.gstRate / 2}%): <strong>₹{(Number(gstCalc.gstAmount) / 2).toFixed(2)}</strong></span>
        <span style={S.gstPreviewLabel}>SGST ({form.gstRate / 2}%): <strong>₹{(Number(gstCalc.gstAmount) / 2).toFixed(2)}</strong></span>
      </>
    ) : (
      <span style={S.gstPreviewLabel}>IGST ({form.gstRate}%): <strong>₹{Number(gstCalc.gstAmount).toLocaleString("en-IN")}</strong></span>
    )}

    <span style={S.gstPreviewLabel}>Total: <strong style={{ color: "#15803d" }}>₹{Number(gstCalc.totalWithGst).toLocaleString("en-IN")}</strong></span>
  </div>
)}

          {/* Buttons */}
          <div style={S.actionRow}>
            <button onClick={handleAddStock} disabled={saving} style={S.saveBtn(t.color)}>
              {saving ? "Saving…" : editingId ? "✅ Update Stock" : "✅ Add Stock"}
            </button>
            {editingId && (
              <button onClick={handleCancelEdit} style={S.cancelBtn}>✕ Cancel</button>
            )}
          </div>
        </div>
      );
    };

    return (
      <div style={S.page}>
        {/* Toast */}
        {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}

        {/* Header bar */}
        <div style={S.headerBar}>
          <div style={S.headerLeft}>
            <h2 style={S.headerTitle}>📦 Stock Entry</h2>
            {t.hint && <span style={S.headerHint}>{t.hint}</span>}
          </div>
          {shopProfile && (
            <span style={S.shopBadge(t.color)}>{t.icon} {t.label}</span>
          )}
        </div>

        {/* ── Tab bar (MOBILE) ── */}
        <div style={S.tabBar}>
          {TAB_LIST.map((tb) => (
            <button
              key={tb.key}
              style={S.tabBtn(tab === tb.key)}
              onClick={() => handleTabClick(tb.key)}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div style={S.body}>
          {/* No shop profile warning */}
          {!shopProfile && !loading && (
            <div style={S.warnBanner}>
              ⚠️ <strong>Shop Profile not set.</strong> Go to <strong>Shop Profile</strong> to select your business type.
            </div>
          )}

          {/* Stats */}
          <div style={S.statsRow}>
            {[
              { label: "Total Products",   value: stats.total_items     || 0,      color: t.color },
              { label: "Stock Value",      value: `₹${(stats.total_value || 0).toLocaleString("en-IN")}`, color: "#16a34a" },
              { label: "Low Stock Alerts", value: stats.low_stock_count  || 0,      color: (stats.low_stock_count || 0) > 0 ? "#dc2626" : "#16a34a" },
              { label: "Total Units",      value: stats.total_qty        || 0,      color: "#7c3aed" },
            ].map((s) => (
              <div key={s.label} style={S.statCard(s.color)}>
                <div style={S.statLabel}>{s.label}</div>
                <div style={S.statValue}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Low stock banner */}
          {lowStock.length > 0 && (
            <div style={S.lowStockBanner}>
              <div style={S.lowStockTitle}>
                ⚠️ Low Stock — {lowStock.length} item{lowStock.length > 1 ? "s" : ""} need restocking
              </div>
              <div style={S.lowStockChips}>
                {lowStock.map((s) => (
                  <span key={s.id} style={S.lowStockChip}>
                    {s.name} — {s.qty} {s.unit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── ADD TAB ── */}
          {tab === "add" && renderFormFields()}

          {/* ── LIST TAB ── */}
          {tab === "list" && (
            <>
              <div style={S.searchWrap}>
                <input
                  placeholder="🔍 Search items…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={S.searchInput}
                />
                <select
                  value={filterCat}
                  onChange={(e) => setFilterCat(e.target.value)}
                  style={S.filterSelect}
                >
                  {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {loading ? (
                <div style={S.emptyBox}>Loading stock…</div>
              ) : (
                <>
                  <div style={S.listCount}>{filtered.length} item{filtered.length !== 1 ? "s" : ""} in stock</div>

                  {filtered.length === 0 ? (
                    <div style={S.emptyBox}>
                      {stock.length === 0
                        ? "No stock added yet. Go to '➕ Add Stock' tab to begin."
                        : "No items match your search or filter."}
                    </div>
                  ) : (
                    filtered.map((s) => (
                      <div key={s.id} style={S.stockCard}>
                        <div style={S.stockCardTop}>
                          <div>
                            <div style={S.stockName}>{s.name}</div>
                            <div style={S.badgeRow}>
                              {s.isLowStock && <span style={S.lowBadge}>Low Stock</span>}
                              {s.medExpiry && new Date(`${s.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                                <span style={S.expiryBadge}>⏰ Exp: {s.medExpiry}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={S.stockMeta}>
                          <span style={S.metaChip}>
                            Qty: <strong style={{ color: s.isLowStock ? "#dc2626" : "#16a34a" }}>{s.qty} {s.unit}</strong>
                          </span>
                          <span style={S.metaChip}>
                            Price: <strong style={{ color: t.color }}>₹{s.sellingPrice}</strong>
                          </span>
                          <span style={S.metaChip}>
                            <strong style={{ color: "#7c3aed" }}>{s.category}</strong>
                          </span>
                          {/* ── GST chip in list ── */}
                          {s.gstRate != null && (
                            <span style={{ ...S.metaChip, background: "#f0fdf4", color: "#15803d" }}>
                              GST: <strong>{s.gstRate}%</strong>
                            </span>
                          )}
                          {s.clothingSize  && <span style={S.metaChip}>Size: <strong>{s.clothingSize}</strong></span>}
                          {s.clothingColor && <span style={S.metaChip}>Color: <strong>{s.clothingColor}</strong></span>}
                          {s.hwBrand    && <span style={S.metaChip}>Brand: <strong>{s.hwBrand}</strong></span>}
                          {s.hwMaterial && <span style={S.metaChip}>Mat: <strong>{s.hwMaterial}</strong></span>}
                          {s.hwModel    && <span style={S.metaChip}>Spec: <strong>{s.hwModel}</strong></span>}
                          {s.medCompany  && <span style={S.metaChip}>Co: <strong>{s.medCompany}</strong></span>}
                          {s.medSchedule && <span style={S.metaChip}>Sch: <strong>{s.medSchedule}</strong></span>}
                          {s.medBatch    && <span style={S.metaChip}>Batch: <strong>{s.medBatch}</strong></span>}
                          {s.goldPurity    && <span style={S.metaChip}>Purity: <strong>{s.goldPurity}</strong></span>}
                          {s.goldWeight    && <span style={S.metaChip}>Wt: <strong>{s.goldWeight}g</strong></span>}
                          {s.makingCharges > 0 && <span style={S.metaChip}>Making: <strong>₹{s.makingCharges}</strong></span>}
                          {s.hsnCode && <span style={S.metaChip}>HSN: <strong>{s.hsnCode}</strong></span>}
                        </div>

                        <div style={S.stockActions}>
                          <button onClick={() => handleEdit(s)} style={S.editBtn(t.color)}>Edit</button>
                          {confirmDel === s.id ? (
                            <div style={S.confirmRow}>
                              <button onClick={() => handleDelete(s.id)} style={S.confirmYes}>Yes, Remove</button>
                              <button onClick={() => setConfirmDel(null)} style={S.confirmNo}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDel(s.id)} style={S.removeBtn}>Remove</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //   DESKTOP RENDER  — original preserved, GST fields added
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

      {/* Stats row */}
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

      {/* ── Tab bar (DESKTOP) ── */}
      <div className="sub-nav">
        {TAB_LIST.map((tb) => (
          <button
            key={tb.key}
            className={`sub-link${tab === tb.key ? " active" : ""}`}
            onClick={() => handleTabClick(tb.key)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ADD / EDIT TAB */}
      {tab === "add" && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ margin: "0 0 4px" }}>
            {editingId ? "Edit Stock Item" : `Add Stock — ${t.icon} ${t.label}`}
          </h3>
          <p style={{ fontSize: "0.83rem", color: "#64748b", marginBottom: "20px" }}>
            {editingId ? "Update the details below and click Update Stock." : "Same item name will auto-merge quantity."}
          </p>

          {/* Kirana / Restaurant / General / Default */}
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
              <Field label="Purchase GST / ITC ₹">
  <input
    name="purchaseGst"
    type="number"
    placeholder="ITC amount"
    value={form.purchaseGst}
    onChange={handleChange}
    style={inputStyle}
  />
  {autoPurchaseGst && !form.purchaseGst && (
    <span style={{ fontSize: "0.7rem", color: "#16a34a", marginTop: "3px" }}>
      Auto: ₹{autoPurchaseGst}
    </span>
  )}
</Field>
              <Field label="Selling Price ₹ *">
                <input name="sellingPrice" type="number" placeholder="Sale price" value={form.sellingPrice} onChange={handleChange} min="0" style={inputStyle} />
              </Field>
              {/* ── GST Rate ── */}
              <Field label="GST Rate">
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    <GstRateSelect value={form.gstRate} onChange={handleChange} style={{ ...selectStyle, flex: 1 }} />
    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
      <input
        type="checkbox"
        checked={form.gstInclusive}
        onChange={(e) => setForm((prev) => ({ ...prev, gstInclusive: e.target.checked }))}
      />
      Incl. GST
    </label>
  </div>
</Field>
              <Field label="Low Stock Alert at Qty">
                <input name="minQtyAlert" type="number" placeholder="5" value={form.minQtyAlert} onChange={handleChange} min="0" style={inputStyle} />
              </Field>
              <Field label="HSN Code (GST)">
                <input name="hsnCode" placeholder="e.g. 1006" value={form.hsnCode} onChange={handleChange} style={inputStyle} />
              </Field>
              <Field label="Supplier GSTIN (for ITC)" full>
  <input
    name="supplierGstin"
    placeholder="15-digit GSTIN"
    value={form.supplierGstin}
    onChange={handleChange}
    maxLength={15}
    style={inputStyle}
  />
</Field>

<Field label="Invoice No.">
  <input
    name="purchaseInvoice"
    placeholder="Bill / Invoice No."
    value={form.purchaseInvoice}
    onChange={handleChange}
    style={inputStyle}
  />
</Field>

<Field label="Purchase Date">
  <input
    name="purchaseDate"
    type="date"
    value={form.purchaseDate}
    onChange={handleChange}
    style={inputStyle}
  />
</Field>
            </div>
          )}

          {/* Clothing */}
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
              <Field label="Purchase GST / ITC ₹">
  <input
    name="purchaseGst"
    type="number"
    placeholder="ITC amount"
    value={form.purchaseGst}
    onChange={handleChange}
    style={inputStyle}
  />
  {autoPurchaseGst && !form.purchaseGst && (
    <span style={{ fontSize: "0.7rem", color: "#16a34a", marginTop: "3px" }}>
      Auto: ₹{autoPurchaseGst}
    </span>
  )}
</Field>
              <Field label="Selling Price ₹ *"><input name="sellingPrice" type="number" placeholder="MRP / Sale price" value={form.sellingPrice} onChange={handleChange} min="0" style={inputStyle} /></Field>
              {/* ── GST Rate ── */}
              <Field label="GST Rate">
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    <GstRateSelect value={form.gstRate} onChange={handleChange} style={{ ...selectStyle, flex: 1 }} />
    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
      <input
        type="checkbox"
        checked={form.gstInclusive}
        onChange={(e) => setForm((prev) => ({ ...prev, gstInclusive: e.target.checked }))}
      />
      Incl. GST
    </label>
  </div>
</Field>
              <Field label="Low Stock Alert at"><input name="minQtyAlert" type="number" placeholder="5" value={form.minQtyAlert} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="HSN Code (GST)"><input name="hsnCode" placeholder="e.g. 6205" value={form.hsnCode} onChange={handleChange} style={inputStyle} /></Field>
              <Field label="Supplier GSTIN (for ITC)" full>
  <input
    name="supplierGstin"
    placeholder="15-digit GSTIN"
    value={form.supplierGstin}
    onChange={handleChange}
    maxLength={15}
    style={inputStyle}
  />
</Field>

<Field label="Invoice No.">
  <input
    name="purchaseInvoice"
    placeholder="Bill / Invoice No."
    value={form.purchaseInvoice}
    onChange={handleChange}
    style={inputStyle}
  />
</Field>

<Field label="Purchase Date">
  <input
    name="purchaseDate"
    type="date"
    value={form.purchaseDate}
    onChange={handleChange}
    style={inputStyle}
  />
</Field>
            </div>
          )}

          {/* Hardware */}
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
              <Field label="Purchase GST / ITC ₹">
  <input
    name="purchaseGst"
    type="number"
    placeholder="ITC amount"
    value={form.purchaseGst}
    onChange={handleChange}
    style={inputStyle}
  />
  {autoPurchaseGst && !form.purchaseGst && (
    <span style={{ fontSize: "0.7rem", color: "#16a34a", marginTop: "3px" }}>
      Auto: ₹{autoPurchaseGst}
    </span>
  )}
</Field>
              <Field label="Selling Price ₹ *"><input name="sellingPrice" type="number" placeholder="Sale price" value={form.sellingPrice} onChange={handleChange} min="0" style={inputStyle} /></Field>
              {/* ── GST Rate ── */}
              <Field label="GST Rate">
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    <GstRateSelect value={form.gstRate} onChange={handleChange} style={{ ...selectStyle, flex: 1 }} />
    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
      <input
        type="checkbox"
        checked={form.gstInclusive}
        onChange={(e) => setForm((prev) => ({ ...prev, gstInclusive: e.target.checked }))}
      />
      Incl. GST
    </label>
  </div>
</Field>
              <Field label="Low Stock Alert at"><input name="minQtyAlert" type="number" placeholder="5" value={form.minQtyAlert} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="HSN Code (GST)"><input name="hsnCode" placeholder="e.g. 7307" value={form.hsnCode} onChange={handleChange} style={inputStyle} /></Field>
              <Field label="Supplier GSTIN (for ITC)" full>
  <input
    name="supplierGstin"
    placeholder="15-digit GSTIN"
    value={form.supplierGstin}
    onChange={handleChange}
    maxLength={15}
    style={inputStyle}
  />
</Field>

<Field label="Invoice No.">
  <input
    name="purchaseInvoice"
    placeholder="Bill / Invoice No."
    value={form.purchaseInvoice}
    onChange={handleChange}
    style={inputStyle}
  />
</Field>

<Field label="Purchase Date">
  <input
    name="purchaseDate"
    type="date"
    value={form.purchaseDate}
    onChange={handleChange}
    style={inputStyle}
  />
</Field>
            </div>
          )}

          {/* Medical */}
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
              <Field label="Purchase GST / ITC ₹">
  <input
    name="purchaseGst"
    type="number"
    placeholder="ITC amount"
    value={form.purchaseGst}
    onChange={handleChange}
    style={inputStyle}
  />
  {autoPurchaseGst && !form.purchaseGst && (
    <span style={{ fontSize: "0.7rem", color: "#16a34a", marginTop: "3px" }}>
      Auto: ₹{autoPurchaseGst}
    </span>
  )}
</Field>
              <Field label="Selling Price ₹ *"><input name="sellingPrice" type="number" placeholder="Your selling price" value={form.sellingPrice} onChange={handleChange} min="0" style={inputStyle} /></Field>
              {/* ── GST Rate ── */}
              <Field label="GST Rate">
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    <GstRateSelect value={form.gstRate} onChange={handleChange} style={{ ...selectStyle, flex: 1 }} />
    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
      <input
        type="checkbox"
        checked={form.gstInclusive}
        onChange={(e) => setForm((prev) => ({ ...prev, gstInclusive: e.target.checked }))}
      />
      Incl. GST
    </label>
  </div>
</Field>
              <Field label="Low Stock Alert at"><input name="minQtyAlert" type="number" placeholder="10" value={form.minQtyAlert} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="HSN Code (GST)"><input name="hsnCode" placeholder="e.g. 3004" value={form.hsnCode} onChange={handleChange} style={inputStyle} /></Field>
              <Field label="Supplier GSTIN (for ITC)" full>
  <input
    name="supplierGstin"
    placeholder="15-digit GSTIN"
    value={form.supplierGstin}
    onChange={handleChange}
    maxLength={15}
    style={inputStyle}
  />
</Field>

<Field label="Invoice No.">
  <input
    name="purchaseInvoice"
    placeholder="Bill / Invoice No."
    value={form.purchaseInvoice}
    onChange={handleChange}
    style={inputStyle}
  />
</Field>

<Field label="Purchase Date">
  <input
    name="purchaseDate"
    type="date"
    value={form.purchaseDate}
    onChange={handleChange}
    style={inputStyle}
  />
</Field>
              {form.medExpiry && new Date(`${form.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                <div style={{ gridColumn: "1 / -1", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "10px", padding: "10px 14px", fontSize: "0.8rem", color: "#92400e" }}>
                  ⚠️ <strong>Expiry soon!</strong> This medicine expires within 90 days. Monitor carefully.
                </div>
              )}
            </div>
          )}

          {/* Gold & Silver */}
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
              <Field label="Purchase GST / ITC ₹">
                <input
                  name="purchaseGst"
                  type="number"
                  placeholder="ITC amount"
                  value={form.purchaseGst}
                  onChange={handleChange}
                  style={inputStyle}
                />
                {autoPurchaseGst && !form.purchaseGst && (
                  <span style={{ fontSize: "0.7rem", color: "#16a34a", marginTop: "3px" }}>
                    Auto: ₹{autoPurchaseGst}
                  </span>
                )}
              </Field>
              <Field label="GST Rate">
  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    <GstRateSelect value={form.gstRate} onChange={handleChange} style={{ ...selectStyle, flex: 1 }} />
    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
      <input
        type="checkbox"
        checked={form.gstInclusive}
        onChange={(e) => setForm((prev) => ({ ...prev, gstInclusive: e.target.checked }))}
      />
      Incl. GST
    </label>
  </div>
</Field>
              <Field label="Low Stock Alert at"><input name="minQtyAlert" type="number" placeholder="1" value={form.minQtyAlert} onChange={handleChange} min="0" style={inputStyle} /></Field>
              <Field label="HSN Code (GST)"><input name="hsnCode" placeholder="e.g. 7113" value={form.hsnCode} onChange={handleChange} style={inputStyle} /></Field>
              <Field label="Supplier GSTIN (for ITC)" full>
  <input
    name="supplierGstin"
    placeholder="15-digit GSTIN"
    value={form.supplierGstin}
    onChange={handleChange}
    maxLength={15}
    style={inputStyle}
  />
</Field>

<Field label="Invoice No.">
  <input
    name="purchaseInvoice"
    placeholder="Bill / Invoice No."
    value={form.purchaseInvoice}
    onChange={handleChange}
    style={inputStyle}
  />
</Field>

<Field label="Purchase Date">
  <input
    name="purchaseDate"
    type="date"
    value={form.purchaseDate}
    onChange={handleChange}
    style={inputStyle}
  />
</Field>
              {goldTotalValue && (
                <div style={{ gridColumn: "1 / -1", background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "0.83rem", color: "#78350f" }}>
                  <span>💍 Item Value: <strong>₹{(Number(form.sellingPrice) * Number(form.qty || 1)).toLocaleString("en-IN")}</strong></span>
                  <span>🔨 Making Charges: <strong>₹{Number(form.makingCharges || 0).toLocaleString("en-IN")}</strong></span>
                  <span>✅ Total: <strong>₹{goldTotalValue.toLocaleString("en-IN")}</strong></span>
                </div>
              )}
              {/* ── Gold GST Preview ── */}
              {goldGstCalc && (
                <div style={{ gridColumn: "1 / -1", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.83rem", color: "#78350f" }}>
                  <span style={{ fontWeight: 800, width: "100%", fontSize: "0.76rem" }}>
                    🧾 GST Breakdown — Metal {GOLD_METAL_GST}% + Making {GOLD_MAKING_GST}% (as per Indian GST rules)
                  </span>
                  <span>Metal Value: <strong>₹{Number(goldGstCalc.metalValue).toLocaleString("en-IN")}</strong></span>
                  <span>Metal GST ({GOLD_METAL_GST}%): <strong>₹{Number(goldGstCalc.metalGstAmt).toLocaleString("en-IN")}</strong></span>
                  <span>Making GST ({GOLD_MAKING_GST}%): <strong>₹{Number(goldGstCalc.makingGstAmt).toLocaleString("en-IN")}</strong></span>
                  <span>Total GST: <strong>₹{Number(goldGstCalc.totalGst).toLocaleString("en-IN")}</strong></span>
                  <span>Grand Total (incl. GST): <strong style={{ color: "#d97706", fontSize: "0.92rem" }}>₹{Number(goldGstCalc.grandTotal).toLocaleString("en-IN")}</strong></span>
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

          {/* ── GST Preview box (non-gold, desktop) ── */}
          {shopType !== "Gold and Silver" && gstCalc && (
  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "14px 18px", marginTop: "12px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
    {/* Sale type toggle */}
    <div style={{ width: "100%", display: "flex", gap: "8px", marginBottom: "4px" }}>
      {["intra", "inter"].map((type) => (
        <button
          key={type}
          onClick={() => setForm((prev) => ({ ...prev, saleType: type }))}
          style={{
            padding: "4px 14px", borderRadius: "100px", border: "none",
            fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
            background: form.saleType === type ? "#15803d" : "#e2e8f0",
            color: form.saleType === type ? "#fff" : "#64748b",
          }}
        >
          {type === "intra" ? "Intra-state" : "Inter-state"}
        </button>
      ))}
    </div>

    <span style={{ fontWeight: 800, width: "100%", fontSize: "0.76rem", color: "#15803d" }}>
      🧾 GST Preview — {form.gstRate}% ({form.gstInclusive ? "price inclusive" : "price exclusive"})
    </span>
    <span style={{ fontSize: "0.85rem", color: "#15803d" }}>Taxable: <strong>₹{Number(gstCalc.taxableValue).toLocaleString("en-IN")}</strong></span>

    {form.saleType === "intra" ? (
      <>
        <span style={{ fontSize: "0.85rem", color: "#15803d" }}>CGST ({form.gstRate / 2}%): <strong>₹{(Number(gstCalc.gstAmount) / 2).toFixed(2)}</strong></span>
        <span style={{ fontSize: "0.85rem", color: "#15803d" }}>SGST ({form.gstRate / 2}%): <strong>₹{(Number(gstCalc.gstAmount) / 2).toFixed(2)}</strong></span>
      </>
    ) : (
      <span style={{ fontSize: "0.85rem", color: "#15803d" }}>IGST ({form.gstRate}%): <strong>₹{Number(gstCalc.gstAmount).toLocaleString("en-IN")}</strong></span>
    )}

    <span style={{ fontSize: "0.85rem", color: "#15803d" }}>Total: <strong style={{ color: "#16a34a" }}>₹{Number(gstCalc.totalWithGst).toLocaleString("en-IN")}</strong></span>
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

      {/* STOCK LIST TAB */}
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
                          {s.isLowStock && (
                            <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase" }}>
                              Low Stock
                            </span>
                          )}
                          {s.medExpiry && new Date(`${s.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                            <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: "100px" }}>
                              ⏰ Exp: {s.medExpiry}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Qty: <strong style={{ color: s.isLowStock ? "#dc2626" : "#16a34a" }}>{s.qty} {s.unit}</strong></span>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Price: <strong style={{ color: t.color }}>₹{s.sellingPrice}</strong></span>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Cat: <strong style={{ color: "#7c3aed" }}>{s.category}</strong></span>
                          {/* ── GST chip in desktop list ── */}
                          {s.gstRate != null && (
                            <span style={{ fontSize: "0.78rem", color: "#15803d" }}>GST: <strong>{s.gstRate}%</strong></span>
                          )}
                          {s.clothingSize  && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Size: <strong>{s.clothingSize}</strong></span>}
                          {s.clothingColor && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Color: <strong>{s.clothingColor}</strong></span>}
                          {s.hwBrand    && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Brand: <strong>{s.hwBrand}</strong></span>}
                          {s.hwMaterial && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Material: <strong>{s.hwMaterial}</strong></span>}
                          {s.hwModel    && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Spec: <strong>{s.hwModel}</strong></span>}
                          {s.medCompany  && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Co: <strong>{s.medCompany}</strong></span>}
                          {s.medSchedule && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Sch: <strong>{s.medSchedule}</strong></span>}
                          {s.medBatch    && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Batch: <strong>{s.medBatch}</strong></span>}
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
