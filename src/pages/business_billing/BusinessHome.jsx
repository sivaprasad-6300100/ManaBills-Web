import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../../components/cards/SummaryCard";
import { getDashboardStats, getChartStats } from "../../services/businessService";


const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtShort = (n) => {
  const num = Number(n || 0);
  if (num >= 100000) return "₹" + (num / 100000).toFixed(1) + "L";
  if (num >= 1000) return "₹" + (num / 1000).toFixed(1) + "K";
  return "₹" + num.toLocaleString("en-IN");
};

const SkeletonCard = () => (
  <div style={{
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    animation: "pulse 1.5s ease-in-out infinite",
    height: "110px"
  }} />
);

// ── CHART COMPONENT ─────────────────────────────────────────────
const CHART_METRICS = [
  { key: "total_sales",    label: "Total Sales",   color: "#6366f1" },
  { key: "collected",      label: "Collected",     color: "#10b981" },
  { key: "pending",        label: "Pending",       color: "#f59e0b" },
  { key: "invoice_count",  label: "Invoices",      color: "#3b82f6", isCount: true },
];

const DAY_LABELS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_LABELS  = ["Week 1", "Week 2", "Week 3", "Week 4"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

  // Determine max value for scaling
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
      background: "#fff",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
      border: "1px solid #f0f0f0",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
          Sales Overview
        </h3>
        {/* Period toggle */}
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "3px", gap: "2px" }}>
          {[["day","Day"], ["week","Week"], ["month","Month"]].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => onPeriodChange(val)}
              style={{
                padding: "5px 14px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: 600,
                background: period === val ? "#6366f1" : "transparent",
                color: period === val ? "#fff" : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Legend / metric toggles */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
        {CHART_METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "4px 10px", borderRadius: "20px", border: "none",
              cursor: "pointer", fontSize: "0.73rem", fontWeight: 600,
              background: activeMetrics.includes(m.key) ? m.color + "18" : "#f1f5f9",
              color: activeMetrics.includes(m.key) ? m.color : "#94a3b8",
              transition: "all 0.15s",
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: activeMetrics.includes(m.key) ? m.color : "#cbd5e1",
              display: "inline-block",
            }} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
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
            {/* Y gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => (
              <g key={pct}>
                <line
                  x1={30} y1={chartH - chartH * pct + 10}
                  x2={Math.max(560, labels.length * barGroupWidth + 40) - 10}
                  y2={chartH - chartH * pct + 10}
                  stroke="#f1f5f9" strokeWidth={1}
                />
                <text
                  x={28} y={chartH - chartH * pct + 14}
                  textAnchor="end" fontSize={9} fill="#94a3b8"
                >
                  {pct === 0 ? "0" : fmtShort(maxVal * pct).replace("₹","").trim()}
                </text>
              </g>
            ))}

            {/* Bars */}
            {labels.map((label, i) => {
              const d      = (chartData && chartData[i]) || {};
              const groupX = 36 + i * barGroupWidth;
              const totalGroupW = barWidth * activeMetrics.length + (activeMetrics.length - 1) * 3;
              const startX = groupX + (barGroupWidth - totalGroupW) / 2;

              return (
                <g key={label}
                  onMouseEnter={() => setTooltip({ i, d, label, x: groupX + barGroupWidth / 2 })}
                >
                  {activeMetrics.map((mKey, mi) => {
                    const metric = CHART_METRICS.find(cm => cm.key === mKey);
                    const rawVal = metric?.isCount ? (d[mKey] || 0) * 500 : (d[mKey] || 0);
                    const barH   = Math.max(2, (rawVal / maxVal) * chartH);
                    const x      = startX + mi * (barWidth + 3);
                    const y      = chartH - barH + 10;
                    return (
                      <rect
                        key={mKey}
                        x={x} y={y}
                        width={barWidth} height={barH}
                        rx={3}
                        fill={metric.color}
                        opacity={tooltip?.i === i ? 1 : 0.82}
                        style={{ transition: "opacity 0.1s" }}
                      />
                    );
                  })}
                  {/* X label */}
                  <text
                    x={groupX + barGroupWidth / 2}
                    y={chartH + 26}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#64748b"
                    fontWeight={tooltip?.i === i ? 700 : 400}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Tooltip */}
            {tooltip && (() => {
              const d    = tooltip.d;
              const tipW = 140;
              const tipX = Math.min(tooltip.x - tipW / 2, Math.max(560, labels.length * barGroupWidth + 40) - tipW - 10);
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

// ── MAIN COMPONENT ───────────────────────────────────────────────
const BusinessHome = () => {
  const navigate = useNavigate();

  const [stats,         setStats]         = useState({});
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [retryCount,    setRetryCount]    = useState(0);

  // Chart state
  const [chartPeriod,   setChartPeriod]   = useState("month");
  const [chartData,     setChartData]     = useState([]);
  const [chartLoading,  setChartLoading]  = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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
      const message   = isTimeout
        ? "Stats loading took too long. Retrying..."
        : "Failed to load stats";

      console.error("BusinessHome: failed to load dashboard stats", err);
      setError(message);

      if (attempt < 2 && (isTimeout || err.code === "ERR_NETWORK")) {
        setRetryCount(attempt + 1);
        setTimeout(() => loadStats(attempt + 1), 2000 * (attempt + 1));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load chart data from backend ──

  // const loadChartData = useCallback(async (period) => {
  // setChartLoading(true);
  // try {
    // ✅ Use the same token source as getDashboardStats (your businessService)
    // If businessService uses axios with an interceptor, call it the same way:
    // const token = localStorage.getItem("access") 
              //  || localStorage.getItem("token") 
              //  || localStorage.getItem("authToken")  // try all possible keys
              //  || "";

    // ✅ No window.__API_BASE__ — use a plain relative URL
    // const res = await fetch(`/api/business/chart-stats/?period=${period}`, {
      // headers: { 
        // Authorization: `Bearer ${token}`,
        // "Content-Type": "application/json",
      // },
    // });

    // ✅ Log the actual error instead of silently failing
    // if (!res.ok) {
      // console.error(`Chart fetch failed: ${res.status} ${res.statusText}`);
      // const text = await res.text();
      // console.error("Response body:", text);
      // throw new Error(`Chart fetch failed: ${res.status}`);
    // }

    // const data = await res.json();
    // setChartData(data);
  // } catch (err) {
    // console.error("Chart data error:", err);
    // Fallback to zeroes so chart renders axes
    // const counts = { day: 7, week: 4, month: 12 };
    // setChartData(Array.from({ length: counts[period] }, () => ({
      // total_sales: 0, collected: 0, pending: 0, invoice_count: 0,
    // })));
  // } finally {
    // setChartLoading(false);
  // }
// }, []);


const loadChartData = useCallback(async (period) => {
  setChartLoading(true);
  try {
    const data = await getChartStats(period);
    setChartData(data);
  } catch (err) {
    console.error("Chart data error:", err);
    const counts = { day: 7, week: 4, month: 12 };
    setChartData(Array.from({ length: counts[period] }, () => ({
      total_sales: 0, collected: 0, pending: 0, invoice_count: 0,
    })));
  } finally {
    setChartLoading(false);
  }
}, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadChartData(chartPeriod); }, [chartPeriod, loadChartData]);

  const plural = (n) => `${n || 0} invoice${(n || 0) !== 1 ? "s" : ""}`;

  const SkeletonSection = () => (
    <div className="summary-grid">
      <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
    </div>
  );

  return (
    <div className="business-home">

      {/* ERROR STATE */}
      {error && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fecaca",
          borderRadius: "12px", padding: "12px 18px", marginBottom: "20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "0.85rem", color: "#991b1b", fontWeight: 600 }}>
            ❌ {error}
          </span>
          {retryCount > 0 && (
            <span style={{ fontSize: "0.8rem", color: "#dc2626" }}>
              Retry {retryCount}...
            </span>
          )}
          {retryCount === 2 && (
            <button
              onClick={() => loadStats()}
              style={{
                padding: "4px 12px", background: "#dc2626", color: "#fff",
                border: "none", borderRadius: "6px", cursor: "pointer",
                fontSize: "0.8rem", fontWeight: 600,
              }}
            >
              Retry Now
            </button>
          )}
        </div>
      )}

      {/* LOW STOCK ALERT */}
      {lowStockCount > 0 && (
        <div
          onClick={() => navigate("products")}
          style={{
            background: "#fff7ed", border: "1px solid #fed7aa",
            borderRadius: "12px", padding: "12px 18px", marginBottom: "6px",
            cursor: "pointer", display: "flex",
            justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "#c2410c", fontWeight: 600 }}>
            ⚠️ {lowStockCount} item{lowStockCount > 1 ? "s" : ""} running low on stock
          </span>
          <span style={{ fontSize: "0.8rem", color: "#ea580c" }}>View →</span>
        </div>
      )}

      {/* ── GRAPH SECTION ── */}
      <SalesChart
        chartData={chartData}
        loading={chartLoading}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
      />

      {loading ? (
        <>
          <div style={{ padding: "0.5rem 0", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
            Loading stats…
          </div>
          <h3 className="section-title">Today</h3>
          <SkeletonSection />
          <h3 className="section-title">This Week</h3>
          <SkeletonSection />
          <h3 className="section-title">This Month</h3>
          <SkeletonSection />
          <h3 className="section-title">Overall</h3>
          <SkeletonSection />
        </>
      ) : (
        <>
          {/* ── TODAY ── */}
          <h3 className="section-title">Today</h3>
          <div className="summary-grid">
            <SummaryCard title="Invoices"    value={stats.today_invoice_count || 0}  subtitle="bills raised today" />
            <SummaryCard title="Total Sales" value={fmt(stats.today_sales)}           subtitle="gross billed today" />
            <SummaryCard title="Pending"     value={fmt(stats.today_unpaid_amount)}   subtitle="outstanding today" />
            <SummaryCard title="Collected"   value={fmt(stats.today_paid_amount)}     subtitle="received today" />
          </div>

          {/* ── THIS WEEK ── */}
          <h3 className="section-title">This Week</h3>
          <div className="summary-grid">
            <SummaryCard title="Invoices"    value={stats.week_invoice_count || 0}    subtitle="last 7 days" />
            <SummaryCard title="Total Sales" value={fmt(stats.week_billing)}           subtitle="gross billed" />
            <SummaryCard title="Pending"     value={fmt(stats.week_unpaid_amount)}     subtitle="outstanding" />
            <SummaryCard title="Collected"   value={fmt(stats.week_paid_amount)}       subtitle="received" />
          </div>

          {/* ── THIS MONTH ── */}
          <h3 className="section-title">This Month</h3>
          <div className="summary-grid">
            <SummaryCard title="Invoices"    value={stats.month_invoice_count || 0}   subtitle={plural(stats.month_invoice_count)} />
            <SummaryCard title="Total Sales" value={fmt(stats.month_billing)}          subtitle="gross billed" />
            <SummaryCard title="Pending"     value={fmt(stats.unpaid_amount)}          subtitle="outstanding" />
            <SummaryCard title="Collected"   value={fmt(stats.paid_amount)}            subtitle="received" />
          </div>

          {/* ── OVERALL ── */}
          <h3 className="section-title">Overall</h3>
          <div className="summary-grid">
            <SummaryCard title="Invoices"    value={stats.invoice_count || 0}          subtitle="all time" />
            <SummaryCard title="Total Sales" value={fmt(stats.total_billing)}          subtitle="all time revenue" />
            <SummaryCard title="Pending"     value={fmt(stats.total_unpaid_amount)}    subtitle="still outstanding" />
            <SummaryCard title="Collected"   value={fmt(stats.total_paid_amount)}      subtitle="total received" />
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessHome;
