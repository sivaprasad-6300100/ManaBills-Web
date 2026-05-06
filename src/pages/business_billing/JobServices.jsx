import React, { useState, useEffect } from "react";
import {
  getProducts,
  updateProduct,
  getShopProfile,
} from "../../services/businessService";

// ─── You may need to add these two functions to businessService.js ────────────
// getJobs()        → GET  /api/jobs/
// createJob(data)  → POST /api/jobs/
// deleteJob(id)    → DELETE /api/jobs/:id/
// For now they are wired below — just add the endpoints on your backend.
// ─────────────────────────────────────────────────────────────────────────────

import {
  getJobs,
  createJob,
  deleteJob,
} from "../../services/businessService";

// ─── THEME (matches Products.jsx) ────────────────────────────
const SHOP_THEME = {
  "Kirana Store":    { icon: "🛒", color: "#16a34a" },
  "Clothing":        { icon: "👗", color: "#7c3aed" },
  "HardWare":        { icon: "🔧", color: "#ea580c" },
  "Medical":         { icon: "💊", color: "#0284c7" },
  "Gold and Silver": { icon: "💍", color: "#d97706" },
  "Resturants":      { icon: "🍽️", color: "#dc2626" },
  "Genral Store":    { icon: "🏪", color: "#2563eb" },
  "default":         { icon: "📦", color: "#2563eb" },
};
const theme = (shopType) => SHOP_THEME[shopType] || SHOP_THEME["default"];

// ─── isMobile hook ────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
};

// ─── Shared input styles (matches Products.jsx) ───────────────
const inputStyle = {
  padding: "10px 13px", borderRadius: "9px",
  border: "1.5px solid #e2e8f0", fontSize: "14px",
  background: "#fff", outline: "none", transition: "border-color 0.15s",
  width: "100%", boxSizing: "border-box", color: "#0f172a",
};
const selectStyle = { ...inputStyle, cursor: "pointer" };

