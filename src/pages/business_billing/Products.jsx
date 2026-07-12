import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts, addProduct, updateProduct, deleteProduct,
  getLowStockProducts, getProductStats, getShopProfile, uploadProductImage,
} from "../../services/businessService";
import { S } from "../../styles/business/Products";





// ─── CONSTANTS ────────────────────────────────────────────────
const UNITS_BY_SHOP = {
  "Kirana Store":    ["bag","kg","gram","packet","litre","ml","dozen","piece"],
  "Clothing":        ["piece","set","pair","dozen"],
  "HardWare":        ["piece","box","set","kg","gram","metre","litre","ml","bag","roll","bundle"],
  "Aluminium Shop":  ["piece","set","kg","gram","foot","inch","metre","sqft","bundle","box"],
  "Medical":         ["strip","bottle","box","tube","sachet","vial","piece","ml","gram","kg"],
  "Gold and Silver": ["gram","kg","piece","set","pair"],
  "Resturants":      ["kg","gram","litre","ml","piece","packet","bag","dozen"],
  "Genral Store":    ["piece","kg","gram","litre","ml","bag","box","dozen","metre","set","packet"],
  "default":         ["piece","kg","gram","litre","ml","bag","box","dozen","metre","set","roll","bundle","packet","strip","bottle"],
};

const CATEGORIES_BY_SHOP = {
  "Kirana Store":    ["Atta & Rice","Dal & Pulses","Oil & Ghee","Sugar & Salt","Spices","Dry Fruits","Biscuits & Snacks","Beverages","shampoo","Soap & Detergent","Dairy","Other"],
  "Clothing":        ["Men","Women","Boy","Girl","Unisex"],
  "HardWare":        ["Fasteners","Hardware Fittings","Furniture Fittings","Wood & Boards","Doors","Adhesives & Chemicals","Electrical & Lighting","Paint & Finishing","Plumbing","Kitchen & Bathroom","Tools & Safety","Glass"],
  "Medical":         ["Tablets","Syrups","Injections","Surgical","OTC Medicines","Vitamins & Supplements","Ayurvedic","Cosmetics","Baby Care","Other"],
  "Gold and Silver": ["Gold Jewellery","Silver Jewellery","Coins & Bars","Diamonds","Gemstones","Accessories","Other"],
  "Aluminium Shop":  ["Aluminium Section","Glass","Aluminium Rods","Handles","Locks","Sliding Channel","Rubber Beading","Screw","Silicone"],
  "Genral Store":    ["Electronics","Grocery","Clothing","Hardware","Stationery","Toys","Sports","Home & Kitchen","Personal Care","Other"],
  "default":         ["General","Electronics","Grocery","Clothing","Hardware","Medical","Stationery","Food & Beverages","Other"],
};

const HARDWARE_SUBCATEGORIES = {
  "Fasteners":             ["Screws","Bolts","Nails"],
  "Hardware Fittings":     ["Locks","Handles","Hinges","Tower Bolts","Door Stoppers","Door Magnets"],
  "Furniture Fittings":    ["Drawer Channels","Sliding Fittings","Wardrobe Accessories"],
  "Wood & Boards":         ["Plywood","MDF","Laminates","Veneers"],
  "Doors":                 ["Wooden Doors","PVC Doors","Flush Doors","Door Frames","WPC Doors","Glass Doors"],
  "Adhesives & Chemicals": ["Fevicol","Silicone","Putty"],
  "Electrical & Lighting": ["Switches","Sockets","LED Lights"],
  "Paint & Finishing":     ["Paint","Polish"],
  "Plumbing":              ["Pipes","Pipe Fittings","Taps & Showers","Valves","Water Tanks","Bathroom Accessories","PVC Fittings","CPVC Fittings","Drainage Items","Other"],
  "Kitchen & Bathroom":    ["Kitchen Accessories","Bathroom Fittings","PVC Fittings"],
  "Tools & Safety":        ["Tools","Safety Items","Miscellaneous"],
  "Glass":                 ["Plain Glass","Mirror Glass","Toughened Glass","Frosted Glass","Designer Glass","Tinted Glass"],
};

const SUBCATEGORIES_BY_SHOP = { "HardWare": HARDWARE_SUBCATEGORIES };
const getSubCategories = (shopType, category) => SUBCATEGORIES_BY_SHOP[shopType]?.[category] || [];

const CLOTHING_TYPES  = ["Shirt","T-Shirt","Pant","Jeans","Kurta","Saree","Lehenga","Suit","Jacket","Pair","Set","Other"];
const CLOTHING_SIZES  = ["Free Size","XS","S","M","L","XL","XXL","XXXL","28","30","32","34","36","38","40","42"];
const CLOTHING_COLORS = ["Red","Blue","Green","Yellow","Black","White","Gray","Pink","Purple","Orange","Brown","Beige","Navy","Maroon","Teal","Olive","Coral","Turquoise","Lavender","Gold","Silver","Multi-color"];
const HW_BRANDS       = ["Asian Paints","Berger","Havells","Finolex","Astral","Prince","Supreme","Stanley","Other"];
const HW_MATERIALS    = ["Iron","Steel","Copper","PVC","CPVC","GI","Aluminium","Wood","Plastic","Other"];
const MED_COMPANIES   = ["Sun Pharma","Cipla","Dr. Reddy's","Mankind","Lupin","Abbott","Pfizer","Zydus","Alkem","Other"];
const MED_SCHEDULES   = ["OTC","Schedule H","Schedule H1","Schedule X","Ayurvedic","OTC-Cosmetic"];
const GOLD_PURITY     = ["24K (999)","22K (916)","18K (750)","14K (585)","Silver 999","Silver 925","Silver 800"];
const METAL_TYPES     = ["Gold","Silver","Platinum","Diamond","Gemstone","Mixed"];
const GST_RATES       = [0, 5, 12, 18, 28];

const DEFAULT_GST_BY_SHOP = {
  "Kirana Store": 5, "Clothing": 5, "HardWare": 18, "Aluminium Shop": 18,
  "Medical": 12, "Gold and Silver": 3, "Resturants": 5, "Genral Store": 18, "default": 18,
};

