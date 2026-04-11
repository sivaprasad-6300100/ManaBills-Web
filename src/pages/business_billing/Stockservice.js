/**
 * stockService.js
 * ───────────────────────────────────────────────────────────
 * Single source of truth for ALL stock operations.
 *
 * localStorage key: "mb_stock"
 *
 * Stock item shape (base):
 * {
 *   id:           string   (timestamp-based)
 *   name:         string
 *   category:     string
 *   unit:         string
 *   purchasePrice:number
 *   sellingPrice: number
 *   qty:          number
 *   minQtyAlert:  number
 *   hsnCode:      string
 *   shopType:     string   ← which business type added this
 *   createdAt:    ISO string
 *   updatedAt:    ISO string
 *
 *   // Clothing extras
 *   clothingType, clothingSize, clothingColor, clothingGender
 *
 *   // Hardware extras
 *   hwBrand, hwMaterial, hwModel
 *
 *   // Medical extras
 *   medCompany, medSchedule, medExpiry, medBatch
 *
 *   // Gold & Silver extras
 *   goldPurity, metalType, goldWeight, makingCharges
 * }
 */

const STOCK_KEY = "mb_stock";

// ─── READ ALL ──────────────────────────────────────────────
export const getStock = () => {
  try {
    return JSON.parse(localStorage.getItem(STOCK_KEY)) || [];
  } catch {
    return [];
  }
};

// ─── WRITE ALL (private) ───────────────────────────────────
const saveStock = (items) => {
  localStorage.setItem(STOCK_KEY, JSON.stringify(items));
};

// ─── ADD / RESTOCK ─────────────────────────────────────────
/**
 * If an item with the same name (case-insensitive) already exists,
 * quantity is merged (auto-restock). Otherwise a new record is created.
 *
 * Accepts ALL extra fields from any shop type in `form`.
 *
 * Returns: { item, merged: boolean }
 */
