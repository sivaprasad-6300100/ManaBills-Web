import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { authAxios } from "../../services/api";
import { getShopProfile } from "../../services/businessService";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ─── CONSTANTS ────────────────────────────────────────────────
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const GST_FILING_DATES = {
  1:"11 Feb",2:"11 Mar",3:"11 Apr",4:"11 May",5:"11 Jun",6:"11 Jul",
  7:"11 Aug",8:"11 Sep",9:"11 Oct",10:"11 Nov",11:"11 Dec",12:"11 Jan",
};

// ─── HELPERS ─────────────────────────────────────────────────
const fmt  = (n) => Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtK = (n) => {
  n = Number(n||0);
  if(n>=1e7) return `₹${(n/1e7).toFixed(2)} Cr`;
  if(n>=1e5) return `₹${(n/1e5).toFixed(2)} L`;
  if(n>=1e3) return `₹${(n/1e3).toFixed(1)} K`;
  return `₹${n.toFixed(0)}`;
};
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";

const escapeHtml = (str) => {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const sanitizeCsvCell = (val) => {
  const s = String(val ?? "");
  if (/^[=+\-@\t\r]/.test(s)) return `'${s}`;
  return s;
};

const useIsMobile = () => {
  const [m, setM] = useState(()=>typeof window!=="undefined"&&window.innerWidth<=768);
  useEffect(()=>{
    const h=()=>setM(window.innerWidth<=768);
    window.addEventListener("resize",h);
    return ()=>window.removeEventListener("resize",h);
  },[]);
  return m;
};

// ─── GLOBAL CSS ──────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .gr { font-family:'Plus Jakarta Sans',sans-serif; background:#f5f6fa; color:#1a1d23; min-height:100vh; }
  .gr * { box-sizing:border-box; margin:0; padding:0; }

  .gr-header { background:#fff; border-bottom:1px solid #e8eaf0; padding:20px 28px 0; position:sticky; top:0; z-index:50; box-shadow:0 2px 8px rgba(0,0,0,.04); }
  .gr-header.mob { padding:14px 14px 0; }
  .gr-body { padding:22px 28px; max-width:1280px; }
  .gr-body.mob { padding:14px; }

  .sc { background:#fff; border:1px solid #e8eaf0; border-radius:14px; padding:18px 20px; flex:1 1 160px; min-width:0; position:relative; overflow:hidden; transition:box-shadow .2s,transform .2s; cursor:default; }
  .sc:hover { box-shadow:0 6px 20px rgba(0,0,0,.08); transform:translateY(-2px); }
  .sc-bar { position:absolute; top:0; left:0; right:0; height:3px; border-radius:14px 14px 0 0; }
  .sc-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1rem; margin-bottom:11px; }
  .sc-label { font-size:0.66rem; font-weight:700; color:#7b8494; text-transform:uppercase; letter-spacing:.07em; margin-bottom:5px; }
  .sc-value { font-size:1.42rem; font-weight:800; color:#1a1d23; line-height:1; margin-bottom:3px; }
  .sc-sub { font-size:0.69rem; color:#a0a8b8; }
  .sc-delta { font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:100px; margin-top:5px; display:inline-block; }

  .sec { background:#fff; border:1px solid #e8eaf0; border-radius:14px; padding:20px 22px; margin-bottom:14px; }
  .sec-title { font-size:0.69rem; font-weight:700; color:#7b8494; text-transform:uppercase; letter-spacing:.07em; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  .dot { width:6px; height:6px; border-radius:50%; display:inline-block; flex-shrink:0; }

  .yr-sel { background:#f5f6fa; border:1px solid #e8eaf0; color:#1a1d23; border-radius:10px; padding:8px 12px; font-size:0.78rem; font-weight:600; font-family:inherit; cursor:pointer; outline:none; }
  .exp-btn { padding:8px 14px; border:1px solid #e8eaf0; border-radius:10px; background:#fff; font-family:inherit; font-size:0.76rem; font-weight:600; color:#7b8494; cursor:pointer; transition:all .15s; }
  .exp-btn:hover { border-color:#3b82f6; color:#3b82f6; }
  .exp-btn:disabled { opacity:.5; cursor:not-allowed; }

  .tab-bar { display:flex; border-bottom:1px solid #e8eaf0; margin-top:14px; overflow-x:auto; }
  .tab-bar::-webkit-scrollbar { display:none; }
  .tab-btn { padding:10px 18px; border:none; background:none; font-family:inherit; font-size:0.78rem; font-weight:600; color:#7b8494; border-bottom:2px solid transparent; cursor:pointer; transition:all .15s; white-space:nowrap; }
  .tab-btn.mob { padding:9px 12px; font-size:0.73rem; }
  .tab-btn:hover { color:#4a5568; }
  .tab-btn.active { color:#1a1d23; border-bottom-color:#3b82f6; }

  .tbl-wrap { overflow-x:auto; border-radius:10px; border:1px solid #e8eaf0; }
  .tbl { width:100%; border-collapse:collapse; font-size:0.81rem; }
  .tbl thead th { padding:10px 14px; background:#f9fafc; font-size:0.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#7b8494; border-bottom:1px solid #e8eaf0; white-space:nowrap; }
  .tbl thead th:first-child { text-align:left; }
  .tbl thead th:not(:first-child) { text-align:right; }
  .tbl tbody tr { border-bottom:1px solid #f0f2f7; transition:background .12s; }
  .tbl tbody tr:hover { background:#f9fafc; }
  .tbl tbody tr.empty { opacity:.38; }
  .tbl tbody td { padding:11px 14px; white-space:nowrap; }
  .tbl tbody td:first-child { text-align:left; font-weight:600; color:#1a1d23; }
  .tbl tbody td:not(:first-child) { text-align:right; color:#4a5568; }
  .tbl tfoot td { padding:13px 14px; text-align:right; background:#f9fafc; font-weight:700; border-top:2px solid #e8eaf0; color:#1a1d23; font-size:0.83rem; }
  .tbl tfoot td:first-child { text-align:left; }

  .badge { display:inline-flex; align-items:center; padding:2px 7px; border-radius:6px; font-size:0.62rem; font-weight:700; letter-spacing:.03em; }

  .chips { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
  .chip { background:#f5f6fa; border:1px solid #e8eaf0; border-radius:8px; padding:5px 12px; font-size:0.74rem; font-weight:600; color:#4a5568; }
  .chip b { color:#1a1d23; }

  .half-card { border-radius:12px; padding:18px 20px; border-left:4px solid; }

  .pay-btn { padding:5px 12px; border-radius:8px; font-family:inherit; font-size:0.7rem; font-weight:700; border:none; cursor:pointer; transition:all .15s; white-space:nowrap; }
  .pay-btn.unpaid { background:#fef2f2; color:#ef4444; border:1px solid #fecaca; }
  .pay-btn.unpaid:hover { background:#ef4444; color:#fff; }
  .pay-btn.paid { background:#ecfdf5; color:#10b981; border:1px solid #a7f3d0; cursor:default; }

  .proof-zone { border:1.5px dashed #e8eaf0; border-radius:10px; padding:20px; text-align:center; cursor:pointer; transition:all .2s; }
  .proof-zone:hover { border-color:#3b82f6; background:#f8fbff; }
  .proof-zone.dragging { border-color:#3b82f6; background:#eff6ff; }
  .proof-zone.disabled { opacity:.5; cursor:not-allowed; }
  .proof-chip { display:inline-flex; align-items:center; gap:6px; background:#f5f6fa; border:1px solid #e8eaf0; border-radius:8px; padding:5px 10px; font-size:0.72rem; font-weight:600; color:#4a5568; }

  .itc-form { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; padding:16px; background:#f9fafc; border-radius:10px; border:1px solid #e8eaf0; margin-bottom:14px; }
  .itc-input { padding:8px 12px; border:1px solid #e8eaf0; border-radius:8px; font-family:inherit; font-size:0.78rem; background:#fff; color:#1a1d23; outline:none; transition:border .15s; }
  .itc-input:focus { border-color:#3b82f6; }
  .itc-add-btn { padding:9px 18px; background:#3b82f6; color:#fff; border:none; border-radius:8px; font-family:inherit; font-size:0.78rem; font-weight:700; cursor:pointer; transition:background .15s; }
  .itc-add-btn:hover { background:#2563eb; }
  .itc-add-btn:disabled { opacity:.6; cursor:not-allowed; }

  .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px; }
  .modal { background:#fff; border-radius:16px; padding:24px; max-width:480px; width:100%; box-shadow:0 24px 60px rgba(0,0,0,.18); }
  .modal-title { font-size:1rem; font-weight:800; color:#1a1d23; margin-bottom:4px; }
  .modal-sub { font-size:0.73rem; color:#7b8494; margin-bottom:20px; }
  .modal-close { float:right; background:none; border:none; font-size:1.2rem; cursor:pointer; color:#7b8494; }

  .toast { position:fixed; top:18px; left:50%; transform:translateX(-50%); z-index:9999; padding:10px 22px; border-radius:100px; font-weight:700; font-size:0.78rem; white-space:nowrap; color:#fff; box-shadow:0 8px 24px rgba(0,0,0,.15); }

  .note-box { background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px 16px; margin-bottom:14px; }
  .note-box.blue { background:#eff6ff; border-color:#bfdbfe; }
  .note-box.green { background:#ecfdf5; border-color:#a7f3d0; }
  .note-box.red { background:#fef2f2; border-color:#fecaca; }
  .note-title { font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; }
  .note-text { font-size:0.73rem; line-height:1.7; color:#4a5568; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation:fadeUp .28s ease forwards; }
  .slide-in { animation:slideIn .22s ease forwards; }

  .tbl-wrap::-webkit-scrollbar { height:4px; }
  .tbl-wrap::-webkit-scrollbar-track { background:#f5f6fa; }
  .tbl-wrap::-webkit-scrollbar-thumb { background:#e0e3ec; border-radius:2px; }
`;

// ─── STAT CARD ────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, bg, icon, delta }) => (
  <div className="sc">
    <div className="sc-bar" style={{background:color}}/>
    <div className="sc-icon" style={{background:bg}}>{icon}</div>
    <div className="sc-label">{label}</div>
    <div className="sc-value">{value}</div>
    {sub   && <div className="sc-sub">{sub}</div>}
    {delta && <div className="sc-delta" style={{background:bg,color}}>{delta}</div>}
  </div>
);

// ─── PROOF UPLOAD ─────────────────────────────────────────────
const ProofUpload = ({ onUpload, existing, disabled, uploading }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const handle = (files) => { if(files[0] && !disabled) onUpload(files[0]); };
  return (
    <div>
      {existing ? (
        <div className="proof-chip">
          <span>📎</span>
          <span style={{maxWidth:160,overflow:"hidden",textOverflow:"ellipsis"}}>{existing}</span>
          {!disabled && (
            <button onClick={()=>onUpload(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontWeight:700,fontSize:"0.8rem"}}>×</button>
          )}
        </div>
      ) : (
        <div
          className={`proof-zone ${dragging?"dragging":""} ${disabled?"disabled":""}`}
          style={{padding:"12px"}}
          onClick={()=>!disabled && inputRef.current.click()}
          onDragOver={e=>{e.preventDefault(); if(!disabled) setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);handle(e.dataTransfer.files);}}
        >
          <div style={{fontSize:"1.2rem",marginBottom:"4px"}}>{uploading ? "⏳" : "📎"}</div>
          <div style={{fontSize:"0.7rem",color:"#7b8494",fontWeight:600}}>
            {uploading ? "Uploading…" : disabled ? "Save entry first to attach proof" : "Upload Proof"}
          </div>
          <div style={{fontSize:"0.62rem",color:"#a0a8b8"}}>PDF, JPG, PNG</div>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}}
            onChange={e=>handle(e.target.files)} disabled={disabled}/>
        </div>
      )}
    </div>
  );
};

const GSTChart = ({ reportData, chartType, totalITCAvailable }) => {
  const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyItc = reportData.length > 0 ? totalITCAvailable / reportData.length : 0;
  const data = reportData.map((r, i) => ({
    month: MONTH_SHORT[i],
    "GST Collected": Number(r.gst_collected || 0),
    "ITC Available": monthlyItc,
    "Net Payable":   Math.max(0, Number(r.gst_collected||0) - monthlyItc),
  }));
  const fmtY = (v) => v >= 1e5 ? `₹${(v/1e5).toFixed(1)}L` : v >= 1e3 ? `₹${(v/1e3).toFixed(0)}K` : `₹${v}`;
  const ChartComp  = chartType === "line" ? LineChart : BarChart;
  const SeriesComp = chartType === "line" ? Line : Bar;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ChartComp data={data} margin={{top:4,right:8,left:0,bottom:0}}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" vertical={false}/>
        <XAxis dataKey="month" tick={{fontSize:12,fill:"#7b8494"}} axisLine={false} tickLine={false}/>
        <YAxis tickFormatter={fmtY} tick={{fontSize:11,fill:"#7b8494"}} axisLine={false} tickLine={false} width={60}/>
        <Tooltip formatter={(v,n) => [`₹${Number(v).toLocaleString("en-IN",{minimumFractionDigits:2})}`, n]}/>
        <Legend wrapperStyle={{fontSize:"12px",paddingTop:"12px"}}/>
        <SeriesComp dataKey="GST Collected" fill="#3b82f6" stroke="#3b82f6" radius={chartType==="bar"?[4,4,0,0]:0} strokeWidth={2} dot={false}/>
        <SeriesComp dataKey="ITC Available" fill="#10b981" stroke="#10b981" radius={chartType==="bar"?[4,4,0,0]:0} strokeWidth={2} dot={false} strokeDasharray={chartType==="line"?"5 4":undefined}/>
        <SeriesComp dataKey="Net Payable"   fill="#ef4444" stroke="#ef4444" radius={chartType==="bar"?[4,4,0,0]:0} strokeWidth={2} dot={false} strokeDasharray={chartType==="line"?"2 3":undefined}/>
      </ChartComp>
    </ResponsiveContainer>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────
const GstReports = () => {
  const [reportData,   setReportData]   = useState([]);
  const [stockITC,     setStockITC]     = useState([]);   // computed from Products — read-only
  const [manualITC,    setManualITC]    = useState([]);   // from backend ITCEntry model — full CRUD
  const [view,         setView]         = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [years,        setYears]        = useState([]);
  const [activeTab,    setActiveTab]    = useState("summary");
  const [toast,        setToast]        = useState(null);
  const [payingMonth,  setPayingMonth]  = useState(null);
  const [confirmingPaid, setConfirmingPaid] = useState(false);
  const [proofModal,   setProofModal]   = useState(null);  // { id }
  const [proofUploading, setProofUploading] = useState(false);
  const [showITCForm,  setShowITCForm]  = useState(false);
  const [savingITCEntry, setSavingITCEntry] = useState(false);
  const [newITC,       setNewITC]       = useState({ item:"", category:"", qty:"", unit:"", purchase_value:"", itc_rate:"18" });
  const [openingITC,      setOpeningITC]      = useState(0);
  const [openingITCInput, setOpeningITCInput] = useState("");
  const [consumedStockITC, setConsumedStockITC] = useState(0);
  const [carryForwardITC, setCarryForwardITC] = useState(0);
  const [openingITCHistory, setOpeningITCHistory] = useState([]);
  const [b2bMonth, setB2bMonth] = useState("all");
  const [b2cMonth, setB2cMonth] = useState("all");
  const [chartType, setChartType] = useState("bar");
  const [b2bInvoices,     setB2bInvoices]     = useState([]);
  const [b2cInvoices,     setB2cInvoices]     = useState([]);
  const [b2bLoadMonth,    setB2bLoadMonth]    = useState(String(new Date().getMonth() + 1));
  const [b2cLoadMonth,    setB2cLoadMonth]    = useState(String(new Date().getMonth() + 1));
  const [b2bLoadYear,     setB2bLoadYear]     = useState(new Date().getFullYear());
  const [b2cLoadYear,     setB2cLoadYear]     = useState(new Date().getFullYear());
  const [b2bLoading,      setB2bLoading]      = useState(false);
  const [b2cLoading,      setB2cLoading]      = useState(false);
  const navigate = useNavigate();
  const [shopProfile, setShopProfile] = useState(null);

  const isMobile = useIsMobile();

  useEffect(()=>{
    const cur = new Date().getFullYear();
    setYears([cur-2, cur-1, cur]);
  },[]);

  // ── Opening ITC balance (persisted) ─────────────────────────
  const loadOpeningITC = async (year) => {
    try {
      const response = await authAxios.get("business/itc-opening-balance/", { params: { year } });
      const itcAmount = Number(response.data?.opening_itc || 0);
      setOpeningITC(itcAmount);
      setOpeningITCInput(itcAmount ? itcAmount.toString() : "");
      setConsumedStockITC(Number(response.data?.consumed_stock_itc || 0));
    } catch (error) {
      console.error("Failed to load opening ITC:", error);
    }
  };

  // ── Opening ITC history (persisted server-side audit log) ──
  const loadITCHistory = async (year) => {
    try {
      const res = await authAxios.get("business/itc-history/", { params: { year } });
      setOpeningITCHistory(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load ITC history:", error);
      setOpeningITCHistory([]);
    }
  };

  const saveOpeningITC = async (amount, year, consumed = null, historyType = null, historyAmount = null) => {
    try {
      const payload = { opening_itc: amount };
      if (consumed !== null) payload.consumed_stock_itc = consumed;
      if (historyType) { payload.history_type = historyType; payload.history_amount = historyAmount; }
      const response = await authAxios.post("business/itc-opening-balance/", payload, { params: { year } });
      const savedAmount = Number(response.data?.opening_itc ?? amount);
      setOpeningITC(savedAmount);
      if (response.data?.consumed_stock_itc !== undefined) {
        setConsumedStockITC(Number(response.data.consumed_stock_itc));
      }
      return true;
    } catch (error) {
      console.error("Failed to save opening ITC:", error);
      showToast("Failed to save opening ITC balance", "error");
      return false;
    }
  };

  const addOpeningITC = async (amount, year) => {
    const newTotal = openingITC + amount;
    const success = await saveOpeningITC(newTotal, year, null, "add", amount);
    if (success) await loadITCHistory(year);
    return success;
  };

  const subtractOpeningITC = async (amount, year) => {
    const newTotal = Math.max(0, openingITC - amount);
    const success = await saveOpeningITC(newTotal, year, null, "subtract", amount);
    if (success) await loadITCHistory(year);
    return success;
  };

  // ── Manual ITC entries (persisted via ITCEntry backend model) ──
  const loadManualITC = async (year) => {
    try {
      const res = await authAxios.get("business/itc-entries/", { params: { year } });
      const list = Array.isArray(res.data) ? res.data : [];
      setManualITC(list.map(e => ({
        id: e.id,
        source: "manual",
        item: e.item,
        category: e.category,
        qty: Number(e.qty),
        unit: e.unit,
        purchase_value: Number(e.purchase_value),
        itc_rate: Number(e.itc_rate),
        itc_amount: Number(e.itc_amount),
        status: e.status,
        proof: e.proof_name || null,
        proofUrl: e.proof_url || null,
      })));
    } catch (error) {
      console.error("Failed to load manual ITC entries:", error);
    }
  };

  const addITCEntry = async () => {
    if(!newITC.item || !newITC.purchase_value) {
      showToast("Item name and purchase value required", "error");
      return;
    }
    setSavingITCEntry(true);
    try {
      await authAxios.post("business/itc-entries/", {
        year: selectedYear,
        item: newITC.item,
        category: newITC.category || "General",
        qty: Number(newITC.qty) || 1,
        unit: newITC.unit || "nos",
        purchase_value: Number(newITC.purchase_value),
        itc_rate: Number(newITC.itc_rate),
        status: "eligible",
      });
      await loadManualITC(selectedYear);
      setNewITC({ item:"", category:"", qty:"", unit:"", purchase_value:"", itc_rate:"18" });
      setShowITCForm(false);
      showToast("ITC entry added ✓");
    } catch (error) {
      console.error("Failed to add ITC entry:", error);
      showToast("Failed to save ITC entry", "error");
    } finally {
      setSavingITCEntry(false);
    }
  };

  const deleteITCEntry = async (id) => {
    try {
      await authAxios.delete(`business/itc-entries/${id}/`);
      await loadManualITC(selectedYear);
      showToast("ITC entry removed");
    } catch (error) {
      console.error("Failed to delete ITC entry:", error);
      showToast("Failed to remove entry", "error");
    }
  };

  const handleProofUpload = async (id, file) => {
    setProofUploading(true);
    try {
      if (file) {
        const formData = new FormData();
        formData.append("proof_file", file);
        await authAxios.patch(`business/itc-entries/${id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast(`Proof uploaded: ${file.name} ✓`);
      } else {
        await authAxios.patch(`business/itc-entries/${id}/`, { clear_proof: true });
        showToast("Proof removed");
      }
      await loadManualITC(selectedYear);
      setProofModal(null);
    } catch (error) {
      console.error("Failed to upload proof:", error);
      showToast("Failed to upload proof", "error");
    } finally {
      setProofUploading(false);
    }
  };

  // ── Invoice lists (B2B / B2C) ──────────────────────────────

  // ── Invoice lists (B2B / B2C) ───────────────────────────────
  const loadInvoiceList = async (type) => {
    const month = type === "b2b" ? b2bLoadMonth : b2cLoadMonth;
    const year  = type === "b2b" ? b2bLoadYear  : b2cLoadYear;
    const setLoading = type === "b2b" ? setB2bLoading : setB2cLoading;
    const setData    = type === "b2b" ? setB2bInvoices : setB2cInvoices;

    setLoading(true);
    try {
      const res = await authAxios.get("business/gst-invoice-export/", {
        params: { year, month, type },
      });
      const list = Array.isArray(res.data) ? res.data : [];

      const mapped = list.map(inv => ({
        id: inv.invoice_id,
        invoice_id: inv.invoice_id,
        date: inv.date,
        customer_name: inv.customer_name,
        customer_mobile: inv.customer_mobile,
        customer_gst: inv.customer_gst === "—" ? "" : inv.customer_gst,
        total: inv.total_amount,
        gst_amt: inv.total_gst,
      }));


      setData(mapped);
    } catch (error) {
      console.error("Failed to load invoice list:", error);
      showToast("Failed to load invoices", "error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [rpt, stockItcList, shop] = await Promise.all([
        authAxios.get("business/gst-reports/", { params: { year: selectedYear, view } }).then(r => r.data),
        authAxios.get("business/products/").then(r => r.data).then(products =>
          products
            .filter(p => Number(p.purchase_price) > 0)
            .map(p => {
              const qty = Number(p.qty) || 0;
              const unitPrice = Number(p.purchase_price) || 0;
              const totalPurchase = unitPrice * qty;
              const gstRate = Number(p.gst_rate) || 0;
              const fallbackItc = (totalPurchase * gstRate) / 100;
              return {
                source: "stock",
                id: `product-${p.id}`,
                item: p.name,
                category: p.category || "General",
                qty,
                unit: p.unit || "nos",
                purchase_value: totalPurchase,
                itc_rate: gstRate,
                itc_amount: Number(p.purchase_gst) > 0 ? Number(p.purchase_gst) : fallbackItc,
                supplier_gstin: p.supplier_gstin || "",
                status: p.supplier_gstin ? "eligible" : "pending",
                proof: null,
              };
            })
            .filter(p => p.itc_amount > 0)
        ),
        getShopProfile().catch(() => null),
      ]);
      setReportData(Array.isArray(rpt) ? rpt : []);
      setStockITC(Array.isArray(stockItcList) ? stockItcList : []);
      setShopProfile(shop || null);
      await Promise.all([loadManualITC(selectedYear), loadITCHistory(selectedYear)]);
        if (isRefresh) showToast("Data refreshed ✓");
      } catch (error) {
        console.error("Failed to load GST report data:", error);
        showToast("Failed to load data", "error");
      } finally {
        setLoading(false); setRefreshing(false);
      }
    };

  useEffect(()=>{
    loadData();
    loadOpeningITC(selectedYear);
  },[selectedYear, view]);

  useEffect(() => {
    if (activeTab === "b2b") loadInvoiceList("b2b");
  }, [activeTab, b2bLoadMonth, b2bLoadYear]);

  useEffect(() => {
    if (activeTab === "b2c") loadInvoiceList("b2c");
  }, [activeTab, b2cLoadMonth, b2cLoadYear]);

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3000);
  };

  // ── Mark as Paid ────────────────────────────────────────────


  // ── Mark as Paid (ATOMIC — single backend call, no drift risk) ──

  const confirmPaid = async (monthIdx) => {
    if (confirmingPaid) return;
    setConfirmingPaid(true);
    const monthData = reportData[monthIdx];
    const gst       = Number(monthData?.gst_collected || 0);


    try {
      const res = await authAxios.post("business/gst-mark-paid-consume-itc/", {
        year:                 selectedYear,
        month:                monthIdx + 1,
        gst_collected:        gst,
        effective_stock_itc:  effectiveStockITC,
        opening_itc:          openingITC,
      });

      const {
        paid_date, total_itc_used, leftover_carried_forward,
        new_opening_itc, new_consumed_stock_itc,
      } = res.data;

      setReportData(prev => prev.map((r, i) =>
        i === monthIdx
          ? { ...r, gst_paid: true, gst_paid_date: paid_date, gst_due_amount: 0 }
          : r
      ));

      setOpeningITC(new_opening_itc);
      setConsumedStockITC(new_consumed_stock_itc);
      setOpeningITCInput("");
      await loadITCHistory(selectedYear);

      if (leftover_carried_forward > 0) {
        setCarryForwardITC(leftover_carried_forward);
        showToast(`₹${fmt(total_itc_used)} ITC used. ₹${fmt(leftover_carried_forward)} carried forward ✓`);
      } else {
        setCarryForwardITC(0);
        showToast(`${MONTH_FULL[monthIdx]} GST marked as paid ✓ (₹${fmt(total_itc_used)} ITC used)`);
      }

      setPayingMonth(null);

      } catch (error) {
      console.error("Failed to mark GST as paid:", error);
      showToast("Failed to save payment. Try again.", "error");
    } finally {
      setConfirmingPaid(false);
    }
  };

  // ── Computed totals ───────────────────────────────────────────
  const totals = useMemo(()=>({
    invoices:    reportData.reduce((s,r)=>s+(r.invoice_count||0),0),
    b2b:         reportData.reduce((s,r)=>s+(r.b2b_count||0),0),
    b2c:         reportData.reduce((s,r)=>s+(r.b2c_count||0),0),
    taxable:     reportData.reduce((s,r)=>s+Number(r.taxable_value||0),0),
    gst:         reportData.reduce((s,r)=>s+Number(r.gst_collected||0),0),
    total:       reportData.reduce((s,r)=>s+Number(r.total_value||0),0),
    itcEligible: reportData.reduce((s,r)=>s+Number(r.itc_eligible||0),0),
    itcClaimed:  reportData.reduce((s,r)=>s+Number(r.itc_claimed||0),0),
    itcPending:  reportData.reduce((s,r)=>s+Number(r.itc_pending||0),0),
    paidMonths:  reportData.filter(r=>r.gst_paid).length,
    dueAmount:   reportData.filter(r=>!r.gst_paid).reduce((s,r)=>s+Number(r.gst_due_amount||0),0),
  }),[reportData]);

  const h1 = useMemo(()=>({
    gst:   reportData.slice(0,6).reduce((s,r)=>s+Number(r.gst_collected||0),0),
    total: reportData.slice(0,6).reduce((s,r)=>s+Number(r.total_value||0),0),
    inv:   reportData.slice(0,6).reduce((s,r)=>s+(r.invoice_count||0),0),
    b2b:   reportData.slice(0,6).reduce((s,r)=>s+(r.b2b_count||0),0),
    b2c:   reportData.slice(0,6).reduce((s,r)=>s+(r.b2c_count||0),0),
    paid:  reportData.slice(0,6).filter(r=>r.gst_paid).length,
  }),[reportData]);

  const h2 = useMemo(()=>({
    gst:   reportData.slice(6,12).reduce((s,r)=>s+Number(r.gst_collected||0),0),
    total: reportData.slice(6,12).reduce((s,r)=>s+Number(r.total_value||0),0),
    inv:   reportData.slice(6,12).reduce((s,r)=>s+(r.invoice_count||0),0),
    b2b:   reportData.slice(6,12).reduce((s,r)=>s+(r.b2b_count||0),0),
    b2c:   reportData.slice(6,12).reduce((s,r)=>s+(r.b2c_count||0),0),
    paid:  reportData.slice(6,12).filter(r=>r.gst_paid).length,
  }),[reportData]);

  const curMonth = new Date().getMonth();

  // combined ITC list for display (stock read-only + manual editable)
  const itcStock = useMemo(() => [...stockITC, ...manualITC], [stockITC, manualITC]);

  // ── Net GST Payable (after ITC) ───────────────────────────────
  const itcClaimedFromStock = itcStock.reduce((s, r) => s + r.itc_amount, 0);
  const effectiveStockITC = Math.max(0, itcClaimedFromStock - consumedStockITC);
  const totalITCAvailable = effectiveStockITC + openingITC;
  const netGstPayable = Math.max(0, totals.gst - totalITCAvailable);

  // ── Export CSV ──────────────────────────────────────
  const exportCSV = (type = "all") => {
    let header, rows, filename;

    if (type === "itc") {
      header = ["Item","Category","Qty","Unit","Purchase Value","ITC Rate %","ITC Amount","Status","Source","Proof"];
      rows = itcStock.map(r => [r.item, r.category, r.qty, r.unit, r.purchase_value, r.itc_rate, r.itc_amount, r.status, r.source, r.proof || "—"]);
      filename = `ITC_Stock_${selectedYear}.csv`;
      const allRows = [header, ...rows];
      const csv = allRows.map(r => r.map(cell => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      showToast("ITC CSV exported ✓");
      return;
    }

    if (type === "b2b" || type === "b2c") {
      const isB2B     = type === "b2b";
      const invoices  = isB2B ? b2bInvoices : b2cInvoices;
      const loadMonth = isB2B ? b2bLoadMonth : b2cLoadMonth;
      const loadYear  = isB2B ? b2bLoadYear  : b2cLoadYear;
      const typeLabel = isB2B ? "B2B (Business to Business)" : "B2C (Business to Consumer)";

      const monthLabel = loadMonth === "all"
        ? `Full Year ${loadYear}`
        : `${MONTH_FULL[Number(loadMonth) - 1]} ${loadYear}`;

      const totalAmount  = invoices.reduce((s, i) => s + Number(i.total   || 0), 0);
      const totalGst     = invoices.reduce((s, i) => s + Number(i.gst_amt || 0), 0);
      const totalTaxable = invoices.reduce((s, i) => s + (Number(i.total || 0) - Number(i.gst_amt || 0)), 0);

      const meta = [
        [`ManaBills GST Report`],
        [`Report Type: ${typeLabel}`],
        [`Period: ${monthLabel}`],
        [`Generated On: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`],
        [`Generated At: ${new Date().toLocaleTimeString("en-IN")}`],
        [],
        [`SUMMARY`],
        [`Total ${type.toUpperCase()} Invoices`, invoices.length],
        [`Total Taxable Value (₹)`, totalTaxable.toFixed(2)],
        [`Total GST Collected (₹)`, totalGst.toFixed(2)],
        [`Total Invoice Value (₹)`, totalAmount.toFixed(2)],
        [],
        [
          "Sr No","Invoice ID","Date","Customer Name","Customer Mobile",
          ...(isB2B ? ["Customer GSTIN"] : []),
          "Taxable Value (₹)","CGST (₹)","SGST (₹)","Total GST (₹)","Invoice Total (₹)",
        ],
      ];

      const rows = invoices.map((inv, idx) => {
        const gst     = Number(inv.gst_amt || 0);
        const total   = Number(inv.total   || 0);
        const taxable = total - gst;
        const half    = (gst / 2).toFixed(2);
        return [
          idx + 1, inv.invoice_id, inv.date,
          inv.customer_name   || "—", inv.customer_mobile || "—",
          ...(isB2B ? [inv.customer_gst || "—"] : []),
          taxable.toFixed(2), half, half, gst.toFixed(2), total.toFixed(2),
        ];
      });

      const blankCols = isB2B ? ["", "", "", "", ""] : ["", "", "", ""];
      const footer = [
        `TOTAL (${invoices.length} invoices)`, ...blankCols,
        totalTaxable.toFixed(2), (totalGst / 2).toFixed(2), (totalGst / 2).toFixed(2),
        totalGst.toFixed(2), totalAmount.toFixed(2),
      ];

      const allRows = [...meta, ...rows, [], footer];
      const csv = allRows.map(r => r.map(cell => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `ManaBills_GST_${type.toUpperCase()}_${monthLabel.replace(/ /g, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`${type.toUpperCase()} CSV exported ✓`);
      return;
    }
    
    
  header = ["Month","Total Invoices","B2B","B2C","Taxable (₹)","GST (₹)","Total (₹)","ITC Eligible (₹)","ITC Claimed (₹)","GST Paid","Paid Date"];
    const monthlyItcForCsv = reportData.length > 0 ? totalITCAvailable / reportData.length : 0;
    rows = reportData.map((r, i) => [
      MONTH_FULL[i], r.invoice_count || 0, r.b2b_count || 0, r.b2c_count || 0,
      Number(r.taxable_value || 0).toFixed(2), Number(r.gst_collected || 0).toFixed(2),
      Number(r.total_value || 0).toFixed(2), monthlyItcForCsv.toFixed(2),
      monthlyItcForCsv.toFixed(2), r.gst_paid ? "Yes" : "No", r.gst_paid_date || "—",
    ]);
  
    filename = `GST_Summary_${selectedYear}.csv`;

    const allRows = [header, ...rows];
    const csv = allRows.map(r => r.map(cell => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported ✓");
  };

  const generatePDF = (type = "b2b") => {
    const isB2B    = type === "b2b";
    const invoices = isB2B ? b2bInvoices : b2cInvoices;
    const loadMonth = isB2B ? b2bLoadMonth : b2cLoadMonth;
    const loadYear  = isB2B ? b2bLoadYear  : b2cLoadYear;
    const typeLabel = isB2B ? "B2B (Business to Business)" : "B2C (Business to Consumer)";
    const color     = isB2B ? "#8b5cf6" : "#f59e0b";
    const colorLight = isB2B ? "#f5f3ff" : "#fffbeb";

    const monthLabel = loadMonth === "all"
      ? `Full Year ${loadYear}`
      : `${MONTH_FULL[Number(loadMonth) - 1]} ${loadYear}`;

    const totalAmount  = invoices.reduce((s, i) => s + Number(i.total   || 0), 0);
    const totalGst     = invoices.reduce((s, i) => s + Number(i.gst_amt || 0), 0);
    const totalTaxable = invoices.reduce((s, i) => s + (Number(i.total || 0) - Number(i.gst_amt || 0)), 0);

    const shop = shopProfile || {};

    const rows = invoices.map((inv, idx) => {
      const gst     = Number(inv.gst_amt || 0);
      const total   = Number(inv.total   || 0);
      const taxable = total - gst;
      const half    = gst / 2;
      const gstinCol = isB2B ? `<td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:center;color:#6366f1">${escapeHtml(inv.customer_gst) || "—"}</td>` : "";
      return `
        <tr style="background:${idx % 2 === 0 ? "#fff" : "#fafafa"}">
          <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:center;color:#7b8494">${idx + 1}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;font-weight:700;color:#1a1d23">${escapeHtml(inv.invoice_id) || "—"}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;color:#4a5568">${escapeHtml(inv.date) || "—"}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;color:#1a1d23">${escapeHtml(inv.customer_name) || "—"}</td>
          ${gstinCol}
          <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;color:#4a5568">₹${fmt(taxable)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;color:#4a5568">₹${fmt(half)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;color:#4a5568">₹${fmt(half)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;color:#10b981;font-weight:700">₹${fmt(gst)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;font-weight:800;color:#1a1d23">₹${fmt(total)}</td>
        </tr>`;
    }).join("");

    const gstinHeader = isB2B ? `<th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:center">Customer GSTIN</th>` : "";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>ManaBills GST ${type.toUpperCase()} Report — ${monthLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1d23; background: #fff; font-size: 13px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      @page { margin: 14mm 12mm; size: A4 landscape; }
    }
  </style>
</head>
<body style="padding:28px 32px;max-width:1100px;margin:0 auto">
  <div class="no-print" style="text-align:right;margin-bottom:16px;display:flex;gap:10px;justify-content:flex-end">
    <button onclick="window.print()" style="padding:10px 24px;background:${color};color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">🖨️ Print / Save PDF</button>
    <button onclick="downloadPDF()" style="padding:10px 24px;background:#1a1d23;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">↓ Download PDF</button>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script>
  async function downloadPDF() {
    const btn = document.querySelector('[onclick="downloadPDF()"]');
    btn.textContent = "Generating…"; btn.disabled = true;
    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(document.body, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save("ManaBills_GST_${type.toUpperCase()}_${monthLabel.replace(/ /g, "_")}.pdf");
    btn.textContent = "↓ Download PDF"; btn.disabled = false;
  }
  </script>
  <div style="background:${color};border-radius:12px 12px 0 0;padding:20px 28px;color:#fff;display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="font-size:11px;opacity:.8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">ManaBills GST Report</div>
      <div style="font-size:22px;font-weight:800;letter-spacing:-.02em">${typeLabel}</div>
      <div style="font-size:13px;opacity:.9;margin-top:4px">Period: ${monthLabel}</div>
    </div>
    <div style="text-align:right;font-size:11px;opacity:.85;line-height:1.8">
      <div>Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
      <div>${new Date().toLocaleTimeString("en-IN")}</div>
    </div>
  </div>
  <div style="background:${colorLight};border:1px solid ${isB2B ? "#e9d5ff" : "#fde68a"};border-top:none;border-radius:0;padding:16px 28px;display:flex;gap:40px;flex-wrap:wrap">
    <div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Shop Name</div>
      <div style="font-size:14px;font-weight:800;color:#1a1d23">${escapeHtml(shop.shop_name || shop.name ) || "—"}</div>
    </div>
    ${shop.gst_number ? `<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">GSTIN</div><div style="font-size:13px;font-weight:700;color:#1a1d23;font-family:monospace">${escapeHtml(shop.gst_number)}</div></div>` : ""}
    ${shop.phone || shop.mobile ? `<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Phone</div><div style="font-size:13px;font-weight:600;color:#1a1d23">${escapeHtml(shop.phone || shop.mobile)}</div></div>` : ""}
    ${shop.address ? `<div style="flex:1;min-width:180px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Address</div><div style="font-size:12px;color:#4a5568;line-height:1.5">${escapeHtml(shop.address)}</div></div>` : ""}
  </div>
  <div style="display:flex;gap:0;border:1px solid #e8eaf0;border-top:none;border-radius:0 0 12px 12px;overflow:hidden;margin-bottom:24px">
    ${[
      { label: "Total Invoices", value: invoices.length, color: color },
      { label: "Taxable Value",  value: `₹${fmt(totalTaxable)}`, color: "#4a5568" },
      { label: "GST Collected",  value: `₹${fmt(totalGst)}`,     color: "#10b981" },
      { label: "CGST",           value: `₹${fmt(totalGst / 2)}`,  color: "#3b82f6" },
      { label: "SGST",           value: `₹${fmt(totalGst / 2)}`,  color: "#3b82f6" },
      { label: "Invoice Total",  value: `₹${fmt(totalAmount)}`,   color: "#1a1d23" },
    ].map((c, i, arr) => `
      <div style="flex:1;padding:14px 16px;background:#fff;border-right:${i < arr.length - 1 ? "1px solid #e8eaf0" : "none"}">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:5px">${c.label}</div>
        <div style="font-size:16px;font-weight:800;color:${c.color}">${c.value}</div>
      </div>`).join("")}
  </div>
  <div style="border:1px solid #e8eaf0;border-radius:10px;overflow:hidden">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:center">#</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:left">Invoice ID</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:left">Date</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:left">Customer</th>
        ${gstinHeader}
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">Taxable</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">CGST</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">SGST</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">Total GST</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">Invoice Total</th>
      </tr></thead>
      <tbody>${invoices.length === 0 ? `<tr><td colspan="${isB2B ? 10 : 9}" style="text-align:center;padding:40px;color:#a0a8b8;font-size:13px">No ${type.toUpperCase()} invoices for this period</td></tr>` : rows}</tbody>
      <tfoot><tr style="background:#f9fafc">
        <td colspan="${isB2B ? 5 : 4}" style="padding:11px 10px;font-weight:800;font-size:12px;color:#1a1d23;border-top:2px solid #e8eaf0">TOTAL — ${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}</td>
        <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:12px;color:#4a5568;border-top:2px solid #e8eaf0">₹${fmt(totalTaxable)}</td>
        <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:12px;color:#3b82f6;border-top:2px solid #e8eaf0">₹${fmt(totalGst / 2)}</td>
        <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:12px;color:#3b82f6;border-top:2px solid #e8eaf0">₹${fmt(totalGst / 2)}</td>
        <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:12px;color:#10b981;border-top:2px solid #e8eaf0">₹${fmt(totalGst)}</td>
        <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:13px;color:#1a1d23;border-top:2px solid #e8eaf0">₹${fmt(totalAmount)}</td>
      </tr></tfoot>
    </table>
  </div>
  <div style="margin-top:18px;font-size:10px;color:#a0a8b8;line-height:1.8;border-top:1px solid #e8eaf0;padding-top:12px">
    * CGST/SGST split assumes intra-state (50/50). For inter-state transactions, full amount is IGST.
    ${isB2B ? "B2B invoices go in GSTR-1 Table 4." : "B2C invoices go in GSTR-1 Table 7/8."}
    Consult your CA before final filing. Generated by ManaBills.
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { showToast("Allow popups to generate PDF", "error"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    showToast(`${type.toUpperCase()} PDF ready — click Print / Save PDF`);
  };

  const generateITCPDF = () => {
    const shop = shopProfile || {};
    const color = "#10b981";
    const colorLight = "#ecfdf5";

    const rows = itcStock.map((r, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#fff" : "#fafafa"}">
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:center;color:#7b8494">${idx + 1}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;font-weight:700;color:#1a1d23">${escapeHtml(r.item)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;color:#4a5568">${escapeHtml(r.category)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;color:#4a5568">${escapeHtml(r.qty)} ${escapeHtml(r.unit)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;color:#4a5568">₹${fmt(r.purchase_value)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;color:${r.itc_rate>0?"#10b981":"#ef4444"}">${r.itc_rate}%</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;font-weight:800;color:#3b82f6">₹${fmt(r.itc_amount)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:center;color:#4a5568">${escapeHtml(r.status)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:center;color:#4a5568">${escapeHtml(r.proof) || "—"}</td>
      </tr>`).join("");

    const totalPurchase = itcStock.reduce((s, r) => s + r.purchase_value, 0);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>ManaBills ITC Report — ${selectedYear}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1d23; background: #fff; font-size: 13px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      @page { margin: 14mm 12mm; size: A4 landscape; }
    }
  </style>
</head>
<body style="padding:28px 32px;max-width:1100px;margin:0 auto">
  <div class="no-print" style="text-align:right;margin-bottom:16px;display:flex;gap:10px;justify-content:flex-end">
    <button onclick="window.print()" style="padding:10px 24px;background:${color};color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">🖨️ Print / Save PDF</button>
    <button onclick="downloadPDF()" style="padding:10px 24px;background:#1a1d23;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">↓ Download PDF</button>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script>
  async function downloadPDF() {
    const btn = document.querySelector('[onclick="downloadPDF()"]');
    btn.textContent = "Generating…"; btn.disabled = true;
    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(document.body, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save("ManaBills_ITC_${selectedYear}.pdf");
    btn.textContent = "↓ Download PDF"; btn.disabled = false;
  }
  </script>
  <div style="background:${color};border-radius:12px 12px 0 0;padding:20px 28px;color:#fff;display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="font-size:11px;opacity:.8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">ManaBills ITC Report</div>
      <div style="font-size:22px;font-weight:800;letter-spacing:-.02em">ITC from Stock / Purchases</div>
      <div style="font-size:13px;opacity:.9;margin-top:4px">Year: ${selectedYear}</div>
    </div>
    <div style="text-align:right;font-size:11px;opacity:.85;line-height:1.8">
      <div>Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
      <div>${new Date().toLocaleTimeString("en-IN")}</div>
    </div>
  </div>
  <div style="background:${colorLight};border:1px solid #a7f3d0;border-top:none;border-radius:0;padding:16px 28px;display:flex;gap:40px;flex-wrap:wrap">
    <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Shop Name</div><div style="font-size:14px;font-weight:800;color:#1a1d23">${escapeHtml(shop.shop_name || shop.name) || "—"}</div></div>
    ${shop.gst_number ? `<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">GSTIN</div><div style="font-size:13px;font-weight:700;color:#1a1d23;font-family:monospace">${escapeHtml(shop.gst_number)}</div></div>` : ""}
    ${shop.phone || shop.mobile ? `<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Phone</div><div style="font-size:13px;font-weight:600;color:#1a1d23">${escapeHtml(shop.phone || shop.mobile)}</div></div>` : ""}
    ${shop.address ? `<div style="flex:1;min-width:180px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Address</div><div style="font-size:12px;color:#4a5568;line-height:1.5">${escapeHtml(shop.address)}</div></div>` : ""}
  </div>
  <div style="display:flex;gap:0;border:1px solid #e8eaf0;border-top:none;border-radius:0 0 12px 12px;overflow:hidden;margin-bottom:24px">
    ${[
      { label: "Total Items", value: itcStock.length, color: color },
      { label: "Total Purchase Value", value: `₹${fmt(totalPurchase)}`, color: "#4a5568" },
      { label: "Total ITC (Stock)", value: `₹${fmt(itcClaimedFromStock)}`, color: "#3b82f6" },
      { label: "Opening / Manual ITC", value: `₹${fmt(openingITC)}`, color: "#6366f1" },
      { label: "Total ITC Available", value: `₹${fmt(totalITCAvailable)}`, color: "#10b981" },
    ].map((c, i, arr) => `
      <div style="flex:1;padding:14px 16px;background:#fff;border-right:${i < arr.length - 1 ? "1px solid #e8eaf0" : "none"}">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:5px">${c.label}</div>
        <div style="font-size:16px;font-weight:800;color:${c.color}">${c.value}</div>
      </div>`).join("")}
  </div>
  <div style="border:1px solid #e8eaf0;border-radius:10px;overflow:hidden">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:center">#</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:left">Item</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:left">Category</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">Qty</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">Purchase Value</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">ITC Rate</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">ITC Amount</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:center">Status</th>
        <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:center">Proof</th>
      </tr></thead>
      <tbody>${itcStock.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:40px;color:#a0a8b8;font-size:13px">No ITC stock entries found</td></tr>` : rows}</tbody>
      <tfoot><tr style="background:#f9fafc">
        <td colspan="4" style="padding:11px 10px;font-weight:800;font-size:12px;color:#1a1d23;border-top:2px solid #e8eaf0">TOTAL — ${itcStock.length} item${itcStock.length !== 1 ? "s" : ""}</td>
        <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:12px;color:#4a5568;border-top:2px solid #e8eaf0">₹${fmt(totalPurchase)}</td>
        <td style="border-top:2px solid #e8eaf0"></td>
        <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:13px;color:#3b82f6;border-top:2px solid #e8eaf0">₹${fmt(itcClaimedFromStock)}</td>
        <td colspan="2" style="border-top:2px solid #e8eaf0"></td>
      </tr></tfoot>
    </table>
  </div>
  <div style="margin-top:18px;font-size:10px;color:#a0a8b8;line-height:1.8;border-top:1px solid #e8eaf0;padding-top:12px">
    * Stock ITC = pulled from Products (purchase_gst field, or Purchase Price × GST Rate). Opening/Manual ITC is added separately to total available ITC.
    Net GST Payable = GST Collected − Total ITC Available. Consult your CA before final filing. Generated by ManaBills.
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { showToast("Allow popups to generate PDF", "error"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    showToast("ITC PDF ready — click Print / Save PDF");
  };

  const renderInvoiceList = (type) => {
    const isB2B      = type === "b2b";
    const color      = isB2B ? "#8b5cf6" : "#f59e0b";
    const invoices   = isB2B ? b2bInvoices : b2cInvoices;
    const loadMonth  = isB2B ? b2bLoadMonth : b2cLoadMonth;
    const setMonth   = isB2B ? setB2bLoadMonth : setB2cLoadMonth;
    const loadYear   = isB2B ? b2bLoadYear : b2cLoadYear;
    const setYear    = isB2B ? setB2bLoadYear : setB2cLoadYear;
    const isLoading  = isB2B ? b2bLoading : b2cLoading;

    const totalAmount = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
    const totalGst    = invoices.reduce((s, i) => s + Number(i.gst_amt || 0), 0);

    return (
      <div className="sec fade-up">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"10px",marginBottom:"16px"}}>
          <div className="sec-title" style={{marginBottom:0}}>
            <span className="dot" style={{background:color}}/>
            {isB2B ? "🏢 B2B Invoices" : "🛒 B2C Invoices"}
            <span className="badge" style={{background:isB2B?"#f5f3ff":"#fffbeb",color:isB2B?"#8b5cf6":"#d97706",border:`1px solid ${isB2B?"#e9d5ff":"#fde68a"}`,marginLeft:"6px"}}>
              {invoices.length} invoices
            </span>
          </div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
            <select className="yr-sel" value={loadMonth} onChange={e => setMonth(e.target.value)}>
              <option value="all">All Months</option>
              {MONTH_FULL.map((m, i) => (<option key={i} value={String(i + 1)}>{m}</option>))}
            </select>
            <select className="yr-sel" value={loadYear} onChange={e => setYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="exp-btn" style={{borderColor: isB2B ? "#8b5cf6" : "#f59e0b", color: isB2B ? "#8b5cf6" : "#d97706"}} onClick={() => generatePDF(type)}>
              🖨️CSV PDF
            </button>
          </div>
        </div>

        <div className="chips" style={{marginBottom:"14px"}}>
          <div className="chip">Total: <b>₹{fmt(totalAmount)}</b></div>
          <div className="chip">GST: <b style={{color:"#10b981"}}>₹{fmt(totalGst)}</b></div>
          <div className="chip">Count: <b style={{color}}>{invoices.length}</b></div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{textAlign:"left"}}>#</th>
                <th style={{textAlign:"left"}}>Invoice ID</th>
                <th style={{textAlign:"left"}}>Customer Name</th>
                <th>Total</th>
                <th>GST</th>
                <th style={{textAlign:"center"}}>View</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{textAlign:"center",padding:"40px",color:"#a0a8b8"}}>⏳ Loading…</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:"center",padding:"40px",color:"#a0a8b8"}}>
                  No {isB2B?"B2B":"B2C"} invoices found for this period
                </td></tr>
              ) : invoices.map((inv, i) => (
                <tr key={inv.id}>
                  <td style={{textAlign:"left",color:"#a0a8b8",fontSize:"0.75rem"}}>{i+1}</td>
                  <td style={{textAlign:"left"}}>
                    <span style={{fontWeight:700,color:"#1a1d23",fontSize:"0.82rem"}}>{inv.invoice_id}</span>
                    <div style={{fontSize:"0.68rem",color:"#a0a8b8",marginTop:"2px"}}>{inv.date}</div>
                  </td>
                  <td style={{textAlign:"left"}}>
                    <span style={{fontWeight:600,color:"#1a1d23"}}>{inv.customer_name || "—"}</span>
                    {isB2B && inv.customer_gst && (
                      <div style={{fontSize:"0.68rem",color:"#6366f1",marginTop:"2px"}}>GSTIN: {inv.customer_gst}</div>
                    )}
                    {inv.customer_mobile && (
                      <div style={{fontSize:"0.68rem",color:"#a0a8b8"}}>{inv.customer_mobile}</div>
                    )}
                  </td>
                  <td style={{color:"#1a1d23",fontWeight:700}}>₹{fmt(inv.total)}</td>
                  <td style={{color:"#10b981",fontWeight:600}}>
                    {Number(inv.gst_amt||0) > 0 ? `₹${fmt(inv.gst_amt)}` : "—"}
                  </td>
                  <td style={{textAlign:"center"}}>
                    <button
                      onClick={() => window.open(`/invoice/${inv.invoice_id}${isB2B ? "" : "?owner=1"}`, "_blank")}
                      style={{
                        padding:"5px 12px", background: isB2B ? "#f5f3ff" : "#fffbeb",
                        color: isB2B ? "#8b5cf6" : "#d97706", border: `1px solid ${isB2B?"#e9d5ff":"#fde68a"}`,
                        borderRadius:"8px", fontSize:"0.72rem", fontWeight:700, cursor:"pointer",
                        fontFamily:"inherit", transition:"all .15s",
                      }}
                      onMouseEnter={e => e.target.style.opacity="0.8"}
                      onMouseLeave={e => e.target.style.opacity="1"}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {invoices.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={3}>Total ({invoices.length} invoices)</td>
                  <td>₹{fmt(totalAmount)}</td>
                  <td style={{color:"#10b981"}}>₹{fmt(totalGst)}</td>
                  <td/>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <p style={{fontSize:"0.68rem",color:"#a0a8b8",marginTop:"12px",lineHeight:1.7}}>
          ℹ️ {isB2B
            ? "B2B = invoices with customer GSTIN. These go in GSTR-1 Table 4."
            : "B2C = invoices without customer GSTIN. These go in GSTR-1 Table 7/8."}
        </p>
      </div>
    );
  };

  const renderInvoiceTable = (type) => {
    const isB2B = type==="b2b";
    const color = isB2B ? "#8b5cf6" : "#f59e0b";
    const countKey = isB2B ? "b2b_count" : "b2c_count";
    const selectedMonth = isB2B ? b2bMonth : b2cMonth;
    const setSelectedMonth = isB2B ? setB2bMonth : setB2cMonth;
    const note = isB2B
      ? "B2B invoices go in GSTR-1 Table 4 (taxable outward supplies to registered persons). Keep buyer GSTIN on record."
      : "B2C invoices go in GSTR-1 Table 7/8. No buyer GSTIN required — keep invoice copies as proof.";

    const filteredRows = selectedMonth === "all"
      ? reportData.map((r, i) => ({ ...r, _idx: i }))
      : reportData.map((r, i) => ({ ...r, _idx: i })).filter((_, i) => i === Number(selectedMonth));


    const filteredGst     = filteredRows.reduce((s,r)=>s+Number(r.gst_collected||0),0);
    const filteredTaxable = filteredRows.reduce((s,r)=>s+Number(r.taxable_value||0),0);
    const filteredCount   = filteredRows.reduce((s,r)=>s+(r[countKey]||0),0);
    const filteredItcE    = filteredRows.length > 0 ? (totalITCAvailable * filteredRows.length / reportData.length) : 0;
    const filteredNet     = Math.max(0, filteredGst - filteredItcE);
    const filteredPaid    = filteredRows.filter(r=>r.gst_paid).length;

    return (
      <div className="sec fade-up">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"10px",marginBottom:"14px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
            <div className="sec-title" style={{marginBottom:0}}>
              <span className="dot" style={{background:color}}/>
              {isB2B?"B2B":"B2C"} Invoices — {selectedYear}
              <span className="badge" style={{background:isB2B?"#f5f3ff":"#fffbeb",color:isB2B?"#8b5cf6":"#d97706",border:`1px solid ${isB2B?"#e9d5ff":"#fde68a"}`,marginLeft:"4px"}}>
                {isB2B?"🏢 Business to Business":"🛒 Business to Consumer"}
              </span>
            </div>
            <select className="yr-sel" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{minWidth:"130px"}}>
              <option value="all">All Months</option>
              {MONTH_FULL.map((m,i)=>(<option key={i} value={String(i)}>{m}</option>))}
            </select>
          </div>
          <button className="exp-btn" style={{borderColor: isB2B ? "#8b5cf6" : "#f59e0b", color: isB2B ? "#8b5cf6" : "#d97706"}} onClick={() => generatePDF(type)}>
            🖨️CSV PDF
          </button>
        </div>

        <div className="chips">
          <div className="chip">{isB2B?"B2B":"B2C"} Count: <b style={{color}}>{filteredCount.toLocaleString("en-IN")}</b></div>
          <div className="chip">Taxable: <b>₹{fmt(filteredTaxable)}</b></div>
          <div className="chip">GST: <b style={{color:"#10b981"}}>₹{fmt(filteredGst)}</b></div>
          <div className="chip">ITC Eligible: <b style={{color:"#3b82f6"}}>₹{fmt(filteredItcE)}</b></div>
          <div className="chip">Net Payable: <b style={{color:"#ef4444"}}>₹{fmt(filteredNet)}</b></div>
          <div className="chip">Paid: <b style={{color:"#10b981"}}>{filteredPaid}/{filteredRows.length}</b></div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Month</th><th>{isB2B?"B2B":"B2C"} Count</th><th>Taxable Value</th>
                <th>GST Collected</th><th>ITC Eligible</th><th>Net GST</th><th>GSTR-1 Due</th><th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length===0 ? (
                <tr><td colSpan={8} style={{textAlign:"center",padding:"40px",color:"#a0a8b8"}}>No data for {selectedYear}</td></tr>
              ) : filteredRows.map((r)=>{
                const i     = r._idx;
                const count = r[countKey]||0;
                const gst   = Number(r.gst_collected||0);
                const tax   = Number(r.taxable_value||0);
                const itcE  = totalITCAvailable / (reportData.length || 1);
                const net   = Math.max(0, gst - itcE);
                const empty = count===0;
                return (
                  <tr key={i} className={empty?"empty":""}>
                    <td>
                      <span style={{display:"inline-flex",alignItems:"center",gap:"7px"}}>
                        {MONTH_FULL[i]}
                        {i===curMonth && <span className="badge" style={{background:"#eff6ff",color:"#3b82f6",border:"1px solid #bfdbfe"}}>Current</span>}
                      </span>
                    </td>
                    <td style={{color:empty?"#a0a8b8":color,fontWeight:700}}>{empty?"—":count}</td>
                    <td>{empty?"—":`₹${fmt(tax)}`}</td>
                    <td style={{color:"#10b981",fontWeight:600}}>{empty?"—":`₹${fmt(gst)}`}</td>
                    <td style={{color:"#3b82f6",fontWeight:600}}>{empty?"—":`₹${fmt(itcE)}`}</td>
                    <td style={{color:net>0?"#ef4444":"#10b981",fontWeight:700}}>{empty?"—":`₹${fmt(net)}`}</td>
                    <td style={{color:"#7b8494",fontSize:"0.74rem"}}>{GST_FILING_DATES[i+1]}</td>
                    <td>
                      {empty ? "—" : r.gst_paid ? (
                        <span className="pay-btn paid">✓ Paid {r.gst_paid_date ? `· ${fmtDate(r.gst_paid_date)}` : ""}</span>
                      ) : (
                        <span className="badge" style={{background:"#fef2f2",color:"#ef4444",border:"1px solid #fecaca"}}>Unpaid</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>{selectedMonth==="all" ? `Total ${selectedYear}` : MONTH_FULL[Number(selectedMonth)]}</td>
                <td style={{color}}>{filteredCount}</td>
                <td>₹{fmt(filteredTaxable)}</td>
                <td style={{color:"#10b981"}}>₹{fmt(filteredGst)}</td>
                <td style={{color:"#3b82f6"}}>₹{fmt(filteredItcE)}</td>
                <td style={{color:"#ef4444"}}>₹{fmt(filteredNet)}</td>
                <td>—</td>
                <td style={{color:"#10b981"}}>{filteredPaid}/{filteredRows.length} paid</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p style={{fontSize:"0.68rem",color:"#a0a8b8",marginTop:"12px",lineHeight:1.7}}>ℹ️ {note}</p>
      </div>
    );
  };

  const renderITC = () => {
    return (
      <div className="fade-up">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
          <div className="sc" style={{ flex: "1 1 180px" }}>
            <div className="sc-bar" style={{ background: "#10b981" }} />
            <div className="sc-icon" style={{ background: "#ecfdf5" }}>💚</div>
            <div className="sc-label">Total ITC Available</div>
            <div className="sc-value" style={{ color: "#10b981" }}>{fmtK(totalITCAvailable)}</div>
            <div className="sc-sub" style={{ fontSize: "0.75rem", lineHeight: "1.4" }}>
              📦 Stock + Manual ITC: {fmtK(itcClaimedFromStock)}<br/>
              {openingITC > 0 && <span style={{ color: "#6366f1", fontWeight: 700 }}>✏️ Opening ITC: {fmtK(openingITC)}</span>}
              {openingITC === 0 && <span style={{ color: "#a0a8b8" }}>✏️ Opening ITC: —</span>}
            </div>
          </div>

          <div className="sc" style={{ flex: "1 1 180px" }}>
            <div className="sc-bar" style={{ background: "#3b82f6" }} />
            <div className="sc-icon" style={{ background: "#eff6ff" }}>🏛️</div>
            <div className="sc-label">Total GST Collected</div>
            <div className="sc-value" style={{ color: "#3b82f6" }}>{fmtK(totals.gst)}</div>
            <div className="sc-sub">From all customer invoices · {selectedYear}</div>
          </div>

          <div className="sc" style={{ flex: "1 1 180px" }}>
            <div className="sc-bar" style={{ background: netGstPayable > 0 ? "#ef4444" : "#10b981" }} />
            <div className="sc-icon" style={{ background: netGstPayable > 0 ? "#fef2f2" : "#ecfdf5" }}>
              {netGstPayable > 0 ? "💸" : "✅"}
            </div>
            <div className="sc-label">Net GST Payable</div>
            <div className="sc-value" style={{ color: netGstPayable > 0 ? "#ef4444" : "#10b981" }}>
              {fmtK(netGstPayable)}
            </div>
            <div className="sc-sub">
              {netGstPayable > 0 ? `GST ${fmtK(totals.gst)} − ITC ${fmtK(totalITCAvailable)}` : "Nothing to pay this period 🎉"}
            </div>
          </div>
        </div>

        {/* Opening ITC Balance */}
        <div className="sec" style={{ marginBottom: "14px" }}>
          <div className="sec-title" style={{ marginBottom: "10px" }}>
            <span className="dot" style={{ background: "#6366f1" }} />
            Opening ITC Balance
            <span style={{ fontSize: "0.68rem", fontWeight: 500, color: "#a0a8b8", marginLeft: "6px", textTransform: "none", letterSpacing: 0 }}>
              — Enter ITC balance carried from previous period
            </span>
          </div>

          {carryForwardITC > 0 && (
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.1rem" }}>🔄</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#10b981" }}>Auto Carried Forward from Last Month</div>
                <div style={{ fontSize: "0.7rem", color: "#4a5568" }}>Previous month had extra ITC — automatically added here</div>
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 900, color: "#10b981" }}>+{fmtK(carryForwardITC)}</div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "0 0 200px" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", color: "#4a5568", fontWeight: 700 }}>₹</span>
              <input
                type="number" className="itc-input"
                style={{ paddingLeft: "26px", fontSize: "0.88rem", fontWeight: 700, width: "100%" }}
                placeholder="0.00" value={openingITCInput}
                onChange={e => setOpeningITCInput(e.target.value)}
              />
            </div>
            <button className="itc-add-btn" onClick={() => {
              const val = Number(openingITCInput) || 0;
              if (val <= 0) { showToast("Enter a valid amount to add", "error"); return; }
              addOpeningITC(val, selectedYear).then(success => {
                if (success) { setOpeningITCInput(""); showToast(`Opening ITC ₹${fmt(val)} added ✓`); }
              });
            }}>
              Add
            </button>
            <button className="exp-btn" style={{ background: "#ef4444", color: "#fff" }} onClick={() => {
              const val = Number(openingITCInput) || 0;
              if (val <= 0) { showToast("Enter a valid amount to subtract", "error"); return; }
              if (val > openingITC) { showToast(`Balance is ₹${fmt(openingITC)} only`, "error"); return; }
              subtractOpeningITC(val, selectedYear).then(success => {
                if (success) { setOpeningITCInput(""); showToast(`Opening ITC ₹${fmt(val)} subtracted ✓`); }
              });
            }}>
              Subtract
            </button>
            {openingITC > 0 && (
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6366f1", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "8px", padding: "7px 12px" }}>
                ✓ Opening ITC = ₹{fmt(openingITC)} · Net Payable = {fmtK(netGstPayable)}
              </div>
            )}
          </div>

          {openingITC > 0 && (
            <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "8px", padding: "10px 12px", marginTop: "12px", fontSize: "0.78rem", color: "#4f46e5", lineHeight: "1.5" }}>
              <div style={{ fontWeight: 700, marginBottom: "6px" }}>✏️ Manual ITC Info:</div>
              Your entered amount (₹{fmt(openingITC)}) is added to total available ITC for GST set-off. Use Add/Subtract above to adjust.
            </div>
          )}

          {openingITCHistory.length > 0 && (
            <div style={{ marginTop: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", padding: "14px" }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "10px" }}>📝 Opening ITC History</div>
              {openingITCHistory.map(entry => (
                <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>
                      {entry.entry_type === "add" ? "➕ Added" : "➖ Subtracted"} ₹{fmt(entry.amount)}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{new Date(entry.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                  </div>
                  <div style={{ color: entry.entry_type === "add" ? "#10b981" : "#ef4444", fontWeight: 700, minWidth: "80px", textAlign: "right" }}>
                    {entry.entry_type === "add" ? "+" : "−"}₹{fmt(entry.amount)}
                  </div>
                </div>
              ))}
              <p style={{fontSize:"0.65rem",color:"#a0a8b8",marginTop:"8px"}}>This is a permanent audit log and cannot be edited or deleted.</p>
            </div>
          )}
        </div>

        {/* ITC entries table (stock + manual, combined) */}
        <div className="sec">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
            <div className="sec-title" style={{ marginBottom: 0 }}>
              <span className="dot" style={{ background: "#10b981" }} />
              ITC from Stock / Purchases
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button className="exp-btn" style={{borderColor:"#10b981",color:"#10b981"}} onClick={generateITCPDF}>🖨️CSV PDF</button>
              <button className="itc-add-btn" onClick={() => setShowITCForm(v => !v)}>+ Add Entry</button>
            </div>
          </div>

          {showITCForm && (
            <div className="slide-in" style={{ marginBottom: "14px" }}>
              <div className="itc-form">
                <input className="itc-input" placeholder="Item name *" value={newITC.item} onChange={e => setNewITC(v => ({ ...v, item: e.target.value }))} />
                <input className="itc-input" placeholder="Category" value={newITC.category} onChange={e => setNewITC(v => ({ ...v, category: e.target.value }))} />
                <input className="itc-input" type="number" placeholder="Qty" value={newITC.qty} onChange={e => setNewITC(v => ({ ...v, qty: e.target.value }))} />
                <input className="itc-input" placeholder="Unit (pcs/kg/nos)" value={newITC.unit} onChange={e => setNewITC(v => ({ ...v, unit: e.target.value }))} />
                <input className="itc-input" type="number" placeholder="Purchase Value (₹) *" value={newITC.purchase_value} onChange={e => setNewITC(v => ({ ...v, purchase_value: e.target.value }))} />
                <select className="itc-input" value={newITC.itc_rate} onChange={e => setNewITC(v => ({ ...v, itc_rate: e.target.value }))}>
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "8px", padding: "0 0 14px" }}>
                <button className="itc-add-btn" disabled={savingITCEntry} onClick={addITCEntry}>
                  {savingITCEntry ? "Saving…" : "Save Entry"}
                </button>
                <button className="exp-btn" onClick={() => setShowITCForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>s.no</th><th>Item</th><th style={{ textAlign: "left" }}>Qty</th>
                  <th>Purchase Value</th><th>GST Rate</th><th style={{ textAlign: "left" }}>Source</th>
                  <th>ITC Amount</th><th style={{ textAlign: "center" }}>Proof</th><th style={{ textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {itcStock.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "#a0a8b8" }}>No stock entries with GST found</td></tr>
                ) : itcStock.map((r, i) => (
                  <tr key={r.id || i}>
                    <td style={{ textAlign: "left", color: "#a0a8b8", fontWeight: 600 }}>{i + 1}</td>
                    <td>{r.item}</td>
                    <td style={{ textAlign: "left", color: "#4a5568" }}>{r.qty} {r.unit}</td>
                    <td>₹{fmt(r.purchase_value)}</td>
                    <td style={{ color: r.itc_rate > 0 ? "#10b981" : "#ef4444" }}>{r.itc_rate}%</td>
                    <td style={{ textAlign: "left" }}>
                      <span className="badge" style={{
                        background: r.source === "stock" ? "#eff6ff" : "#f5f3ff",
                        color: r.source === "stock" ? "#3b82f6" : "#8b5cf6",
                        border: `1px solid ${r.source === "stock" ? "#bfdbfe" : "#e9d5ff"}`,
                      }}>
                        {r.source === "stock" ? "📦 Stock" : "✏️ Manual"}
                      </span>
                    </td>
                    <td style={{ color: r.itc_amount > 0 ? "#3b82f6" : "#a0a8b8", fontWeight: 700 }}>
                      {r.itc_amount > 0 ? `₹${fmt(r.itc_amount)}` : "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {r.source !== "manual" ? (
                        <span style={{fontSize:"0.68rem",color:"#a0a8b8"}}>—</span>
                      ) : r.proof ? (
                        <div className="proof-chip" style={{ justifyContent: "center" }}>
                          <span>📎</span>
                          <span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.65rem" }}>{r.proof}</span>
                          <button onClick={() => handleProofUpload(r.id, null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontWeight: 700, fontSize: "0.8rem" }}>×</button>
                        </div>
                      ) : (
                        <button className="exp-btn" style={{ fontSize: "0.68rem", padding: "4px 10px" }} onClick={() => setProofModal({ id: r.id, item: r.item, category: r.category })}>
                          📎 Upload
                        </button>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {r.source === "manual" && (
                        <button
                          onClick={() => deleteITCEntry(r.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontWeight: 700, fontSize: "0.85rem" }}
                          title="Delete entry"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td/>
                  <td>Total ({itcStock.length} items)</td>
                  <td /><td />
                  <td>₹{fmt(itcStock.reduce((s, r) => s + r.purchase_value, 0))}</td>
                  <td>—</td>
                  <td style={{ color: "#10b981" }}>₹{fmt(itcClaimedFromStock)}</td>
                  <td style={{ color: "#10b981" }}>{itcStock.filter(r => r.proof).length}/{itcStock.length} proof</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="note-box green">
          <div className="note-title" style={{ color: "#10b981" }}>💡ManaBills How ITC is calculated</div>
          <div className="note-text">
            • <b>Stock ITC</b> = pulled automatically from your Products (purchase_gst field, or Purchase Price × GST Rate) — read-only.<br />
            • <b>Manual entries</b> via "+ Add Entry" are saved to your account and persist across devices/sessions, with proof attachments stored securely.<br />
            • <b>Opening ITC</b> = leftover from previous month — enter manually or auto-filled after Mark as Paid.<br />
            • <b>Total ITC Available</b> = Stock + Manual ITC + Opening ITC.<br />
            • <b>Net GST Payable</b> = GST Collected − Total ITC. Share with your CA before filing.
          </div>
        </div>
      </div>
    );
  };

  const renderPayments = () => (
    <div className="fade-up">
      <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginBottom:"14px"}}>
        <StatCard icon="✅" label="Months Paid"   value={`${totals.paidMonths}/12`} sub="GST paid months" color="#10b981" bg="#ecfdf5"/>
        <StatCard icon="⏳" label="Pending Months" value={`${12-totals.paidMonths}`}  sub="Still unpaid"   color="#f59e0b" bg="#fffbeb"/>
        <StatCard icon="💸" label="Total Due"      value={fmtK(totals.dueAmount)}     sub="Across pending months" color="#ef4444" bg="#fef2f2"/>
        <StatCard icon="🏛️" label="Total GST"      value={fmtK(totals.gst)}           sub="Output collected" color="#3b82f6" bg="#eff6ff"/>
      </div>

      {totals.dueAmount > 0 && (
        <div className="note-box red" style={{marginBottom:"14px"}}>
          <div className="note-title" style={{color:"#ef4444"}}>🔴 Pending Payment Alert</div>
          <div className="note-text">
            You have <b>₹{fmt(totals.dueAmount)}</b> in pending GST payments across {12-totals.paidMonths} month(s).
            Late payment attracts interest @ 18% p.a. under Section 50 of CGST Act. File GSTR-3B on time to avoid penalties.
          </div>
        </div>
      )}

      <div className="sec">
        <div className="sec-title"><span className="dot" style={{background:"#3b82f6"}}/>Monthly Payment Status — {selectedYear}</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Month</th><th>GST Collected</th><th>ITC Claimed</th><th>Net Payable</th>
                <th>Due Date</th><th style={{textAlign:"center"}}>Status</th><th style={{textAlign:"center"}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((r,i)=>{
                const gst  = Number(r.gst_collected||0);
                const itcC = totalITCAvailable / (reportData.length || 1);
                const net  = Math.max(0,gst-itcC);
                const empty= (r.invoice_count||0)===0;
                return (
                  <tr key={i} className={empty?"empty":""}>
                    <td>
                      <span style={{display:"inline-flex",alignItems:"center",gap:"7px"}}>
                        {MONTH_FULL[i]}
                        {i===curMonth && <span className="badge" style={{background:"#eff6ff",color:"#3b82f6",border:"1px solid #bfdbfe"}}>Current</span>}
                      </span>
                    </td>
                    <td style={{color:"#10b981"}}>{empty?"—":`₹${fmt(gst)}`}</td>
                    <td style={{color:"#3b82f6"}}>{empty?"—":`₹${fmt(itcC)}`}</td>
                    <td style={{color:net>0?"#ef4444":"#10b981",fontWeight:700}}>{empty?"—":`₹${fmt(net)}`}</td>
                    <td style={{color:"#7b8494",fontSize:"0.74rem"}}>{empty ? "—" : `20th ${MONTH_LABELS[i===11?0:i+1]}`}</td>
                    <td style={{textAlign:"center"}}>
                      {empty ? "—" : r.gst_paid ? (
                        <span className="badge" style={{background:"#ecfdf5",color:"#10b981",border:"1px solid #a7f3d0"}}>
                          ✓ Paid · {fmtDate(r.gst_paid_date)}
                        </span>
                      ) : (
                        <span className="badge" style={{background:"#fef2f2",color:"#ef4444",border:"1px solid #fecaca"}}>Unpaid</span>
                      )}
                    </td>
                    <td style={{textAlign:"center"}}>
                      {!empty && !r.gst_paid && i !== curMonth && (
                        <button className="pay-btn unpaid" onClick={()=>setPayingMonth(i)}>Mark as Paid</button>
                      )}
                      {(!empty && r.gst_paid) || (!empty && !r.gst_paid && i === curMonth) ? (
                        <span style={{color:"#a0a8b8",fontSize:"0.72rem"}}>—</span>
                      ) : null}
                      {empty && <span style={{color:"#a0a8b8",fontSize:"0.72rem"}}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>Summary</td>
                <td style={{color:"#10b981"}}>₹{fmt(totals.gst)}</td>
                <td style={{color:"#3b82f6"}}>₹{fmt(totalITCAvailable)}</td>
                <td style={{color:"#ef4444"}}>₹{fmt(netGstPayable)}</td>
                <td>—</td>
                <td style={{textAlign:"center",color:"#10b981"}}>{totals.paidMonths} paid</td>
                <td/>
              </tr>
            </tfoot>
          </table>
        </div>
        <p style={{fontSize:"0.68rem",color:"#a0a8b8",marginTop:"12px",lineHeight:1.7}}>
          ℹ️ GSTR-3B (payment) is due by 20th of following month. Late filing penalty: ₹50/day (₹20/day for nil return). Interest @ 18% p.a. on delayed tax payment.
        </p>
      </div>
    </div>
  );

  const renderSummary = () => (
    <>
      {totals.dueAmount > 0 && (
        <div className="note-box red" style={{marginBottom:"14px"}}>
          <div className="note-title" style={{color:"#ef4444"}}>⚠️ GST Payment Pending</div>
          <div className="note-text">
            <b>₹{fmt(totals.dueAmount)}</b> is pending across <b>{12-totals.paidMonths}</b> month(s).
            Go to the <b>Payments</b> tab to mark them as paid.
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginBottom:"14px"}}>
        <StatCard icon="🧾" label="Total Invoices"  value={totals.invoices.toLocaleString("en-IN")} sub={`All · ${selectedYear}`}  color="#3b82f6" bg="#eff6ff"/>
        <StatCard icon="🏢" label="B2B Invoices"    value={totals.b2b.toLocaleString("en-IN")} sub={`${totals.invoices>0?((totals.b2b/totals.invoices)*100).toFixed(0):0}% of total`} color="#8b5cf6" bg="#f5f3ff"/>
        <StatCard icon="🛒" label="B2C Invoices"    value={totals.b2c.toLocaleString("en-IN")} sub={`${totals.invoices>0?((totals.b2c/totals.invoices)*100).toFixed(0):0}% of total`} color="#f59e0b" bg="#fffbeb"/>
        <StatCard icon="🏛️" label="GST Collected"   value={fmtK(totals.gst)} sub={`₹${fmt(totals.gst)}`} color="#10b981" bg="#ecfdf5"/>
        <StatCard icon="📅" label="This Month GST"  value={fmtK(Number(reportData[curMonth]?.gst_collected || 0))} sub={`${MONTH_FULL[curMonth]} ${selectedYear}`} color="#f59e0b" bg="#fffbeb"/>
        <StatCard icon="💚" label="ITC Available" value={fmtK(totalITCAvailable)} sub={`Stock + Manual + Opening ITC`} color="#10b981" bg="#ecfdf5"/>
        <StatCard icon="💰" label="Net GST Payable" value={fmtK(netGstPayable)} sub={`After ITC set-off`} color="#ef4444" bg="#fef2f2"/>
        <StatCard icon="✅" label="Paid Months"     value={`${totals.paidMonths}/12`} sub={`${12-totals.paidMonths} pending`} color="#10b981" bg="#ecfdf5"/>
      </div>

      <div className="sec fade-up">
        <div className="sec-title"><span className="dot" style={{background:"#3b82f6"}}/>Monthly Overview — {selectedYear}</div>
        <div className="tbl-wrap" style={{marginBottom:"14px"}}>
          <table className="tbl">
            <thead>
              <tr><th>Month</th><th>Invoices</th><th>B2B</th><th>B2C</th><th>GST Collected</th><th>ITC Claimed</th><th>Net GST</th><th>Status</th></tr>
            </thead>
            <tbody>
              {reportData.map((r,i)=>{
                const gst   = Number(r.gst_collected||0);
                const itc   = totalITCAvailable / (reportData.length || 1);
                const empty = (r.invoice_count||0)===0;
                const net   = Math.max(0, gst - itc);
                return (
                  <tr key={i} className={empty?"empty":""}>
                    <td>{MONTH_FULL[i]}</td>
                    <td>{r.invoice_count||0}</td>
                    <td>{r.b2b_count||0}</td>
                    <td>{r.b2c_count||0}</td>
                    <td>{empty?"—":`₹${fmt(gst)}`}</td>
                    <td>{empty?"—":`₹${fmt(itc)}`}</td>
                    <td style={{color:net>0?"#ef4444":"#10b981",fontWeight:700}}>{empty?"—":`₹${fmt(net)}`}</td>
                    <td>{r.gst_paid?"Paid":"Unpaid"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td><td>{totals.invoices}</td><td>{totals.b2b}</td><td>{totals.b2c}</td>
                <td>₹{fmt(totals.gst)}</td><td>₹{fmt(totalITCAvailable)}</td><td>₹{fmt(netGstPayable)}</td>
                <td>{totals.paidMonths}/12 paid</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="sec fade-up">
        <div className="sec-title"><span className="dot" style={{background:"#3b82f6"}}/>Half-Yearly Summary — {selectedYear}</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px"}}>
          {[
            {label:"H1 · Jan – Jun",d:h1,color:"#3b82f6",bg:"#eff6ff"},
            {label:"H2 · Jul – Dec",d:h2,color:"#10b981",bg:"#ecfdf5"},
          ].map(({label,d,color,bg})=>(
            <div key={label} className="half-card" style={{background:bg,borderColor:color}}>
              <div style={{fontSize:"0.68rem",fontWeight:700,color:"#7b8494",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"14px"}}>{label}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0"}}>
                {[
                  {l:"Invoice Total",v:fmtK(d.total)},
                  {l:"GST",          v:fmtK(d.gst),   c:color},
                  {l:"Invoices",     v:d.inv},
                  {l:"B2B",          v:d.b2b,          c:"#8b5cf6"},
                  {l:"B2C",          v:d.b2c,          c:"#f59e0b"},
                  {l:"Paid Months",  v:`${d.paid}/6`,   c:"#10b981"},
                ].map(({l,v,c})=>(
                  <div key={l} style={{flex:"1 1 80px",padding:"0 16px 0 0",marginBottom:"8px"}}>
                    <div style={{fontSize:"1.05rem",fontWeight:800,color:c||"#1a1d23"}}>{v}</div>
                    <div style={{fontSize:"0.68rem",color:"#7b8494",marginTop:"2px"}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sec fade-up">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
          <div className="sec-title" style={{marginBottom:0}}>
            <span className="dot" style={{background:"#3b82f6"}}/>Monthly GST Overview — {selectedYear}
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <select className="yr-sel" value={chartType} onChange={e=>setChartType(e.target.value)}>
              <option value="bar">Bar</option>
              <option value="line">Line</option>
            </select>
          </div>
        </div>
        <GSTChart reportData={reportData} chartType={chartType} selectedYear={selectedYear} totalITCAvailable={totalITCAvailable}/>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="gr">
        {toast && (
          <div className="toast" style={{background:toast.type==="error"?"#ef4444":"#22c55e"}}>{toast.msg}</div>
        )}

        {payingMonth !== null && (
          <div className="modal-bg" onClick={()=>setPayingMonth(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <button className="modal-close" onClick={()=>setPayingMonth(null)}>×</button>
              <div className="modal-title">Confirm GST Payment</div>
              <div className="modal-sub">{MONTH_FULL[payingMonth]} {selectedYear}</div>
              <div style={{background:"#f9fafc",borderRadius:"10px",padding:"14px",marginBottom:"18px",border:"1px solid #e8eaf0"}}>
                {[
                  {l:"GST Collected", v:`₹${fmt(reportData[payingMonth]?.gst_collected||0)}`},
                  {l:"ITC Available (Stock + Manual + Opening)", v:`₹${fmt(totalITCAvailable)}`},
                  {l:"Net Payable",   v:`₹${fmt(Math.max(0,(reportData[payingMonth]?.gst_collected||0)-totalITCAvailable))}`, bold:true, color:"#ef4444"},
                ].map(({l,v,bold,color})=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f0f2f7",fontSize:"0.82rem"}}>
                    <span style={{color:"#7b8494",fontWeight:600}}>{l}</span>
                    <span style={{fontWeight:bold?800:700,color:color||"#1a1d23"}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:"10px"}}>
                <button className="itc-add-btn" style={{flex:1}} disabled={confirmingPaid} onClick={()=>confirmPaid(payingMonth)}>
                  {confirmingPaid ? "Saving…" : "✓ Confirm Paid"}
                </button>
                <button className="exp-btn" style={{flex:1}} onClick={()=>setPayingMonth(null)}>Cancel</button>
              </div>
              <p style={{fontSize:"0.67rem",color:"#a0a8b8",marginTop:"12px",textAlign:"center"}}>
                This records {MONTH_FULL[payingMonth]} GST as paid on {new Date().toLocaleDateString("en-IN")}.
              </p>
            </div>
          </div>
        )}

        {proofModal !== null && (
          <div className="modal-bg" onClick={()=>!proofUploading && setProofModal(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <button className="modal-close" onClick={()=>setProofModal(null)} disabled={proofUploading}>×</button>
              <div className="modal-title">Upload Proof Document</div>
              <div className="modal-sub">{proofModal?.item} — {proofModal?.category}</div>
              <ProofUpload
                existing={null}
                uploading={proofUploading}
                disabled={proofUploading}
                onUpload={(f)=>handleProofUpload(proofModal.id, f)}
              />
              <div className="note-box blue" style={{marginTop:"14px"}}>
                <div className="note-title" style={{color:"#3b82f6"}}>📋 Accepted Proofs</div>
                <div className="note-text">
                  Tax invoice, Bill of supply, Debit note, Import document (Bill of Entry).
                  Must have supplier GSTIN, HSN/SAC code, and GST breakup.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`gr-header ${isMobile?"mob":""}`}>
          <div style={{
            display:"flex", alignItems:isMobile?"flex-start":"center", justifyContent:"space-between",
            flexDirection:isMobile?"column":"row", gap:isMobile?"10px":"0", marginBottom:"2px",
          }}>
            <div>
              <h2 style={{fontSize:isMobile?"1.15rem":"1.35rem",fontWeight:800,letterSpacing:"-.02em",color:"#1a1d23"}}>GST Reports</h2>
              <p style={{fontSize:"0.72rem",color:"#7b8494",marginTop:"2px"}}>
                B2B · B2C · ITC · Payments · {selectedYear}
                {totals.paidMonths > 0 && <span style={{marginLeft:"8px",color:"#10b981",fontWeight:700}}>· {totals.paidMonths} months paid</span>}
                {totals.dueAmount > 0  && <span style={{marginLeft:"8px",color:"#ef4444",fontWeight:700}}>· ₹{fmtK(totals.dueAmount)} due</span>}
              </p>
            </div>
            <select className="yr-sel" value={selectedYear} onChange={e=>setSelectedYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="tab-bar">
            {[
              {key:"summary",  label:"📊 Summary"},
              {key:"b2b",      label:"🏢 B2B"},
              {key:"b2c",      label:"🛒 B2C"},
              {key:"itc",      label:"💚 ITC"},
              {key:"payments", label:"💳 Payments"},
            ].map(t=>(
              <button key={t.key} className={`tab-btn ${activeTab===t.key?"active":""} ${isMobile?"mob":""}`} onClick={()=>setActiveTab(t.key)}>
                {t.label}
                {t.key==="payments" && totals.dueAmount>0 && (
                  <span style={{marginLeft:"5px",background:"#ef4444",color:"#fff",borderRadius:"100px",padding:"1px 5px",fontSize:"0.58rem",fontWeight:700}}>
                    {12-totals.paidMonths}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={`gr-body ${isMobile?"mob":""}`}>
          {loading ? (
            <div style={{padding:"60px",textAlign:"center",color:"#7b8494",fontSize:"0.85rem"}}>
              <div style={{fontSize:"2rem",marginBottom:"12px"}}>⏳</div>
              Loading GST data…
            </div>
          ) : totals.invoices===0 && activeTab!=="itc" ? (
            <div className="sec" style={{textAlign:"center",padding:"60px 24px"}}>
              <div style={{fontSize:"2.5rem",marginBottom:"12px"}}>🧾</div>
              <div style={{fontWeight:700,fontSize:"1rem",color:"#1a1d23",marginBottom:"6px"}}>No GST Invoices for {selectedYear}</div>
              <div style={{color:"#7b8494",fontSize:"0.8rem"}}>Enable GST while creating invoices to see reports here.</div>
            </div>
          ) : (
            <>
              {activeTab==="summary"  && renderSummary()}
              {activeTab==="b2b" && (<>{renderInvoiceTable("b2b")}{renderInvoiceList("b2b")}</>)}
              {activeTab==="b2c" && (<>{renderInvoiceTable("b2c")}{renderInvoiceList("b2c")}</>)}
              {activeTab==="itc"      && renderITC()}
              {activeTab==="payments" && renderPayments()}
            </>
          )}

          <div style={{fontSize:"0.65rem",color:"#c4c9d4",marginTop:"20px",lineHeight:1.7,borderTop:"1px solid #e8eaf0",paddingTop:"14px"}}>
            * Only GST-enabled invoices are included. CGST/SGST split assumes intra-state (50/50). For inter-state, full amount is IGST.
            B2B figures assume buyer has a valid GSTIN. ITC is subject to GSTR-2B reconciliation. Consult your CA before final filing.
          </div>
        </div>
      </div>
    </>
  );
};

export default GstReports;