const GST_HSN_MAP = {
  "Kirana Store": {
    "Atta & Rice": { gstRate: 5, hsnCode: "1006" }, "Dal & Pulses": { gstRate: 5, hsnCode: "0713" },
    "Oil & Ghee": { gstRate: 5, hsnCode: "1516" }, "Sugar & Salt": { gstRate: 5, hsnCode: "1701" },
    "Spices": { gstRate: 5, hsnCode: "0910" }, "Dry Fruits": { gstRate: 12, hsnCode: "0813" },
    "Biscuits & Snacks": { gstRate: 18, hsnCode: "1905" }, "Beverages": { gstRate: 12, hsnCode: "2202" },
    "shampoo": { gstRate: 18, hsnCode: "3305" }, "Soap & Detergent": { gstRate: 18, hsnCode: "3401" },
    "Dairy": { gstRate: 5, hsnCode: "0402" }, "Other": { gstRate: 5, hsnCode: "" },
  },
  "Clothing": {
    "Men": { gstRate: 5, hsnCode: "6205" }, "Women": { gstRate: 5, hsnCode: "6204" },
    "Boy": { gstRate: 5, hsnCode: "6203" }, "Girl": { gstRate: 5, hsnCode: "6204" },
    "Unisex": { gstRate: 5, hsnCode: "6211" },
  },
  "HardWare": {
    "Fasteners": { gstRate: 18, hsnCode: "7318" }, "Hardware Fittings": { gstRate: 18, hsnCode: "8302" },
    "Furniture Fittings": { gstRate: 18, hsnCode: "8302" }, "Wood & Boards": { gstRate: 18, hsnCode: "4412" },
    "Doors": { gstRate: 12, hsnCode: "4418" }, "Adhesives & Chemicals": { gstRate: 18, hsnCode: "3506" },
    "Electrical & Lighting": { gstRate: 18, hsnCode: "8536" }, "Paint & Finishing": { gstRate: 18, hsnCode: "3208" },
    "Plumbing": { gstRate: 18, hsnCode: "3917" }, "Kitchen & Bathroom": { gstRate: 18, hsnCode: "3922" },
    "Tools & Safety": { gstRate: 18, hsnCode: "8205" }, "Glass": { gstRate: 18, hsnCode: "7005" },
    _sub: {
      "Screws": { gstRate: 18, hsnCode: "7318" }, "Bolts": { gstRate: 18, hsnCode: "7318" },
      "Nails": { gstRate: 18, hsnCode: "7317" }, "Locks": { gstRate: 18, hsnCode: "8301" },
      "Handles": { gstRate: 18, hsnCode: "8302" }, "Hinges": { gstRate: 18, hsnCode: "8302" },
      "Tower Bolts": { gstRate: 18, hsnCode: "8302" }, "Door Stoppers": { gstRate: 18, hsnCode: "8302" },
      "Door Magnets": { gstRate: 18, hsnCode: "8505" }, "Drawer Channels": { gstRate: 18, hsnCode: "8302" },
      "Sliding Fittings": { gstRate: 18, hsnCode: "8302" }, "Plywood": { gstRate: 18, hsnCode: "4412" },
      "MDF": { gstRate: 18, hsnCode: "4411" }, "Laminates": { gstRate: 18, hsnCode: "3921" },
      "Wooden Doors": { gstRate: 12, hsnCode: "4418" }, "PVC Doors": { gstRate: 18, hsnCode: "3925" },
      "Flush Doors": { gstRate: 18, hsnCode: "4418" }, "WPC Doors": { gstRate: 18, hsnCode: "3925" },
      "Glass Doors": { gstRate: 18, hsnCode: "7007" }, "Fevicol": { gstRate: 18, hsnCode: "3506" },
      "Silicone": { gstRate: 18, hsnCode: "3910" }, "Putty": { gstRate: 18, hsnCode: "3214" },
      "Switches": { gstRate: 18, hsnCode: "8536" }, "Sockets": { gstRate: 18, hsnCode: "8536" },
      "LED Lights": { gstRate: 12, hsnCode: "9405" }, "Paint": { gstRate: 18, hsnCode: "3208" },
      "Polish": { gstRate: 18, hsnCode: "3405" }, "Pipes": { gstRate: 18, hsnCode: "3917" },
      "Pipe Fittings": { gstRate: 18, hsnCode: "3917" }, "Taps & Showers": { gstRate: 18, hsnCode: "8481" },
      "Valves": { gstRate: 18, hsnCode: "8481" }, "Water Tanks": { gstRate: 18, hsnCode: "3925" },
      "Bathroom Accessories": { gstRate: 18, hsnCode: "3922" }, "PVC Fittings": { gstRate: 18, hsnCode: "3917" },
      "CPVC Fittings": { gstRate: 18, hsnCode: "3917" }, "Kitchen Accessories": { gstRate: 18, hsnCode: "3922" },
      "Tools": { gstRate: 18, hsnCode: "8205" }, "Plain Glass": { gstRate: 18, hsnCode: "7005" },
      "Mirror Glass": { gstRate: 18, hsnCode: "7009" }, "Toughened Glass": { gstRate: 18, hsnCode: "7007" },
      "Frosted Glass": { gstRate: 18, hsnCode: "7005" },
    },
  },
  "Medical": {
    "Tablets": { gstRate: 12, hsnCode: "3004" }, "Syrups": { gstRate: 12, hsnCode: "3004" },
    "Injections": { gstRate: 12, hsnCode: "3004" }, "Surgical": { gstRate: 12, hsnCode: "9018" },
    "OTC Medicines": { gstRate: 12, hsnCode: "3004" }, "Vitamins & Supplements": { gstRate: 12, hsnCode: "2936" },
    "Ayurvedic": { gstRate: 12, hsnCode: "3004" }, "Cosmetics": { gstRate: 18, hsnCode: "3304" },
    "Baby Care": { gstRate: 12, hsnCode: "3304" }, "Other": { gstRate: 12, hsnCode: "3004" },
  },
  "Gold and Silver": {
    "Gold Jewellery": { gstRate: 3, hsnCode: "7113" }, "Silver Jewellery": { gstRate: 3, hsnCode: "7113" },
    "Coins & Bars": { gstRate: 3, hsnCode: "7108" }, "Diamonds": { gstRate: 0, hsnCode: "7102" },
    "Gemstones": { gstRate: 0, hsnCode: "7103" }, "Accessories": { gstRate: 3, hsnCode: "7117" },
    "Other": { gstRate: 3, hsnCode: "7113" },
  },
  "Aluminium Shop": {
    "Aluminium Section": { gstRate: 18, hsnCode: "7604" }, "Glass": { gstRate: 18, hsnCode: "7005" },
    "Aluminium Rods": { gstRate: 18, hsnCode: "7604" }, "Handles": { gstRate: 18, hsnCode: "8302" },
    "Locks": { gstRate: 18, hsnCode: "8301" }, "Sliding Channel": { gstRate: 18, hsnCode: "7610" },
    "Rubber Beading": { gstRate: 18, hsnCode: "4008" }, "Screw": { gstRate: 18, hsnCode: "7318" },
    "Silicone": { gstRate: 18, hsnCode: "3910" },
  },
};

const getGstHsn = (shopType, category, subCategory) => {
  const shopMap = GST_HSN_MAP[shopType];
  if (!shopMap) return null;
  if (shopType === "HardWare" && subCategory && shopMap._sub?.[subCategory])
    return shopMap._sub[subCategory];
  return shopMap[category] || null;
};

const SHOP_THEME = {
  "Kirana Store":    { icon: "🛒", color: "#16a34a", label: "Kirana Store",   hint: "Groceries, FMCG, Provisions" },
  "Clothing":        { icon: "👗", color: "#7c3aed", label: "Clothing Store", hint: "Apparels, Fashion, Textiles" },
  "HardWare":        { icon: "🔧", color: "#ea580c", label: "Hardware Store", hint: "Pipes, Electrical, Tools, Paint" },
  "Aluminium Shop":  { icon: "🪟", color: "#64748b", label: "Aluminium Shop", hint: "Sections, Glass, Handles, Locks" },
  "Medical":         { icon: "💊", color: "#0284c7", label: "Medical Store",  hint: "Medicines, Surgical, Health" },
  "Gold and Silver": { icon: "💍", color: "#d97706", label: "Gold & Silver",  hint: "Jewellery, Coins, Precious Metals" },
  "Resturants":      { icon: "🍽️", color: "#dc2626", label: "Restaurant",     hint: "Raw materials, Ingredients" },
  "Genral Store":    { icon: "🏪", color: "#2563eb", label: "General Store",  hint: "Multi-category retail" },
  "default":         { icon: "📦", color: "#2563eb", label: "Stock Entry",    hint: "" },
};

const GOLD_METAL_GST  = 3;
const GOLD_MAKING_GST = 5;

// ─── FORM DEFAULTS ────────────────────────────────────────────
const BASE_EMPTY_FORM = {
  name: "", category: "General", unit: "piece",image: null, imagePreview: "",
  purchasePrice: "", sellingPrice: "", qty: "", minQtyAlert: "5",
  hsnCode: "", gstRate: 18, purchaseGst: "", supplierGstin: "",
  purchaseInvoice: "", purchaseDate: "", saleType: "intra", gstInclusive: true,
  clothingType: "", clothingSize: "", clothingColor: "", clothingGender: "",
  hwBrand: "", hwMaterial: "", hwModel: "", subCategory: "",
  medCompany: "", medSchedule: "OTC", medExpiry: "", medBatch: "",
  goldPurity: "", metalType: "Gold", goldWeight: "", makingCharges: "",
};

const getEmptyForm = (shopType) => {
  const base = { ...BASE_EMPTY_FORM, gstRate: DEFAULT_GST_BY_SHOP[shopType] ?? 18 };
  const map = {
    "Kirana Store":    { category: "Atta & Rice",       unit: "bag",   gstRate: 5  },
    "Clothing":        { category: "Men",               unit: "piece", gstRate: 5  },
    "HardWare":        { category: "Pipes & Fittings",  unit: "piece", gstRate: 18 },
    "Aluminium Shop":  { category: "Aluminium Section", unit: "piece", gstRate: 18 },
    "Medical":         { category: "Tablets",           unit: "strip", minQtyAlert: "10", gstRate: 12 },
    "Gold and Silver": { category: "Gold Jewellery",    unit: "gram",  minQtyAlert: "1",  gstRate: 3  },
    "Resturants":      { category: "Breakfast",         unit: "kg",    gstRate: 5  },
  };
  return { ...base, ...(map[shopType] || { category: "General", unit: "piece", gstRate: 18 }) };
};

// ─── API MAPPERS ──────────────────────────────────────────────
const fromApi = (p) => ({
  id: p.id, name: p.name || "", category: p.category || "General",
  imageUrl: p.image_url || "",
  unit: p.unit || "piece",
  purchasePrice:  p.purchase_price  != null ? String(p.purchase_price)  : "",
  sellingPrice:   p.selling_price   != null ? String(p.selling_price)   : "",
  qty:            p.qty             != null ? Number(p.qty)              : 0,
  minQtyAlert:    p.min_qty_alert   != null ? Number(p.min_qty_alert)    : 5,
  hsnCode:        p.hsn_code        || "",
  gstRate:        p.gst_rate        != null ? Number(p.gst_rate)         : 18,
  purchaseGst:    p.purchase_gst    != null ? String(p.purchase_gst)     : "",
  supplierGstin:  p.supplier_gstin  || "",
  purchaseInvoice:p.purchase_invoice|| "",
  purchaseDate:   p.purchase_date   || "",
  saleType:       p.sale_type       || "intra",
  gstInclusive:   p.gst_inclusive   != null ? Boolean(p.gst_inclusive)   : true,
  shopType:       p.shop_type       || "", isLowStock: p.is_low_stock || false,
  clothingType:   p.clothing_type   || "", clothingSize:   p.clothing_size   || "",
  clothingColor:  p.clothing_color  || "", clothingGender: p.clothing_gender || "",
  hwBrand:        p.hw_brand        || "", subCategory:    p.sub_category    || "",
  hwMaterial:     p.hw_material     || "", hwModel:        p.hw_model        || "",
  medCompany:     p.med_company     || "", medSchedule:    p.med_schedule    || "OTC",
  medCompany:     p.med_company     || "", medSchedule:    p.med_schedule    || "",
  goldPurity:     p.gold_purity     || "", metalType:      p.metal_type      || "",
  goldWeight:     p.gold_weight     || "",
  makingCharges:  p.making_charges  != null ? Number(p.making_charges)  : 0,
});

