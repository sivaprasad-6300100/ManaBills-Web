// src/services/stockService.js
// ─────────────────────────────────────────────────────────
//  ManaBills — Stock Service
//  Handles: entry, deduction, log, low-stock alerts
// ─────────────────────────────────────────────────────────

const STOCK_KEY = "mb_stock";
const LOG_KEY   = "mb_stock_log";

/* ─── READ ─── */
export const getStock = () => {
  try {
    return JSON.parse(localStorage.getItem(STOCK_KEY)) || [];
  } catch {
    return [];
  }
};

/* ─── WRITE ─── */
export const saveStock = (items) => {
  localStorage.setItem(STOCK_KEY, JSON.stringify(items));
};

/* ─── ADD / MERGE STOCK ─── */
export const addStock = (newItem) => {
  const stock = getStock();

  // If same name + unit already exists → merge qty, update price
  const existing = stock.find(
    (s) =>
      s.name.trim().toLowerCase() === newItem.name.trim().toLowerCase() &&
      s.unit === newItem.unit
  );

  if (existing) {
    existing.qty          += Number(newItem.qty);
    existing.purchasePrice = Number(newItem.purchasePrice) || existing.purchasePrice;
    existing.sellingPrice  = Number(newItem.sellingPrice)  || existing.sellingPrice;
    existing.minQtyAlert   = Number(newItem.minQtyAlert)   || existing.minQtyAlert;
    existing.shopType      = newItem.shopType?.trim()       || existing.shopType;
    existing.updatedAt     = new Date().toISOString();
    saveStock(stock);
    logTransaction({
      type:        "ENTRY",
      productId:   existing.id,
      productName: existing.name,
      qty:         Number(newItem.qty),
      note:        "Merged into existing stock",
    });
    return { merged: true, item: existing };
  }

  // New product
  const item = {
    id:            `prod_${Date.now()}`,
    name:          newItem.name.trim(),
    category:      newItem.category?.trim() || "General",
    unit:          newItem.unit || "piece",
    purchasePrice: Number(newItem.purchasePrice) || 0,
    sellingPrice:  Number(newItem.sellingPrice)  || 0,
    qty:           Number(newItem.qty)           || 0,
    minQtyAlert:   Number(newItem.minQtyAlert)   || 5,
    hsnCode:       newItem.hsnCode?.trim()       || "",
    shopType:      newItem.shopType?.trim()      || "",
    createdAt:     new Date().toISOString(),
    updatedAt:     new Date().toISOString(),
  };

  saveStock([...stock, item]);
  logTransaction({
    type:        "ENTRY",
    productId:   item.id,
    productName: item.name,
    qty:         item.qty,
    note:        "New stock added",
  });
  return { merged: false, item };
};

/* ─── DELETE STOCK ITEM ─── */
export const deleteStockItem = (id) => {
  const stock = getStock().filter((s) => s.id !== id);
  saveStock(stock);
};

/* ─── UPDATE STOCK ITEM ─── */
export const updateStockItem = (id, updates) => {
  const stock = getStock().map((s) =>
    s.id === id
      ? { ...s, ...updates, updatedAt: new Date().toISOString() }
      : s
  );
  saveStock(stock);
};

/* ─── SEARCH (for invoice autocomplete) ─── */
export const searchStock = (query) => {
  if (!query || query.trim().length < 1) return [];
  const q = query.trim().toLowerCase();
  return getStock().filter(
    (s) => s.qty > 0 && s.name.toLowerCase().includes(q)
  );
};

/* ─── DEDUCT STOCK (called on invoice generate) ─────────
   Rule: validate ALL items first, deduct NONE until all pass.
   Returns { success, errors, lowStock }
──────────────────────────────────────────────────────── */
export const deductStock = (invoiceItems, invoiceId = "") => {
  const stock  = getStock();
  const errors = [];

  // Step 1 — validate every item before touching qty
  invoiceItems.forEach(({ productId, name, qty }) => {
    if (!productId) return; // manual item, no stock link — skip
    const found = stock.find((s) => s.id === productId);
    if (!found) {
      errors.push(`"${name}" not found in stock`);
    } else if (found.qty < qty) {
      errors.push(
        `"${found.name}": only ${found.qty} ${found.unit} in stock, you need ${qty}`
      );
    }
  });

  if (errors.length > 0) {
    return { success: false, errors, lowStock: [] };
  }

  // Step 2 — all passed, deduct atomically
  invoiceItems.forEach(({ productId, qty, name }) => {
    if (!productId) return;
    const item = stock.find((s) => s.id === productId);
    if (item) {
      item.qty       -= qty;
      item.updatedAt  = new Date().toISOString();
      logTransaction({
        type:        "DEDUCTION",
        productId:   item.id,
        productName: item.name,
        qty,
        invoiceId,
        note:        `Sold via invoice ${invoiceId}`,
      });
    }
  });

  saveStock(stock);

  const lowStock = stock.filter((s) => s.qty <= s.minQtyAlert);
  return { success: true, errors: [], lowStock };
};

/* ─── REVERSE DEDUCTION (on invoice cancel) ─── */
export const reverseDeduction = (invoiceItems, invoiceId = "") => {
  const stock = getStock();

  invoiceItems.forEach(({ productId, qty, name }) => {
    if (!productId) return;
    const item = stock.find((s) => s.id === productId);
    if (item) {
      item.qty      += qty;
      item.updatedAt = new Date().toISOString();
      logTransaction({
        type:        "ADJUSTMENT",
        productId:   item.id,
        productName: item.name,
        qty,
        invoiceId,
        note:        `Reversed from cancelled invoice ${invoiceId}`,
      });
    }
  });

  saveStock(stock);
};

/* ─── LOW STOCK ITEMS ─── */
export const getLowStockItems = () =>
  getStock().filter((s) => s.qty <= s.minQtyAlert);

/* ─── TRANSACTION LOG ─── */
export const logTransaction = ({
  type,
  productId,
  productName,
  qty,
  invoiceId = "",
  note = "",
}) => {
  try {
    const logs = JSON.parse(localStorage.getItem(LOG_KEY)) || [];
    logs.unshift({
      id:          `log_${Date.now()}`,
      type,        // "ENTRY" | "DEDUCTION" | "ADJUSTMENT"
      productId,
      productName,
      qty,
      invoiceId,
      note,
      createdAt:   new Date().toISOString(),
    });
    // Keep last 500 entries only
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 500)));
  } catch {
    // silently fail — log is non-critical
  }
};

export const getStockLog = () => {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
  } catch {
    return [];
  }
};

/* ─── STOCK SUMMARY STATS (for dashboard cards) ─── */
export const getStockStats = () => {
  const stock = getStock();
  return {
    totalItems:    stock.length,
    totalQty:      stock.reduce((s, i) => s + i.qty, 0),
    totalValue:    stock.reduce((s, i) => s + i.qty * i.sellingPrice, 0),
    lowStockCount: stock.filter((s) => s.qty <= s.minQtyAlert).length,
  };
};