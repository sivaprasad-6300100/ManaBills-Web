import React, { useRef, useState, useEffect } from "react";
import { getProducts, updateProduct, getShopProfile } from "../../services/businessService";

// ── Same maps as Products.jsx ─────────────────────────────────
const CATEGORIES_BY_SHOP = {
  "Kirana Store":    ["Atta & Rice","Dal & Pulses","Oil & Ghee","Sugar & Salt","Spices","Dry Fruits","Biscuits & Snacks","Beverages","shampoo","Soap & Detergent","Dairy","Other"],
  "Clothing":        ["Men","Women","Boy","Girl","Unisex"],
  "HardWare":        ["Fasteners","Hardware Fittings","Furniture Fittings","Wood & Boards","Doors","Adhesives & Chemicals","Electrical & Lighting","Paint & Finishing","Plumbing","Kitchen & Bathroom","Tools & Safety","Glass"],
  "Medical":         ["Tablets","Syrups","Injections","Surgical","OTC Medicines","Vitamins & Supplements","Ayurvedic","Cosmetics","Baby Care","Other"],
  "Gold and Silver": ["Gold Jewellery","Silver Jewellery","Coins & Bars","Diamonds","Gemstones","Accessories","Other"],
  "Aluminium Shop":  ["Aluminium Section","Glass","Aluminium Rods","Handles","Locks","Sliding Channel","Rubber Beading","Screw","Silicone"],
  "Genral Store":    ["Electronics","Grocery","Clothing","Hardware","Stationery","Toys","Sports","Home & Kitchen","Personal Care","Other"],
  "Resturants":      ["Breakfast","Lunch","Dinner","Beverages","Snacks","Other"],
  "default":         ["General","Electronics","Grocery","Clothing","Hardware","Medical","Stationery","Food & Beverages","Other"],
};

const UNITS_BY_SHOP = {
  "Kirana Store":    ["bag","kg","gram","packet","litre","ml","dozen","piece"],
  "Clothing":        ["piece","set","pair","dozen"],
  "HardWare":        ["piece","box","set","kg","gram","metre","litre","ml","bag","roll","bundle"],
  "Aluminium Shop":  ["sqm","sqft","piece","set","kg","gram","foot","inch","metre","bundle","box"],
  "Medical":         ["strip","bottle","box","tube","sachet","vial","piece","ml","gram","kg"],
  "Gold and Silver": ["gram","kg","piece","set","pair"],
  "Resturants":      ["kg","gram","litre","ml","piece","packet","bag","dozen"],
  "Genral Store":    ["piece","kg","gram","litre","ml","bag","box","dozen","metre","set","packet"],
  "default":         ["piece","kg","gram","litre","ml","bag","box","dozen","metre","set","roll","bundle","packet","strip","bottle","sqm","sqft"],
};

// GST rate by first 2 digits of HSN
const HSN_GST_MAP = {
  "01":0,"02":5,"03":5,"04":5,"07":0,"08":0,"09":5,"10":0,"11":5,"12":5,
  "15":5,"16":12,"17":18,"18":18,"19":18,"20":12,"21":18,"22":18,"27":18,
  "28":18,"29":18,"30":12,"32":18,"33":18,"34":18,"38":18,"39":18,"40":18,
  "41":5,"42":12,"48":12,"49":12,"52":5,"60":5,"61":12,"62":12,"63":12,
  "64":18,"70":18,"72":18,"73":18,"84":18,"85":18,"87":28,"90":18,"94":18,
};
const getGstFromHsn = (hsn) => {
  if (!hsn || hsn.length < 2) return 18;
  return HSN_GST_MAP[hsn.slice(0, 2)] ?? 18;
};
const calcITC = (ratePerUnit, qty, gstRate) => {
  if (!ratePerUnit || !gstRate) return 0;
  const total = Number(ratePerUnit) * Number(qty || 1);
  return parseFloat(((total * gstRate) / (100 + gstRate)).toFixed(2));
};