const toApi = (form, shopType, finalName, customCategory = "", customSubCategory = "") => ({
  name:            finalName,
  category:        form.category   === "__custom__" ? (customCategory.trim()    || "Other") : form.category,
  unit:            form.unit,
  sub_category:    form.subCategory === "__custom__" ? (customSubCategory.trim() || "")     : (form.subCategory || ""),
  purchase_price:  Number(form.purchasePrice)  || 0,
  selling_price:   Number(form.sellingPrice),
  qty:             Number(form.qty),
  min_qty_alert:   Number(form.minQtyAlert)    || 5,
  hsn_code:        form.hsnCode?.trim()        || "",
  gst_rate:        Number(form.gstRate)        || 0,
  purchase_gst: Number(form.purchaseGst) || 
  ((Number(form.purchasePrice) * Number(form.qty) * Number(form.gstRate)) / 100),
  supplier_gstin:  form.supplierGstin?.trim()  || "",
  purchase_invoice:form.purchaseInvoice?.trim()|| "",
  purchase_date: form.purchaseDate || null,
  sale_type:       form.saleType               || "intra",
  gst_inclusive:   form.gstInclusive,
  shop_type:       shopType,
  clothing_type:   shopType === "Clothing"        ? form.clothingType   : "",
  clothing_size:   shopType === "Clothing"        ? form.clothingSize   : "",
  clothing_color:  shopType === "Clothing"        ? form.clothingColor  : "",
  clothing_gender: shopType === "Clothing"        ? form.clothingGender : "",
  hw_brand:        shopType === "HardWare"        ? form.hwBrand        : "",
  hw_material:     shopType === "HardWare"        ? form.hwMaterial     : "",
  hw_model:        shopType === "HardWare"        ? form.hwModel        : "",
  med_company:     shopType === "Medical"         ? form.medCompany     : "",
  med_schedule:    shopType === "Medical"         ? form.medSchedule    : "",
  med_expiry:      shopType === "Medical"         ? form.medExpiry      : "",
  med_batch:       shopType === "Medical"         ? form.medBatch       : "",
  gold_purity:     shopType === "Gold and Silver" ? form.goldPurity     : "",
  metal_type:      shopType === "Gold and Silver" ? form.metalType      : "",
  gold_weight:     shopType === "Gold and Silver" ? form.goldWeight     : "",
  making_charges:  shopType === "Gold and Silver" ? Number(form.makingCharges) || 0 : 0,
});

// ─── GST CALCULATORS ──────────────────────────────────────────
const calcGst = (sellingPrice, gstRate, inclusive = true) => {
  const sp = Number(sellingPrice), gst = Number(gstRate);
  if (!sp || isNaN(sp) || sp <= 0) return null;
  if (inclusive) {
    const taxableValue = sp / (1 + gst / 100);
    return { taxableValue: taxableValue.toFixed(2), gstAmount: (sp - taxableValue).toFixed(2), totalWithGst: sp.toFixed(2) };
  }
  const gstAmount = (sp * gst) / 100;
  return { taxableValue: sp.toFixed(2), gstAmount: gstAmount.toFixed(2), totalWithGst: (sp + gstAmount).toFixed(2) };
};

const calcGoldGst = (sellingPrice, qty, makingCharges) => {
  const rate = Number(sellingPrice), q = Number(qty) || 1, making = Number(makingCharges) || 0;
  if (!rate || rate <= 0) return null;
  const metalValue = rate * q, metalGstAmt = (metalValue * GOLD_METAL_GST) / 100;
  const makingGstAmt = (making * GOLD_MAKING_GST) / 100, totalGst = metalGstAmt + makingGstAmt;
  return {
    metalValue: metalValue.toFixed(2), metalGstAmt: metalGstAmt.toFixed(2),
    makingGstAmt: makingGstAmt.toFixed(2), totalGst: totalGst.toFixed(2),
    grandTotal: (metalValue + making + totalGst).toFixed(2),
  };
};

// ─── HOOKS ────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

// ─── REUSABLE FIELD WRAPPERS ──────────────────────────────────
const inputStyle  = { padding: "10px 13px", borderRadius: "9px", border: "1.5px solid #e2e8f0", fontSize: "14px", background: "#fff", outline: "none", transition: "border-color 0.15s" };
const selectStyle = { ...inputStyle, cursor: "pointer" };

// Desktop field wrapper
const Field = ({ label, children, full }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "5px", gridColumn: full ? "1 / -1" : undefined }}>
    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
    {children}
  </div>
);

// Mobile field wrapper
const MField = ({ label, children, full }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px", ...(full ? { gridColumn: "1 / -1" } : {}) }}>
    <span style={S.fieldLabel}>{label}</span>
    {children}
  </div>
);

// ─── REUSABLE SMALL COMPONENTS ────────────────────────────────
const GstRateSelect = ({ value, onChange, style }) => (
  <select name="gstRate" value={value} onChange={onChange} style={style}>
    {GST_RATES.map((r) => <option key={r} value={r}>{r}% GST</option>)}
  </select>
);

const SubCategoryField = ({ shopType, category, value, onChange, isMobile, userSubCats = [] }) => {
  const options = getSubCategories(shopType, category);
  if (!options.length && !userSubCats.length) return null;
  const W = isMobile ? MField : Field;
  const style = isMobile ? S.mSelect : selectStyle;
  return (
    <W label="Sub Category" full>
      <select name="subCategory" value={value} onChange={onChange} style={style}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o}>{o}</option>)}
        {userSubCats.map((o) => <option key={`custom_${o}`} value={o}>{o} ✓</option>)}
        <option value="__custom__">✏️ Add Custom…</option>
      </select>
    </W>
  );
};

