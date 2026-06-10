import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../../components/cards/SummaryCard";
import { getDashboardStats, getChartStats } from "../../services/businessService";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtShort = (n) => {
  const num = Number(n || 0);
  if (num >= 100000) return "₹" + (num / 100000).toFixed(1) + "L";
  if (num >= 1000)   return "₹" + (num / 1000).toFixed(1) + "K";
  return "₹" + num.toLocaleString("en-IN");
};

const SkeletonCard = () => (
  <div style={{
    background: "#fff", borderRadius: "12px", padding: "20px",
    animation: "pulse 1.5s ease-in-out infinite", height: "110px"
  }} />
);

// ── LABELS ───────────────────────────────────────────────────────
const DAY_LABELS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_LABELS  = ["Week 1", "Week 2", "Week 3", "Week 4"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── DEFAULT SELECTIONS (current day / week / month) ───────────────
const _now         = new Date();
const DEFAULT_DAY  = _now.getDay() === 0 ? 6 : _now.getDay() - 1; // 0=Mon…6=Sun (array index)
const DEFAULT_WEEK = Math.min(3, Math.ceil(_now.getDate() / 7) - 1); // 0–3
const DEFAULT_MON  = _now.getMonth(); // 0–11

// ── DROPDOWN ─────────────────────────────────────────────────────
const StatsDropdown = ({ labels, selectedIndex, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "5px 12px", borderRadius: "8px",
          border: "1.5px solid #e2e8f0", background: "#fff",
          cursor: "pointer", fontSize: "0.78rem", fontWeight: 700,
          color: "#6366f1", whiteSpace: "nowrap",
          boxShadow: open ? "0 0 0 3px #6366f115" : "none",
          transition: "all 0.15s",
        }}
      >
        {labels[selectedIndex]}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d={open ? "M2 8L6 4L10 8" : "M2 4L6 8L10 4"}
            stroke="#6366f1" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "#fff", borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 1000, minWidth: "120px", padding: "4px",
        }}>
          {labels.map((label, i) => (
            <div
              key={i}
              onClick={() => { onChange(i); setOpen(false); }}
              style={{
                padding: "8px 14px", cursor: "pointer", borderRadius: "8px",
                fontSize: "0.78rem", fontWeight: i === selectedIndex ? 700 : 500,
                color: i === selectedIndex ? "#6366f1" : "#374151",
                background: i === selectedIndex ? "#6366f108" : "transparent",
                display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: "10px",
              }}
              onMouseEnter={e => { if (i !== selectedIndex) e.currentTarget.style.background = "#f8fafc"; }}
              onMouseLeave={e => { if (i !== selectedIndex) e.currentTarget.style.background = "transparent"; }}
            >
              {label}
              {i === selectedIndex && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7L6 11L12 3" stroke="#6366f1" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── SECTION HEADER ────────────────────────────────────────────────
const SectionHeader = ({ title, labels, selectedIndex, onChange }) => (
  <div style={{
    display: "flex", alignItems: "center",
    justifyContent: "space-between", margin: "24px 0 10px",
  }}>
    <h3 className="section-title" style={{ margin: 0 }}>{title}</h3>
    <StatsDropdown labels={labels} selectedIndex={selectedIndex} onChange={onChange} />
  </div>
);

// ── CHART COMPONENT (untouched) ───────────────────────────────────
const CHART_METRICS = [
  { key: "total_sales",   label: "Total Sales", color: "#6366f1" },
  { key: "collected",     label: "Collected",   color: "#10b981" },
  { key: "pending",       label: "Pending",     color: "#f59e0b" },
  { key: "invoice_count", label: "Invoices",    color: "#3b82f6", isCount: true },
];

const SalesChart = ({ chartData, loading, period, onPeriodChange }) => {
  const [activeMetrics, setActiveMetrics] = useState(["total_sales", "collected", "pending"]);
  const [tooltip, setTooltip]             = useState(null);

  const labels = period === "day" ? DAY_LABELS : period === "week" ? WEEK_LABELS : MONTH_LABELS;

  const toggleMetric = (key) => {
    setActiveMetrics(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key]
    );
  };

  const allValues = (chartData || []).flatMap(d =>
    activeMetrics.map(m => {
      const metric = CHART_METRICS.find(cm => cm.key === m);
      return metric?.isCount ? (d[m] || 0) * 500 : (d[m] || 0);
    })
  );
  const maxVal = Math.max(...allValues, 1);
  const barGroupWidth = labels.length > 0 ? Math.floor(560 / labels.length) : 80;
  const barWidth      = Math.max(6, Math.floor((barGroupWidth - 12) / activeMetrics.length));
  const chartH        = 180;

  return (
    <div style={{
      background: "#fff", borderRadius: "16px", padding: "20px",
      marginBottom: "20px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
      border: "1px solid #f0f0f0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>Sales Overview</h3>
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "3px", gap: "2px" }}>
          {[["day","Day"],["week","Week"],["month","Month"]].map(([val, lbl]) => (
            <button key={val} onClick={() => onPeriodChange(val)} style={{
              padding: "5px 14px", borderRadius: "6px", border: "none", cursor: "pointer",
              fontSize: "0.78rem", fontWeight: 600,
              background: period === val ? "#6366f1" : "transparent",
              color: period === val ? "#fff" : "#64748b", transition: "all 0.15s",
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
        {CHART_METRICS.map(m => (
          <button key={m.key} onClick={() => toggleMetric(m.key)} style={{
            display: "flex", alignItems: "center", gap: "5px",
            padding: "4px 10px", borderRadius: "20px", border: "none",
            cursor: "pointer", fontSize: "0.73rem", fontWeight: 600,
            background: activeMetrics.includes(m.key) ? m.color + "18" : "#f1f5f9",
            color: activeMetrics.includes(m.key) ? m.color : "#94a3b8",
            transition: "all 0.15s",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: activeMetrics.includes(m.key) ? m.color : "#cbd5e1",
              display: "inline-block",
            }} />
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ height: chartH + 40, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.85rem" }}>
          Loading chart…
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <svg width={Math.max(560, labels.length * barGroupWidth + 40)} height={chartH + 50}
            style={{ display: "block" }} onMouseLeave={() => setTooltip(null)}>
            {[0, 0.25, 0.5, 0.75, 1].map(pct => (
              <g key={pct}>
                <line x1={30} y1={chartH - chartH * pct + 10}
                  x2={Math.max(560, labels.length * barGroupWidth + 40) - 10}
                  y2={chartH - chartH * pct + 10} stroke="#f1f5f9" strokeWidth={1} />
                <text x={28} y={chartH - chartH * pct + 14} textAnchor="end" fontSize={9} fill="#94a3b8">
                  {pct === 0 ? "0" : fmtShort(maxVal * pct).replace("₹","").trim()}
                </text>
              </g>
            ))}
            {labels.map((label, i) => {
              const d      = (chartData && chartData[i]) || {};
              const groupX = 36 + i * barGroupWidth;
              const totalGroupW = barWidth * activeMetrics.length + (activeMetrics.length - 1) * 3;
              const startX = groupX + (barGroupWidth - totalGroupW) / 2;
              return (
                <g key={label} onMouseEnter={() => setTooltip({ i, d, label, x: groupX + barGroupWidth / 2 })}>
                  {activeMetrics.map((mKey, mi) => {
                    const metric = CHART_METRICS.find(cm => cm.key === mKey);
                    const rawVal = metric?.isCount ? (d[mKey] || 0) * 500 : (d[mKey] || 0);
                    const barH   = Math.max(2, (rawVal / maxVal) * chartH);
                    const x = startX + mi * (barWidth + 3);
                    const y = chartH - barH + 10;
                    return (
                      <rect key={mKey} x={x} y={y} width={barWidth} height={barH} rx={3}
                        fill={metric.color} opacity={tooltip?.i === i ? 1 : 0.82}
                        style={{ transition: "opacity 0.1s" }} />
                    );
                  })}
                  <text x={groupX + barGroupWidth / 2} y={chartH + 26} textAnchor="middle"
                    fontSize={10} fill="#64748b" fontWeight={tooltip?.i === i ? 700 : 400}>
                    {label}
                  </text>
                </g>
              );
            })}
            {tooltip && (() => {
              const d = tooltip.d;
              const tipW = 140;
              const tipX = Math.min(tooltip.x - tipW / 2, Math.max(560, labels.length * barGroupWidth + 40) - tipW - 10);
              return (
                <g>
                  <rect x={tipX} y={4} width={tipW} height={activeMetrics.length * 18 + 22}
                    rx={8} fill="#1e293b" opacity={0.92} />
                  <text x={tipX + 10} y={20} fill="#fff" fontSize={11} fontWeight={700}>{tooltip.label}</text>
                  {activeMetrics.map((mKey, mi) => {
                    const metric = CHART_METRICS.find(cm => cm.key === mKey);
                    const val = d[mKey] || 0;
                    return (
                      <g key={mKey}>
                        <circle cx={tipX + 14} cy={34 + mi * 18} r={4} fill={metric.color} />
                        <text x={tipX + 22} y={38 + mi * 18} fill="#e2e8f0" fontSize={10}>
                          {metric.label}: {metric.isCount ? val : fmtShort(val)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
const BusinessHome = () => {
  const navigate = useNavigate();

  const [stats,         setStats]         = useState({});
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [retryCount,    setRetryCount]    = useState(0);

  const [chartPeriod,  setChartPeriod]  = useState("month");
  const [chartLoading, setChartLoading] = useState(false);

  // All 3 datasets
  const [monthData, setMonthData] = useState([]);   // Jan–Dec, fixed
  const [weekData,  setWeekData]  = useState([]);   // Week 1–4 of selMonth
  const [dayData,   setDayData]   = useState([]);   // Mon–Sun of selWeek in selMonth

  // Dropdown selections (0-based index)
  const [selMonth, setSelMonth] = useState(DEFAULT_MON);
  const [selWeek,  setSelWeek]  = useState(DEFAULT_WEEK);
  const [selDay,   setSelDay]   = useState(DEFAULT_DAY);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ── Overall stats ──
  const loadStats = useCallback(async (attempt = 0) => {
    try {
      setError(null);
      setLoading(true);
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 10000);
      const data = await Promise.race([
        getDashboardStats(),
        new Promise((_, reject) =>
          controller.signal.addEventListener("abort", () =>
            reject(new Error("Dashboard stats request timeout"))
          )
        ),
      ]);
      clearTimeout(timeoutId);
      setStats(data || {});
      setLowStockCount(data?.low_stock_count || 0);
      setRetryCount(0);
    } catch (err) {
      const isTimeout = err.message.includes("timeout");
      setError(isTimeout ? "Stats loading took too long. Retrying..." : "Failed to load stats");
      if (attempt < 2 && (isTimeout || err.code === "ERR_NETWORK")) {
        setRetryCount(attempt + 1);
        setTimeout(() => loadStats(attempt + 1), 2000 * (attempt + 1));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fallback = (count) =>
    Array.from({ length: count }, () => ({
      total_sales: 0, collected: 0, pending: 0, invoice_count: 0,
    }));

  // ── On mount: load month data (Jan–Dec) + initial week + initial day ──
  const loadInitialData = useCallback(async () => {
    setChartLoading(true);
    try {
      const [mData, wData, dData] = await Promise.all([
        getChartStats("month").catch(() => fallback(12)),
        getChartStats("week",  { month: DEFAULT_MON + 1 }).catch(() => fallback(4)),
        getChartStats("day",   { month: DEFAULT_MON + 1, week_of_month: DEFAULT_WEEK + 1 }).catch(() => fallback(7)),
      ]);
      setMonthData(mData);
      setWeekData(wData);
      setDayData(dData);
    } catch (err) {
      console.error("Initial chart load error:", err);
      setMonthData(fallback(12));
      setWeekData(fallback(4));
      setDayData(fallback(7));
    } finally {
      setChartLoading(false);
    }
  }, []);

  // ── Month changed → refetch weeks of that month, reset week to 0, reset day ──
  const handleMonthChange = useCallback(async (monthIndex) => {
    setSelMonth(monthIndex);
    setSelWeek(0);
    setSelDay(0);
    try {
      const wData = await getChartStats("week", { month: monthIndex + 1 });
      setWeekData(wData);
      // Also refetch days for week 1 of the new month
      const dData = await getChartStats("day", { month: monthIndex + 1, week_of_month: 1 });
      setDayData(dData);
    } catch (err) {
      console.error("Month change fetch error:", err);
      setWeekData(fallback(4));
      setDayData(fallback(7));
    }
  }, []);

  // ── Week changed → refetch days of that week in current selMonth ──
  const handleWeekChange = useCallback(async (weekIndex) => {
    setSelWeek(weekIndex);
    setSelDay(0);
    try {
      const dData = await getChartStats("day", {
        month: selMonth + 1,
        week_of_month: weekIndex + 1,
      });
      setDayData(dData);
    } catch (err) {
      console.error("Week change fetch error:", err);
      setDayData(fallback(7));
    }
  }, [selMonth]);

  useEffect(() => { loadStats(); },       [loadStats]);
  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // Graph data — uses the correct dataset based on chartPeriod
  const graphData = chartPeriod === "day" ? dayData
                  : chartPeriod === "week" ? weekData
                  : monthData;

  const SkeletonSection = () => (
    <div className="summary-grid">
      <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
    </div>
  );

  const getSlot = (arr, index) =>
    arr[index] || { total_sales: 0, collected: 0, pending: 0, invoice_count: 0 };

  const StatsCards = ({ slot }) => (
    <div className="summary-grid">
      <SummaryCard title="Invoices"    value={slot.invoice_count || 0} subtitle="bills raised" />
      <SummaryCard title="Total Sales" value={fmt(slot.total_sales)}   subtitle="gross billed" />
      <SummaryCard title="Pending"     value={fmt(slot.pending)}       subtitle="outstanding" />
      <SummaryCard title="Collected"   value={fmt(slot.collected)}     subtitle="received" />
    </div>
  );

  return (
    <div className="business-home">

      {/* ERROR */}
      {error && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fecaca",
          borderRadius: "12px", padding: "12px 18px", marginBottom: "20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "0.85rem", color: "#991b1b", fontWeight: 600 }}>❌ {error}</span>
          {retryCount > 0 && <span style={{ fontSize: "0.8rem", color: "#dc2626" }}>Retry {retryCount}...</span>}
          {retryCount === 2 && (
            <button onClick={() => loadStats()} style={{
              padding: "4px 12px", background: "#dc2626", color: "#fff",
              border: "none", borderRadius: "6px", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 600,
            }}>Retry Now</button>
          )}
        </div>
      )}

      {/* LOW STOCK */}
      {lowStockCount > 0 && (
        <div onClick={() => navigate("products")} style={{
          background: "#fff7ed", border: "1px solid #fed7aa",
          borderRadius: "12px", padding: "12px 18px", marginBottom: "6px",
          cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "0.85rem", color: "#c2410c", fontWeight: 600 }}>
            ⚠️ {lowStockCount} item{lowStockCount > 1 ? "s" : ""} running low on stock
          </span>
          <span style={{ fontSize: "0.8rem", color: "#ea580c" }}>View →</span>
        </div>
      )}

      {/* ── GRAPH — untouched ── */}
      <SalesChart
        chartData={graphData}
        loading={chartLoading}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
      />

      {loading ? (
        <>
          <div style={{ padding: "0.5rem 0", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
            Loading stats…
          </div>
          {["Today","This Week","This Month","Overall"].map(t => (
            <React.Fragment key={t}>
              <h3 className="section-title">{t}</h3>
              <SkeletonSection />
            </React.Fragment>
          ))}
        </>
      ) : (
        <>
          {/* ── TODAY ── */}
          <SectionHeader
            title="Today"
            labels={DAY_LABELS}
            selectedIndex={selDay}
            onChange={setSelDay}   // day change = just read array, no fetch needed
          />
          <StatsCards slot={getSlot(dayData, selDay)} />

          {/* ── THIS WEEK ── */}
          <SectionHeader
            title="This Week"
            labels={WEEK_LABELS}
            selectedIndex={selWeek}
            onChange={handleWeekChange}  // week change → refetch days
          />
          <StatsCards slot={getSlot(weekData, selWeek)} />

          {/* ── THIS MONTH ── */}
          <SectionHeader
            title="This Month"
            labels={MONTH_LABELS}
            selectedIndex={selMonth}
            onChange={handleMonthChange}  // month change → refetch weeks + days
          />
          <StatsCards slot={getSlot(monthData, selMonth)} />

          {/* ── OVERALL ── */}
          <h3 className="section-title" style={{ margin: "24px 0 10px" }}>Overall</h3>
          <div className="summary-grid">
            <SummaryCard title="Invoices"    value={stats.invoice_count || 0}      subtitle="all time" />
            <SummaryCard title="Total Sales" value={fmt(stats.total_billing)}       subtitle="all time revenue" />
            <SummaryCard title="Pending"     value={fmt(stats.total_unpaid_amount)} subtitle="still outstanding" />
            <SummaryCard title="Collected"   value={fmt(stats.total_paid_amount)}   subtitle="total received" />
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessHome;