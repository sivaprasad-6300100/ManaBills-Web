import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { authAxios } from "../../services/api";
import { getShopProfile } from "../../services/businessService";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
// import { getGstReports } from "../../services/businessService";

// ─── MOCK DATA (replace with real API calls) ──────────────────
const mockGetGstReports = async (year) => {
  await new Promise(r => setTimeout(r, 600));
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const hasData = i <= now.getMonth() || year < now.getFullYear();
    const base = hasData ? Math.random() * 500000 + 50000 : 0;
    return {
      month: i + 1,
      invoice_count: hasData ? Math.floor(Math.random() * 80 + 10) : 0,
      b2b_count:     hasData ? Math.floor(Math.random() * 50 + 5)  : 0,
      b2c_count:     hasData ? Math.floor(Math.random() * 30 + 5)  : 0,
      taxable_value: base,
      gst_collected: base * 0.18,
      total_value:   base * 1.18,
      // ITC from purchases
      itc_eligible:  hasData ? base * 0.12 : 0,
      itc_claimed:   hasData ? base * 0.10 : 0,
      itc_pending:   hasData ? base * 0.02 : 0,
      // Payment status
      gst_paid:      hasData ? (Math.random() > 0.4) : false,
      gst_paid_date: hasData && Math.random() > 0.4 ? `${year}-0${i+1}-15` : null,
      gst_due_amount: hasData ? base * 0.18 * 0.3 : 0,
    };
  });
};

const mockGetITCStock = async () => {
  await new Promise(r => setTimeout(r, 400));
  return [
    { item: "Office Supplies",     category: "Stationery",    qty: 120, unit: "pcs",  purchase_value: 24000,  itc_rate: 12, itc_amount: 2880,  status: "eligible",   proof: null },
    { item: "Raw Material A",      category: "Manufacturing", qty: 500, unit: "kg",   purchase_value: 185000, itc_rate: 18, itc_amount: 33300, status: "eligible",   proof: null },
    { item: "Laptop - Dell",       category: "Capital Goods", qty: 3,   unit: "nos",  purchase_value: 180000, itc_rate: 18, itc_amount: 32400, status: "claimed",    proof: "invoice_laptop.pdf" },
    { item: "Packaging Material",  category: "Consumables",   qty: 800, unit: "rolls",purchase_value: 32000,  itc_rate: 12, itc_amount: 3840,  status: "eligible",   proof: null },
    { item: "Machine Parts",       category: "Capital Goods", qty: 10,  unit: "nos",  purchase_value: 95000,  itc_rate: 18, itc_amount: 17100, status: "pending",    proof: null },
    { item: "Fuel (Non-eligible)", category: "Fuel",          qty: 200, unit: "ltrs", purchase_value: 18000,  itc_rate: 0,  itc_amount: 0,     status: "blocked",    proof: null },
    { item: "Software License",    category: "IT Services",   qty: 1,   unit: "yr",   purchase_value: 60000,  itc_rate: 18, itc_amount: 10800, status: "claimed",    proof: "invoice_sw.pdf" },
    { item: "Raw Material B",      category: "Manufacturing", qty: 300, unit: "kg",   purchase_value: 75000,  itc_rate: 18, itc_amount: 13500, status: "pending",    proof: null },
  ];
};

// ─── CONSTANTS ────────────────────────────────────────────────
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const GST_FILING_DATES = {
  1:"11 Feb",2:"11 Mar",3:"11 Apr",4:"11 May",5:"11 Jun",6:"11 Jul",
  7:"11 Aug",8:"11 Sep",9:"11 Oct",10:"11 Nov",11:"11 Dec",12:"11 Jan",
};