// ── Auto-detect category from line text + shop type ───────────
const autoDetectCategory = (line, shopType, defaultCat) => {
  const l = line.toLowerCase();
  if (shopType === "Aluminium Shop") {
    if (/glass|mirror|figured|clear|tinted|frosted|pin\s*head|sg\b|float/i.test(l)) return "Glass";
    if (/handle/i.test(l)) return "Handles";
    if (/lock/i.test(l)) return "Locks";
    if (/screw/i.test(l)) return "Screw";
    if (/channel|sliding/i.test(l)) return "Sliding Channel";
    if (/rubber|bead/i.test(l)) return "Rubber Beading";
    if (/rod/i.test(l)) return "Aluminium Rods";
    if (/silicone/i.test(l)) return "Silicone";
    return "Aluminium Section";
  }
  if (shopType === "HardWare") {
    if (/glass|mirror/i.test(l)) return "Glass";
    if (/pipe|pvc|cpvc|fitting/i.test(l)) return "Plumbing";
    if (/paint|polish|putty/i.test(l)) return "Paint & Finishing";
    if (/switch|socket|led|light/i.test(l)) return "Electrical & Lighting";
    if (/screw|bolt|nail/i.test(l)) return "Fasteners";
    if (/handle|hinge|lock/i.test(l)) return "Hardware Fittings";
    if (/door/i.test(l)) return "Doors";
    if (/plywood|mdf|laminat/i.test(l)) return "Wood & Boards";
    return defaultCat;
  }
  if (shopType === "Kirana Store") {
    if (/rice|atta|wheat/i.test(l)) return "Atta & Rice";
    if (/dal|pulse|moong|chana/i.test(l)) return "Dal & Pulses";
    if (/oil|ghee|vanaspati/i.test(l)) return "Oil & Ghee";
    if (/soap|detergent|surf/i.test(l)) return "Soap & Detergent";
    if (/biscuit|snack|chips/i.test(l)) return "Biscuits & Snacks";
    if (/spice|masala|pepper/i.test(l)) return "Spices";
    if (/milk|curd|paneer|dairy/i.test(l)) return "Dairy";
    return defaultCat;
  }
  if (shopType === "Medical") {
    if (/tablet|tab\b/i.test(l)) return "Tablets";
    if (/syrup|suspension/i.test(l)) return "Syrups";
    if (/injection|inj\b/i.test(l)) return "Injections";
    if (/vitamin|supplement/i.test(l)) return "Vitamins & Supplements";
    return defaultCat;
  }
  return defaultCat;
};