// ─── CUSTOM INPUT BOX (shared for category & sub-category) ────
const CustomTextInput = ({ label, placeholder, value, onChange, onConfirm, isMobile, color }) => (
  <div style={{ gridColumn: "1 / -1", background: "#f0f9ff", border: `1.5px solid ${color}55`, borderRadius: "10px", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
    <span style={{ fontSize: "0.7rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.04em" }}>✏️ {label}</span>
    <div style={{ display: "flex", gap: "8px" }}>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && value.trim() && onConfirm()}
        style={{ flex: 1, padding: isMobile ? "9px 12px" : "10px 13px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", background: "#fff", outline: "none" }}
      />
      <button onClick={() => value.trim() && onConfirm()} disabled={!value.trim()}
        style={{ padding: "9px 16px", borderRadius: "8px", border: "none", background: value.trim() ? color : "#e2e8f0", color: value.trim() ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: "0.82rem", cursor: value.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
        ✓ Set
      </button>
    </div>
    <span style={{ fontSize: "0.68rem", color: "#0369a1" }}>Press Set or Enter to confirm. This name will be saved for future use.</span>
  </div>
);

// ─── SHARED PRICING FIELDS (used in ALL shop types) ───────────
// This is the key refactor — instead of copy-pasting these fields 5 times,
// we render them once from this component
const PricingFields = ({ form, handleChange, setForm, units, autoPurchaseGst, isMobile, gstEnabled }) => {
  const W = isMobile ? MField : Field;
  const iStyle = isMobile ? S.mInput : inputStyle;
  const sStyle = isMobile ? S.mSelect : selectStyle;
  return (
    <>
      <W label="Unit">
        <select name="unit" value={form.unit} onChange={handleChange} style={sStyle}>
          {units.map((u) => <option key={u}>{u}</option>)}
        </select>
      </W>
      <W label="Quantity *">
        <input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={iStyle} />
      </W>
      <W label="Purchase ₹">
        <input name="purchasePrice" type="number" placeholder="Cost price" value={form.purchasePrice} onChange={handleChange} min="0" style={iStyle} />
      </W>
      <W label="Selling ₹ *">
        <input name="sellingPrice" type="number" placeholder="Sale price" value={form.sellingPrice} onChange={handleChange} min="0" style={iStyle} />
      </W>
      <W label="Low Stock At">
        <input name="minQtyAlert" type="number" placeholder="5" value={form.minQtyAlert} onChange={handleChange} min="0" style={iStyle} />
      </W>
      {gstEnabled && <>
        <W label="Purchase GST / ITC ₹">
          <input name="purchaseGst" type="number" placeholder="ITC amount" value={form.purchaseGst} onChange={handleChange} style={iStyle} />
          {autoPurchaseGst && !form.purchaseGst && (
            <span style={{ fontSize: "0.68rem", color: "#16a34a", marginTop: "3px" }}>Auto: ₹{autoPurchaseGst}</span>
          )}
        </W>
        <W label="GST Rate" full>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <GstRateSelect value={form.gstRate} onChange={handleChange} style={{ ...sStyle, flex: 1 }} />
            <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={form.gstInclusive} onChange={(e) => setForm((prev) => ({ ...prev, gstInclusive: e.target.checked }))} />
              Incl. GST
            </label>
          </div>
        </W>
        <W label="HSN Code" full>
          <input name="hsnCode" placeholder="e.g. 1006" value={form.hsnCode} onChange={handleChange} style={iStyle} />
        </W>
        <W label="Supplier GSTIN (for ITC)" full>
          <input name="supplierGstin" placeholder="15-digit GSTIN" value={form.supplierGstin} onChange={handleChange} maxLength={15} style={iStyle} />
        </W>
        <W label="Invoice No.">
          <input name="purchaseInvoice" placeholder="Bill / Invoice No." value={form.purchaseInvoice} onChange={handleChange} style={iStyle} />
        </W>
        <W label="Purchase Date">
          <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} style={iStyle} />
        </W>
      </>}
    </>
  );
};














// ─── CATEGORY SELECT (shared) ──────────────────────────────────
const CategorySelect = ({ form, handleChange, categories, userCategories, isMobile }) => {
  const W = isMobile ? MField : Field;
  const sStyle = isMobile ? S.mSelect : selectStyle;
  return (
    <W label="Category *">
      <select name="category" value={form.category} onChange={handleChange} style={sStyle}>
        {categories.map((c) => <option key={c}>{c}</option>)}
        {userCategories.map((c) => <option key={`custom_${c}`} value={c}>{c} ✓</option>)}
        <option value="__custom__">✏️ Custom…</option>
      </select>
    </W>
  );
};

// ─── GST PREVIEW (shared) ─────────────────────────────────────
const GstPreview = ({ gstCalc, form, setForm, isMobile }) => {
  if (!gstCalc) return null;
  return (
    <div style={isMobile ? S.gstPreview : { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "14px 18px", marginTop: "12px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
      <div style={{ width: "100%", display: "flex", gap: "8px", marginBottom: "4px" }}>
        {["intra", "inter"].map((type) => (
          <button key={type} onClick={() => setForm((prev) => ({ ...prev, saleType: type }))}
            style={{ padding: "4px 12px", borderRadius: "100px", border: "none", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", background: form.saleType === type ? "#15803d" : "#e2e8f0", color: form.saleType === type ? "#fff" : "#64748b" }}>
            {type === "intra" ? "Intra-state" : "Inter-state"}
          </button>
        ))}
      </div>
      <span style={{ fontWeight: 800, width: "100%", fontSize: "0.75rem", color: "#15803d" }}>
        🧾 GST Preview — {form.gstRate}% ({form.gstInclusive ? "inclusive" : "exclusive"})
      </span>
      <span style={isMobile ? S.gstPreviewLabel : { fontSize: "0.85rem", color: "#15803d" }}>
        Taxable: <strong>₹{Number(gstCalc.taxableValue).toLocaleString("en-IN")}</strong>
      </span>
      {form.saleType === "intra" ? (
        <>
          <span style={isMobile ? S.gstPreviewLabel : { fontSize: "0.85rem", color: "#15803d" }}>CGST ({form.gstRate / 2}%): <strong>₹{(Number(gstCalc.gstAmount) / 2).toFixed(2)}</strong></span>
          <span style={isMobile ? S.gstPreviewLabel : { fontSize: "0.85rem", color: "#15803d" }}>SGST ({form.gstRate / 2}%): <strong>₹{(Number(gstCalc.gstAmount) / 2).toFixed(2)}</strong></span>
        </>
      ) : (
        <span style={isMobile ? S.gstPreviewLabel : { fontSize: "0.85rem", color: "#15803d" }}>IGST ({form.gstRate}%): <strong>₹{Number(gstCalc.gstAmount).toLocaleString("en-IN")}</strong></span>
      )}
      <span style={isMobile ? S.gstPreviewLabel : { fontSize: "0.85rem", color: "#15803d" }}>
        Total: <strong style={{ color: "#16a34a" }}>₹{Number(gstCalc.totalWithGst).toLocaleString("en-IN")}</strong>
      </span>
    </div>
  );
};

// ─── MARGIN PREVIEW (shared) ──────────────────────────────────
const MarginPreview = ({ form, t, isMobile }) => {
  const margin = form.purchasePrice && form.sellingPrice
    ? (Number(form.sellingPrice) - Number(form.purchasePrice)).toFixed(2) : null;
  if (!margin) return null;
  if (isMobile) return (
    <div style={S.marginPreview}>
      <span style={S.marginLabel}>Margin: <strong style={{ color: Number(margin) >= 0 ? "#16a34a" : "#dc2626" }}>₹{margin}</strong></span>
      {form.purchasePrice > 0 && <span style={S.marginLabel}>%: <strong style={{ color: "#16a34a" }}>{(((Number(form.sellingPrice) - Number(form.purchasePrice)) / Number(form.purchasePrice)) * 100).toFixed(1)}%</strong></span>}
      {form.qty && <span style={S.marginLabel}>Batch: <strong style={{ color: t.color }}>₹{(Number(form.qty) * Number(form.sellingPrice)).toLocaleString("en-IN")}</strong></span>}
    </div>
  );
  return (
    <div style={{ background: "#fff", borderRadius: "12px", padding: "14px 18px", marginTop: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: "24px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Margin per {form.unit}: <strong style={{ color: Number(margin) >= 0 ? "#16a34a" : "#dc2626" }}>₹{margin}</strong></span>
      {form.purchasePrice > 0 && <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Margin %: <strong style={{ color: "#16a34a" }}>{(((Number(form.sellingPrice) - Number(form.purchasePrice)) / Number(form.purchasePrice)) * 100).toFixed(1)}%</strong></span>}
      {form.qty && <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Batch value: <strong style={{ color: t.color }}>₹{(Number(form.qty) * Number(form.sellingPrice)).toLocaleString("en-IN")}</strong></span>}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
const Products = () => {
  const [stock,             setStock]             = useState([]);
  const [form,              setForm]              = useState(BASE_EMPTY_FORM);
  const [search,            setSearch]            = useState("");
  const [filterCat,         setFilterCat]         = useState("All");
  const [toast,             setToast]             = useState(null);
  const [confirmDel,        setConfirmDel]        = useState(null);
  const [stats,             setStats]             = useState({});
  const [lowStock,          setLowStock]          = useState([]);
  const [tab,               setTab]               = useState("list");
  const [shopProfile,       setShopProfile]       = useState(null);
  const [editingId,         setEditingId]         = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [customCategory,    setCustomCategory]    = useState("");
  const [customSubCategory, setCustomSubCategory] = useState("");
  const [userCategories,    setUserCategories]    = useState([]);
  const [userSubCategories, setUserSubCategories] = useState([]);

  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const shopType = shopProfile?.shop_type || "default";
  const t = SHOP_THEME[shopType] || { icon: "🏷️", color: "#2563eb", label: shopType, hint: "Custom shop type" };

  const units = (() => {
    if (UNITS_BY_SHOP[shopType]) return UNITS_BY_SHOP[shopType];
    try {
      const custom = JSON.parse(localStorage.getItem(`customUnits_shoptype_${shopType}`) || "[]");
      return custom.length ? custom : ["piece","kg","gram","litre","ml","bag","box","dozen","metre","set","packet"];
    } catch { return ["piece","kg","gram","litre","ml"]; }
  })();

  const categories = (() => {
    if (CATEGORIES_BY_SHOP[shopType]) return CATEGORIES_BY_SHOP[shopType];
    try {
      const custom = JSON.parse(
        localStorage.getItem(`customCats_shoptype_${shopType}`) ||
        localStorage.getItem(`customCats_${shopType}`) || "[]"
      );
      return custom.length ? custom : ["General", "Other"];
    } catch { return ["General", "Other"]; }
  })();

  // ─── EFFECTS ──────────────────────────────────────────────
  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (!editingId) setForm(getEmptyForm(shopType)); }, [shopType]);
  useEffect(() => {
    if (!shopType || shopType === "default") return;
    const catsRaw = localStorage.getItem(`customCats_shoptype_${shopType}`) || localStorage.getItem(`customCats_${shopType}`) || "[]";
    try { setUserCategories(JSON.parse(catsRaw)); } catch { setUserCategories([]); }
    try { setUserSubCategories(JSON.parse(localStorage.getItem(`customSubCats_${shopType}_${form.category}`) || "[]")); } catch { setUserSubCategories([]); }
  }, [shopType]);

  // ─── DATA LOADING ──────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [profileData, productData, statsData, lowStockData] = await Promise.all([
        getShopProfile().catch(() => null), getProducts(), getProductStats(), getLowStockProducts(),
      ]);
      if (profileData) setShopProfile(profileData);
      setStock(productData.map(fromApi));
      setStats(statsData);
      setLowStock(lowStockData.map(fromApi));
    } catch { showToast("Failed to load stock data.", "error"); }
    finally { setLoading(false); }
  };

  const refreshStock = async () => {
    try {
      const [productData, statsData, lowStockData] = await Promise.all([getProducts(), getProductStats(), getLowStockProducts()]);
      setStock(productData.map(fromApi)); setStats(statsData); setLowStock(lowStockData.map(fromApi));
    } catch {}
  };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  // ─── CUSTOM CATEGORY / SUBCATEGORY ────────────────────────
  const confirmCustomCategory = () => {
    const name = customCategory.trim(); if (!name) return;
    const key = `customCats_${shopType}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    if (!existing.includes(name)) { const updated = [...existing, name]; localStorage.setItem(key, JSON.stringify(updated)); setUserCategories(updated); }
    setForm((prev) => ({ ...prev, category: name })); setCustomCategory("");
  };

  const confirmCustomSubCategory = () => {
    const name = customSubCategory.trim(); if (!name) return;
    const key = `customSubCats_${shopType}_${form.category}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    if (!existing.includes(name)) { const updated = [...existing, name]; localStorage.setItem(key, JSON.stringify(updated)); setUserSubCategories(updated); }
    setForm((prev) => ({ ...prev, subCategory: name })); setCustomSubCategory("");
  };

  // ─── FORM HANDLERS ────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "category") {
        updated.subCategory = ""; setCustomSubCategory("");
        if (value === "__custom__") { updated.category = "__custom__"; }
        else { setCustomCategory(""); const lookup = getGstHsn(shopType, value, ""); if (lookup) { updated.gstRate = lookup.gstRate; if (lookup.hsnCode) updated.hsnCode = lookup.hsnCode; } }
      }
      if (name === "subCategory") {
        if (value === "__custom__") { updated.subCategory = "__custom__"; }
        else if (value) { setCustomSubCategory(""); const lookup = getGstHsn(shopType, prev.category, value); if (lookup) { updated.gstRate = lookup.gstRate; if (lookup.hsnCode) updated.hsnCode = lookup.hsnCode; } }
      }
      return updated;
    });
  };

  const buildClothingName = () => [form.clothingGender, form.clothingType, form.clothingColor, form.clothingSize].filter(Boolean).join(" ") || form.name;
  const buildGoldName = () => [form.metalType, form.goldPurity, form.name].filter(Boolean).join(" - ");

  const handleAddStock = async () => {
    let finalName = form.name.trim();
    if (shopType === "Clothing" && !finalName) { finalName = buildClothingName(); if (!finalName) { showToast("Enter item name or select Type/Color/Size", "error"); return; } }
    if (shopType === "Gold and Silver" && !finalName) finalName = buildGoldName();
    if (!finalName)                                { showToast("Item name is required", "error"); return; }
    if (!form.qty || Number(form.qty) <= 0)        { showToast("Enter a valid quantity", "error"); return; }
    if (!form.sellingPrice || Number(form.sellingPrice) <= 0) { showToast("Enter a valid selling price", "error"); return; }
    if (shopType === "Medical" && !form.medExpiry) { showToast("Expiry date is required for medicines", "error"); return; }

    const payload = toApi(form, shopType, finalName, customCategory, customSubCategory);
    setSaving(true);
    try {
      let savedId = editingId;
      if (editingId) { await updateProduct(editingId, payload); showToast(`"${finalName}" updated successfully`); setEditingId(null); }
      else {
        const result = await addProduct(payload);
        savedId = result.id;
        showToast(result.merged ? `"${result.name}" qty updated — stock merged` : `"${result.name}" added to stock`);
      }
      if (form.image && savedId) {
        const fd = new FormData();
        fd.append("image", form.image);
        try { await uploadProductImage(savedId, fd); }
        catch { showToast("Item saved, but image upload failed.", "error"); }
      }
      setForm(getEmptyForm(shopType)); setCustomCategory(""); setCustomSubCategory(""); setTab("list");
      await refreshStock();
    } catch (err) {
      showToast(err?.response?.data?.name?.[0] || err?.response?.data?.detail || "Failed to save. Please try again.", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteProduct(id); setStock((prev) => prev.filter((s) => s.id !== id)); setConfirmDel(null); showToast("Item removed from stock"); await refreshStock(); }
    catch { showToast("Failed to remove item.", "error"); }
  };

  const handleEdit = (item) => {
    setForm({ ...BASE_EMPTY_FORM, name: item.name, category: item.category, unit: item.unit,
      purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : "",
      sellingPrice:  item.sellingPrice  != null ? String(item.sellingPrice)  : "",
      qty:           item.qty           != null ? String(item.qty)           : "",
      minQtyAlert:   item.minQtyAlert   != null ? String(item.minQtyAlert)   : "5",
      hsnCode: item.hsnCode || "", gstRate: item.gstRate != null ? Number(item.gstRate) : 18,
      clothingType: item.clothingType || "", clothingSize: item.clothingSize || "",
      clothingColor: item.clothingColor || "", clothingGender: item.clothingGender || "",
      hwBrand: item.hwBrand || "", hwMaterial: item.hwMaterial || "", hwModel: item.hwModel || "",
      medCompany: item.medCompany || "", medSchedule: item.medSchedule || "OTC",
      medExpiry: item.medExpiry || "", medBatch: item.medBatch || "",
      goldPurity: item.goldPurity || "", metalType: item.metalType || "Gold",
      goldWeight: item.goldWeight || "", makingCharges: item.makingCharges != null ? String(item.makingCharges) : "",
    });
    setEditingId(item.id); setTab("add");
  };

  const handleCancelEdit = () => { setForm(getEmptyForm(shopType)); setEditingId(null); setCustomCategory(""); setCustomSubCategory(""); setTab("list"); };

  // ─── DERIVED VALUES ────────────────────────────────────────
  const filtered       = stock.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) && (filterCat === "All" || s.category === filterCat));
  const allCategories  = ["All", ...new Set(stock.map((s) => s.category))];
  const autoPurchaseGst = form.purchasePrice && form.gstRate && form.qty
    ? ((Number(form.purchasePrice) * Number(form.qty) * Number(form.gstRate)) / 100).toFixed(2) 
    : null;
  const goldTotalValue  = shopType === "Gold and Silver" && form.sellingPrice && form.qty ? (Number(form.sellingPrice) * Number(form.qty || 1)) + Number(form.makingCharges || 0) : null;
  const gstCalc         = shopType !== "Gold and Silver" ? calcGst(form.sellingPrice, form.gstRate, form.gstInclusive) : null;
  const goldGstCalc     = shopType === "Gold and Silver"  ? calcGoldGst(form.sellingPrice, form.qty, form.makingCharges) : null;

  // ─── TABS ─────────────────────────────────────────────────
  const TAB_LIST = [
    { key: "list", label: "📋 Stock List" },
    { key: "add",  label: editingId ? "✏️ Edit Stock" : "➕ Add Stock" },
    { key: "job-services", label: "🛠️ Job Services" },
  ];
  const handleTabClick = (key) => {
    if (key === "job-services") { navigate("/dashboard/business/job-services"); return; }
    setTab(key); if (key === "list" && editingId) handleCancelEdit();
  };

  // ─── SHARED PROPS FOR PricingFields ───────────────────────
  const pricingProps = { form, handleChange, setForm, units, autoPurchaseGst, gstEnabled: shopProfile?.gst_enabled || false };

  // ─── SHARED CATEGORY PROPS ────────────────────────────────
  const catProps = { form, handleChange, categories, userCategories };

  // ─── DETERMINE WHICH FORM TO SHOW ─────────────────────────
  // Basic form: Kirana, Aluminium, Restaurant, General, Default, and all custom shop types
  // Own block:  Clothing, HardWare, Medical, Gold and Silver
  const SPECIAL_SHOPS = ["Clothing", "HardWare", "Medical", "Gold and Silver"];
  const isBasicForm   = !SPECIAL_SHOPS.includes(shopType);

  // ─── SECTION HEADER (desktop only) ────────────────────────
  const SectionHeader = ({ label }) => (
    <div style={{ gridColumn: "1 / -1" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{label}</div>
      <div style={{ height: "2px", background: t.color + "22", borderRadius: "2px" }} />
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  //   FORM FIELDS RENDERER (works for BOTH mobile & desktop)
  // ═══════════════════════════════════════════════════════════
  const renderFormFields = () => {
    const W      = isMobile ? MField : Field;
    const iStyle = isMobile ? S.mInput : inputStyle;
    const sStyle = isMobile ? S.mSelect : selectStyle;
    const gridStyle = isMobile
      ? S.fieldGrid
      : { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" };

    // ── BASIC FORM (Kirana / Aluminium / General / Custom) ──
    if (isBasicForm) return (
      <>
        {isMobile && <div style={S.sectionDivider(t.color)}>{t.icon} Item Details</div>}
        {!isMobile && <SectionHeader label={`${t.icon} ${t.label} — Item Details`} />}
        <div style={gridStyle}>
          <W label="Item Name *" full>
            <input name="name" placeholder="e.g. Basmati Rice…" value={form.name} onChange={handleChange} style={iStyle} />
          </W>
          <W label="Product Image" full>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setForm((prev) => ({ ...prev, image: file, imagePreview: URL.createObjectURL(file) }));
            }} style={iStyle} />
            {form.imagePreview && <img src={form.imagePreview} alt="preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />}
          </W>
          <CategorySelect {...catProps} isMobile={isMobile} />
          {form.category === "__custom__" && (
            <CustomTextInput label="Custom Category Name" placeholder="Type your category name…" value={customCategory} onChange={setCustomCategory} onConfirm={confirmCustomCategory} isMobile={isMobile} color={t.color} />
          )}
          <PricingFields {...pricingProps} isMobile={isMobile} />
        </div>
      </>
    );

    // ── CLOTHING ──
    if (shopType === "Clothing") return (
      <>
        {isMobile && <div style={S.sectionDivider(t.color)}>👗 Clothing Details</div>}
        {!isMobile && <SectionHeader label="👗 Clothing Details" />}
        <div style={gridStyle}>
          {["clothingGender","clothingType","clothingColor","clothingSize"].map((field) => {
            const opts = { clothingGender: ["Men","Women","Boy","Girl","Unisex"], clothingType: CLOTHING_TYPES, clothingColor: CLOTHING_COLORS, clothingSize: CLOTHING_SIZES };
            const labels = { clothingGender: "Gender *", clothingType: "Type *", clothingColor: "Color", clothingSize: "Size" };
            return (
              <W key={field} label={labels[field]}>
                <select name={field} value={form[field]} onChange={handleChange} style={sStyle}>
                  <option value="">Select…</option>
                  {opts[field].map((o) => <option key={o}>{o}</option>)}
                </select>
              </W>
            );
          })}
          <W label="Custom Name" full>
            <input name="name" placeholder="Auto-built or type custom name" value={form.name} onChange={handleChange} style={iStyle} />
            {(form.clothingGender || form.clothingType) && !form.name && (
              <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "3px" }}>Will save as: <strong>{buildClothingName()}</strong></span>
            )}
          </W>
          <W label="Product Image" full>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setForm((prev) => ({ ...prev, image: file, imagePreview: URL.createObjectURL(file) }));
            }} style={iStyle} />
            {form.imagePreview && <img src={form.imagePreview} alt="preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />}
          </W>
        </div>
        {isMobile && <div style={{ ...S.sectionDivider(t.color), marginTop: "14px" }}>💰 Pricing & Stock</div>}
        {!isMobile && <SectionHeader label="💰 Pricing & Stock" />}
        <div style={gridStyle}>
          <PricingFields {...pricingProps} isMobile={isMobile} />
        </div>
      </>
    );

    // ── HARDWARE ──
    if (shopType === "HardWare") return (
      <>
        {isMobile && <div style={S.sectionDivider(t.color)}>🔧 Hardware Details</div>}
        {!isMobile && <SectionHeader label="🔧 Hardware Item Details" />}
        <div style={gridStyle}>
          <W label="Item Name *" full>
            <input name="name" placeholder="e.g. 1/2 inch PVC Pipe…" value={form.name} onChange={handleChange} style={iStyle} />
          </W>
          <W label="Product Image" full>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setForm((prev) => ({ ...prev, image: file, imagePreview: URL.createObjectURL(file) }));
            }} style={iStyle} />
            {form.imagePreview && <img src={form.imagePreview} alt="preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />}
          </W>
          <CategorySelect {...catProps} isMobile={isMobile} />
          {form.category === "__custom__" && (
            <CustomTextInput label="Custom Category Name" placeholder="Type your category name…" value={customCategory} onChange={setCustomCategory} onConfirm={confirmCustomCategory} isMobile={isMobile} color={t.color} />
          )}
          <SubCategoryField shopType={shopType} category={form.category} value={form.subCategory} onChange={handleChange} isMobile={isMobile} userSubCats={userSubCategories} />
          {form.subCategory === "__custom__" && (
            <CustomTextInput label="Custom Sub-Category Name" placeholder="Type your sub-category name…" value={customSubCategory} onChange={setCustomSubCategory} onConfirm={confirmCustomSubCategory} isMobile={isMobile} color={t.color} />
          )}
          <W label="Brand">
            <select name="hwBrand" value={form.hwBrand} onChange={handleChange} style={sStyle}>
              <option value="">Select…</option>
              {HW_BRANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </W>
          <W label="Material">
            <select name="hwMaterial" value={form.hwMaterial} onChange={handleChange} style={sStyle}>
              <option value="">Select…</option>
              {HW_MATERIALS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </W>
          <W label="Model / Spec" full>
            <input name="hwModel" placeholder="e.g. 1/2 inch, 4mm, 100W" value={form.hwModel} onChange={handleChange} style={iStyle} />
          </W>
        </div>
        {isMobile && <div style={{ ...S.sectionDivider(t.color), marginTop: "14px" }}>📦 Stock & Pricing</div>}
        {!isMobile && <SectionHeader label="📦 Stock & Pricing" />}
        <div style={gridStyle}>
          <PricingFields {...pricingProps} isMobile={isMobile} />
        </div>
      </>
    );

    // ── MEDICAL ──
    if (shopType === "Medical") return (
      <>
        {isMobile && <div style={S.sectionDivider(t.color)}>💊 Medicine Details</div>}
        {!isMobile && <SectionHeader label="💊 Medicine / Product Details" />}
        <div style={gridStyle}>
          <W label="Medicine Name *" full>
            <input name="name" placeholder="e.g. Dolo 650mg…" value={form.name} onChange={handleChange} style={iStyle} />
          </W>
          <W label="Product Image" full>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setForm((prev) => ({ ...prev, image: file, imagePreview: URL.createObjectURL(file) }));
            }} style={iStyle} />
            {form.imagePreview && <img src={form.imagePreview} alt="preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />}
          </W>
          <CategorySelect {...catProps} isMobile={isMobile} />
          {form.category === "__custom__" && (
            <CustomTextInput label="Custom Category Name" placeholder="Type your category name…" value={customCategory} onChange={setCustomCategory} onConfirm={confirmCustomCategory} isMobile={isMobile} color={t.color} />
          )}
          <W label="Company">
            <select name="medCompany" value={form.medCompany} onChange={handleChange} style={sStyle}>
              <option value="">Select…</option>
              {MED_COMPANIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </W>
          <W label="Schedule">
            <select name="medSchedule" value={form.medSchedule} onChange={handleChange} style={sStyle}>
              {MED_SCHEDULES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </W>
          <W label="Batch No.">
            <input name="medBatch" placeholder="Batch No." value={form.medBatch} onChange={handleChange} style={iStyle} />
          </W>
          <W label="Expiry Date *">
            <input name="medExpiry" type="month" value={form.medExpiry} onChange={handleChange}
              style={{ ...iStyle, borderColor: !form.medExpiry ? "#fca5a5" : "#e2e8f0" }} />
          </W>
        </div>
        {form.medExpiry && new Date(`${form.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
          <div style={isMobile ? { ...S.expiryWarning, marginTop: "10px" } : { gridColumn: "1 / -1", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "10px", padding: "10px 14px", fontSize: "0.8rem", color: "#92400e" }}>
            ⚠️ <strong>Expiry soon!</strong> Within 90 days. Monitor carefully.
          </div>
        )}
        {isMobile && <div style={{ ...S.sectionDivider(t.color), marginTop: "14px" }}>📦 Stock & Pricing</div>}
        {!isMobile && <SectionHeader label="📦 Stock & Pricing" />}
        <div style={gridStyle}>
          <PricingFields {...pricingProps} isMobile={isMobile} />
        </div>
      </>
    );

    // ── GOLD & SILVER ──
    if (shopType === "Gold and Silver") return (
      <>
        {isMobile && <div style={S.sectionDivider(t.color)}>💍 Jewellery Details</div>}
        {!isMobile && <SectionHeader label="💍 Jewellery / Metal Details" />}
        <div style={gridStyle}>
          <W label="Metal Type *">
            <select name="metalType" value={form.metalType} onChange={handleChange} style={sStyle}>
              {METAL_TYPES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </W>
          <W label="Purity / Karat">
            <select name="goldPurity" value={form.goldPurity} onChange={handleChange} style={sStyle}>
              <option value="">Select…</option>
              {GOLD_PURITY.map((p) => <option key={p}>{p}</option>)}
            </select>
          </W>
          <W label="Item Name *" full>
            <input name="name" placeholder="e.g. Necklace, Ring, Coin…" value={form.name} onChange={handleChange} style={iStyle} />
          </W>
          <W label="Product Image" full>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setForm((prev) => ({ ...prev, image: file, imagePreview: URL.createObjectURL(file) }));
            }} style={iStyle} />
            {form.imagePreview && <img src={form.imagePreview} alt="preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />}
          </W>
          <CategorySelect {...catProps} isMobile={isMobile} />
          {form.category === "__custom__" && (
            <CustomTextInput label="Custom Category Name" placeholder="Type your category name…" value={customCategory} onChange={setCustomCategory} onConfirm={confirmCustomCategory} isMobile={isMobile} color={t.color} />
          )}
          <W label="Weight (grams) *">
            <input name="goldWeight" type="number" placeholder="0.00" value={form.goldWeight} onChange={handleChange} min="0" step="0.01" style={iStyle} />
          </W>
        </div>
        {isMobile && <div style={{ ...S.sectionDivider(t.color), marginTop: "14px" }}>💰 Pricing</div>}
        {!isMobile && <SectionHeader label="💰 Pricing" />}
        <div style={gridStyle}>
          <W label="Unit">
            <select name="unit" value={form.unit} onChange={handleChange} style={sStyle}>
              {units.map((u) => <option key={u}>{u}</option>)}
            </select>
          </W>
          <W label="Quantity *">
            <input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" style={iStyle} />
          </W>
          <W label="Rate/gram ₹ *">
            <input name="sellingPrice" type="number" placeholder="Rate" value={form.sellingPrice} onChange={handleChange} min="0" style={iStyle} />
          </W>
          <W label="Purchase ₹">
            <input name="purchasePrice" type="number" placeholder="Cost rate" value={form.purchasePrice} onChange={handleChange} min="0" style={iStyle} />
          </W>
          <W label="Purchase GST / ITC ₹">
            <input name="purchaseGst" type="number" placeholder="ITC amount" value={form.purchaseGst} onChange={handleChange} style={iStyle} />
            {autoPurchaseGst && !form.purchaseGst && <span style={{ fontSize: "0.68rem", color: "#16a34a", marginTop: "3px" }}>Auto: ₹{autoPurchaseGst}</span>}
          </W>
          <W label="Making Charges ₹">
            <input name="makingCharges" type="number" placeholder="Making" value={form.makingCharges} onChange={handleChange} min="0" style={iStyle} />
          </W>
          <W label="Low Stock At">
            <input name="minQtyAlert" type="number" placeholder="1" value={form.minQtyAlert} onChange={handleChange} min="0" style={iStyle} />
          </W>
          <W label="HSN Code" full>
            <input name="hsnCode" placeholder="e.g. 7113" value={form.hsnCode} onChange={handleChange} style={iStyle} />
          </W>
          <W label="Supplier GSTIN (for ITC)" full>
            <input name="supplierGstin" placeholder="15-digit GSTIN" value={form.supplierGstin} onChange={handleChange} maxLength={15} style={iStyle} />
          </W>
          <W label="Invoice No.">
            <input name="purchaseInvoice" placeholder="Bill / Invoice No." value={form.purchaseInvoice} onChange={handleChange} style={iStyle} />
          </W>
          <W label="Purchase Date">
            <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} style={iStyle} />
          </W>
        </div>

        {/* Gold totals */}
        {goldTotalValue && (
          <div style={isMobile ? S.goldTotal : { background: "#fef9c3", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "0.83rem", color: "#78350f", marginTop: "12px" }}>
            <span>💍 Value: <strong>₹{(Number(form.sellingPrice) * Number(form.qty || 1)).toLocaleString("en-IN")}</strong></span>
            <span>🔨 Making: <strong>₹{Number(form.makingCharges || 0).toLocaleString("en-IN")}</strong></span>
            <span>✅ Total: <strong>₹{goldTotalValue.toLocaleString("en-IN")}</strong></span>
          </div>
        )}
        {goldGstCalc && (
          <div style={isMobile ? S.goldGstPreview : { background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.83rem", color: "#78350f", marginTop: "8px" }}>
            <span style={{ fontWeight: 800, width: "100%", fontSize: "0.76rem" }}>🧾 GST Breakdown — Metal {GOLD_METAL_GST}% + Making {GOLD_MAKING_GST}% (Indian GST rules)</span>
            <span>Metal Value: <strong>₹{Number(goldGstCalc.metalValue).toLocaleString("en-IN")}</strong></span>
            <span>Metal GST ({GOLD_METAL_GST}%): <strong>₹{Number(goldGstCalc.metalGstAmt).toLocaleString("en-IN")}</strong></span>
            <span>Making GST ({GOLD_MAKING_GST}%): <strong>₹{Number(goldGstCalc.makingGstAmt).toLocaleString("en-IN")}</strong></span>
            <span>Total GST: <strong>₹{Number(goldGstCalc.totalGst).toLocaleString("en-IN")}</strong></span>
            <span>Grand Total: <strong style={{ color: "#d97706" }}>₹{Number(goldGstCalc.grandTotal).toLocaleString("en-IN")}</strong></span>
          </div>
        )}
      </>
    );
  };

  // ─── STATS CARDS (shared) ──────────────────────────────────
  const statsData = [
    { label: "Total Products",   value: stats.total_items  || 0,      color: t.color },
    { label: "Stock Value",      value: `₹${(stats.total_value || 0).toLocaleString("en-IN")}`, color: "#16a34a" },
    { label: "Low Stock Alerts", value: stats.low_stock_count || 0,   color: (stats.low_stock_count || 0) > 0 ? "#dc2626" : "#16a34a" },
    { label: "Total Units",      value: stats.total_qty    || 0,      color: "#7c3aed" },
  ];

  // ─── STOCK LIST ITEM (shared) ──────────────────────────────
  const renderStockItem = (s) => {
    const chips = [
      { show: true,                   label: "Qty",    val: `${s.qty} ${s.unit}`,   color: s.isLowStock ? "#dc2626" : "#16a34a" },
      { show: true,                   label: "Price",  val: `₹${s.sellingPrice}`,   color: t.color },
      { show: true,                   label: "Value",  val: `₹${(Number(s.qty) * Number(s.sellingPrice)).toLocaleString("en-IN")}`, color: "#0f172a" },
      { show: s.gstRate != null && shopProfile?.gst_enabled,      label: "GST",    val: `${s.gstRate}%`,         color: "#15803d" },
      { show: !!s.clothingSize,       label: "Size",   val: s.clothingSize },
      { show: !!s.clothingColor,      label: "Color",  val: s.clothingColor },
      { show: !!s.hwBrand,            label: "Brand",  val: s.hwBrand },
      { show: !!s.hwMaterial,         label: "Mat",    val: s.hwMaterial },
      { show: !!s.hwModel,            label: "Spec",   val: s.hwModel },
      { show: !!s.medCompany,         label: "Co",     val: s.medCompany },
      { show: !!s.medSchedule,        label: "Sch",    val: s.medSchedule },
      { show: !!s.medBatch,           label: "Batch",  val: s.medBatch },
      { show: !!s.goldPurity,         label: "Purity", val: s.goldPurity },
      { show: !!s.goldWeight,         label: "Wt",     val: `${s.goldWeight}g` },
      { show: s.makingCharges > 0,    label: "Making", val: `₹${s.makingCharges}` },
      { show: !!s.hsnCode && shopProfile?.gst_enabled,            label: "HSN",    val: s.hsnCode },
      { show: true,                   label: "",       val: s.category,              color: "#7c3aed" },
    ].filter((c) => c.show);

    const isExpiringSoon = s.medExpiry && new Date(`${s.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    return chips.map((c, i) => (
      <span key={i} style={isMobile ? { ...S.metaChip, ...(c.color ? { color: c.color } : {}) } : { fontSize: "0.78rem", color: "#64748b" }}>
        {c.label ? `${c.label}: ` : ""}<strong style={{ color: c.color }}>{c.val}</strong>
      </span>
    ));
  };

  // ═══════════════════════════════════════════════════════════
  //   MOBILE RENDER
  // ═══════════════════════════════════════════════════════════
  if (isMobile) return (
    <div style={S.page}>
      {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
      <div style={S.headerBar}>
        <div style={S.headerLeft}>
          <h2 style={S.headerTitle}>📦 Stock Entry</h2>
          {t.hint && <span style={S.headerHint}>{t.hint}</span>}
        </div>
        {shopProfile && <span style={S.shopBadge(t.color)}>{t.icon} {t.label}</span>}
      </div>
      <div style={S.tabBar}>
        {TAB_LIST.map((tb) => <button key={tb.key} style={S.tabBtn(tab === tb.key)} onClick={() => handleTabClick(tb.key)}>{tb.label}</button>)}
      </div>
      <div style={S.body}>
        {!shopProfile && !loading && <div style={S.warnBanner}>⚠️ <strong>Shop Profile not set.</strong> Go to <strong>Shop Profile</strong> to select your business type.</div>}
        <div style={S.statsRow}>
          {statsData.map((s) => (
            <div key={s.label} style={S.statCard(s.color)}>
              <div style={S.statLabel}>{s.label}</div>
              <div style={S.statValue}>{s.value}</div>
            </div>
          ))}
        </div>
        {lowStock.length > 0 && (
          <div style={S.lowStockBanner}>
            <div style={S.lowStockTitle}>⚠️ Low Stock — {lowStock.length} item{lowStock.length > 1 ? "s" : ""} need restocking</div>
            <div style={S.lowStockChips}>{lowStock.map((s) => <span key={s.id} style={S.lowStockChip}>{s.name} — {s.qty} {s.unit}</span>)}</div>
          </div>
        )}

        {tab === "add" && (
          <div style={S.formCard}>
            {renderFormFields()}
            {shopType !== "Gold and Silver" && <MarginPreview form={form} t={t} isMobile={true} />}
            {shopType !== "Gold and Silver" && shopProfile?.gst_enabled && <GstPreview gstCalc={gstCalc} form={form} setForm={setForm} isMobile={true} />}
            <div style={S.actionRow}>
              <button onClick={handleAddStock} disabled={saving} style={S.saveBtn(t.color)}>
                {saving ? "Saving…" : editingId ? "✅ Update Stock" : "✅ Add Stock"}
              </button>
              {editingId && <button onClick={handleCancelEdit} style={S.cancelBtn}>✕ Cancel</button>}
            </div>
          </div>
        )}

        {tab === "list" && (
          <>
            <div style={S.searchWrap}>
              <input placeholder="🔍 Search items…" value={search} onChange={(e) => setSearch(e.target.value)} style={S.searchInput} />
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={S.filterSelect}>
                {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {loading ? <div style={S.emptyBox}>Loading stock…</div> : (
              <>
                <div style={S.listCount}>{filtered.length} item{filtered.length !== 1 ? "s" : ""} in stock</div>
                {filtered.length === 0
                  ? <div style={S.emptyBox}>{stock.length === 0 ? "No stock added yet. Go to '➕ Add Stock' tab to begin." : "No items match your search or filter."}</div>
                  : filtered.map((s) => (
                    <div key={s.id} style={S.stockCard}>
                      {s.imageUrl && (
                        <img src={s.imageUrl} alt={s.name} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
                      )}
                      <div style={S.stockCardTop}>
                        <div>
                          <div style={S.stockName}>{s.name}</div>
                          <div style={S.badgeRow}>
                            {s.isLowStock && <span style={S.lowBadge}>Low Stock</span>}
                            {s.medExpiry && new Date(`${s.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && <span style={S.expiryBadge}>⏰ Exp: {s.medExpiry}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={S.stockMeta}>{renderStockItem(s)}</div>
                      <div style={S.stockActions}>
                        <button onClick={() => handleEdit(s)} style={S.editBtn(t.color)}>Edit</button>
                        {confirmDel === s.id
                          ? <div style={S.confirmRow}><button onClick={() => handleDelete(s.id)} style={S.confirmYes}>Yes, Remove</button><button onClick={() => setConfirmDel(null)} style={S.confirmNo}>Cancel</button></div>
                          : <button onClick={() => setConfirmDel(s.id)} style={S.removeBtn}>Remove</button>}
                      </div>
                    </div>
                  ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  //   DESKTOP RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="stock-page">
      {toast && (
        <div style={{ position: "fixed", top: "72px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "10px 24px", borderRadius: "100px", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", background: toast.type === "success" ? "#0e1b2e" : "#dc2626", color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
        <h2 style={{ margin: 0 }}>Stock Entry</h2>
        {shopProfile && <span style={{ background: t.color + "18", color: t.color, border: `1.5px solid ${t.color}44`, padding: "4px 12px", borderRadius: "100px", fontSize: "0.76rem", fontWeight: 700 }}>{t.icon} {t.label}</span>}
      </div>
      {t.hint && <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: "#64748b" }}>{t.hint}</p>}
      {!shopProfile && !loading && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "12px", padding: "12px 18px", marginBottom: "18px", fontSize: "0.83rem", color: "#92400e" }}>
          ⚠️ <strong>Shop Profile not set.</strong> Go to <strong>Shop Profile</strong> to select your business type.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px", marginBottom: "22px" }}>
        {statsData.map((s) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginBottom: "6px" }}>{s.label}</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>{s.value}</div>
          </div>
        ))}
      </div>
      {lowStock.length > 0 && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px" }}>
          <strong style={{ color: "#c2410c", fontSize: "0.88rem" }}>⚠️ Low Stock — {lowStock.length} item{lowStock.length > 1 ? "s" : ""} need restocking</strong>
          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {lowStock.map((s) => <span key={s.id} style={{ background: "#fee2e2", color: "#991b1b", padding: "3px 10px", borderRadius: "100px", fontSize: "0.73rem", fontWeight: 600 }}>{s.name} — {s.qty} {s.unit} left</span>)}
          </div>
        </div>
      )}
      <div className="sub-nav">
        {TAB_LIST.map((tb) => <button key={tb.key} className={`sub-link${tab === tb.key ? " active" : ""}`} onClick={() => handleTabClick(tb.key)} style={{ background: "none", border: "none", cursor: "pointer" }}>{tb.label}</button>)}
      </div>

      {tab === "add" && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ margin: "0 0 4px" }}>{editingId ? "Edit Stock Item" : `Add Stock — ${t.icon} ${t.label}`}</h3>
          <p style={{ fontSize: "0.83rem", color: "#64748b", marginBottom: "20px" }}>{editingId ? "Update the details below and click Update Stock." : "Same item name will auto-merge quantity."}</p>
          {renderFormFields()}
          {shopType !== "Gold and Silver" && <MarginPreview form={form} t={t} isMobile={false} />}
          {shopType !== "Gold and Silver" && shopProfile?.gst_enabled && <GstPreview gstCalc={gstCalc} form={form} setForm={setForm} isMobile={false} />}
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button onClick={handleAddStock} disabled={saving} style={{ padding: "12px 28px", borderRadius: "10px", border: "none", background: t.color, color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : editingId ? "✅ Update Stock" : "✅ Add Stock"}
            </button>
            {editingId && <button onClick={handleCancelEdit} style={{ padding: "12px 20px", borderRadius: "10px", border: "1.5px solid #cbd5e1", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>✕ Cancel Edit</button>}
          </div>
        </div>
      )}

      {tab === "list" && (
        <>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", margin: "20px 0 16px" }}>
            <input placeholder="🔍 Search items…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: "180px", ...inputStyle }} />
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...selectStyle, minWidth: "160px" }}>
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {loading ? <div className="empty-box">Loading stock…</div> : (
            <>
              <h3 style={{ margin: "0 0 14px" }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""} in stock</h3>
              {filtered.length === 0
                ? <div className="empty-box">{stock.length === 0 ? "No stock added yet. Go to '➕ Add Stock' tab to begin." : "No items match your search or filter."}</div>
                : <ul style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: 0, listStyle: "none", margin: 0 }}>
                  {filtered.map((s) => (
                    <li key={s.id}>
                      {s.imageUrl && (
                        <img src={s.imageUrl} alt={s.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                          <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{s.name}</strong>
                          {s.isLowStock && <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: "100px", textTransform: "uppercase" }}>Low Stock</span>}
                          {s.medExpiry && new Date(`${s.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && <span style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: "100px" }}>⏰ Exp: {s.medExpiry}</span>}
                        </div>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>{renderStockItem(s)}</div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button onClick={() => handleEdit(s)} style={{ padding: "6px 12px", borderRadius: "6px", background: t.color, color: "#fff", border: "none", fontSize: "12px", cursor: "pointer" }}>Edit</button>
                        {confirmDel === s.id
                          ? <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleDelete(s.id)} style={{ padding: "6px 10px", borderRadius: "6px", background: "#dc2626", color: "#fff", border: "none", fontSize: "12px", cursor: "pointer" }}>Yes, Remove</button>
                              <button onClick={() => setConfirmDel(null)} style={{ padding: "6px 10px", borderRadius: "6px", background: "#f1f5f9", color: "#64748b", border: "none", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                            </div>
                          : <button onClick={() => setConfirmDel(s.id)}>Remove</button>}
                      </div>
                    </li>
                  ))}
                </ul>}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
