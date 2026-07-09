import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../../components/cards/SummaryCard";
import { getDashboardStats, getChartStats } from "../../services/businessService";

const fmt      = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtShort = (n) => {
  const num = Number(n || 0);
  if (num >= 100000) return "₹" + (num / 100000).toFixed(1) + "L";
  if (num >= 1000)   return "₹" + (num / 1000).toFixed(1)   + "K";
  return "₹" + num.toLocaleString("en-IN");
};

const SkeletonCard = () => (
  <div style={{
    background: "#fff", borderRadius: "12px", padding: "20px",
    animation: "pulse 1.5s ease-in-out infinite", height: "110px",
  }} />
);

// ── STATIC LABELS ────────────────────────────────────────────────
const DAY_LABELS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function buildWeekLabels(year, monthIndex) {
  const count = buildWeekRanges(year, monthIndex).length;
  return Array.from({ length: count }, (_, i) => `Week ${i + 1}`);
}
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun",
                      "Jul","Aug","Sep","Oct","Nov","Dec"];

// ── DEFAULTS ─────────────────────────────────────────────────────
const _now        = new Date();
const DEFAULT_MON = _now.getMonth();

// ── Helper: build calendar-accurate week ranges ───────────────────
// Returns array of 4 items: { start: Date, end: Date } | null

function buildWeekRanges(year, monthIndex) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const ranges      = [];
  let start         = new Date(year, monthIndex, 1);

  while (start.getMonth() === monthIndex) {
    const rangeStart   = new Date(start);
    const daysToSunday = start.getDay() === 0 ? 0 : 7 - start.getDay();
    let end            = new Date(start);
    end.setDate(start.getDate() + daysToSunday);
    if (end.getMonth() !== monthIndex) {
      end = new Date(year, monthIndex, daysInMonth);
    }
    ranges.push({ start: rangeStart, end: new Date(end) });
    start = new Date(end);
    start.setDate(end.getDate() + 1);
  }

  return ranges; // 4 or 5 items, always real calendar weeks, no nulls
}

// ── Get which week index today falls in ──────────────────────────
function getCurrentWeekIndex(monthIndex) {
  const year       = new Date().getFullYear();
  const today      = new Date();
  const weekRanges = buildWeekRanges(year, monthIndex);

  for (let i = 0; i < weekRanges.length; i++) {
    const wr = weekRanges[i];
    if (today >= wr.start && today <= wr.end) return i;
  }
  return 0;
}

// ── Get which day index today falls in within a week ─────────────
function getCurrentDayIndex(monthIndex, weekIndex) {
  const year       = new Date().getFullYear();
  const today      = new Date();
  const weekRanges = buildWeekRanges(year, monthIndex);
  const wr         = weekRanges[weekIndex];

  if (!wr) return 0;

  // Count leading inactive slots (previous month days) first
  const weekStartDay  = wr.start.getDay();
  const leadingSlots  = weekStartDay === 0 ? 6 : weekStartDay - 1;

  if (today >= wr.start && today <= wr.end) {
    const diffDays = Math.floor((today - wr.start) / (1000 * 60 * 60 * 24));
    return leadingSlots + diffDays; // offset by leading inactive slots
  }
  return leadingSlots; // default to first active slot
}

// ── Build day labels for a specific week ─────────────────────────
// Returns array of 7 objects: { label: "Wed 1", active: true/false }
// active: false = previous/next month days (greyed out, not selectable)
function buildDayLabels(monthIndex, weekIndex) {
  const year      = new Date().getFullYear();
  const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekRanges = buildWeekRanges(year, monthIndex);
  const wr         = weekRanges[weekIndex];

  if (!wr) return DAY_LABELS.map(l => ({ label: l, active: true }));

  const items = [];

  // ── Fill leading slots with PREVIOUS month's days ─────────────
  const weekStartDay = wr.start.getDay(); // 0=Sun,1=Mon...
  const leadingSlots = weekStartDay === 0 ? 6 : weekStartDay - 1;

  for (let i = leadingSlots - 1; i >= 0; i--) {
    const d = new Date(wr.start);
    d.setDate(wr.start.getDate() - (i + 1));
    items.push({
      label:  `${DAY_SHORT[d.getDay()]} ${d.getDate()}`,
      active: false, // greyed out — previous month
    });
  }

  // ── Fill actual days of this week ─────────────────────────────
  let d = new Date(wr.start);
  while (d <= wr.end && items.length < 7) {
    items.push({
      label:  `${DAY_SHORT[d.getDay()]} ${d.getDate()}`,
      active: true,
    });
    d.setDate(d.getDate() + 1);
  }

  // ── Pad trailing with NEXT month's days ──────────────────────
  while (items.length < 7) {
    items.push({
      label:  `${DAY_SHORT[d.getDay()]} ${d.getDate()}`,
      active: false, // greyed out — next month
    });
    d.setDate(d.getDate() + 1);
  }

  return items; // always exactly 7 items
}