const ITC_STATUS_CONFIG = {
  eligible: { label:"Eligible",  color:"#10b981", bg:"#ecfdf5", border:"#a7f3d0" },
  claimed:  { label:"Claimed",   color:"#3b82f6", bg:"#eff6ff", border:"#bfdbfe" },
  pending:  { label:"Pending",   color:"#f59e0b", bg:"#fffbeb", border:"#fde68a" },
  blocked:  { label:"Blocked",   color:"#ef4444", bg:"#fef2f2", border:"#fecaca" },
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

  /* Header */
  .gr-header { background:#fff; border-bottom:1px solid #e8eaf0; padding:20px 28px 0; position:sticky; top:0; z-index:50; box-shadow:0 2px 8px rgba(0,0,0,.04); }
  .gr-header.mob { padding:14px 14px 0; }
  .gr-body { padding:22px 28px; max-width:1280px; }
  .gr-body.mob { padding:14px; }

  /* Stat card */
  .sc { background:#fff; border:1px solid #e8eaf0; border-radius:14px; padding:18px 20px; flex:1 1 160px; min-width:0; position:relative; overflow:hidden; transition:box-shadow .2s,transform .2s; cursor:default; }
  .sc:hover { box-shadow:0 6px 20px rgba(0,0,0,.08); transform:translateY(-2px); }
  .sc-bar { position:absolute; top:0; left:0; right:0; height:3px; border-radius:14px 14px 0 0; }
  .sc-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1rem; margin-bottom:11px; }
  .sc-label { font-size:0.66rem; font-weight:700; color:#7b8494; text-transform:uppercase; letter-spacing:.07em; margin-bottom:5px; }
  .sc-value { font-size:1.42rem; font-weight:800; color:#1a1d23; line-height:1; margin-bottom:3px; }
  .sc-sub { font-size:0.69rem; color:#a0a8b8; }
  .sc-delta { font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:100px; margin-top:5px; display:inline-block; }

  /* Section */
  .sec { background:#fff; border:1px solid #e8eaf0; border-radius:14px; padding:20px 22px; margin-bottom:14px; }
  .sec-title { font-size:0.69rem; font-weight:700; color:#7b8494; text-transform:uppercase; letter-spacing:.07em; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  .dot { width:6px; height:6px; border-radius:50%; display:inline-block; flex-shrink:0; }

  /* Controls */
  .yr-sel { background:#f5f6fa; border:1px solid #e8eaf0; color:#1a1d23; border-radius:10px; padding:8px 12px; font-size:0.78rem; font-weight:600; font-family:inherit; cursor:pointer; outline:none; }
  .period-wrap { display:flex; background:#f5f6fa; border:1px solid #e8eaf0; border-radius:10px; overflow:hidden; }
  .period-btn { padding:8px 15px; border:none; background:transparent; font-family:inherit; font-size:0.76rem; font-weight:600; color:#7b8494; cursor:pointer; transition:all .15s; }
  .period-btn.active { background:#fff; color:#1a1d23; box-shadow:0 1px 4px rgba(0,0,0,.08); }
  .exp-btn { padding:8px 14px; border:1px solid #e8eaf0; border-radius:10px; background:#fff; font-family:inherit; font-size:0.76rem; font-weight:600; color:#7b8494; cursor:pointer; transition:all .15s; }
  .exp-btn:hover { border-color:#3b82f6; color:#3b82f6; }
  .ref-btn { padding:8px 12px; border:1px solid #e8eaf0; border-radius:10px; background:#fff; font-family:inherit; font-size:0.76rem; font-weight:600; color:#7b8494; cursor:pointer; transition:all .15s; }
  .ref-btn:hover { border-color:#10b981; color:#10b981; }
  .ref-btn.spin svg { animation:spin 1s linear infinite; }

  /* Tabs */
  .tab-bar { display:flex; border-bottom:1px solid #e8eaf0; margin-top:14px; overflow-x:auto; }
  .tab-bar::-webkit-scrollbar { display:none; }
  .tab-btn { padding:10px 18px; border:none; background:none; font-family:inherit; font-size:0.78rem; font-weight:600; color:#7b8494; border-bottom:2px solid transparent; cursor:pointer; transition:all .15s; white-space:nowrap; }
  .tab-btn.mob { padding:9px 12px; font-size:0.73rem; }
  .tab-btn:hover { color:#4a5568; }
  .tab-btn.active { color:#1a1d23; border-bottom-color:#3b82f6; }

  /* Table */
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

  /* Badge */
  .badge { display:inline-flex; align-items:center; padding:2px 7px; border-radius:6px; font-size:0.62rem; font-weight:700; letter-spacing:.03em; }

  /* Chips */
  .chips { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
  .chip { background:#f5f6fa; border:1px solid #e8eaf0; border-radius:8px; padding:5px 12px; font-size:0.74rem; font-weight:600; color:#4a5568; }
  .chip b { color:#1a1d23; }

  /* Month grid */
  .month-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:8px; }
  .month-cell { border-radius:10px; padding:12px 13px; border:1px solid #e8eaf0; background:#f9fafc; transition:box-shadow .15s; cursor:default; }
  .month-cell.now { background:#eff6ff; border-color:#bfdbfe; }
  .month-cell:hover { box-shadow:0 2px 8px rgba(0,0,0,.06); }

  /* Half-year card */
  .half-card { border-radius:12px; padding:18px 20px; border-left:4px solid; }

  /* ITC bar */
  .itc-bar-wrap { height:7px; background:#f0f2f7; border-radius:100px; overflow:hidden; margin-top:5px; }
  .itc-bar-fill { height:100%; border-radius:100px; transition:width .6s cubic-bezier(.4,0,.2,1); }

  /* Paid button */
  .pay-btn { padding:5px 12px; border-radius:8px; font-family:inherit; font-size:0.7rem; font-weight:700; border:none; cursor:pointer; transition:all .15s; white-space:nowrap; }
  .pay-btn.unpaid { background:#fef2f2; color:#ef4444; border:1px solid #fecaca; }
  .pay-btn.unpaid:hover { background:#ef4444; color:#fff; }
  .pay-btn.paid { background:#ecfdf5; color:#10b981; border:1px solid #a7f3d0; cursor:default; }

  /* Proof upload zone */
  .proof-zone { border:1.5px dashed #e8eaf0; border-radius:10px; padding:20px; text-align:center; cursor:pointer; transition:all .2s; }
  .proof-zone:hover { border-color:#3b82f6; background:#f8fbff; }
  .proof-zone.dragging { border-color:#3b82f6; background:#eff6ff; }
  .proof-chip { display:inline-flex; align-items:center; gap:6px; background:#f5f6fa; border:1px solid #e8eaf0; border-radius:8px; padding:5px 10px; font-size:0.72rem; font-weight:600; color:#4a5568; }

  /* ITC Manual Entry */
  .itc-form { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; padding:16px; background:#f9fafc; border-radius:10px; border:1px solid #e8eaf0; margin-bottom:14px; }
  .itc-input { padding:8px 12px; border:1px solid #e8eaf0; border-radius:8px; font-family:inherit; font-size:0.78rem; background:#fff; color:#1a1d23; outline:none; transition:border .15s; }
  .itc-input:focus { border-color:#3b82f6; }
  .itc-add-btn { padding:9px 18px; background:#3b82f6; color:#fff; border:none; border-radius:8px; font-family:inherit; font-size:0.78rem; font-weight:700; cursor:pointer; transition:background .15s; }
  .itc-add-btn:hover { background:#2563eb; }

  /* Modal */
  .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px; }
  .modal { background:#fff; border-radius:16px; padding:24px; max-width:480px; width:100%; box-shadow:0 24px 60px rgba(0,0,0,.18); }
  .modal-title { font-size:1rem; font-weight:800; color:#1a1d23; margin-bottom:4px; }
  .modal-sub { font-size:0.73rem; color:#7b8494; margin-bottom:20px; }
  .modal-close { float:right; background:none; border:none; font-size:1.2rem; cursor:pointer; color:#7b8494; }

  /* Toast */
  .toast { position:fixed; top:18px; left:50%; transform:translateX(-50%); z-index:9999; padding:10px 22px; border-radius:100px; font-weight:700; font-size:0.78rem; white-space:nowrap; color:#fff; box-shadow:0 8px 24px rgba(0,0,0,.15); }

  /* Progress ring */
  .ring-wrap { position:relative; display:inline-flex; align-items:center; justify-content:center; }
  .ring-label { position:absolute; font-size:0.7rem; font-weight:800; color:#1a1d23; text-align:center; }

  /* Note box */
  .note-box { background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px 16px; margin-bottom:14px; }
  .note-box.blue { background:#eff6ff; border-color:#bfdbfe; }
  .note-box.green { background:#ecfdf5; border-color:#a7f3d0; }
  .note-box.red { background:#fef2f2; border-color:#fecaca; }
  .note-title { font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; }
  .note-text { font-size:0.73rem; line-height:1.7; color:#4a5568; }

  /* Reconcile table */
  .rec-row { display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #f0f2f7; font-size:0.8rem; }
  .rec-row:last-child { border-bottom:none; }
  .rec-label { font-weight:600; color:#1a1d23; }
  .rec-val { font-weight:700; }

  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation:fadeUp .28s ease forwards; }
  .slide-in { animation:slideIn .22s ease forwards; }

  /* Scrollbar */
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

// ─── ITC DONUT ────────────────────────────────────────────────
const DonutRing = ({ pct, color, size=72 }) => {
  const r = 28; const circ = 2 * Math.PI * r;
  const dash = (pct/100)*circ;
  return (
    <div className="ring-wrap" style={{width:size,height:size}}>
      <svg width={size} height={size} viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f0f2f7" strokeWidth="8"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 36 36)" style={{transition:"stroke-dasharray .7s"}}/>
      </svg>
      <div className="ring-label">{pct}%</div>
    </div>
  );
};

// ─── PROOF UPLOAD ─────────────────────────────────────────────
const ProofUpload = ({ onUpload, existing }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const handle = (files) => { if(files[0]) onUpload(files[0]); };
  return (
    <div>
      {existing ? (
        <div className="proof-chip">
          <span>📎</span>
          <span style={{maxWidth:160,overflow:"hidden",textOverflow:"ellipsis"}}>{existing}</span>
          <button onClick={()=>onUpload(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontWeight:700,fontSize:"0.8rem"}}>×</button>
        </div>
      ) : (
        <div
          className={`proof-zone ${dragging?"dragging":""}`}
          style={{padding:"12px"}}
          onClick={()=>inputRef.current.click()}
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);handle(e.dataTransfer.files);}}
        >
          <div style={{fontSize:"1.2rem",marginBottom:"4px"}}>📎</div>
          <div style={{fontSize:"0.7rem",color:"#7b8494",fontWeight:600}}>Upload Proof</div>
          <div style={{fontSize:"0.62rem",color:"#a0a8b8"}}>PDF, JPG, PNG</div>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}}
            onChange={e=>handle(e.target.files)}/>
        </div>
      )}
    </div>
  );
};


const GSTChart = ({ reportData, chartType }) => {
  const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const data = reportData.map((r, i) => ({
    month: MONTH_SHORT[i],
    "GST Collected": Number(r.gst_collected || 0),
    "ITC Available": Number(r.itc_eligible || 0),
    "Net Payable":   Math.max(0, Number(r.gst_collected||0) - Number(r.itc_eligible||0)),
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
  const [itcStock,     setItcStock]     = useState([]);
  const [view,         setView]         = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [years,        setYears]        = useState([]);
  const [activeTab,    setActiveTab]    = useState("summary");
  const [toast,        setToast]        = useState(null);
  const [payingMonth,  setPayingMonth]  = useState(null);  // modal
  const [proofModal,   setProofModal]   = useState(null);  // {rowIdx}
  const [itcFilter,    setItcFilter]    = useState("all");
  const [showITCForm,  setShowITCForm]  = useState(false);
  const [newITC,       setNewITC]       = useState({ item:"", category:"", qty:"", unit:"", purchase_value:"", itc_rate:"18" });
  const [openingITC,      setOpeningITC]      = useState(0);
  const [openingITCInput, setOpeningITCInput] = useState("");
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

  // Load opening ITC balance from backend
  const loadOpeningITC = async (year) => {
    try {
      const response = await authAxios.get("business/itc-opening-balance/", { 
        params: { year } 
      });
      const itcAmount = Number(response.data?.opening_itc || 0);
      setOpeningITC(itcAmount);
      setOpeningITCInput(itcAmount ? itcAmount.toString() : "");
      setOpeningITCHistory([]);
    } catch (error) {
      console.error("Failed to load opening ITC:", error);
      // Don't show error toast, just use 0 as default
    }
  };

  // Save opening ITC balance to backend
  const saveOpeningITC = async (amount, year) => {
    try {
      const response = await authAxios.post("business/itc-opening-balance/", 
        { opening_itc: amount },
        { params: { year } }
      );
      const savedAmount = Number(response.data?.opening_itc ?? amount);
      setOpeningITC(savedAmount);
      return true;
    } catch (error) {
      console.error("Failed to save opening ITC:", error);
      showToast("Failed to save opening ITC balance", "error");
      return false;
    }
  };

  const addOpeningITC = async (amount, year) => {
    const newTotal = openingITC + amount;
    const success = await saveOpeningITC(newTotal, year);
    if (success) {
      setOpeningITCHistory(prev => [{
        id: Date.now(),
        amount,
        type: "add",
        date: new Date().toISOString(),
      }, ...prev]);
    }
    return success;
  };

  const subtractOpeningITC = async (amount, year) => {
    const newTotal = Math.max(0, openingITC - amount);
    const success = await saveOpeningITC(newTotal, year);
    if (success) {
      setOpeningITCHistory(prev => [{
        id: Date.now(),
        amount,
        type: "subtract",
        date: new Date().toISOString(),
      }, ...prev]);
    }
    return success;
  };

  const deleteHistoryEntry = (entryId) => {
    setOpeningITCHistory(prev => prev.filter(e => e.id !== entryId));
    showToast(`History entry deleted`);
  };

  const loadInvoiceList = async (type) => {
  const month = type === "b2b" ? b2bLoadMonth : b2cLoadMonth;
  const year  = type === "b2b" ? b2bLoadYear  : b2cLoadYear;
  const setLoading = type === "b2b" ? setB2bLoading : setB2cLoading;
  const setData    = type === "b2b" ? setB2bInvoices : setB2cInvoices;

  setLoading(true);
  try {
    const params = { type, year };
    if (month !== "all") params.month = month;
    const res = await authAxios.get("business/invoices/", { params });
    let list = Array.isArray(res.data) ? res.data : [];

    // Safety filter: only keep correct type (B2B has GST, B2C doesn't)
    list = list.filter(inv => {
      const hasGst = !!(inv.customer_gst && inv.customer_gst.trim());
      return type === "b2b" ? hasGst : !hasGst;
    });

    // Safety filter: only keep invoices matching selected month & year
    // invoice.date is in DD/MM/YYYY format
    list = list.filter(inv => {
      if (!inv.date) return false;
      const parts = inv.date.split("/");
      if (parts.length !== 3) return true; // can't parse, keep it
      const invMonth = Number(parts[1]);
      const invYear  = Number(parts[2]);
      if (invYear !== Number(year)) return false;
      if (month !== "all" && invMonth !== Number(month)) return false;
      return true;
    });

    setData(list);
  } catch {
    showToast("Failed to load invoices", "error");
  } finally {
    setLoading(false);
  }
};

const loadData = async (isRefresh = false) => {
  if (isRefresh) setRefreshing(true); else setLoading(true);
  try {
    const [rpt, itc, shop] = await Promise.all([
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
    setItcStock(Array.isArray(itc) ? itc : []);
    setShopProfile(shop || null);
    if (isRefresh) showToast("Data refreshed ✓");
  } catch {
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

  const confirmPaid = async (monthIdx) => {
    const monthData  = reportData[monthIdx];
    const gst        = Number(monthData?.gst_collected || 0);
    const netPayable = Math.max(0, gst - openingITC); // pay from ledger balance only

    try {
        await authAxios.post("business/gst-mark-paid/", {
            year:        selectedYear,
            month:       monthIdx + 1,
            paid_amount: netPayable,
        });

        setReportData(prev => prev.map((r, i) =>
            i === monthIdx
                ? { ...r, gst_paid: true, gst_paid_date: new Date().toISOString().slice(0, 10), gst_due_amount: 0 }
                : r
        ));

        // ── DEBIT the ledger by amount of ITC actually used ──
        const itcUsed = Math.min(gst, openingITC);
        const leftover = Math.max(0, openingITC - gst);

        if (itcUsed > 0) {
            await saveOpeningITC(leftover, selectedYear);
            setOpeningITCInput("");
        }

        if (leftover > 0) {
            setCarryForwardITC(leftover);
            showToast(`₹${fmt(itcUsed)} ITC used. ₹${fmt(leftover)} carried forward ✓`);
        } else {
            setCarryForwardITC(0);
            showToast(`${MONTH_FULL[monthIdx]} GST marked as paid ✓ (₹${fmt(itcUsed)} ITC used)`);
        }

        setPayingMonth(null);
    } catch {
        showToast("Failed to save payment. Try again.", "error");
    }
};


  // ── ITC proof upload ─────────────────────────────────────────
  const handleProofUpload = (rowIdx, file) => {
    setItcStock(prev => prev.map((r, i) =>
      i === rowIdx ? { ...r, proof: file ? file.name : null } : r
    ));
    setProofModal(null);
    if(file) showToast(`Proof uploaded: ${file.name} ✓`);
    else showToast("Proof removed", "error");
  };

  // ── Add ITC Entry ─────────────────────────────────────────────
  const addITCEntry = () => {
    if(!newITC.item || !newITC.purchase_value) { showToast("Item name and purchase value required","error"); return; }
    const pv = Number(newITC.purchase_value);
    const rate = Number(newITC.itc_rate);
    setItcStock(prev=>[...prev, {
      item: newITC.item, category: newITC.category||"General",
      qty: Number(newITC.qty)||1, unit: newITC.unit||"nos",
      purchase_value: pv, itc_rate: rate, itc_amount: pv*(rate/100),
      status:"eligible", proof:null,
    }]);
    setNewITC({ item:"", category:"", qty:"", unit:"", purchase_value:"", itc_rate:"18" });
    setShowITCForm(false);
    showToast("ITC entry added ✓");
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

  const b2bTotals = useMemo(() => {
    const gst = reportData.reduce((sum, r) => {
      const totalCount = (r.b2b_count || 0) + (r.b2c_count || 0);
      const ratio = totalCount ? (r.b2b_count || 0) / totalCount : 0;
      return sum + Number(r.gst_collected || 0) * ratio;
    }, 0);
    const itc = reportData.reduce((sum, r) => {
      const totalCount = (r.b2b_count || 0) + (r.b2c_count || 0);
      const ratio = totalCount ? (r.b2b_count || 0) / totalCount : 0;
      return sum + Number(r.itc_claimed || 0) * ratio;
    }, 0);
    return {
      count: totals.b2b,
      gst,
      itc,
      net: Math.max(0, gst - itc),
    };
  }, [reportData, totals.b2b]);

  const b2cTotals = useMemo(() => {
    const gst = reportData.reduce((sum, r) => {
      const totalCount = (r.b2b_count || 0) + (r.b2c_count || 0);
      const ratio = totalCount ? (r.b2c_count || 0) / totalCount : 0;
      return sum + Number(r.gst_collected || 0) * ratio;
    }, 0);
    const itc = reportData.reduce((sum, r) => {
      const totalCount = (r.b2b_count || 0) + (r.b2c_count || 0);
      const ratio = totalCount ? (r.b2c_count || 0) / totalCount : 0;
      return sum + Number(r.itc_claimed || 0) * ratio;
    }, 0);
    return {
      count: totals.b2c,
      gst,
      itc,
      net: Math.max(0, gst - itc),
    };
  }, [reportData, totals.b2c]);

  const itcTotals = useMemo(()=>({
    eligible: itcStock.filter(r=>r.status==="eligible").reduce((s,r)=>s+r.itc_amount,0),
    claimed:  itcStock.filter(r=>r.status==="claimed").reduce((s,r)=>s+r.itc_amount,0),
    pending:  itcStock.filter(r=>r.status==="pending").reduce((s,r)=>s+r.itc_amount,0),
    blocked:  itcStock.filter(r=>r.status==="blocked").reduce((s,r)=>s+r.itc_amount,0),
    total:    itcStock.reduce((s,r)=>s+r.itc_amount,0),
  }),[itcStock]);

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

  // ── Export CSV ──────────────────────────────────────

  const exportCSV = (type = "all") => {
  let header, rows, filename;

  if (type === "itc") {
    header = ["Item","Category","Qty","Unit","Purchase Value","ITC Rate %","ITC Amount","Status","Proof"];
    rows = itcStock.map(r => [r.item, r.category, r.qty, r.unit, r.purchase_value, r.itc_rate, r.itc_amount, r.status, r.proof || "—"]);
    filename = `ITC_Stock_${selectedYear}.csv`;
    const allRows = [header, ...rows];
    const csv = allRows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
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
        "Sr No",
        "Invoice ID",
        "Date",
        "Customer Name",
        "Customer Mobile",
        ...(isB2B ? ["Customer GSTIN"] : []),
        "Taxable Value (₹)",
        "CGST (₹)",
        "SGST (₹)",
        "Total GST (₹)",
        "Invoice Total (₹)",
      ],
    ];

    const rows = invoices.map((inv, idx) => {
      const gst     = Number(inv.gst_amt || 0);
      const total   = Number(inv.total   || 0);
      const taxable = total - gst;
      const half    = (gst / 2).toFixed(2);
      return [
        idx + 1,
        inv.invoice_id,
        inv.date,
        inv.customer_name   || "—",
        inv.customer_mobile || "—",
        ...(isB2B ? [inv.customer_gst || "—"] : []),
        taxable.toFixed(2),
        half,
        half,
        gst.toFixed(2),
        total.toFixed(2),
      ];
    });

    const blankCols = isB2B ? ["", "", "", "", ""] : ["", "", "", ""];
    const footer = [
      `TOTAL (${invoices.length} invoices)`,
      ...blankCols,
      totalTaxable.toFixed(2),
      (totalGst / 2).toFixed(2),
      (totalGst / 2).toFixed(2),
      totalGst.toFixed(2),
      totalAmount.toFixed(2),
    ];

    const allRows = [...meta, ...rows, [], footer];
    const csv  = allRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
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

  // Default: full year summary
  header = ["Month","Total Invoices","B2B","B2C","Taxable (₹)","GST (₹)","Total (₹)","ITC Eligible (₹)","ITC Claimed (₹)","GST Paid","Paid Date"];
  rows = reportData.map((r, i) => [
    MONTH_FULL[i], r.invoice_count || 0, r.b2b_count || 0, r.b2c_count || 0,
    Number(r.taxable_value || 0).toFixed(2), Number(r.gst_collected || 0).toFixed(2),
    Number(r.total_value || 0).toFixed(2), Number(r.itc_eligible || 0).toFixed(2),
    Number(r.itc_claimed || 0).toFixed(2), r.gst_paid ? "Yes" : "No", r.gst_paid_date || "—",
  ]);
  filename = `GST_Summary_${selectedYear}.csv`;

  const allRows = [header, ...rows];
  const csv  = allRows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
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
    const gstinCol = isB2B ? `<td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:center;color:#6366f1">${inv.customer_gst || "—"}</td>` : "";
    return `
      <tr style="background:${idx % 2 === 0 ? "#fff" : "#fafafa"}">
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:center;color:#7b8494">${idx + 1}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;font-weight:700;color:#1a1d23">${inv.invoice_id || "—"}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;color:#4a5568">${inv.date || "—"}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;color:#1a1d23">${inv.customer_name || "—"}</td>
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

  <!-- Print button -->

  <div class="no-print" style="text-align:right;margin-bottom:16px;display:flex;gap:10px;justify-content:flex-end">
    <button onclick="window.print()" style="padding:10px 24px;background:${color};color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">
      🖨️ Print / Save PDF
    </button>
    <button onclick="downloadPDF()" style="padding:10px 24px;background:#1a1d23;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">
      ↓ Download PDF
    </button>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script>
  async function downloadPDF() {
    const btn = document.querySelector('[onclick="downloadPDF()"]');
    btn.textContent = "Generating…";
    btn.disabled = true;
    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(document.body, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save("ManaBills_GST_${type.toUpperCase()}_${monthLabel.replace(/ /g, "_")}.pdf");
    btn.textContent = "↓ Download PDF";
    btn.disabled = false;
  }
  </script>

  <!-- Header band -->
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

  <!-- Shop Details -->
  <div style="background:${colorLight};border:1px solid ${isB2B ? "#e9d5ff" : "#fde68a"};border-top:none;border-radius:0;padding:16px 28px;display:flex;gap:40px;flex-wrap:wrap">
    <div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Shop Name</div>
      <div style="font-size:14px;font-weight:800;color:#1a1d23">${shop.shop_name || shop.name || "—"}</div>
    </div>
    ${shop.gstin ? `<div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">GSTIN</div>
      <div style="font-size:13px;font-weight:700;color:#1a1d23;font-family:monospace">${shop.gstin}</div>
    </div>` : ""}
    ${shop.phone || shop.mobile ? `<div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Phone</div>
      <div style="font-size:13px;font-weight:600;color:#1a1d23">${shop.phone || shop.mobile}</div>
    </div>` : ""}
    ${shop.address ? `<div style="flex:1;min-width:180px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Address</div>
      <div style="font-size:12px;color:#4a5568;line-height:1.5">${shop.address}</div>
    </div>` : ""}
  </div>

  <!-- Summary cards -->
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

  <!-- Invoice table -->
  <div style="border:1px solid #e8eaf0;border-radius:10px;overflow:hidden">
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
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
        </tr>
      </thead>
      <tbody>
        ${invoices.length === 0
          ? `<tr><td colspan="${isB2B ? 10 : 9}" style="text-align:center;padding:40px;color:#a0a8b8;font-size:13px">No ${type.toUpperCase()} invoices for this period</td></tr>`
          : rows}
      </tbody>
      <tfoot>
        <tr style="background:#f9fafc">
          <td colspan="${isB2B ? 5 : 4}" style="padding:11px 10px;font-weight:800;font-size:12px;color:#1a1d23;border-top:2px solid #e8eaf0">
            TOTAL — ${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}
          </td>
          <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:12px;color:#4a5568;border-top:2px solid #e8eaf0">₹${fmt(totalTaxable)}</td>
          <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:12px;color:#3b82f6;border-top:2px solid #e8eaf0">₹${fmt(totalGst / 2)}</td>
          <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:12px;color:#3b82f6;border-top:2px solid #e8eaf0">₹${fmt(totalGst / 2)}</td>
          <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:12px;color:#10b981;border-top:2px solid #e8eaf0">₹${fmt(totalGst)}</td>
          <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:13px;color:#1a1d23;border-top:2px solid #e8eaf0">₹${fmt(totalAmount)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Footer note -->
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
      <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;font-weight:700;color:#1a1d23">${r.item}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;color:#4a5568">${r.category}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;color:#4a5568">${r.qty} ${r.unit}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;color:#4a5568">₹${fmt(r.purchase_value)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;color:${r.itc_rate>0?"#10b981":"#ef4444"}">${r.itc_rate}%</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:right;font-weight:800;color:#3b82f6">₹${fmt(r.itc_amount)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:center;color:#4a5568">${r.status}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0f2f7;font-size:11px;text-align:center;color:#4a5568">${r.proof || "—"}</td>
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
    <button onclick="window.print()" style="padding:10px 24px;background:${color};color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">
      🖨️ Print / Save PDF
    </button>
    <button onclick="downloadPDF()" style="padding:10px 24px;background:#1a1d23;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">
      ↓ Download PDF
    </button>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script>
  async function downloadPDF() {
    const btn = document.querySelector('[onclick="downloadPDF()"]');
    btn.textContent = "Generating…";
    btn.disabled = true;
    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(document.body, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save("ManaBills_ITC_${selectedYear}.pdf");
    btn.textContent = "↓ Download PDF";
    btn.disabled = false;
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
    <div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Shop Name</div>
      <div style="font-size:14px;font-weight:800;color:#1a1d23">${shop.shop_name || shop.name || "—"}</div>
    </div>
    ${shop.gstin ? `<div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">GSTIN</div>
      <div style="font-size:13px;font-weight:700;color:#1a1d23;font-family:monospace">${shop.gstin}</div>
    </div>` : ""}
    ${shop.phone || shop.mobile ? `<div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Phone</div>
      <div style="font-size:13px;font-weight:600;color:#1a1d23">${shop.phone || shop.mobile}</div>
    </div>` : ""}
    ${shop.address ? `<div style="flex:1;min-width:180px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7b8494;margin-bottom:3px">Address</div>
      <div style="font-size:12px;color:#4a5568;line-height:1.5">${shop.address}</div>
    </div>` : ""}
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
      <thead>
        <tr>
          <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:center">#</th>
          <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:left">Item</th>
          <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:left">Category</th>
          <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">Qty</th>
          <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">Purchase Value</th>
          <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">ITC Rate</th>
          <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:right">ITC Amount</th>
          <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:center">Status</th>
          <th style="padding:9px 10px;background:#f9fafc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#7b8494;border-bottom:2px solid #e8eaf0;text-align:center">Proof</th>
        </tr>
      </thead>
      <tbody>
        ${itcStock.length === 0
          ? `<tr><td colspan="9" style="text-align:center;padding:40px;color:#a0a8b8;font-size:13px">No ITC stock entries found</td></tr>`
          : rows}
      </tbody>
      <tfoot>
        <tr style="background:#f9fafc">
          <td colspan="4" style="padding:11px 10px;font-weight:800;font-size:12px;color:#1a1d23;border-top:2px solid #e8eaf0">
            TOTAL — ${itcStock.length} item${itcStock.length !== 1 ? "s" : ""}
          </td>
          <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:12px;color:#4a5568;border-top:2px solid #e8eaf0">₹${fmt(totalPurchase)}</td>
          <td style="border-top:2px solid #e8eaf0"></td>
          <td style="padding:11px 10px;text-align:right;font-weight:800;font-size:13px;color:#3b82f6;border-top:2px solid #e8eaf0">₹${fmt(itcClaimedFromStock)}</td>
          <td colspan="2" style="border-top:2px solid #e8eaf0"></td>
        </tr>
      </tfoot>
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

  // ── Net GST Payable (after ITC) ───────────────────────────────

  // Total ITC from products API (all eligible + pending from stock)
  const itcClaimedFromStock = itcStock.reduce((s, r) => s + r.itc_amount, 0);
  // Manual entries added via "+ Add Entry" form are already in itcStock
  const totalITCAvailable = itcClaimedFromStock + openingITC;
  const netGstPayable = Math.max(0, totals.gst - totalITCAvailable);


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
      {/* Header row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"10px",marginBottom:"16px"}}>
        <div className="sec-title" style={{marginBottom:0}}>
          <span className="dot" style={{background:color}}/>
          {isB2B ? "🏢 B2B Invoices" : "🛒 B2C Invoices"}
          <span className="badge" style={{background:isB2B?"#f5f3ff":"#fffbeb",color:isB2B?"#8b5cf6":"#d97706",border:`1px solid ${isB2B?"#e9d5ff":"#fde68a"}`,marginLeft:"6px"}}>
            {invoices.length} invoices
          </span>
        </div>

        {/* Month + Year dropdowns */}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
          <select
            className="yr-sel"
            value={loadMonth}
            onChange={e => setMonth(e.target.value)}
          >
            <option value="all">All Months</option>
            {MONTH_FULL.map((m, i) => (
              <option key={i} value={String(i + 1)}>{m}</option>
            ))}
          </select>
          <select
            className="yr-sel"
            value={loadYear}
            onChange={e => setYear(Number(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {/* <button className="exp-btn" onClick={() => exportCSV(type)}>↓ CSV</button> */}
          <button
            className="exp-btn"
            style={{borderColor: isB2B ? "#8b5cf6" : "#f59e0b", color: isB2B ? "#8b5cf6" : "#d97706"}}
            onClick={() => generatePDF(type)}
          >
            🖨️CSV PDF
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="chips" style={{marginBottom:"14px"}}>
        <div className="chip">Total: <b>₹{fmt(totalAmount)}</b></div>
        <div className="chip">GST: <b style={{color:"#10b981"}}>₹{fmt(totalGst)}</b></div>
        <div className="chip">Count: <b style={{color}}>{invoices.length}</b></div>
      </div>

      {/* Table */}
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
                      padding:"5px 12px",
                      background: isB2B ? "#f5f3ff" : "#fffbeb",
                      color: isB2B ? "#8b5cf6" : "#d97706",
                      border: `1px solid ${isB2B?"#e9d5ff":"#fde68a"}`,
                      borderRadius:"8px",
                      fontSize:"0.72rem",
                      fontWeight:700,
                      cursor:"pointer",
                      fontFamily:"inherit",
                      transition:"all .15s",
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



  // ── Monthly table (B2B / B2C) ─────────────────────────────────

  const renderInvoiceTable = (type) => {
    const isB2B = type==="b2b";
    const color = isB2B ? "#8b5cf6" : "#f59e0b";
    const countKey = isB2B ? "b2b_count" : "b2c_count";
    const selectedMonth = isB2B ? b2bMonth : b2cMonth;
    const setSelectedMonth = isB2B ? setB2bMonth : setB2cMonth;
    const note = isB2B
      ? "B2B invoices go in GSTR-1 Table 4 (taxable outward supplies to registered persons). Keep buyer GSTIN on record."
      : "B2C invoices go in GSTR-1 Table 7/8. No buyer GSTIN required — keep invoice copies as proof.";

    // Filter rows based on selected month
    const filteredRows = selectedMonth === "all"
      ? reportData.map((r, i) => ({ ...r, _idx: i }))
      : reportData
          .map((r, i) => ({ ...r, _idx: i }))
          .filter((_, i) => i === Number(selectedMonth));

    // Totals for filtered rows only
    const filteredGst     = filteredRows.reduce((s,r)=>s+Number(r.gst_collected||0),0);
    const filteredItcE    = filteredRows.reduce((s,r)=>s+Number(r.itc_eligible||0),0);
    const filteredTaxable = filteredRows.reduce((s,r)=>s+Number(r.taxable_value||0),0);
    const filteredCount   = filteredRows.reduce((s,r)=>s+(r[countKey]||0),0);
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
            {/* Month dropdown */}
            <select
              className="yr-sel"
              value={selectedMonth}
              onChange={e=>setSelectedMonth(e.target.value)}
              style={{minWidth:"130px"}}
            >
              <option value="all">All Months</option>
              {MONTH_FULL.map((m,i)=>(
                <option key={i} value={String(i)}>{m}</option>
              ))}
            </select>
          </div>
          <button
                className="exp-btn"
                style={{borderColor: isB2B ? "#8b5cf6" : "#f59e0b", color: isB2B ? "#8b5cf6" : "#d97706"}}
                onClick={() => generatePDF(type)}
              >
                🖨️CSV PDF
          </button>
        </div>

        {/* Summary chips — update based on filtered */}
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
                <th>Month</th>
                <th>{isB2B?"B2B":"B2C"} Count</th>
                <th>Taxable Value</th>
                <th>GST Collected</th>
                <th>ITC Eligible</th>
                <th>Net GST</th>
                <th>GSTR-1 Due</th>
                <th>Payment</th>
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
                const itcE  = Number(r.itc_eligible||0);
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
        <p style={{fontSize:"0.68rem",color:"#a0a8b8",marginTop:"12px",lineHeight:1.7}}>
          ℹ️ {note}
        </p>
      </div>
    );
  };

  // ── ITC TAB ─────────────────────────────────────────────────── 

  const renderITC = () => {
  return (
    <div className="fade-up">

      {/* ── 3 stat cards only ── */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>

        <div className="sc" style={{ flex: "1 1 180px" }}>
          <div className="sc-bar" style={{ background: "#10b981" }} />
          <div className="sc-icon" style={{ background: "#ecfdf5" }}>💚</div>
          <div className="sc-label">Total ITC Available</div>
          <div className="sc-value" style={{ color: "#10b981" }}>{fmtK(totalITCAvailable)}</div>
          <div className="sc-sub" style={{ fontSize: "0.75rem", lineHeight: "1.4" }}>
            📦 Stock ITC: {fmtK(itcClaimedFromStock)}<br/>
            {openingITC > 0 && <span style={{ color: "#6366f1", fontWeight: 700 }}>✏️ Manual ITC: {fmtK(openingITC)}</span>}
            {openingITC === 0 && <span style={{ color: "#a0a8b8" }}>✏️ Manual ITC: —</span>}
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
            {netGstPayable > 0
              ? `GST ${fmtK(totals.gst)} − ITC ${fmtK(totalITCAvailable)}`
              : "Nothing to pay this period 🎉"}
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
              type="number"
              className="itc-input"
              style={{ paddingLeft: "26px", fontSize: "0.88rem", fontWeight: 700, width: "100%" }}
              placeholder="0.00"
              value={openingITCInput}
              onChange={e => setOpeningITCInput(e.target.value)}
            />
          </div>
          <button className="itc-add-btn" onClick={() => {
            const val = Number(openingITCInput) || 0;
            if (val <= 0) {
              showToast("Enter a valid amount to add", "error");
              return;
            }
            addOpeningITC(val, selectedYear).then(success => {
              if (success) {
                setOpeningITCInput("");
                showToast(`Opening ITC ₹${fmt(val)} added ✓`);
              }
            });
          }}>
            Add
          </button>
          <button className="exp-btn" style={{ background: "#ef4444", color: "#fff" }} onClick={() => {
            const val = Number(openingITCInput) || 0;
            if (val <= 0) {
              showToast("Enter a valid amount to subtract", "error");
              return;
            }
            if (val > openingITC) {
              showToast(`Balance is ₹${fmt(openingITC)} only`, "error");
              return;
            }
            subtractOpeningITC(val, selectedYear).then(success => {
              if (success) {
                setOpeningITCInput("");
                showToast(`Opening ITC ₹${fmt(val)} subtracted ✓`);
              }
            });
          }}>
            Subtract
          </button>
          {openingITC > 0 && (
            <button className="exp-btn" style={{ background: "#fca5a5", color: "#7f1d1d" }} onClick={() => { 
              saveOpeningITC(0, selectedYear).then(success => {
                if(success) {
                  setOpeningITCInput(""); 
                  setCarryForwardITC(0);
                  setOpeningITCHistory([]);
                  showToast("Opening ITC cleared");
                }
              });
            }}>
              Clear All
            </button>
          )}
          {openingITC > 0 && (
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#6366f1", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "8px", padding: "7px 12px" }}>
              ✓ Real ITC = ₹{fmt(openingITC)} · Net Payable = {fmtK(netGstPayable)}
            </div>
          )}
        </div>

        {openingITC > 0 && (
          <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "8px", padding: "10px 12px", marginTop: "12px", fontSize: "0.78rem", color: "#4f46e5", lineHeight: "1.5" }}>
            <div style={{ fontWeight: 700, marginBottom: "6px" }}>✏️ Manual ITC Info:</div>
            Your entered amount (₹{fmt(openingITC)}) is treated as <b>REAL ITC</b> and added to total available ITC for GST set-off. Edit via Add/Subtract above or delete history entries to adjust.
          </div>
        )}

        {openingITCHistory.length > 0 && (
          <div style={{ marginTop: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", padding: "14px" }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "10px" }}>📝 Opening ITC History</div>
            {openingITCHistory.map(entry => (
              <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>
                    {entry.type === "add" ? "➕ Added" : "➖ Subtracted"} ₹{fmt(entry.amount)}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{new Date(entry.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ color: entry.type === "add" ? "#10b981" : "#ef4444", fontWeight: 700, minWidth: "80px", textAlign: "right" }}>
                    {entry.type === "add" ? "+" : "−"}₹{fmt(entry.amount)}
                  </div>
                  <button
                    onClick={() => deleteHistoryEntry(entry.id)}
                    style={{ background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ITC from Stock table */}
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
              <button className="itc-add-btn" onClick={addITCEntry}>Save Entry</button>
              <button className="exp-btn" onClick={() => setShowITCForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>s.no</th>
                <th>Item </th>
                <th style={{ textAlign: "left" }}>Qty</th>
                <th>Purchase Value</th>
                <th>GST Rate</th>
                <th style={{ textAlign: "left" }}>Supplier GSTIN</th>  
                <th>ITC Amount</th>
                <th style={{ textAlign: "center" }}>Proof</th>
              </tr>
            </thead>
            <tbody>
              {itcStock.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#a0a8b8" }}>No stock entries with GST found</td></tr>
              ) : itcStock.map((r, i) => (
                <tr key={i}>
                  <td style={{ textAlign: "left", color: "#a0a8b8", fontWeight: 600 }}>{i + 1}</td>
                  <td>{r.item}</td>
                  {/* <td style={{ textAlign: "left", color: "#7b8494", fontSize: "0.75rem" }}>{r.category}</td> */}
                  <td style={{ textAlign: "left", color: "#4a5568" }}>{r.qty} {r.unit}</td>
                  <td>₹{fmt(r.purchase_value)}</td>
                  <td style={{ color: r.itc_rate > 0 ? "#10b981" : "#ef4444" }}>{r.itc_rate}%</td>
                  <td style={{ textAlign: "left", fontSize: "0.72rem", 
                    color: r.supplier_gstin ? "#6366f1" : "#a0a8b8", 
                    fontWeight: r.supplier_gstin ? 700 : 400,
                    fontFamily: "monospace" }}>
                    {r.supplier_gstin || "—"}
                  </td>

                  <td style={{ color: r.itc_amount > 0 ? "#3b82f6" : "#a0a8b8", fontWeight: 700 }}>
                    {r.itc_amount > 0 ? `₹${fmt(r.itc_amount)}` : "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {r.proof ? (
                      <div className="proof-chip" style={{ justifyContent: "center" }}>
                        <span>📎</span>
                        <span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.65rem" }}>{r.proof}</span>
                        <button onClick={() => handleProofUpload(i, null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontWeight: 700, fontSize: "0.8rem" }}>×</button>
                      </div>
                    ) : (
                      <button className="exp-btn" style={{ fontSize: "0.68rem", padding: "4px 10px" }} onClick={() => setProofModal(i)}>
                        📎 Upload
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
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Note */}
      <div className="note-box green">
        <div className="note-title" style={{ color: "#10b981" }}>💡ManaBills How ITC is calculated</div>
        <div className="note-text">
          • <b>Stock ITC</b> = pulled from your Products (purchase_gst field, or Purchase Price × GST Rate).<br />
          • <b>Manual entries</b> via "+ Add Entry" are added to Stock ITC total above.<br />
          • <b>Opening ITC</b> = leftover from previous month — enter manually or auto-filled after Mark as Paid.<br />
          • <b>Total ITC Available</b> = Stock ITC + Opening ITC.<br />
          • <b>Net GST Payable</b> = GST Collected − Total ITC. Share with your CA before filing.
        </div>
      </div>

    </div>
  );
};
 
 
 

  // ── PAYMENTS TAB ──────────────────────────────────────────────
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
                <th>Month</th>
                <th>GST Collected</th>
                <th>ITC Claimed</th>
                <th>Net Payable</th>
                <th>Due Date</th>
                <th style={{textAlign:"center"}}>Status</th>
                <th style={{textAlign:"center"}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((r,i)=>{
                const gst  = Number(r.gst_collected||0);
                const itcC = Number(r.itc_claimed||0);
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
                    <td style={{color:"#7b8494",fontSize:"0.74rem"}}>
                      {empty ? "—" : `20th ${MONTH_LABELS[i===11?0:i+1]}`}
                    </td>
                    <td style={{textAlign:"center"}}>
                      {empty ? "—" : r.gst_paid ? (
                        <span className="badge" style={{background:"#ecfdf5",color:"#10b981",border:"1px solid #a7f3d0"}}>
                          ✓ Paid · {fmtDate(r.gst_paid_date)}
                        </span>
                      ) : (
                        <span className="badge" style={{background:"#fef2f2",color:"#ef4444",border:"1px solid #fecaca"}}>
                          Unpaid
                        </span>
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
                <td style={{color:"#3b82f6"}}>₹{fmt(totals.itcClaimed)}</td>
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

  // ── SUMMARY TAB ───────────────────────────────────────────────
  const renderSummary = () => (
    <>
      {/* Alert if pending */}
      {totals.dueAmount > 0 && (
        <div className="note-box red" style={{marginBottom:"14px"}}>
          <div className="note-title" style={{color:"#ef4444"}}>⚠️ GST Payment Pending</div>
          <div className="note-text">
            <b>₹{fmt(totals.dueAmount)}</b> is pending across <b>{12-totals.paidMonths}</b> month(s).
            Go to the <b>Payments</b> tab to mark them as paid.
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginBottom:"14px"}}>
        <StatCard icon="🧾" label="Total Invoices"  value={totals.invoices.toLocaleString("en-IN")} sub={`All · ${selectedYear}`}  color="#3b82f6" bg="#eff6ff"/>
        <StatCard icon="🏢" label="B2B Invoices"    value={totals.b2b.toLocaleString("en-IN")} sub={`${totals.invoices>0?((totals.b2b/totals.invoices)*100).toFixed(0):0}% of total`} color="#8b5cf6" bg="#f5f3ff"/>
        <StatCard icon="🛒" label="B2C Invoices"    value={totals.b2c.toLocaleString("en-IN")} sub={`${totals.invoices>0?((totals.b2c/totals.invoices)*100).toFixed(0):0}% of total`} color="#f59e0b" bg="#fffbeb"/>
        <StatCard icon="🏛️" label="GST Collected"   value={fmtK(totals.gst)} sub={`₹${fmt(totals.gst)}`} color="#10b981" bg="#ecfdf5"/>
        <StatCard icon="📅" label="This Month GST"  value={fmtK(Number(reportData[curMonth]?.gst_collected || 0))}sub={`${MONTH_FULL[curMonth]} ${selectedYear}`}color="#f59e0b"bg="#fffbeb"/>
        <StatCard icon="💚" label="ITC Available" value={fmtK(totalITCAvailable)} sub={`Stock ITC + Opening ITC`} color="#10b981" bg="#ecfdf5"/>
        <StatCard icon="💰" label="Net GST Payable" value={fmtK(netGstPayable)} sub={`After ITC set-off`} color="#ef4444" bg="#fef2f2"/>
        <StatCard icon="✅" label="Paid Months"     value={`${totals.paidMonths}/12`} sub={`${12-totals.paidMonths} pending`} color="#10b981" bg="#ecfdf5"/>
      </div>

      {/* Half yearly */}
      <div className="sec fade-up">
        <div className="sec-title"><span className="dot" style={{background:"#3b82f6"}}/>Monthly Overview — {selectedYear}</div>
        <div className="tbl-wrap" style={{marginBottom:"14px"}}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Month</th>
                <th>Invoices</th>
                <th>B2B</th>
                <th>B2C</th>
                <th>GST Collected</th>
                <th>ITC Claimed</th>
                <th>Net GST</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((r,i)=>{
                const gst   = Number(r.gst_collected||0);
                const itc   = Number(r.itc_claimed||0);
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
                <td>Total</td>
                <td>{totals.invoices}</td>
                <td>{totals.b2b}</td>
                <td>{totals.b2c}</td>
                <td>₹{fmt(totals.gst)}</td>
                <td>₹{fmt(totals.itcClaimed)}</td>
                <td>₹{fmt(netGstPayable)}</td>
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

      {/* Monthly GST grid */}
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
        <GSTChart reportData={reportData} chartType={chartType} selectedYear={selectedYear}/>
      </div>
  
    </>
  );

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="gr">
        {/* Toast */}
        {toast && (
          <div className="toast" style={{background:toast.type==="error"?"#ef4444":"#22c55e"}}>{toast.msg}</div>
        )}

        {/* Mark as Paid Modal */}
        {payingMonth !== null && (
          <div className="modal-bg" onClick={()=>setPayingMonth(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <button className="modal-close" onClick={()=>setPayingMonth(null)}>×</button>
              <div className="modal-title">Confirm GST Payment</div>
              <div className="modal-sub">{MONTH_FULL[payingMonth]} {selectedYear}</div>
              <div style={{background:"#f9fafc",borderRadius:"10px",padding:"14px",marginBottom:"18px",border:"1px solid #e8eaf0"}}>
                {[
                  {l:"GST Collected", v:`₹${fmt(reportData[payingMonth]?.gst_collected||0)}`},
                  {l:"ITC Claimed", v:`₹${fmt(itcClaimedFromStock)}`},
                  {l:"Net Payable",   v:`₹${fmt(Math.max(0,(reportData[payingMonth]?.gst_collected||0)-(reportData[payingMonth]?.itc_claimed||0)))}`, bold:true, color:"#ef4444"},
                ].map(({l,v,bold,color})=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f0f2f7",fontSize:"0.82rem"}}>
                    <span style={{color:"#7b8494",fontWeight:600}}>{l}</span>
                    <span style={{fontWeight:bold?800:700,color:color||"#1a1d23"}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:"10px"}}>
                <button className="itc-add-btn" style={{flex:1}} onClick={()=>confirmPaid(payingMonth)}>
                  ✓ Confirm Paid
                </button>
                <button className="exp-btn" style={{flex:1}} onClick={()=>setPayingMonth(null)}>Cancel</button>
              </div>
              <p style={{fontSize:"0.67rem",color:"#a0a8b8",marginTop:"12px",textAlign:"center"}}>
                This records {MONTH_FULL[payingMonth]} GST as paid on {new Date().toLocaleDateString("en-IN")}.
              </p>
            </div>
          </div>
        )}

        {/* Proof Upload Modal */}
        {proofModal !== null && (
          <div className="modal-bg" onClick={()=>setProofModal(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <button className="modal-close" onClick={()=>setProofModal(null)}>×</button>
              <div className="modal-title">Upload Proof Document</div>
              <div className="modal-sub">{itcStock[proofModal]?.item} — {itcStock[proofModal]?.category}</div>
              <ProofUpload existing={itcStock[proofModal]?.proof} onUpload={(f)=>handleProofUpload(proofModal,f)}/>
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

        {/* ── Header ── */}
        <div className={`gr-header ${isMobile?"mob":""}`}>
          <div style={{
            display:"flex",
            alignItems:isMobile?"flex-start":"center",
            justifyContent:"space-between",
            flexDirection:isMobile?"column":"row",
            gap:isMobile?"10px":"0",
            marginBottom:"2px",
          }}>
            <div>
              <h2 style={{fontSize:isMobile?"1.15rem":"1.35rem",fontWeight:800,letterSpacing:"-.02em",color:"#1a1d23"}}>
                GST Reports
              </h2>
              <p style={{fontSize:"0.72rem",color:"#7b8494",marginTop:"2px"}}>
                B2B · B2C · ITC · Payments · {selectedYear}
                {totals.paidMonths > 0 && <span style={{marginLeft:"8px",color:"#10b981",fontWeight:700}}>· {totals.paidMonths} months paid</span>}
                {totals.dueAmount > 0  && <span style={{marginLeft:"8px",color:"#ef4444",fontWeight:700}}>· ₹{fmtK(totals.dueAmount)} due</span>}
              </p>
            </div>         
          </div>

          {/* Tabs */}
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

        {/* ── Body ── */}
        <div className={`gr-body ${isMobile?"mob":""}`}>
          {loading ? (
            <div style={{padding:"60px",textAlign:"center",color:"#7b8494",fontSize:"0.85rem"}}>
              <div style={{fontSize:"2rem",marginBottom:"12px"}}>⏳</div>
              Loading GST data…
            </div>
          ) : totals.invoices===0 && activeTab!=="itc" ? (
            <div className="sec" style={{textAlign:"center",padding:"60px 24px"}}>
              <div style={{fontSize:"2.5rem",marginBottom:"12px"}}>🧾</div>
              <div style={{fontWeight:700,fontSize:"1rem",color:"#1a1d23",marginBottom:"6px"}}>
                No GST Invoices for {selectedYear}
              </div>
              <div style={{color:"#7b8494",fontSize:"0.8rem"}}>
                Enable GST while creating invoices to see reports here.
              </div>
            </div>
          ) : (
            <>
              {activeTab==="summary"  && renderSummary()}
              {activeTab==="b2b" && (
                <>
                  {renderInvoiceTable("b2b")}
                  {renderInvoiceList("b2b")}
                </>
              )}
              {activeTab==="b2c" && (
                <>
                  {renderInvoiceTable("b2c")}
                  {renderInvoiceList("b2c")}
                </>
              )}
              {activeTab==="itc"      && renderITC()}
              {activeTab==="payments" && renderPayments()}
            </>
          )}

          {/* Footer note */}
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