export const addStock = (form) => {
  const stock    = getStock();
  const nameNorm = form.name.trim().toLowerCase();

  const existIdx = stock.findIndex(
    (s) => s.name.trim().toLowerCase() === nameNorm
  );

  if (existIdx !== -1) {
    // Merge — update qty and prices, keep id & createdAt
    stock[existIdx] = {
      ...stock[existIdx],
      qty:           stock[existIdx].qty + Number(form.qty),
      purchasePrice: Number(form.purchasePrice) || stock[existIdx].purchasePrice,
      sellingPrice:  Number(form.sellingPrice)  || stock[existIdx].sellingPrice,
      minQtyAlert:   Number(form.minQtyAlert)   || stock[existIdx].minQtyAlert,
      hsnCode:       form.hsnCode               || stock[existIdx].hsnCode,
      updatedAt:     new Date().toISOString(),
    };
    saveStock(stock);
    return { item: stock[existIdx], merged: true };
  }

  // New item — pick ALL fields from form (base + shop-specific extras)
  const newItem = {
    id:            `stk_${Date.now()}`,
    name:          form.name.trim(),
    category:      form.category      || "General",
    unit:          form.unit          || "piece",
    purchasePrice: Number(form.purchasePrice) || 0,
    sellingPrice:  Number(form.sellingPrice),
    qty:           Number(form.qty),
    minQtyAlert:   Number(form.minQtyAlert)   || 5,
    hsnCode:       form.hsnCode               || "",
    shopType:      form.shopType              || "",

    // ── Clothing ──────────────────────────────────────────
    clothingType:   form.clothingType   || "",
    clothingSize:   form.clothingSize   || "",
    clothingColor:  form.clothingColor  || "",
    clothingGender: form.clothingGender || "",

    // ── Hardware ──────────────────────────────────────────
    hwBrand:    form.hwBrand    || "",
    hwMaterial: form.hwMaterial || "",
    hwModel:    form.hwModel    || "",

    // ── Medical ───────────────────────────────────────────
    medCompany:  form.medCompany  || "",
    medSchedule: form.medSchedule || "",
    medExpiry:   form.medExpiry   || "",
    medBatch:    form.medBatch    || "",

    // ── Gold / Silver ─────────────────────────────────────
    goldPurity:    form.goldPurity    || "",
    metalType:     form.metalType     || "",
    goldWeight:    form.goldWeight    || "",
    makingCharges: Number(form.makingCharges) || 0,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveStock([...stock, newItem]);
  return { item: newItem, merged: false };
};

// ─── UPDATE EXISTING ITEM ──────────────────────────────────
/**
 * Fully replaces the item fields with the given `updates` payload.
 * Preserves id and createdAt. Handles all shop-type extra fields.
 */
export const updateStockItem = (id, updates) => {
  const stock = getStock();
  const idx   = stock.findIndex((s) => s.id === id);
  if (idx === -1) return;

  stock[idx] = {
    ...stock[idx],
    // Base fields
    name:          updates.name          ?? stock[idx].name,
    category:      updates.category      ?? stock[idx].category,
    unit:          updates.unit          ?? stock[idx].unit,
    purchasePrice: updates.purchasePrice ?? stock[idx].purchasePrice,
    sellingPrice:  updates.sellingPrice  ?? stock[idx].sellingPrice,
    qty:           updates.qty           ?? stock[idx].qty,
    minQtyAlert:   updates.minQtyAlert   ?? stock[idx].minQtyAlert,
    hsnCode:       updates.hsnCode       ?? stock[idx].hsnCode,
    shopType:      updates.shopType      ?? stock[idx].shopType,

    // Clothing
    clothingType:   updates.clothingType   ?? stock[idx].clothingType   ?? "",
    clothingSize:   updates.clothingSize   ?? stock[idx].clothingSize   ?? "",
    clothingColor:  updates.clothingColor  ?? stock[idx].clothingColor  ?? "",
    clothingGender: updates.clothingGender ?? stock[idx].clothingGender ?? "",

    // Hardware
    hwBrand:    updates.hwBrand    ?? stock[idx].hwBrand    ?? "",
    hwMaterial: updates.hwMaterial ?? stock[idx].hwMaterial ?? "",
    hwModel:    updates.hwModel    ?? stock[idx].hwModel    ?? "",

    // Medical
    medCompany:  updates.medCompany  ?? stock[idx].medCompany  ?? "",
    medSchedule: updates.medSchedule ?? stock[idx].medSchedule ?? "",
    medExpiry:   updates.medExpiry   ?? stock[idx].medExpiry   ?? "",
    medBatch:    updates.medBatch    ?? stock[idx].medBatch    ?? "",

    // Gold / Silver
    goldPurity:    updates.goldPurity    ?? stock[idx].goldPurity    ?? "",
    metalType:     updates.metalType     ?? stock[idx].metalType     ?? "",
    goldWeight:    updates.goldWeight    ?? stock[idx].goldWeight    ?? "",
    makingCharges: updates.makingCharges ?? stock[idx].makingCharges ?? 0,

    updatedAt: new Date().toISOString(),
  };

  saveStock(stock);
};

// ─── DELETE ────────────────────────────────────────────────
export const deleteStockItem = (id) => {
  saveStock(getStock().filter((s) => s.id !== id));
};

// ─── SEARCH (for invoice autocomplete) ────────────────────
/**
 * Returns items whose name starts with or includes the query.
 * Sorted: startsWith first, then includes. Max 8 results.
 */
export const searchStock = (query) => {
  if (!query || query.trim().length === 0) return [];
  const q     = query.trim().toLowerCase();
  const stock = getStock().filter((s) => s.qty > 0); // only in-stock items

  const starts   = stock.filter((s) => s.name.toLowerCase().startsWith(q));
  const contains = stock.filter(
    (s) => !s.name.toLowerCase().startsWith(q) && s.name.toLowerCase().includes(q)
  );
  return [...starts, ...contains].slice(0, 8);
};

// ─── DEDUCT STOCK (called on invoice generate) ─────────────
/**
 * Validates ALL items first, then applies deductions atomically.
 *
 * @param  items      Array<{ productId, name, qty }>
 * @param  invoiceId  string (for audit log / future use)
 * @returns {
 *   success:  boolean,
 *   errors:   string[],
 *   lowStock: StockItem[]  — items below minQtyAlert after deduction
 * }
 */
export const deductStock = (items, invoiceId = "") => {
  const stock  = getStock();
  const errors = [];

  // Phase 1: validate all before touching anything
  for (const { productId, name, qty } of items) {
    const idx = stock.findIndex((s) => s.id === productId);
    if (idx === -1) {
      errors.push(`"${name}" not found in stock`);
      continue;
    }
    if (stock[idx].qty < qty) {
      errors.push(
        `"${name}" — only ${stock[idx].qty} ${stock[idx].unit} available, you need ${qty}`
      );
    }
  }

  if (errors.length > 0) return { success: false, errors, lowStock: [] };

  // Phase 2: apply deductions
  const lowStock = [];
  for (const { productId, qty } of items) {
    const idx = stock.findIndex((s) => s.id === productId);
    if (idx === -1) continue;
    stock[idx] = {
      ...stock[idx],
      qty:       stock[idx].qty - Number(qty),
      updatedAt: new Date().toISOString(),
    };
    if (stock[idx].qty <= stock[idx].minQtyAlert) {
      lowStock.push(stock[idx]);
    }
  }

  saveStock(stock);
  return { success: true, errors: [], lowStock };
};

// ─── LOW STOCK LIST ────────────────────────────────────────
export const getLowStockItems = () => {
  return getStock().filter((s) => s.qty <= s.minQtyAlert);
};

// ─── STATS SUMMARY ─────────────────────────────────────────
export const getStockStats = () => {
  const stock         = getStock();
  const totalItems    = stock.length;
  const totalQty      = stock.reduce((s, i) => s + i.qty, 0);
  const totalValue    = stock.reduce((s, i) => s + i.qty * i.sellingPrice, 0);
  const lowStockCount = stock.filter((i) => i.qty <= i.minQtyAlert).length;
  const outOfStockCount = stock.filter((i) => i.qty === 0).length;

  // Medical: expiring soon (within 90 days)
  const expiringSoon = stock.filter((i) => {
    if (!i.medExpiry) return false;
    return new Date(`${i.medExpiry}-01`) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }).length;

  return { totalItems, totalQty, totalValue, lowStockCount, outOfStockCount, expiringSoon };
};