// ── Compute defaults using calendar-accurate helpers ─────────────
const DEFAULT_WEEK = getCurrentWeekIndex(DEFAULT_MON);
const DEFAULT_DAY  = getCurrentDayIndex(DEFAULT_MON, DEFAULT_WEEK);

// ── DROPDOWN ─────────────────────────────────────────────────────
// labels can be:
//   - plain strings: ["Jan", "Feb", ...]  (month / week dropdowns)
//   - objects:       [{ label, active }]  (day dropdown)
const StatsDropdown = ({ labels, selectedIndex, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref             = useRef();

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Normalise: always work with { label, active }
  const normalised = labels.map(l =>
    typeof l === "object" ? l : { label: l, active: true }
  );

  const selectedLabel = normalised[selectedIndex]?.label ?? "";

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
        {selectedLabel}
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
          {normalised.map((item, i) => (
            <div
              key={i}
              onClick={() => {
                if (!item.active) return; // block click on grey days
                onChange(i);
                setOpen(false);
              }}
              style={{
                padding: "8px 14px",
                cursor: item.active ? "pointer" : "default",
                borderRadius: "8px",
                fontSize: "0.78rem",
                fontWeight: i === selectedIndex ? 700 : 500,
                color: !item.active
                  ? "#cbd5e1"                          // greyed out
                  : i === selectedIndex
                    ? "#6366f1"                        // selected
                    : "#374151",                       // normal
                background: i === selectedIndex && item.active
                  ? "#6366f108"
                  : "transparent",
                opacity: item.active ? 1 : 0.5,
                display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: "10px",
              }}
              onMouseEnter={e => {
                if (item.active && i !== selectedIndex)
                  e.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={e => {
                if (i !== selectedIndex)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {item.label}
              {i === selectedIndex && item.active && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7L6 11L12 3" stroke="#6366f1" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
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

// ── CHART ─────────────────────────────────────────────────────────
const CHART_METRICS = [
  { key: "total_sales",   label: "Total Sales", color: "#6366f1" },
  { key: "collected",     label: "Collected",   color: "#10b981" },
  { key: "pending",       label: "Pending",     color: "#f59e0b" },
  { key: "invoice_count", label: "Invoices",    color: "#3b82f6", isCount: true },
];

const SalesChart = ({ chartData, loading, period, onPeriodChange, weekLabels }) => {
  const [activeMetrics, setActiveMetrics] = useState(["total_sales", "collected", "pending"]);
  const [tooltip,       setTooltip]       = useState(null);

  const labels = period === "day"  ? DAY_LABELS
               : period === "week" ? weekLabels
               : MONTH_LABELS;

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
  const maxVal        = Math.max(...allValues, 1);
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
              color:      period === val ? "#fff"    : "#64748b",
              transition: "all 0.15s",
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
            color:      activeMetrics.includes(m.key) ? m.color         : "#94a3b8",
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
          <svg
            width={Math.max(560, labels.length * barGroupWidth + 40)}
            height={chartH + 50}
            style={{ display: "block" }}
            onMouseLeave={() => setTooltip(null)}
          >
            {[0, 0.25, 0.5, 0.75, 1].map(pct => (
              <g key={pct}>
                <line
                  x1={30} y1={chartH - chartH * pct + 10}
                  x2={Math.max(560, labels.length * barGroupWidth + 40) - 10}
                  y2={chartH - chartH * pct + 10}
                  stroke="#f1f5f9" strokeWidth={1}
                />
                <text x={28} y={chartH - chartH * pct + 14} textAnchor="end" fontSize={9} fill="#94a3b8">
                  {pct === 0 ? "0" : fmtShort(maxVal * pct).replace("₹", "").trim()}
                </text>
              </g>
            ))}

            {labels.map((label, i) => {
              const d           = (chartData && chartData[i]) || {};
              const groupX      = 36 + i * barGroupWidth;
              const totalGroupW = barWidth * activeMetrics.length + (activeMetrics.length - 1) * 3;
              const startX      = groupX + (barGroupWidth - totalGroupW) / 2;
              return (
                <g key={label} onMouseEnter={() => setTooltip({ i, d, label, x: groupX + barGroupWidth / 2 })}>
                  {activeMetrics.map((mKey, mi) => {
                    const metric = CHART_METRICS.find(cm => cm.key === mKey);
                    const rawVal = metric?.isCount ? (d[mKey] || 0) * 500 : (d[mKey] || 0);
                    const barH   = Math.max(2, (rawVal / maxVal) * chartH);
                    return (
                      <rect
                        key={mKey}
                        x={startX + mi * (barWidth + 3)}
                        y={chartH - barH + 10}
                        width={barWidth} height={barH} rx={3}
                        fill={metric.color}
                        opacity={tooltip?.i === i ? 1 : 0.82}
                        style={{ transition: "opacity 0.1s" }}
                      />
                    );
                  })}
                  <text
                    x={groupX + barGroupWidth / 2} y={chartH + 26}
                    textAnchor="middle" fontSize={10} fill="#64748b"
                    fontWeight={tooltip?.i === i ? 700 : 400}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {tooltip && (() => {
              const d    = tooltip.d;
              const tipW = 140;
              const tipX = Math.min(
                tooltip.x - tipW / 2,
                Math.max(560, labels.length * barGroupWidth + 40) - tipW - 10
              );
              return (
                <g>
                  <rect x={tipX} y={4} width={tipW} height={activeMetrics.length * 18 + 22}
                    rx={8} fill="#1e293b" opacity={0.92} />
                  <text x={tipX + 10} y={20} fill="#fff" fontSize={11} fontWeight={700}>{tooltip.label}</text>
                  {activeMetrics.map((mKey, mi) => {
                    const metric = CHART_METRICS.find(cm => cm.key === mKey);
                    const val    = d[mKey] || 0;
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
const BusinessHome = () => {
  const navigate = useNavigate();

  const [stats,         setStats]         = useState({});
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [retryCount,    setRetryCount]    = useState(0);

  const [chartPeriod,  setChartPeriod]  = useState("month");
  const [chartLoading, setChartLoading] = useState(false);

  // All 3 data arrays
  const [monthData, setMonthData] = useState([]);
  const [weekData,  setWeekData]  = useState([]);
  const [dayData,   setDayData]   = useState([]);

  // Dropdown selections (0-based)
  const [selMonth, setSelMonth] = useState(DEFAULT_MON);
  const [selWeek,  setSelWeek]  = useState(DEFAULT_WEEK);
  const [selDay,   setSelDay]   = useState(DEFAULT_DAY);

  // Dynamic day labels — array of { label, active }

  const [dayLabels, setDayLabels] = useState(
    () => buildDayLabels(DEFAULT_MON, DEFAULT_WEEK)
  );
  

  const [weekLabels, setWeekLabels] = useState(
    () => buildWeekLabels(new Date().getFullYear(), DEFAULT_MON)
  );

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const fallback = (count) =>
    Array.from({ length: count }, () => ({
      total_sales: 0, collected: 0, pending: 0, invoice_count: 0,
    }));

  // ── Overall stats ──────────────────────────────────────────────
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

  // ── Initial load: all 3 arrays in parallel ─────────────────────
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
      setDayLabels(buildDayLabels(DEFAULT_MON, DEFAULT_WEEK));
      setWeekLabels(buildWeekLabels(new Date().getFullYear(), DEFAULT_MON));
    } catch (err) {
      console.error("Initial chart load error:", err);
      setMonthData(fallback(12));
      setWeekData(fallback(4));
      setDayData(fallback(7));
    } finally {
      setChartLoading(false);
    }
  }, []);

  // ── Month changed → refetch week + day, reset both ─────────────
  const handleMonthChange = useCallback(async (monthIndex) => {
    setSelMonth(monthIndex);
    setSelWeek(0);
    const newDayIndex = getCurrentDayIndex(monthIndex, 0);
    setSelDay(newDayIndex);
    try {
      const [wData, dData] = await Promise.all([
        getChartStats("week", { month: monthIndex + 1 }),
        getChartStats("day",  { month: monthIndex + 1, week_of_month: 1 }),
      ]);
      setWeekData(wData);
      setDayData(dData);
      setDayLabels(buildDayLabels(monthIndex, 0));
      setWeekLabels(buildWeekLabels(new Date().getFullYear(), monthIndex));
    } catch (err) {
      console.error("Month change fetch error:", err);
      setWeekData(fallback(4));
      setDayData(fallback(7));
      setDayLabels(DAY_LABELS.map(l => ({ label: l, active: true })));
    }
  }, []);

  // ── Week changed → refetch day, reset day selection ────────────
  const handleWeekChange = useCallback(async (weekIndex) => {
    setSelWeek(weekIndex);
    const newDayIndex = getCurrentDayIndex(selMonth, weekIndex);
    setSelDay(newDayIndex);
    try {
      const dData = await getChartStats("day", {
        month:         selMonth + 1,
        week_of_month: weekIndex + 1,
      });
      setDayData(dData);
      setDayLabels(buildDayLabels(selMonth, weekIndex));
    } catch (err) {
      console.error("Week change fetch error:", err);
      setDayData(fallback(7));
      setDayLabels(DAY_LABELS.map(l => ({ label: l, active: true })));
    }
  }, [selMonth]);

  useEffect(() => { loadStats(); },       [loadStats]);
  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const graphData = chartPeriod === "day"  ? dayData
                  : chartPeriod === "week" ? weekData
                  : monthData;

  // For the day stats cards — inactive slots (prev/next month) use index 0
  // but their data slot will be zeros anyway (backend pads with zeros)
  const getSlot = (arr, index) =>
    arr[index] || { total_sales: 0, collected: 0, pending: 0, invoice_count: 0 };

  // Map selDay (which includes leading inactive slots) to actual data index
  // e.g. July Week 1 has 2 leading inactive slots, so selDay=2 → dataIndex=0
  const getDayDataIndex = () => {
    const wr = buildWeekRanges(new Date().getFullYear(), selMonth)[selWeek];
    if (!wr) return selDay;
    const weekStartDay = wr.start.getDay();
    const leadingSlots = weekStartDay === 0 ? 6 : weekStartDay - 1;
    return Math.max(0, selDay - leadingSlots);
  };

  const SkeletonSection = () => (
    <div className="summary-grid">
      <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
    </div>
  );

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

      {/* CHART */}
      <SalesChart
        chartData={graphData}
        loading={chartLoading}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
        weekLabels={weekLabels}
      />

      {loading ? (
        <>
          <div style={{ padding: "0.5rem 0", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
            Loading stats…
          </div>
          {["Today", "This Week", "This Month", "Overall"].map(t => (
            <React.Fragment key={t}>
              <h3 className="section-title">{t}</h3>
              <SkeletonSection />
            </React.Fragment>
          ))}
        </>
      ) : (
        <>
          {/* TODAY — uses dynamic dayLabels (objects with active flag) */}
          <SectionHeader
            title="Today"
            labels={dayLabels}
            selectedIndex={selDay}
            onChange={setSelDay}
          />
          <StatsCards slot={getSlot(dayData, getDayDataIndex())} />

          {/* THIS WEEK */}
          <SectionHeader
            title="This Week"
            labels={weekLabels}
            selectedIndex={selWeek}
            onChange={handleWeekChange}
          />
          <StatsCards slot={getSlot(weekData, selWeek)} />

          {/* THIS MONTH */}
          <SectionHeader
            title="This Month"
            labels={MONTH_LABELS}
            selectedIndex={selMonth}
            onChange={handleMonthChange}
          />
          <StatsCards slot={getSlot(monthData, selMonth)} />

          {/* OVERALL */}
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