// ─── Mobile style object S ────────────────────────────────────
const S = {
  page:       { fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#f0f2f7", minHeight: "100vh", paddingBottom: "100px", boxSizing: "border-box", width: "100%", overflowX: "hidden" },
  headerBar:  { background: "#0f172a", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.25)" },
  headerTitle:{ color: "#fff", fontSize: "1.05rem", fontWeight: 800, margin: 0 },
  headerHint: { color: "#94a3b8", fontSize: "0.72rem", fontWeight: 500 },
  shopBadge: (color) => ({ background: color+"22", color, border: `1.5px solid ${color}55`, padding: "5px 12px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }),
  tabBar:     { display: "flex", background: "#fff", borderBottom: "1.5px solid #e8eaf0", overflowX: "auto", scrollbarWidth: "none" },
  tabBtn: (active) => ({ flex: 1, padding: "13px 8px", border: "none", background: "none", fontSize: "13px", fontWeight: active ? 800 : 600, color: active ? "#0f172a" : "#94a3b8", borderBottom: active ? "2.5px solid #0f172a" : "2.5px solid transparent", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.18s" }),
  body:       { padding: "14px 14px 0" },
  card:       { background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
  sectionDiv: (color) => ({ fontSize: "0.68rem", fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px", paddingBottom: "8px", borderBottom: `2px solid ${color}22` }),
  fieldGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  fieldLabel: { fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "5px", display: "block" },
  mInput:     { width: "100%", padding: "11px 13px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "14px", background: "#f8fafc", outline: "none", boxSizing: "border-box", color: "#0f172a", WebkitAppearance: "none" },
  mSelect:    { width: "100%", padding: "11px 13px", borderRadius: "10px", border: "1.5px solid #e2e8f0", fontSize: "14px", background: "#f8fafc", outline: "none", boxSizing: "border-box", color: "#0f172a", cursor: "pointer", WebkitAppearance: "none" },
  saveBtn: (color) => ({ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: color, color: "#fff", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", boxShadow: `0 4px 14px ${color}44` }),
  cancelBtn:  { padding: "14px 18px", borderRadius: "12px", border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" },
  toast: (type) => ({ position: "fixed", top: "72px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "10px 24px", borderRadius: "100px", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", background: type === "success" ? "#0e1b2e" : "#dc2626", color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }),
  emptyBox:   { background: "#fff", borderRadius: "14px", padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem", fontWeight: 600, border: "1.5px dashed #e2e8f0" },
  jobCard:    { background: "#fff", borderRadius: "14px", padding: "14px", marginBottom: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1.5px solid #f0f2f7" },
  jobName:    { fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginBottom: "6px" },
  metaRow:    { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" },
  metaChip:   { fontSize: "0.75rem", color: "#64748b", background: "#f8fafc", padding: "3px 10px", borderRadius: "100px", fontWeight: 600 },
  matRow:     { background: "#f8fafc", borderRadius: "10px", padding: "10px 12px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px" },
  removeChip: { padding: "4px 10px", borderRadius: "6px", background: "#fee2e2", color: "#dc2626", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  addMatBtn: (color) => ({ padding: "10px 16px", borderRadius: "10px", border: `1.5px dashed ${color}`, background: color+"11", color, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", width: "100%", marginTop: "8px" }),
  confirmYes: { padding: "7px 12px", borderRadius: "8px", background: "#dc2626", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" },
  confirmNo:  { padding: "7px 10px", borderRadius: "8px", background: "#f1f5f9", color: "#64748b", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" },
};

// ─── Helper: MField ───────────────────────────────────────────
const MField = ({ label, children, full }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px", ...(full ? { gridColumn: "1 / -1" } : {}) }}>
    <span style={S.fieldLabel}>{label}</span>
    {children}
  </div>
);

// ═════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
const JobServices = () => {
  const [tab,         setTab]         = useState("list");
  const [stock,       setStock]       = useState([]);      // all stock items
  const [jobs,        setJobs]        = useState([]);      // saved jobs
  const [shopProfile, setShopProfile] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const [confirmDel,  setConfirmDel]  = useState(null);

  // ── Form state ───────────────────────────────────────────────
  const [jobName,      setJobName]      = useState("");
  const [jobPrice,     setJobPrice]     = useState("");
  const [jobNote,      setJobNote]      = useState("");
  // materials = [{ stockId, stockName, unit, availableQty, usedQty }]
  const [materials,    setMaterials]    = useState([]);
  // item selector row
  const [selStockId,   setSelStockId]   = useState("");
  const [selQty,       setSelQty]       = useState("");

  const isMobile = useIsMobile();
  const shopType = shopProfile?.shop_type || "default";
  const t        = theme(shopType);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profileData, stockData, jobData] = await Promise.all([
        getShopProfile().catch(() => null),
        getProducts(),
        getJobs().catch(() => []),
      ]);
      if (profileData) setShopProfile(profileData);
      setStock(stockData);
      setJobs(jobData);
    } catch {
      showToast("Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const resetForm = () => {
    setJobName(""); setJobPrice(""); setJobNote("");
    setMaterials([]); setSelStockId(""); setSelQty("");
  };

  // ── Add a material row to the job ────────────────────────────
  const handleAddMaterial = () => {
    if (!selStockId)                        { showToast("Select a stock item", "error"); return; }
    if (!selQty || Number(selQty) <= 0)    { showToast("Enter a valid quantity", "error"); return; }

    const item = stock.find(s => String(s.id) === String(selStockId));
    if (!item)                              { showToast("Item not found", "error"); return; }
    if (Number(selQty) > Number(item.qty)) { showToast(`Only ${item.qty} ${item.unit} available in stock`, "error"); return; }

    // prevent duplicate
    if (materials.find(m => String(m.stockId) === String(selStockId))) {
      showToast("Item already added — edit quantity below", "error"); return;
    }

    setMaterials(prev => [...prev, {
      stockId:      item.id,
      stockName:    item.name,
      unit:         item.unit,
      availableQty: Number(item.qty),
      usedQty:      Number(selQty),
    }]);
    setSelStockId(""); setSelQty("");
  };

  const handleRemoveMaterial = (stockId) => {
    setMaterials(prev => prev.filter(m => String(m.stockId) !== String(stockId)));
  };

  const handleUsedQtyChange = (stockId, val) => {
    setMaterials(prev => prev.map(m =>
      String(m.stockId) === String(stockId) ? { ...m, usedQty: Number(val) } : m
    ));
  };

  // ── Save job + debit stock ───────────────────────────────────
  const handleSaveJob = async () => {
    if (!jobName.trim())              { showToast("Job name is required", "error"); return; }
    if (!jobPrice || Number(jobPrice) <= 0) { showToast("Enter a valid selling price", "error"); return; }
    if (materials.length === 0)       { showToast("Add at least one material used", "error"); return; }

    // Validate quantities again before saving
    for (const m of materials) {
      const live = stock.find(s => String(s.id) === String(m.stockId));
      if (!live)                            { showToast(`"${m.stockName}" not found in stock`, "error"); return; }
      if (m.usedQty <= 0)                  { showToast(`Enter valid qty for ${m.stockName}`, "error"); return; }
      if (m.usedQty > Number(live.qty))    { showToast(`Not enough stock: ${m.stockName} (have ${live.qty} ${m.unit})`, "error"); return; }
    }

    setSaving(true);
    try {
      // 1. Debit each stock item
      for (const m of materials) {
        const live = stock.find(s => String(s.id) === String(m.stockId));
        const newQty = Number(live.qty) - m.usedQty;
        await updateProduct(live.id, {
          ...liveToApi(live),
          qty: newQty,
        });
      }

      // 2. Save the job record
      const jobPayload = {
        name:         jobName.trim(),
        selling_price: Number(jobPrice),
        note:         jobNote.trim(),
        shop_type:    shopType,
        materials:    materials.map(m => ({
          stock_id:   m.stockId,
          stock_name: m.stockName,
          unit:       m.unit,
          qty_used:   m.usedQty,
        })),
      };
      await createJob(jobPayload);

      showToast(`"${jobName}" saved — stock debited ✅`);
      resetForm();
      setTab("list");
      await loadAll();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to save job. Please try again.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete job (does NOT re-credit stock — intentional) ──────
  const handleDeleteJob = async (id) => {
    try {
      await deleteJob(id);
      setJobs(prev => prev.filter(j => j.id !== id));
      setConfirmDel(null);
      showToast("Job removed");
    } catch {
      showToast("Failed to remove job.", "error");
    }
  };

  // ── Convert stock item back to API shape for updateProduct ───
  const liveToApi = (item) => ({
    name:           item.name,
    category:       item.category,
    unit:           item.unit,
    purchase_price: Number(item.purchase_price ?? item.purchasePrice) || 0,
    selling_price:  Number(item.selling_price  ?? item.sellingPrice)  || 0,
    qty:            Number(item.qty),
    min_qty_alert:  Number(item.min_qty_alert  ?? item.minQtyAlert)   || 5,
    hsn_code:       item.hsn_code ?? item.hsnCode ?? "",
    gst_rate:       Number(item.gst_rate ?? item.gstRate) || 0,
    shop_type:      item.shop_type ?? item.shopType ?? shopType,
    clothing_type:   item.clothing_type   ?? "",
    clothing_size:   item.clothing_size   ?? "",
    clothing_color:  item.clothing_color  ?? "",
    clothing_gender: item.clothing_gender ?? "",
    hw_brand:    item.hw_brand    ?? "",
    hw_material: item.hw_material ?? "",
    hw_model:    item.hw_model    ?? "",
    med_company:  item.med_company  ?? "",
    med_schedule: item.med_schedule ?? "",
    med_expiry:   item.med_expiry   ?? "",
    med_batch:    item.med_batch    ?? "",
    gold_purity:    item.gold_purity    ?? "",
    metal_type:     item.metal_type     ?? "",
    gold_weight:    item.gold_weight    ?? "",
    making_charges: Number(item.making_charges ?? item.makingCharges) || 0,
  });

  // ── Cost preview ─────────────────────────────────────────────
  const materialCost = materials.reduce((sum, m) => {
    const item = stock.find(s => String(s.id) === String(m.stockId));
    const cost = item ? Number(item.purchase_price ?? item.purchasePrice ?? 0) : 0;
    return sum + cost * m.usedQty;
  }, 0);

  const profit = jobPrice && materialCost >= 0
    ? Number(jobPrice) - materialCost
    : null;

  // ── Stock options (only items with qty > 0) ──────────────────
  const availableStock = stock.filter(s => Number(s.qty) > 0);

  // ════════════════════════════════════════════════════════════
  //   MOBILE RENDER
  // ════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div style={S.page}>
        {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}

        {/* Header */}
        <div style={S.headerBar}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <h2 style={S.headerTitle}>🔨 Job / Services</h2>
            <span style={S.headerHint}>Create jobs — materials auto-debited from stock</span>
          </div>
          {shopProfile && <span style={S.shopBadge(t.color)}>{t.icon} {shopType}</span>}
        </div>

        {/* Tabs */}
        <div style={S.tabBar}>
          {[
            { key: "list",   label: "📋 Job List" },
            { key: "create", label: "➕ New Job" },
          ].map(tb => (
            <button key={tb.key} style={S.tabBtn(tab === tb.key)} onClick={() => setTab(tb.key)}>
              {tb.label}
            </button>
          ))}
        </div>

        <div style={S.body}>

          {/* ── CREATE TAB ── */}
          {tab === "create" && (
            <div style={S.card}>
              {/* Job Info */}
              <div style={S.sectionDiv(t.color)}>🔨 Job Details</div>
              <div style={S.fieldGrid}>
                <MField label="Job Name *" full>
                  <input placeholder="e.g. Wooden Door Making…" value={jobName} onChange={e => setJobName(e.target.value)} style={S.mInput} />
                </MField>
                <MField label="Selling Price ₹ *">
                  <input type="number" placeholder="e.g. 5000" value={jobPrice} onChange={e => setJobPrice(e.target.value)} min="0" style={S.mInput} />
                </MField>
                <MField label="Note / Description">
                  <input placeholder="Optional note…" value={jobNote} onChange={e => setJobNote(e.target.value)} style={S.mInput} />
                </MField>
              </div>

              {/* Materials used */}
              <div style={{ ...S.sectionDiv(t.color), marginTop: "16px" }}>📦 Materials Used from Stock</div>

              {/* Added materials */}
              {materials.map(m => (
                <div key={m.stockId} style={S.matRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{m.stockName}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>Available: {m.availableQty} {m.unit}</div>
                  </div>
                  <input
                    type="number"
                    value={m.usedQty}
                    min="1"
                    max={m.availableQty}
                    onChange={e => handleUsedQtyChange(m.stockId, e.target.value)}
                    style={{ ...S.mInput, width: "72px", textAlign: "center", padding: "8px 6px" }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "#64748b", minWidth: "30px" }}>{m.unit}</span>
                  <button onClick={() => handleRemoveMaterial(m.stockId)} style={S.removeChip}>✕</button>
                </div>
              ))}

              {/* Add material row */}
              <div style={{ ...S.fieldGrid, marginTop: "8px" }}>
                <MField label="Select Item" full>
                  <select value={selStockId} onChange={e => setSelStockId(e.target.value)} style={S.mSelect}>
                    <option value="">— Choose stock item —</option>
                    {availableStock.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.qty} {s.unit} left)
                      </option>
                    ))}
                  </select>
                </MField>
                <MField label="Qty Used *">
                  <input type="number" placeholder="0" value={selQty} onChange={e => setSelQty(e.target.value)} min="1" style={S.mInput} />
                </MField>
                <MField label="" full>
                  <button onClick={handleAddMaterial} style={{ ...S.addMatBtn(t.color) }}>
                    ➕ Add This Material
                  </button>
                </MField>
              </div>

              {/* Cost / profit preview */}
              {materials.length > 0 && (
                <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "12px 14px", marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Material Cost: <strong style={{ color: "#0f172a" }}>₹{materialCost.toLocaleString("en-IN")}</strong>
                  </span>
                  {profit !== null && (
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      Profit: <strong style={{ color: profit >= 0 ? "#16a34a" : "#dc2626" }}>₹{profit.toLocaleString("en-IN")}</strong>
                    </span>
                  )}
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", gridColumn: "1/-1" }}>
                    ⚠️ Stock will be debited when you tap Save Job
                  </span>
                </div>
              )}

              {/* Save button */}
              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button onClick={handleSaveJob} disabled={saving} style={S.saveBtn(t.color)}>
                  {saving ? "Saving…" : "✅ Save Job & Debit Stock"}
                </button>
                <button onClick={() => { resetForm(); setTab("list"); }} style={S.cancelBtn}>✕</button>
              </div>
            </div>
          )}

          {/* ── LIST TAB ── */}
          {tab === "list" && (
            <>
              {loading ? (
                <div style={S.emptyBox}>Loading jobs…</div>
              ) : jobs.length === 0 ? (
                <div style={S.emptyBox}>No jobs yet. Tap '➕ New Job' to create one.</div>
              ) : (
                jobs.map(job => (
                  <div key={job.id} style={S.jobCard}>
                    <div style={S.jobName}>{job.name}</div>
                    <div style={S.metaRow}>
                      <span style={{ ...S.metaChip, background: "#f0fdf4", color: "#15803d" }}>
                        ₹{Number(job.selling_price).toLocaleString("en-IN")}
                      </span>
                      <span style={S.metaChip}>
                        {job.materials?.length || 0} material{(job.materials?.length || 0) !== 1 ? "s" : ""}
                      </span>
                      {job.note && <span style={S.metaChip}>{job.note}</span>}
                    </div>

                    {/* Materials breakdown */}
                    {job.materials?.length > 0 && (
                      <div style={{ marginBottom: "10px" }}>
                        {job.materials.map((m, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>📦</span>
                            <span style={{ fontSize: "0.8rem", color: "#0f172a", fontWeight: 600 }}>{m.stock_name}</span>
                            <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 700, marginLeft: "auto" }}>
                              -{m.qty_used} {m.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      {confirmDel === job.id ? (
                        <>
                          <button onClick={() => handleDeleteJob(job.id)} style={S.confirmYes}>Yes, Delete</button>
                          <button onClick={() => setConfirmDel(null)} style={S.confirmNo}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDel(job.id)} style={{ padding: "7px 14px", borderRadius: "8px", background: "#fee2e2", color: "#dc2626", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //   DESKTOP RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="stock-page">
      {toast && (
        <div style={{ position: "fixed", top: "72px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, padding: "10px 24px", borderRadius: "100px", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", background: toast.type === "success" ? "#0e1b2e" : "#dc2626", color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
        <h2 style={{ margin: 0 }}>🔨 Job / Services</h2>
        {shopProfile && (
          <span style={{ background: t.color+"18", color: t.color, border: `1.5px solid ${t.color}44`, padding: "4px 12px", borderRadius: "100px", fontSize: "0.76rem", fontWeight: 700 }}>
            {t.icon} {shopType}
          </span>
        )}
      </div>
      <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: "#64748b" }}>
        Create a job → select materials used → save. Stock is debited immediately on save.
      </p>

      {/* Tab bar */}
      <div className="sub-nav">
        {[
          { key: "list",   label: "📋 Job List" },
          { key: "create", label: "➕ New Job" },
        ].map(tb => (
          <button key={tb.key} className={`sub-link${tab === tb.key ? " active" : ""}`} onClick={() => setTab(tb.key)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── CREATE TAB ── */}
      {tab === "create" && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ margin: "0 0 20px" }}>New Job / Service Work</h3>

          {/* Job Info */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>
              🔨 Job Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Job Name *</label>
                <input placeholder="e.g. Wooden Door Making, Window Frame…" value={jobName} onChange={e => setJobName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Selling Price ₹ *</label>
                <input type="number" placeholder="e.g. 5000" value={jobPrice} onChange={e => setJobPrice(e.target.value)} min="0" style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Note / Description</label>
                <input placeholder="Optional note or description…" value={jobNote} onChange={e => setJobNote(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Materials */}
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: t.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>
              📦 Materials Used from Stock
            </div>

            {/* Added materials table */}
            {materials.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "0.86rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Item Name", "Available", "Qty Used", "Unit", "Est. Cost", ""].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {materials.map(m => {
                    const item = stock.find(s => String(s.id) === String(m.stockId));
                    const cost = item ? Number(item.purchase_price ?? item.purchasePrice ?? 0) * m.usedQty : 0;
                    return (
                      <tr key={m.stockId} style={{ borderBottom: "1px solid #f0f2f7" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>{m.stockName}</td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{m.availableQty} {m.unit}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <input
                            type="number" value={m.usedQty} min="1" max={m.availableQty}
                            onChange={e => handleUsedQtyChange(m.stockId, e.target.value)}
                            style={{ ...inputStyle, width: "80px", padding: "6px 10px" }}
                          />
                        </td>
                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{m.unit}</td>
                        <td style={{ padding: "10px 12px", color: "#dc2626", fontWeight: 700 }}>₹{cost.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <button onClick={() => handleRemoveMaterial(m.stockId)} style={{ padding: "4px 10px", borderRadius: "6px", background: "#fee2e2", color: "#dc2626", border: "none", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}>✕ Remove</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Add material row */}
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: "200px", display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Select Stock Item</label>
                <select value={selStockId} onChange={e => setSelStockId(e.target.value)} style={selectStyle}>
                  <option value="">— Choose a stock item —</option>
                  {availableStock.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}  ({s.qty} {s.unit} available)
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ width: "130px", display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Qty Used *</label>
                <input type="number" placeholder="0" value={selQty} onChange={e => setSelQty(e.target.value)} min="1" style={inputStyle} />
              </div>
              <button onClick={handleAddMaterial} style={{ padding: "10px 20px", borderRadius: "10px", background: t.color, color: "#fff", border: "none", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", height: "42px" }}>
                ➕ Add
              </button>
            </div>

            {/* Cost / Profit preview */}
            {materials.length > 0 && (
              <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px 16px", marginTop: "16px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Total Material Cost: <strong style={{ color: "#0f172a" }}>₹{materialCost.toLocaleString("en-IN")}</strong>
                </span>
                {profit !== null && (
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    Estimated Profit: <strong style={{ color: profit >= 0 ? "#16a34a" : "#dc2626" }}>₹{profit.toLocaleString("en-IN")}</strong>
                  </span>
                )}
                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                  ⚠️ Stock will be debited immediately when you click Save Job
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleSaveJob} disabled={saving} style={{ padding: "12px 28px", borderRadius: "10px", border: "none", background: t.color, color: "#fff", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "✅ Save Job & Debit Stock"}
            </button>
            <button onClick={() => { resetForm(); setTab("list"); }} style={{ padding: "12px 20px", borderRadius: "10px", border: "1.5px solid #cbd5e1", background: "#fff", color: "#64748b", fontWeight: 600, cursor: "pointer" }}>
              ✕ Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── JOB LIST TAB ── */}
      {tab === "list" && (
        <div style={{ marginTop: "20px" }}>
          {loading ? (
            <div className="empty-box">Loading jobs…</div>
          ) : jobs.length === 0 ? (
            <div className="empty-box">No jobs saved yet. Click '➕ New Job' to create one.</div>
          ) : (
            <ul>
              {jobs.map(job => (
                <li key={job.id}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{job.name}</strong>
                      <span style={{ background: "#f0fdf4", color: "#15803d", padding: "2px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700 }}>
                        ₹{Number(job.selling_price).toLocaleString("en-IN")}
                      </span>
                      {job.note && <span style={{ fontSize: "0.78rem", color: "#64748b" }}>{job.note}</span>}
                    </div>

                    {/* Materials used */}
                    {job.materials?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {job.materials.map((m, i) => (
                          <span key={i} style={{ background: "#fff7ed", color: "#c2410c", padding: "2px 10px", borderRadius: "100px", fontSize: "0.73rem", fontWeight: 600, border: "1px solid #fed7aa" }}>
                            📦 {m.stock_name}: <strong>-{m.qty_used} {m.unit}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {confirmDel === job.id ? (
                      <>
                        <button onClick={() => handleDeleteJob(job.id)} style={{ padding: "6px 10px", borderRadius: "6px", background: "#dc2626", color: "#fff", border: "none", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}>Yes, Delete</button>
                        <button onClick={() => setConfirmDel(null)} style={{ padding: "6px 10px", borderRadius: "6px", background: "#f1f5f9", color: "#64748b", border: "none", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDel(job.id)} style={{ padding: "6px 12px", borderRadius: "6px", background: "#fee2e2", color: "#dc2626", border: "none", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}>Delete</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );    
};

export default JobServices;
