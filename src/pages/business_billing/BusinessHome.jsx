import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../../components/cards/SummaryCard";
import { getDashboardStats, getLowStockProducts } from "../../services/businessService";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// Skeleton loader component for better UX
const SkeletonCard = () => (
  <div style={{
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    animation: "pulse 1.5s ease-in-out infinite",
    height: "130px"
  }} />
);

const BusinessHome = () => {
  const navigate = useNavigate();

  const [stats,        setStats]        = useState({});
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [retryCount,   setRetryCount]   = useState(0);

  // Add pulse animation CSS dynamically
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

  // Optimized load function with timeout and retry
  const loadStats = useCallback(async (attempt = 0) => {
    try {
      setError(null);
      setLoading(true);

      // Set a timeout of 10 seconds for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

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
      const message = isTimeout 
        ? "Stats loading took too long. Retrying..." 
        : "Failed to load stats";
      
      console.error("BusinessHome: failed to load dashboard stats", err);
      setError(message);

      // Auto-retry up to 2 times if network error
      if (attempt < 2 && (isTimeout || err.code === "ERR_NETWORK")) {
        setRetryCount(attempt + 1);
        setTimeout(() => loadStats(attempt + 1), 2000 * (attempt + 1));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Field name mapping: backend uses snake_case, frontend used camelCase
  // Backend fields: today_sales, today_invoice_count, unpaid_amount,
  //   paid_amount, month_billing, month_invoice_count,
  //   total_billing, invoice_count, customer_count,
  //   stock_items, stock_value, low_stock_count

  return (
    <div className="business-home">

      {/* HERO */}
      <div className="business-hero">
        <div>
          <h2>Business Billing</h2>
          <p>Track sales, invoices, customers and GST in one place</p>
        </div>
        <button
          className="primary-action"
          onClick={() => navigate("create-invoice")}
        >
          + Create Invoice
        </button>
      </div>

      {/* QUICK ACTIONS */}
      <div className="business-quick-actions">
        <div className="business-quick-card" onClick={() => navigate("create-invoice")}>
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" alt="invoice" />
          <span>Create Invoice</span>
        </div>
        <div className="business-quick-card" onClick={() => navigate("products")}>
          <img src="https://cdn-icons-png.flaticon.com/512/679/679922.png" alt="stock" />
          <span>Manage Stock</span>
        </div>
        <div className="business-quick-card" onClick={() => navigate("customers")}>
          <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" alt="customers" />
          <span>Customers</span>
        </div>
        <div className="business-quick-card" onClick={() => navigate("invoices")}>
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135679.png" alt="history" />
          <span>Invoice History</span>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div
          style={{
            background: "#fee2e2", border: "1px solid #fecaca",
            borderRadius: "12px", padding: "12px 18px", marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between", alignItems: "center",
          }}
        >
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
                padding: "4px 12px",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600
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

      {loading ? (
        <>
          <div style={{ padding: "0.5rem 0", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
            Loading stats…
          </div>
          
          {/* KPI: TODAY */}
          <h3 className="section-title">Today</h3>
          <div className="summary-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>

          {/* KPI: THIS MONTH */}
          <h3 className="section-title">This Month</h3>
          <div className="summary-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>

          {/* KPI: STOCK */}
          <h3 className="section-title">Business Overview</h3>
          <div className="summary-grid">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </>
      ) : (
        <>
          {/* KPI: TODAY */}
          <h3 className="section-title">Today</h3>
          <div className="summary-grid">
            <SummaryCard
              title="Today's Sales"
              value={fmt(stats.today_sales)}
              subtitle={`${stats.today_invoice_count || 0} invoice${(stats.today_invoice_count || 0) !== 1 ? "s" : ""}`}
            />
            <SummaryCard
              title="Unpaid / Pending"
              value={fmt(stats.unpaid_amount)}
              subtitle="Outstanding balance"
            />
            <SummaryCard
              title="Total Collected"
              value={fmt(stats.paid_amount)}
              subtitle="Fully paid invoices"
            />
          </div>

          {/* KPI: THIS MONTH */}
          <h3 className="section-title">This Month</h3>
          <div className="summary-grid">
            <SummaryCard
              title="Month Billing"
              value={fmt(stats.month_billing)}
              subtitle={`${stats.month_invoice_count || 0} invoice${(stats.month_invoice_count || 0) !== 1 ? "s" : ""}`}
            />
            <SummaryCard
              title="Invoices Created"
              value={stats.invoice_count || 0}
              subtitle="All time total"
            />
            <SummaryCard
              title="Customers"
              value={stats.customer_count || 0}
              subtitle="Saved contacts"
            />
          </div>

          {/* KPI: STOCK */}
          <h3 className="section-title">Business Overview</h3>
          <div className="summary-grid">
            <SummaryCard
              title="Total Billing"
              value={fmt(stats.total_billing)}
              subtitle="All time revenue"
            />
            <SummaryCard
              title="Stock Products"
              value={stats.stock_items || 0}
              subtitle="Items in inventory"
            />
            <SummaryCard
              title="Stock Value"
              value={fmt(stats.stock_value)}
              subtitle="Inventory worth (selling)"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessHome;
