import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts, addProduct, updateProduct, deleteProduct,
  getLowStockProducts, getProductStats, getShopProfile, uploadProductImage,
} from "../../services/businessService";
import "../../styles/business/Products.css";

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

// Medicine expiring within 90 days
const isExpiringSoon = (item) =>
  item.medExpiry && new Date(`${item.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

// ─── REUSABLE UI PIECES ───────────────────────────────────────
// Field renders a <label> so the control inside is announced with its label.
// Use as="div" when the field contains more than one control.
const Field = ({ label, children, full, as: Tag = "label" }) => (
  <Tag className={`pr-field${full ? " pr-field--full" : ""}`}>
    <span className="pr-label">{label}</span>
    {children}
  </Tag>
);

const Section = ({ title, children }) => (
  <section className="pr-section">
    <h4 className="pr-section-title">{title}</h4>
    <div className="pr-grid">{children}</div>
  </section>
);

const GstRateSelect = ({ value, onChange }) => (
  <select name="gstRate" aria-label="GST rate" value={value} onChange={onChange} className="pr-select">
    {GST_RATES.map((r) => <option key={r} value={r}>{r}% GST</option>)}
  </select>
);

// Two ways to add a product photo: open the camera, or pick an existing file.
// Both hidden inputs feed the same handler, so form.image / form.imagePreview
// behave exactly as before.
const ImageField = ({ form, setForm }) => {
  const cameraRef = useRef(null);
  const fileRef   = useRef(null);

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    if (file) setForm((prev) => ({ ...prev, image: file, imagePreview: URL.createObjectURL(file) }));
    e.target.value = ""; // allows picking the same photo again
  };

  return (
    <Field label="Product Image" full as="div">
      <div className="pr-imgpick">
        <button type="button" className="pr-btn" onClick={() => cameraRef.current?.click()}>
          Take photo
        </button>
        <button type="button" className="pr-btn" onClick={() => fileRef.current?.click()}>
          Choose from files
        </button>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handlePick} />
        <input ref={fileRef}   type="file" accept="image/*" hidden onChange={handlePick} />
      </div>
      {form.imagePreview && <img src={form.imagePreview} alt="Selected product preview" className="pr-imgprev" />}
    </Field>
  );
};

const SubCategoryField = ({ shopType, category, value, onChange, userSubCats = [] }) => {
  const options = getSubCategories(shopType, category);
  if (!options.length && !userSubCats.length) return null;
  return (
    <Field label="Sub Category" full>
      <select name="subCategory" value={value} onChange={onChange} className="pr-select">
        <option value="">Select…</option>
        {options.map((o) => <option key={o}>{o}</option>)}
        {userSubCats.map((o) => <option key={`custom_${o}`} value={o}>{o} ✓</option>)}
        <option value="__custom__">Add custom…</option>
      </select>
    </Field>
  );
};

const CustomTextInput = ({ label, placeholder, value, onChange, onConfirm }) => (
  <div className="pr-custom">
    <span className="pr-custom-label">{label}</span>
    <div className="pr-custom-row">
      <input
        className="pr-input" aria-label={label} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && value.trim() && onConfirm()}
      />
      <button type="button" className="pr-btn pr-btn--primary" onClick={() => value.trim() && onConfirm()} disabled={!value.trim()}>
        Set
      </button>
    </div>
    <span className="pr-help">Press Set or Enter to confirm. This name will be saved for future use.</span>
  </div>
);

// Pricing, stock and GST fields shared by every shop type
const PricingFields = ({ form, handleChange, setForm, units, autoPurchaseGst, gstEnabled }) => (
  <>
    <Field label="Unit">
      <select name="unit" value={form.unit} onChange={handleChange} className="pr-select">
        {units.map((u) => <option key={u}>{u}</option>)}
      </select>
    </Field>
    <Field label="Quantity *">
      <input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" className="pr-input" />
    </Field>
    <Field label="Purchase ₹">
      <input name="purchasePrice" type="number" placeholder="Cost price" value={form.purchasePrice} onChange={handleChange} min="0" className="pr-input" />
    </Field>
    <Field label="Selling ₹ *">
      <input name="sellingPrice" type="number" placeholder="Sale price" value={form.sellingPrice} onChange={handleChange} min="0" className="pr-input" />
    </Field>
    <Field label="Low Stock At">
      <input name="minQtyAlert" type="number" placeholder="5" value={form.minQtyAlert} onChange={handleChange} min="0" className="pr-input" />
    </Field>
    {gstEnabled && <>
      <Field label="Purchase GST / ITC ₹">
        <input name="purchaseGst" type="number" placeholder="ITC amount" value={form.purchaseGst} onChange={handleChange} className="pr-input" />
        {autoPurchaseGst && !form.purchaseGst && <span className="pr-help pr-help--ok">Auto: ₹{autoPurchaseGst}</span>}
      </Field>
      <Field label="GST Rate" full as="div">
        <div className="pr-gstrow">
          <GstRateSelect value={form.gstRate} onChange={handleChange} />
          <label className="pr-check">
            <input type="checkbox" checked={form.gstInclusive} onChange={(e) => setForm((prev) => ({ ...prev, gstInclusive: e.target.checked }))} />
            Incl. GST
          </label>
        </div>
      </Field>
      <Field label="HSN Code" full>
        <input name="hsnCode" placeholder="e.g. 1006" value={form.hsnCode} onChange={handleChange} className="pr-input" />
      </Field>
      <Field label="Supplier GSTIN (for ITC)" full>
        <input name="supplierGstin" placeholder="15-digit GSTIN" value={form.supplierGstin} onChange={handleChange} maxLength={15} className="pr-input" />
      </Field>
      <Field label="Invoice No.">
        <input name="purchaseInvoice" placeholder="Bill / Invoice No." value={form.purchaseInvoice} onChange={handleChange} className="pr-input" />
      </Field>
      <Field label="Purchase Date">
        <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} className="pr-input" />
      </Field>
    </>}
  </>
);

const CategorySelect = ({ form, handleChange, categories, userCategories }) => (
  <Field label="Category *">
    <select name="category" value={form.category} onChange={handleChange} className="pr-select">
      {categories.map((c) => <option key={c}>{c}</option>)}
      {userCategories.map((c) => <option key={`custom_${c}`} value={c}>{c} ✓</option>)}
      <option value="__custom__">Custom…</option>
    </select>
  </Field>
);

const GstPreview = ({ gstCalc, form, setForm }) => {
  if (!gstCalc) return null;
  return (
    <div className="pr-preview pr-preview--gst">
      <div className="pr-seg" role="group" aria-label="Sale type">
        {["intra", "inter"].map((type) => (
          <button key={type} type="button" aria-pressed={form.saleType === type}
            onClick={() => setForm((prev) => ({ ...prev, saleType: type }))}>
            {type === "intra" ? "Intra-state" : "Inter-state"}
          </button>
        ))}
      </div>
      <span className="pr-preview-title">
        GST preview — {form.gstRate}% ({form.gstInclusive ? "inclusive" : "exclusive"})
      </span>
      <span>Taxable: <strong>₹{Number(gstCalc.taxableValue).toLocaleString("en-IN")}</strong></span>
      {form.saleType === "intra" ? (
        <>
          <span>CGST ({form.gstRate / 2}%): <strong>₹{(Number(gstCalc.gstAmount) / 2).toFixed(2)}</strong></span>
          <span>SGST ({form.gstRate / 2}%): <strong>₹{(Number(gstCalc.gstAmount) / 2).toFixed(2)}</strong></span>
        </>
      ) : (
        <span>IGST ({form.gstRate}%): <strong>₹{Number(gstCalc.gstAmount).toLocaleString("en-IN")}</strong></span>
      )}
      <span>Total: <strong>₹{Number(gstCalc.totalWithGst).toLocaleString("en-IN")}</strong></span>
    </div>
  );
};

const MarginPreview = ({ form }) => {
  const margin = form.purchasePrice && form.sellingPrice
    ? (Number(form.sellingPrice) - Number(form.purchasePrice)).toFixed(2) : null;
  if (!margin) return null;
  return (
    <div className="pr-preview">
      <span>Margin per {form.unit}: <strong className={Number(margin) >= 0 ? "pr-pos" : "pr-neg"}>₹{margin}</strong></span>
      {form.purchasePrice > 0 && (
        <span>Margin %: <strong className="pr-pos">{(((Number(form.sellingPrice) - Number(form.purchasePrice)) / Number(form.purchasePrice)) * 100).toFixed(1)}%</strong></span>
      )}
      {form.qty && <span>Batch value: <strong>₹{(Number(form.qty) * Number(form.sellingPrice)).toLocaleString("en-IN")}</strong></span>}
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
    { key: "list", label: "Stock List" },
    { key: "add",  label: editingId ? "Edit Stock" : "Add Stock" },
    { key: "job-services", label: "Job Services" },
  ];
  const handleTabClick = (key) => {
    if (key === "job-services") { navigate("/dashboard/business/job-services"); return; }
    setTab(key); if (key === "list" && editingId) handleCancelEdit();
  };

  // ─── SHARED PROPS ─────────────────────────────────────────
  const pricingProps = { form, handleChange, setForm, units, autoPurchaseGst, gstEnabled: shopProfile?.gst_enabled || false };
  const catProps = { form, handleChange, categories, userCategories };

  // Basic form: Kirana, Aluminium, Restaurant, General, Default, and all custom shop types
  // Own block:  Clothing, HardWare, Medical, Gold and Silver
  const SPECIAL_SHOPS = ["Clothing", "HardWare", "Medical", "Gold and Silver"];
  const isBasicForm   = !SPECIAL_SHOPS.includes(shopType);

  const customCategoryInput = form.category === "__custom__" && (
    <CustomTextInput label="Custom category name" placeholder="Type your category name…" value={customCategory} onChange={setCustomCategory} onConfirm={confirmCustomCategory} />
  );

  // ═══════════════════════════════════════════════════════════
  //   FORM FIELDS (one responsive layout for all breakpoints)
  // ═══════════════════════════════════════════════════════════
  const renderFormFields = () => {
    // ── BASIC FORM ──
    if (isBasicForm) return (
      <>
        <Section title={`${t.label} — item details`}>
          <Field label="Item Name *" full>
            <input name="name" placeholder="e.g. Basmati Rice…" value={form.name} onChange={handleChange} className="pr-input" />
          </Field>
          <ImageField form={form} setForm={setForm} />
          <CategorySelect {...catProps} />
          {customCategoryInput}
        </Section>
        <Section title="Stock & pricing">
          <PricingFields {...pricingProps} />
        </Section>
      </>
    );

    // ── CLOTHING ──
    if (shopType === "Clothing") {
      const opts = { clothingGender: ["Men","Women","Boy","Girl","Unisex"], clothingType: CLOTHING_TYPES, clothingColor: CLOTHING_COLORS, clothingSize: CLOTHING_SIZES };
      const labels = { clothingGender: "Gender *", clothingType: "Type *", clothingColor: "Color", clothingSize: "Size" };
      return (
        <>
          <Section title="Clothing details">
            {["clothingGender","clothingType","clothingColor","clothingSize"].map((field) => (
              <Field key={field} label={labels[field]}>
                <select name={field} value={form[field]} onChange={handleChange} className="pr-select">
                  <option value="">Select…</option>
                  {opts[field].map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
            ))}
            <Field label="Custom Name" full>
              <input name="name" placeholder="Auto-built or type custom name" value={form.name} onChange={handleChange} className="pr-input" />
              {(form.clothingGender || form.clothingType) && !form.name && (
                <span className="pr-help">Will save as: <strong>{buildClothingName()}</strong></span>
              )}
            </Field>
            <ImageField form={form} setForm={setForm} />
          </Section>
          <Section title="Pricing & stock">
            <PricingFields {...pricingProps} />
          </Section>
        </>
      );
    }

    // ── HARDWARE ──
    if (shopType === "HardWare") return (
      <>
        <Section title="Hardware item details">
          <Field label="Item Name *" full>
            <input name="name" placeholder="e.g. 1/2 inch PVC Pipe…" value={form.name} onChange={handleChange} className="pr-input" />
          </Field>
          <ImageField form={form} setForm={setForm} />
          <CategorySelect {...catProps} />
          {customCategoryInput}
          <SubCategoryField shopType={shopType} category={form.category} value={form.subCategory} onChange={handleChange} userSubCats={userSubCategories} />
          {form.subCategory === "__custom__" && (
            <CustomTextInput label="Custom sub-category name" placeholder="Type your sub-category name…" value={customSubCategory} onChange={setCustomSubCategory} onConfirm={confirmCustomSubCategory} />
          )}
          <Field label="Brand">
            <select name="hwBrand" value={form.hwBrand} onChange={handleChange} className="pr-select">
              <option value="">Select…</option>
              {HW_BRANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Material">
            <select name="hwMaterial" value={form.hwMaterial} onChange={handleChange} className="pr-select">
              <option value="">Select…</option>
              {HW_MATERIALS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Model / Spec" full>
            <input name="hwModel" placeholder="e.g. 1/2 inch, 4mm, 100W" value={form.hwModel} onChange={handleChange} className="pr-input" />
          </Field>
        </Section>
        <Section title="Stock & pricing">
          <PricingFields {...pricingProps} />
        </Section>
      </>
    );

    // ── MEDICAL ──
    if (shopType === "Medical") return (
      <>
        <Section title="Medicine / product details">
          <Field label="Medicine Name *" full>
            <input name="name" placeholder="e.g. Dolo 650mg…" value={form.name} onChange={handleChange} className="pr-input" />
          </Field>
          <ImageField form={form} setForm={setForm} />
          <CategorySelect {...catProps} />
          {customCategoryInput}
          <Field label="Company">
            <select name="medCompany" value={form.medCompany} onChange={handleChange} className="pr-select">
              <option value="">Select…</option>
              {MED_COMPANIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Schedule">
            <select name="medSchedule" value={form.medSchedule} onChange={handleChange} className="pr-select">
              {MED_SCHEDULES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Batch No.">
            <input name="medBatch" placeholder="Batch No." value={form.medBatch} onChange={handleChange} className="pr-input" />
          </Field>
          <Field label="Expiry Date *">
            <input name="medExpiry" type="month" value={form.medExpiry} onChange={handleChange}
              className={`pr-input${!form.medExpiry ? " pr-input--invalid" : ""}`} />
          </Field>
        </Section>
        {form.medExpiry && isExpiringSoon(form) && (
          <div className="pr-note" role="alert"><strong>Expiry soon.</strong> This batch expires within 90 days. Monitor it carefully.</div>
        )}
        <Section title="Stock & pricing">
          <PricingFields {...pricingProps} />
        </Section>
      </>
    );

    // ── GOLD & SILVER ──
    if (shopType === "Gold and Silver") return (
      <>
        <Section title="Jewellery / metal details">
          <Field label="Metal Type *">
            <select name="metalType" value={form.metalType} onChange={handleChange} className="pr-select">
              {METAL_TYPES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Purity / Karat">
            <select name="goldPurity" value={form.goldPurity} onChange={handleChange} className="pr-select">
              <option value="">Select…</option>
              {GOLD_PURITY.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Item Name *" full>
            <input name="name" placeholder="e.g. Necklace, Ring, Coin…" value={form.name} onChange={handleChange} className="pr-input" />
          </Field>
          <ImageField form={form} setForm={setForm} />
          <CategorySelect {...catProps} />
          {customCategoryInput}
          <Field label="Weight (grams) *">
            <input name="goldWeight" type="number" placeholder="0.00" value={form.goldWeight} onChange={handleChange} min="0" step="0.01" className="pr-input" />
          </Field>
        </Section>
        <Section title="Pricing">
          <Field label="Unit">
            <select name="unit" value={form.unit} onChange={handleChange} className="pr-select">
              {units.map((u) => <option key={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Quantity *">
            <input name="qty" type="number" placeholder="0" value={form.qty} onChange={handleChange} min="0" className="pr-input" />
          </Field>
          <Field label="Rate/gram ₹ *">
            <input name="sellingPrice" type="number" placeholder="Rate" value={form.sellingPrice} onChange={handleChange} min="0" className="pr-input" />
          </Field>
          <Field label="Purchase ₹">
            <input name="purchasePrice" type="number" placeholder="Cost rate" value={form.purchasePrice} onChange={handleChange} min="0" className="pr-input" />
          </Field>
          <Field label="Purchase GST / ITC ₹">
            <input name="purchaseGst" type="number" placeholder="ITC amount" value={form.purchaseGst} onChange={handleChange} className="pr-input" />
            {autoPurchaseGst && !form.purchaseGst && <span className="pr-help pr-help--ok">Auto: ₹{autoPurchaseGst}</span>}
          </Field>
          <Field label="Making Charges ₹">
            <input name="makingCharges" type="number" placeholder="Making" value={form.makingCharges} onChange={handleChange} min="0" className="pr-input" />
          </Field>
          <Field label="Low Stock At">
            <input name="minQtyAlert" type="number" placeholder="1" value={form.minQtyAlert} onChange={handleChange} min="0" className="pr-input" />
          </Field>
          <Field label="HSN Code" full>
            <input name="hsnCode" placeholder="e.g. 7113" value={form.hsnCode} onChange={handleChange} className="pr-input" />
          </Field>
          <Field label="Supplier GSTIN (for ITC)" full>
            <input name="supplierGstin" placeholder="15-digit GSTIN" value={form.supplierGstin} onChange={handleChange} maxLength={15} className="pr-input" />
          </Field>
          <Field label="Invoice No.">
            <input name="purchaseInvoice" placeholder="Bill / Invoice No." value={form.purchaseInvoice} onChange={handleChange} className="pr-input" />
          </Field>
          <Field label="Purchase Date">
            <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} className="pr-input" />
          </Field>
        </Section>

        {goldTotalValue && (
          <div className="pr-preview pr-preview--gold">
            <span>Value: <strong>₹{(Number(form.sellingPrice) * Number(form.qty || 1)).toLocaleString("en-IN")}</strong></span>
            <span>Making: <strong>₹{Number(form.makingCharges || 0).toLocaleString("en-IN")}</strong></span>
            <span>Total: <strong>₹{goldTotalValue.toLocaleString("en-IN")}</strong></span>
          </div>
        )}
        {goldGstCalc && (
          <div className="pr-preview pr-preview--gold" style={{ marginTop: 12 }}>
            <span className="pr-preview-title">GST breakdown — Metal {GOLD_METAL_GST}% + Making {GOLD_MAKING_GST}% (Indian GST rules)</span>
            <span>Metal Value: <strong>₹{Number(goldGstCalc.metalValue).toLocaleString("en-IN")}</strong></span>
            <span>Metal GST ({GOLD_METAL_GST}%): <strong>₹{Number(goldGstCalc.metalGstAmt).toLocaleString("en-IN")}</strong></span>
            <span>Making GST ({GOLD_MAKING_GST}%): <strong>₹{Number(goldGstCalc.makingGstAmt).toLocaleString("en-IN")}</strong></span>
            <span>Total GST: <strong>₹{Number(goldGstCalc.totalGst).toLocaleString("en-IN")}</strong></span>
            <span>Grand Total: <strong>₹{Number(goldGstCalc.grandTotal).toLocaleString("en-IN")}</strong></span>
          </div>
        )}
      </>
    );
  };

  // ─── STATS CARDS ───────────────────────────────────────────
  const statsData = [
    { label: "Total Products",   value: stats.total_items  || 0,      color: t.color },
    { label: "Stock Value",      value: `₹${(stats.total_value || 0).toLocaleString("en-IN")}`, color: "#16a34a" },
    { label: "Low Stock Alerts", value: stats.low_stock_count || 0,   color: (stats.low_stock_count || 0) > 0 ? "#dc2626" : "#16a34a" },
    { label: "Total Units",      value: stats.total_qty    || 0,      color: "#7c3aed" },
  ];

  // ─── STOCK LIST ITEM CHIPS ─────────────────────────────────
  const renderStockItem = (s) => {
    const chips = [
      { show: true,                   label: "Qty",    val: `${s.qty} ${s.unit}`,   tone: s.isLowStock ? "bad" : "ok" },
      { show: true,                   label: "Price",  val: `₹${s.sellingPrice}`,   tone: "accent" },
      { show: true,                   label: "Value",  val: `₹${(Number(s.qty) * Number(s.sellingPrice)).toLocaleString("en-IN")}`, tone: "strong" },
      { show: s.gstRate != null && shopProfile?.gst_enabled,      label: "GST",    val: `${s.gstRate}%`,         tone: "ok" },
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
      { show: true,                   label: "",       val: s.category,              tone: "cat" },
    ].filter((c) => c.show);

    return chips.map((c, i) => (
      <span key={i} className={`pr-chip${c.tone ? ` pr-chip--${c.tone}` : ""}`}>
        {c.label ? `${c.label}: ` : ""}<strong>{c.val}</strong>
      </span>
    ));
  };

  // ═══════════════════════════════════════════════════════════
  //   RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="pr-page" style={{ "--accent": t.color }}>
      {toast && (
        <div className={`pr-toast${toast.type === "success" ? "" : " pr-toast--error"}`}
          role={toast.type === "success" ? "status" : "alert"}>
          {toast.msg}
        </div>
      )}

      <header className="pr-header">
        <div>
          <h2 className="pr-title">Stock Entry</h2>
          {t.hint && <p className="pr-sub">{t.hint}</p>}
        </div>
        {shopProfile && <span className="pr-badge"><span aria-hidden="true">{t.icon}</span> {t.label}</span>}
      </header>

      {!shopProfile && !loading && (
        <div className="pr-alert"><strong>Shop Profile not set.</strong> Go to <strong>Shop Profile</strong> to select your business type.</div>
      )}

      <div className="pr-stats">
        {statsData.map((s) => (
          <div key={s.label} className="pr-stat" style={{ "--dot": s.color }}>
            <div className="pr-stat-label">{s.label}</div>
            <div className="pr-stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="pr-low">
          <div className="pr-low-title">Low stock — {lowStock.length} item{lowStock.length > 1 ? "s" : ""} need restocking</div>
          <div className="pr-low-list">
            {lowStock.map((s) => <span key={s.id} className="pr-low-chip">{s.name} — {s.qty} {s.unit} left</span>)}
          </div>
        </div>
      )}

      <nav className="pr-tabs" aria-label="Stock sections">
        {TAB_LIST.map((tb) => (
          <button key={tb.key} type="button" className="pr-tab"
            aria-current={tab === tb.key ? "page" : undefined}
            onClick={() => handleTabClick(tb.key)}>
            {tb.label}
          </button>
        ))}
      </nav>

      {tab === "add" && (
        <div className="pr-form">
          <div className="pr-form-head">
            <h3 className="pr-form-title">{editingId ? "Edit stock item" : `Add stock — ${t.label}`}</h3>
            <p className="pr-form-sub">{editingId ? "Update the details below and click Update Stock." : "Same item name will auto-merge quantity."}</p>
          </div>
          <div className="pr-form-body">
            {renderFormFields()}
            {shopType !== "Gold and Silver" && <MarginPreview form={form} />}
            {shopType !== "Gold and Silver" && shopProfile?.gst_enabled && <GstPreview gstCalc={gstCalc} form={form} setForm={setForm} />}
          </div>
          <div className="pr-formbar">
            {editingId && <button type="button" onClick={handleCancelEdit} className="pr-btn pr-btn--lg">Cancel</button>}
            <button type="button" onClick={handleAddStock} disabled={saving} className="pr-btn pr-btn--primary pr-btn--lg">
              {saving ? "Saving…" : editingId ? "Update Stock" : "Add Stock"}
            </button>
          </div>
        </div>
      )}

      {tab === "list" && (
        <>
          <div className="pr-toolbar">
            <input className="pr-input pr-search" aria-label="Search items" placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="pr-select" aria-label="Filter by category" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {loading ? <div className="pr-empty pr-empty--loading">Loading stock…</div> : (
            <>
              <h3 className="pr-count">{filtered.length} item{filtered.length !== 1 ? "s" : ""} in stock</h3>
              {filtered.length === 0
                ? <div className="pr-empty">{stock.length === 0 ? "No stock added yet. Open the “Add Stock” tab to add your first item." : "No items match your search or filter."}</div>
                : (
                  <ul className="pr-list">
                    {filtered.map((s) => (
                      <li key={s.id} className="pr-card">
                        <div className="pr-card-head">
                          {s.imageUrl && <img src={s.imageUrl} alt={s.name} className="pr-card-img" />}
                          <div className="pr-card-main">
                            <h4 className="pr-card-name">{s.name}</h4>
                            {(s.isLowStock || isExpiringSoon(s)) && (
                              <div className="pr-tags">
                                {s.isLowStock && <span className="pr-tag pr-tag--low">Low stock</span>}
                                {isExpiringSoon(s) && <span className="pr-tag pr-tag--exp">Exp: {s.medExpiry}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="pr-meta">{renderStockItem(s)}</div>
                        <div className="pr-card-actions">
                          <button type="button" onClick={() => handleEdit(s)} className="pr-btn pr-btn--sm">Edit</button>
                          {confirmDel === s.id ? (
                            <>
                              <button type="button" onClick={() => handleDelete(s.id)} className="pr-btn pr-btn--danger pr-btn--sm">Yes, Remove</button>
                              <button type="button" onClick={() => setConfirmDel(null)} className="pr-btn pr-btn--sm">Cancel</button>
                            </>
                          ) : (
                            <button type="button" onClick={() => setConfirmDel(s.id)} className="pr-btn pr-btn--danger-ghost pr-btn--sm">Remove</button>
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