// ══════════════════════════════════════════════════════════════
//  SMART OCR PARSER — handles structured invoice tables
//  Strategy:
//  1. Find the item table header row  → marks where items start
//  2. Find footer rows (totals/taxes) → marks where items end
//  3. Inside item rows: detect column positions from header
//     and extract: serial, description, HSN, qty(pcs), qty(sqm/unit),
//     rate, unit, assessable value
//  4. Merge multi-line descriptions (e.g. "CLEAR FIGURED" + "NANNUN…")
// ══════════════════════════════════════════════════════════════
const parseInvoiceOCR = (fullText, shopType, defaultCat, shopUnits) => {
  const lines = fullText.split("\n").map(l => l.trim()).filter(Boolean);
  const items = [];
  let id = 0;

  // ── Step 1: Find table header row ──────────────────────────
  // Look for row containing "Description" or "Particulars" AND "HSN" AND "Quantity"
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    if (
      (l.includes("description") || l.includes("particulars") || l.includes("item")) &&
      (l.includes("hsn") || l.includes("qty") || l.includes("quantity") || l.includes("rate"))
    ) {
      headerIdx = i;
      break;
    }
  }
  // Fallback: find "S.No" row
  if (headerIdx < 0) {
    for (let i = 0; i < lines.length; i++) {
      if (/s\.?\s*no\b|sr\.?\s*no\b|sl\.?\s*no\b/i.test(lines[i])) {
        headerIdx = i;
        break;
      }
    }
  }
  const startIdx = headerIdx >= 0 ? headerIdx + 1 : Math.floor(lines.length * 0.25);

  // ── Step 2: Find footer ─────────────────────────────────────
  const FOOTER_PAT = /^(less\s*:?|add\s*:?|grand\s*total|sub\s*total|amount\s*payable|total\s*value|total\s*in\s*words|thank|authoriz|bank\s*name|ifsc|terms|sgst|cgst|igst|rounding|discount|handling|loading|freight|packing)/i;
  let endIdx = lines.length;
  for (let i = startIdx; i < lines.length; i++) {
    if (FOOTER_PAT.test(lines[i])) { endIdx = i; break; }
  }

  const itemLines = lines.slice(startIdx, endIdx);

  // ── Step 3: Skip pure header/label lines ───────────────────
  const SKIP_LINE = /^(sgst|cgst|igst|gst|discount|total|sub.?total|less|hsn\s*\/?\s*sac|s\.?\s*no|sr\.?\s*no|sl\.?\s*no|description|particulars|unit|qty|quantity|rate|amount|assessable|value)/i;

  // ── Step 4: Detect column layout from numbers on each line ─
  // For this bill type, each item row has this pattern:
  //   [SerialNo] [Description...] [HSN] [TotalPcs] [TotalSQM] [Rate] [Unit] [AssessableValue]
  // Key insight: HSN is a 4–8 digit standalone integer
  //              TotalPcs is a small whole number (1–999)
  //              TotalSQM / TotalQty is a decimal (like 39.1620)
  //              Rate is a decimal (like 372.96)
  //              AssessableValue is the largest number (14605.86)

  // We'll collect all lines, try to detect item rows vs continuation rows
  // An item row starts with a serial number digit OR has an HSN code in it

  const pendingDesc = []; // for multi-line descriptions

  const flushPending = (descLines, numbersOnLine, hsnOnLine, unitOnLine) => {
    if (descLines.length === 0) return null;
    const fullDesc = descLines.join(" ").trim();

    // Extract numbers from the data line
    const allNums = numbersOnLine.map(Number);

    // HSN: 4–8 digit integer (commonly 6 digits for glass: 700319, 700910)
    const hsn = hsnOnLine || "";

    // Unit detection
    const unitMatch = fullDesc.match(/\b(sqm|sqft|pcs|nos?|kg|ltr?|mtr?|piece|box|bag|sheet|btl|pkt|roll|bundle|gram|litre|metre|foot|inch|strip|bottle|set|pair)\b/i);
    const unit = unitOnLine
      || (unitMatch ? unitMatch[1].toLowerCase() : null)
      || shopUnits[0] || "sqm";

    // Qty = small whole integer (skip serial no at start, skip HSN)
    const wholeNums = allNums.filter(n =>
      Number.isInteger(n) && n >= 1 && n <= 9999 &&
      String(n).length <= 4 &&
      n !== Number(hsn)   // not the HSN itself
    );
    // First whole num might be serial (1, 2, 3…) — skip if very small and only 1 digit
    const qty = wholeNums.length > 0 ? wholeNums[wholeNums.length > 1 ? 1 : 0] : 1;

    // Rate = first decimal number that is NOT the assessable value (not the largest)
    const decimalNums = allNums.filter(n => !Number.isInteger(n));
    // Assessable value is largest; rate is the smaller decimal
    const sortedDec = [...decimalNums].sort((a, b) => a - b);
    const rate = sortedDec.length > 0 ? sortedDec[0] : 0;

    // Clean name
    let name = fullDesc
      .replace(/^\d{1,2}\s*\.?\s*/, "")               // leading serial
      .replace(/\b\d{4,8}\b/g, "")                     // HSN codes
      .replace(/\d{3,4}\s*[xX×]\s*\d{3,4}/g, "")      // dimensions 2140x1220
      .replace(/\d+(\.\d+)?/g, "")                     // remaining numbers
      .replace(/\b(sqm|sqft|pcs|nos?|kg|ltr?|mtr?|piece|box|bag|sheet|crts?|mm|cm)\b/gi, "")
      .replace(/\b(clear\s*figured|float\s*glass)\b/gi, txt => txt) // KEEP product descriptors
      .replace(/[|\\/:*?"<>()[\]{}@#$%&=+]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .replace(/^[-–,.\s]+|[-–,.\s]+$/g, "")
      .trim();

    if (name.length < 2) return null;

    const category = autoDetectCategory(fullDesc, shopType, defaultCat);

    return { id: id++, name, category, qty, unit, price: rate, hsn };
  };

  // ── Step 5: Walk item lines ─────────────────────────────────
  let currentDescLines = [];
  let currentNumbers   = [];
  let currentHsn       = "";
  let currentUnit      = "";

  const HSN_RE   = /\b(\d{6,8})\b/;          // 6–8 digit HSN (glass: 700319)
  const SERIAL_RE = /^\d{1,2}[\s.]/;          // line starts with "1 " or "2."

  for (let i = 0; i < itemLines.length; i++) {
    const line = itemLines[i];
    if (SKIP_LINE.test(line)) continue;
    if (line.length < 3) continue;

    const hasLetters = /[a-zA-Z]{2,}/.test(line);
    const numbers    = (line.match(/-?\d+(\.\d+)?/g) || []).filter(n => !n.startsWith("-"));
    const hsnMatch   = line.match(HSN_RE);
    const hsnFound   = hsnMatch ? hsnMatch[1] : "";
    const unitMatch  = line.match(/\b(sqm|sqft|pcs|nos?|kg|ltr?|mtr?|piece|sqmt)\b/i);
    const unitFound  = unitMatch ? unitMatch[1].toLowerCase() : "";
    const isNewItem  = SERIAL_RE.test(line) || (hsnFound && hasLetters);

    if (isNewItem && currentDescLines.length > 0) {
      // Flush previous item
      const parsed = flushPending(currentDescLines, currentNumbers, currentHsn, currentUnit);
      if (parsed) items.push(parsed);
      currentDescLines = [];
      currentNumbers   = [];
      currentHsn       = "";
      currentUnit      = "";
    }

    if (hasLetters) currentDescLines.push(line);
    if (numbers.length > 0) currentNumbers.push(...numbers);
    if (hsnFound) currentHsn = hsnFound;
    if (unitFound) currentUnit = unitFound;
  }

  // Flush last item
  if (currentDescLines.length > 0) {
    const parsed = flushPending(currentDescLines, currentNumbers, currentHsn, currentUnit);
    if (parsed) items.push(parsed);
  }

  return items;
};

// ══════════════════════════════════════════════════════════════
//   COMPONENT
// ══════════════════════════════════════════════════════════════
const BillScanner = ({ onClose }) => {
  const fileInputRef = useRef(null);
  const scannerRef   = useRef(null);
  const hasScanned   = useRef(false);
  const isRunning    = useRef(false);

  const [step, setStep]                 = useState("choose");
  const [scannedItems, setScannedItems] = useState([]);
  const [editQtys, setEditQtys]         = useState({});
  const [editNames, setEditNames]       = useState({});
  const [editCats, setEditCats]         = useState({});
  const [editPurchase, setEditPurchase] = useState({});
  const [editHsn, setEditHsn]           = useState({});
  const [editUnits, setEditUnits]       = useState({});
  const [allStock, setAllStock]         = useState([]);
  const [shopType, setShopType]         = useState("default");
  const [toast, setToast]               = useState(null);
  const [deleteIds, setDeleteIds]       = useState([]);
  const [expandedId, setExpandedId]     = useState(null);

  useEffect(() => {
    getProducts().then(setAllStock).catch(() => setAllStock([]));
    getShopProfile()
      .then(p => setShopType(p?.shop_type || "default"))
      .catch(() => setShopType("default"));
  }, []);

  useEffect(() => {
    if (step !== "camera") return;
    const timer = setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const html5QrCode = new Html5Qrcode("qr-reader-box");
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (hasScanned.current) return;
            hasScanned.current = true;
            stopCamera();
            parseScannedText(decodedText);
          },
          () => {}
        );
        isRunning.current = true;
      } catch { setStep("error"); }
    }, 400);
    return () => clearTimeout(timer);
  }, [step]);

  const stopCamera = () => {
    if (scannerRef.current && isRunning.current) {
      isRunning.current = false;
      scannerRef.current.stop().catch(() => {});
    }
  };
  const handleClose = () => { stopCamera(); onClose(); };

  // ── Shop-aware categories & units ─────────────────────────
  const shopCategories = (() => {
    const base = CATEGORIES_BY_SHOP[shopType] || CATEGORIES_BY_SHOP["default"];
    try {
      const custom = JSON.parse(
        localStorage.getItem(`customCats_shoptype_${shopType}`) ||
        localStorage.getItem(`customCats_${shopType}`) || "[]"
      );
      return [...base, ...custom.filter(c => !base.includes(c))];
    } catch { return base; }
  })();

  const shopUnits  = UNITS_BY_SHOP[shopType] || UNITS_BY_SHOP["default"];
  const defaultCat = shopCategories[0] || "General";

  // ── File upload ────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep("loading");

    // Try QR first
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const result = await Html5Qrcode.scanFile(file, true);
      parseScannedText(result);
      return;
    } catch { /* no QR */ }

    // OCR
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("apikey", "K82309043788957");
      formData.append("language", "eng");
      formData.append("isTable", "true");
      formData.append("OCREngine", "2");

      const res      = await fetch("https://api.ocr.space/parse/image", { method: "POST", body: formData });
      const data     = await res.json();
      const fullText = data?.ParsedResults?.[0]?.ParsedText || "";

      console.log("OCR RAW TEXT:\n", fullText);

      if (!fullText) { buildItems([makeBlankItem(0)]); return; }

      const parsed = parseInvoiceOCR(fullText, shopType, defaultCat, shopUnits);
      buildItems(parsed.length > 0 ? parsed : [makeBlankItem(0)]);

    } catch (err) {
      console.error("OCR failed:", err);
      buildItems([makeBlankItem(0)]);
    }
  };

  const makeBlankItem = (id) => ({
    id, name: "", category: defaultCat,
    qty: 1, unit: shopUnits[0] || "piece", price: 0, hsn: "",
  });

  const parseScannedText = (text) => {
    try {
      const data  = JSON.parse(text);
      const arr   = Array.isArray(data.items) ? data.items : [data];
      buildItems(arr.map((item, i) => ({
        id: i,
        name:     item.name || item.item_name || "Unknown",
        category: item.category || defaultCat,
        qty:      Number(item.qty || item.quantity || 1),
        unit:     item.unit || shopUnits[0] || "piece",
        price:    Number(item.price || item.purchase_price || 0),
        hsn:      item.hsn || item.hsn_code || "",
      })));
    } catch {
      const lines = text.split("\n").filter(Boolean);
      buildItems(lines.length
        ? lines.map((line, i) => ({ id: i, name: line.trim(), category: defaultCat, qty: 1, unit: shopUnits[0] || "piece", price: 0, hsn: "" }))
        : [makeBlankItem(0)]);
    }
  };

  const buildItems = (items) => {
    const q = {}, n = {}, c = {}, p = {}, h = {}, u = {};
    items.forEach(item => {
      q[item.id] = String(item.qty);
      n[item.id] = item.name;
      c[item.id] = item.category || defaultCat;
      p[item.id] = item.price ? String(item.price) : "";
      h[item.id] = item.hsn || "";
      u[item.id] = item.unit || shopUnits[0] || "piece";
    });
    setScannedItems(items);
    setEditQtys(q); setEditNames(n); setEditCats(c);
    setEditPurchase(p); setEditHsn(h); setEditUnits(u);
    setDeleteIds([]); setExpandedId(null);
    setStep("confirm");
  };

  const findMatch = (name) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    return allStock.find(s =>
      s.name.toLowerCase() === lower ||
      s.name.toLowerCase().includes(lower) ||
      lower.includes(s.name.toLowerCase())
    );
  };

  const handleSaveAll = async () => {
    setStep("saving");
    let ok = 0, fail = 0;
    for (const item of scannedItems) {
      if (deleteIds.includes(item.id)) continue;
      const name     = editNames[item.id]?.trim();
      const qty      = Number(editQtys[item.id]) || 1;
      const category = editCats[item.id] || defaultCat;
      const rate     = Number(editPurchase[item.id]) || 0;
      const hsn      = editHsn[item.id] || "";
      const unit     = editUnits[item.id] || shopUnits[0] || "piece";
      const gstRate  = getGstFromHsn(hsn);
      if (!name) continue;
      const match = findMatch(name);
      try {
        if (match) {
          await updateProduct(match.id, {
            ...match, qty: Number(match.qty) + qty,
            purchase_price: rate || match.purchase_price,
            hsn_code: hsn || match.hsn_code,
            category: category || match.category,
            gst_rate: gstRate, unit: unit || match.unit,
          });
        } else {
          const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";
          await fetch("/api/business/products/", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              name, category, unit, qty,
              selling_price: item.price || 0,
              purchase_price: rate,
              min_qty_alert: 5,
              gst_rate: gstRate,
              gst_inclusive: true,
              sale_type: "intra",
              hsn_code: hsn,
              shop_type: shopType,
            }),
          });
        }
        ok++;
      } catch { fail++; }
    }
    setToast(fail === 0
      ? `✅ ${ok} item${ok > 1 ? "s" : ""} added to stock!`
      : `⚠️ ${ok} added, ${fail} failed`);
    setStep("done");
    setTimeout(() => onClose(), 2500);
  };

  // ── STYLES ────────────────────────────────────────────────
  const overlay = {
    position:"fixed",inset:0,zIndex:9999,
    background:"rgba(0,0,0,0.92)",
    display:"flex",flexDirection:"column",
    alignItems:"center",justifyContent:"center",padding:"24px",
  };
  const closeBtn = {
    position:"absolute",top:"20px",right:"20px",
    background:"rgba(255,255,255,0.12)",border:"none",
    color:"#fff",fontSize:"1.1rem",borderRadius:"50%",
    width:"36px",height:"36px",cursor:"pointer",
    display:"flex",alignItems:"center",justifyContent:"center",
  };
  const sheet = {
    position:"fixed",bottom:0,left:0,right:0,zIndex:10000,
    background:"#fff",borderRadius:"24px 24px 0 0",
    padding:"20px 16px 48px",maxHeight:"90vh",overflowY:"auto",
    boxShadow:"0 -8px 40px rgba(0,0,0,0.2)",
  };
  const actBtn = (bg, color) => ({
    width:"100%",padding:"15px",borderRadius:"14px",
    border:"none",background:bg,color,
    fontSize:"0.95rem",fontWeight:800,cursor:"pointer",marginTop:"10px",
  });
  const inp = {
    padding:"9px 11px",borderRadius:"9px",
    border:"1.5px solid #e2e8f0",fontSize:"0.85rem",
    color:"#0f172a",background:"#fff",
    width:"100%",boxSizing:"border-box",
  };
  const lbl = {
    fontSize:"0.68rem",color:"#64748b",fontWeight:700,
    marginBottom:"3px",display:"block",
    textTransform:"uppercase",letterSpacing:"0.04em",
  };

  // ── RENDER ────────────────────────────────────────────────
  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*"
        style={{display:"none"}} onChange={handleFileChange} />

      <div style={overlay}>
        <button style={closeBtn} onClick={handleClose}>✕</button>

        {/* CHOOSE */}
        {step === "choose" && (
          <div style={{width:"100%",maxWidth:"340px"}}>
            <div style={{textAlign:"center",marginBottom:"28px"}}>
              <div style={{fontSize:"3rem",marginBottom:"10px"}}>🧾</div>
              <div style={{color:"#fff",fontWeight:800,fontSize:"1.2rem",marginBottom:"6px"}}>
                Scan Bill / Invoice
              </div>
              <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.82rem",lineHeight:1.6}}>
                Upload your supplier bill — items, HSN codes &amp; rates are read automatically
              </p>
            </div>
            <button onClick={() => setStep("camera")} style={{
              width:"100%",padding:"18px 20px",borderRadius:"16px",
              border:"2px solid #c9963a",background:"rgba(201,150,58,0.1)",
              color:"#fff",cursor:"pointer",marginBottom:"14px",
              display:"flex",alignItems:"center",gap:"16px",textAlign:"left",
            }}>
              <span style={{fontSize:"2rem"}}>📷</span>
              <div>
                <div style={{fontWeight:800,fontSize:"0.95rem",color:"#c9963a"}}>Open Camera</div>
                <div style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.5)",marginTop:"2px"}}>Scan QR code on bill</div>
              </div>
              <span style={{marginLeft:"auto",color:"#c9963a",fontSize:"1.2rem"}}>→</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={{
              width:"100%",padding:"18px 20px",borderRadius:"16px",
              border:"2px solid rgba(255,255,255,0.15)",
              background:"rgba(255,255,255,0.07)",color:"#fff",cursor:"pointer",
              display:"flex",alignItems:"center",gap:"16px",textAlign:"left",
            }}>
              <span style={{fontSize:"2rem"}}>🖼️</span>
              <div>
                <div style={{fontWeight:800,fontSize:"0.95rem"}}>Upload Bill Image</div>
                <div style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.5)",marginTop:"2px"}}>
                  Reads items, HSN &amp; rates from photo
                </div>
              </div>
              <span style={{marginLeft:"auto",color:"rgba(255,255,255,0.4)",fontSize:"1.2rem"}}>→</span>
            </button>
          </div>
        )}

        {/* CAMERA */}
        {step === "camera" && (
          <div style={{width:"100%",textAlign:"center"}}>
            <div style={{color:"#c9963a",fontWeight:800,fontSize:"1rem",marginBottom:"16px"}}>
              📷 Point at QR code on bill
            </div>
            <div id="qr-reader-box" style={{width:"280px",margin:"0 auto",borderRadius:"16px",overflow:"hidden",border:"3px solid #c9963a"}} />
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:"0.75rem",marginTop:"16px"}}>Auto-detects QR code</p>
            <button onClick={() => {stopCamera(); setStep("choose");}} style={{
              marginTop:"16px",background:"rgba(255,255,255,0.1)",
              border:"1px solid rgba(255,255,255,0.2)",color:"#fff",
              padding:"10px 24px",borderRadius:"10px",cursor:"pointer",fontWeight:600,
            }}>← Back</button>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div style={{color:"#fff",textAlign:"center"}}>
            <div style={{fontSize:"2.5rem",marginBottom:"12px"}}>⏳</div>
            <div style={{fontWeight:700,marginBottom:"6px"}}>Reading bill…</div>
            <p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.8rem"}}>Extracting items, HSN codes &amp; rates</p>
          </div>
        )}

        {/* SAVING */}
        {step === "saving" && (
          <div style={{color:"#fff",textAlign:"center"}}>
            <div style={{fontSize:"2.5rem",marginBottom:"12px"}}>📦</div>
            <div style={{fontWeight:700}}>Saving to stock…</div>
          </div>
        )}

        {/* DONE */}
        {step === "done" && (
          <div style={{color:"#fff",textAlign:"center"}}>
            <div style={{fontSize:"3rem",marginBottom:"12px"}}>✅</div>
            <div style={{fontWeight:800,fontSize:"1.1rem",color:"#c9963a"}}>{toast}</div>
          </div>
        )}

        {/* ERROR */}
        {step === "error" && (
          <div style={{color:"#fff",textAlign:"center",padding:"20px"}}>
            <div style={{fontSize:"2.5rem",marginBottom:"12px"}}>❌</div>
            <div style={{fontWeight:700,marginBottom:"8px"}}>Camera not available</div>
            <p style={{color:"rgba(255,255,255,0.5)",fontSize:"0.85rem",marginBottom:"20px"}}>
              Allow camera permission or use Upload Image
            </p>
            <button onClick={() => setStep("choose")} style={{padding:"12px 24px",borderRadius:"12px",border:"none",background:"#c9963a",color:"#0e1b2e",fontWeight:700,cursor:"pointer",marginRight:"10px"}}>Try Again</button>
            <button onClick={handleClose} style={{padding:"12px 24px",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"#fff",fontWeight:600,cursor:"pointer"}}>Cancel</button>
          </div>
        )}
      </div>

      {/* ── CONFIRM SHEET ── */}
      {step === "confirm" && (
        <div style={sheet}>
          <div style={{width:"40px",height:"4px",background:"#e2e8f0",borderRadius:"4px",margin:"0 auto 16px"}} />

          <div style={{fontWeight:800,fontSize:"1.05rem",color:"#0e1b2e",marginBottom:"2px"}}>
            📦 {scannedItems.length} item{scannedItems.length > 1 ? "s" : ""} found
          </div>
          <p style={{fontSize:"0.76rem",color:"#64748b",marginBottom:"14px"}}>
            Verify names &amp; qty · tap <strong>▼ Details</strong> for category, HSN &amp; ITC
          </p>

          {scannedItems.map((item) => {
            const isDeleted  = deleteIds.includes(item.id);
            const match      = findMatch(editNames[item.id]);
            const isExpanded = expandedId === item.id;
            const hsn        = editHsn[item.id] || "";
            const gstRate    = getGstFromHsn(hsn);
            const rate       = Number(editPurchase[item.id]) || 0;
            const qty        = Number(editQtys[item.id]) || 1;
            const totalCost  = rate * qty;
            const itc        = calcITC(rate, qty, gstRate);
            const netCost    = totalCost - itc;

            return (
              <div key={item.id} style={{
                background: isDeleted ? "#fef2f2" : "#f8fafc",
                border: isDeleted ? "1px dashed #fca5a5" : "1px solid #e2e8f0",
                borderRadius:"16px",padding:"13px",marginBottom:"11px",
                opacity: isDeleted ? 0.5 : 1,transition:"all 0.2s",
              }}>

                {/* Name + delete */}
                <div style={{display:"flex",gap:"7px",marginBottom:"9px",alignItems:"center"}}>
                  <input
                    value={editNames[item.id] ?? ""}
                    onChange={e => setEditNames(p => ({...p,[item.id]:e.target.value}))}
                    placeholder="Item name…"
                    disabled={isDeleted}
                    style={{...inp,flex:1,fontWeight:600}}
                  />
                  <button
                    onClick={() => setDeleteIds(p =>
                      p.includes(item.id) ? p.filter(x=>x!==item.id) : [...p,item.id]
                    )}
                    style={{
                      width:"34px",height:"34px",borderRadius:"8px",border:"none",
                      background:isDeleted?"#fee2e2":"#f1f5f9",
                      color:isDeleted?"#dc2626":"#94a3b8",
                      fontSize:"1rem",cursor:"pointer",flexShrink:0,
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}
                  >{isDeleted?"↩":"🗑"}</button>
                </div>

                {/* Qty + unit + badges */}
                <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
                  <span style={{fontSize:"0.72rem",color:"#64748b",fontWeight:600}}>Qty:</span>
                  <button disabled={isDeleted}
                    onClick={() => setEditQtys(p => ({...p,[item.id]:String(Math.max(1,Number(p[item.id])-1))}))}
                    style={{width:"27px",height:"27px",borderRadius:"6px",border:"1px solid #e2e8f0",background:"#f1f5f9",fontSize:"0.9rem",cursor:"pointer",fontWeight:700}}>−</button>
                  <input type="number" min="1"
                    value={editQtys[item.id]??1}
                    onChange={e => setEditQtys(p=>({...p,[item.id]:e.target.value}))}
                    disabled={isDeleted}
                    style={{width:"50px",textAlign:"center",padding:"5px 3px",borderRadius:"7px",border:"1.5px solid #c9963a",fontWeight:700,fontSize:"0.88rem"}}
                  />
                  <button disabled={isDeleted}
                    onClick={() => setEditQtys(p=>({...p,[item.id]:String(Number(p[item.id])+1)}))}
                    style={{width:"27px",height:"27px",borderRadius:"6px",border:"1px solid #e2e8f0",background:"#f1f5f9",fontSize:"0.9rem",cursor:"pointer",fontWeight:700}}>+</button>

                  {/* Unit pill */}
                  <span style={{padding:"2px 8px",borderRadius:"100px",fontSize:"0.68rem",fontWeight:700,background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe"}}>
                    {editUnits[item.id] || shopUnits[0]}
                  </span>

                  {/* Rate pill */}
                  {rate > 0 && (
                    <span style={{padding:"2px 8px",borderRadius:"100px",fontSize:"0.68rem",fontWeight:700,background:"#fef3c7",color:"#92400e",border:"1px solid #fde68a"}}>
                      ₹{rate}/{editUnits[item.id]||"unit"}
                    </span>
                  )}

                  {/* HSN pill */}
                  {hsn && (
                    <span style={{padding:"2px 8px",borderRadius:"100px",fontSize:"0.68rem",fontWeight:700,background:"#f3f4f6",color:"#374151"}}>
                      HSN {hsn}
                    </span>
                  )}

                  <span style={{
                    marginLeft:"auto",fontSize:"0.66rem",fontWeight:700,
                    padding:"2px 8px",borderRadius:"100px",
                    background:match?"#dcfce7":"#fef3c7",
                    color:match?"#15803d":"#92400e",
                  }}>{match?"✓ Merge":"+ New"}</span>

                  <button onClick={()=>setExpandedId(isExpanded?null:item.id)} disabled={isDeleted}
                    style={{padding:"3px 8px",borderRadius:"7px",border:"1px solid #e2e8f0",background:"#fff",color:"#64748b",fontSize:"0.68rem",cursor:"pointer",fontWeight:700}}>
                    {isExpanded?"▲":"▼ Details"}
                  </button>
                </div>

                {/* EXPANDED */}
                {isExpanded && !isDeleted && (
                  <div style={{borderTop:"1px solid #e2e8f0",paddingTop:"12px",marginTop:"10px",display:"flex",flexDirection:"column",gap:"10px"}}>

                    {/* Category — shop's own list */}
                    <div>
                      <label style={lbl}>🏷️ Category — {shopType}</label>
                      <select
                        value={editCats[item.id]||defaultCat}
                        onChange={e=>setEditCats(p=>({...p,[item.id]:e.target.value}))}
                        style={{...inp,appearance:"auto"}}
                      >
                        {shopCategories.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Unit */}
                    <div>
                      <label style={lbl}>📐 Unit</label>
                      <select
                        value={editUnits[item.id]||shopUnits[0]}
                        onChange={e=>setEditUnits(p=>({...p,[item.id]:e.target.value}))}
                        style={{...inp,appearance:"auto"}}
                      >
                        {shopUnits.map(u=><option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>

                    {/* HSN */}
                    <div>
                      <label style={lbl}>📋 HSN / SAC Code</label>
                      <input
                        type="text"
                        value={editHsn[item.id]||""}
                        onChange={e=>setEditHsn(p=>({...p,[item.id]:e.target.value}))}
                        placeholder="e.g. 700319, 700910…"
                        maxLength={8}
                        style={inp}
                      />
                      {hsn.length>=2 && (
                        <div style={{marginTop:"4px",fontSize:"0.7rem",color:"#6366f1",fontWeight:700,padding:"3px 8px",background:"#eef2ff",borderRadius:"6px",display:"inline-block"}}>
                          GST: {gstRate}% (from HSN)
                        </div>
                      )}
                    </div>

                    {/* Rate / Purchase price */}
                    <div>
                      <label style={lbl}>💰 Rate per {editUnits[item.id]||shopUnits[0]} (₹ incl. GST)</label>
                      <input
                        type="number"
                        value={editPurchase[item.id]||""}
                        onChange={e=>setEditPurchase(p=>({...p,[item.id]:e.target.value}))}
                        placeholder="Rate per unit from bill…"
                        min="0"
                        style={inp}
                      />
                    </div>

                    {/* ITC Breakdown */}
                    {rate>0 && gstRate>0 && (
                      <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"1px solid #86efac",borderRadius:"12px",padding:"11px 13px"}}>
                        <div style={{fontSize:"0.72rem",color:"#166534",fontWeight:800,marginBottom:"7px"}}>📊 ITC Breakdown</div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",color:"#15803d",marginBottom:"4px"}}>
                          <span>Rate ₹{rate} × {qty} {editUnits[item.id]||"unit"}</span>
                          <span>₹{totalCost.toFixed(2)}</span>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",color:"#15803d",marginBottom:"4px"}}>
                          <span>GST {gstRate}% — ITC Claimable</span>
                          <span style={{fontWeight:800,color:"#166534"}}>− ₹{itc.toFixed(2)}</span>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.82rem",fontWeight:800,color:"#14532d",borderTop:"1px solid #86efac",paddingTop:"6px",marginTop:"4px"}}>
                          <span>Net Cost (after ITC)</span>
                          <span>₹{netCost.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    {rate>0 && !hsn && (
                      <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:"9px",padding:"8px 11px",fontSize:"0.73rem",color:"#0369a1",fontWeight:600}}>
                        💡 Enter HSN code to auto-calculate GST &amp; ITC
                      </div>
                    )}
                    {rate>0 && hsn.length>=2 && gstRate===0 && (
                      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:"9px",padding:"8px 11px",fontSize:"0.73rem",color:"#92400e",fontWeight:600}}>
                        ⚠️ HSN {hsn} → 0% GST — ITC not applicable
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add manually */}
          <button onClick={() => {
            const id = Date.now();
            setScannedItems(p=>[...p,makeBlankItem(id)]);
            setEditQtys(p=>({...p,[id]:"1"}));
            setEditNames(p=>({...p,[id]:""}));
            setEditCats(p=>({...p,[id]:defaultCat}));
            setEditPurchase(p=>({...p,[id]:""}));
            setEditHsn(p=>({...p,[id]:""}));
            setEditUnits(p=>({...p,[id]:shopUnits[0]||"piece"}));
            setExpandedId(id);
          }} style={{
            width:"100%",padding:"12px",borderRadius:"12px",
            border:"1.5px dashed #c9963a",background:"transparent",
            color:"#c9963a",fontWeight:700,fontSize:"0.88rem",
            cursor:"pointer",marginBottom:"4px",
          }}>+ Add Item Manually</button>

          <button onClick={handleSaveAll} style={actBtn("#0e1b2e","#fff")}>
            ✅ Save All to Stock
          </button>
          <button onClick={handleClose} style={actBtn("#f1f5f9","#64748b")}>
            Cancel
          </button>
        </div>
      )}
    </>
  );
};

export default BillScanner;
