import React, { useEffect, useState } from "react";
import {
  getInvoices,
  markInvoicePaid,
  deleteInvoice,
} from "../../services/businessService";

const InvoiceHistory = () => {
  const [invoices,      setInvoices]      = useState([]);
  const [search,        setSearch]        = useState("");
  const [filterStatus,  setFilterStatus]  = useState("All");
  const [filterPayment, setFilterPayment] = useState("All");
  const [loading,       setLoading]       = useState(true);
  const [toast,         setToast]         = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load invoices from API ────────────────────────────────
  const loadInvoices = async (params = {}) => {
    setLoading(true);
    try {
      const data = await getInvoices(params);
      setInvoices(data);
    } catch {
      showToast("Failed to load invoices.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // ── Apply filters — send to backend as query params ───────
  useEffect(() => {
    const params = {};
    if (search)                        params.search  = search;
    if (filterStatus  !== "All")       params.status  = filterStatus;
    if (filterPayment !== "All")       params.payment = filterPayment;

    const timer = setTimeout(() => loadInvoices(params), 350);
    return () => clearTimeout(timer);
  }, [search, filterStatus, filterPayment]);

  // ── Mark paid ─────────────────────────────────────────────
  const handleMarkPaid = async (id) => {
    try {
      const updated = await markInvoicePaid(id);
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === updated.id ? updated : inv))
      );
      showToast("Invoice marked as paid ✓");
    } catch {
      showToast("Failed to update invoice.", "error");
    }
  };

  // ── Delete invoice ────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    try {
      await deleteInvoice(id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      showToast("Invoice deleted.");
    } catch {
      showToast("Failed to delete invoice.", "error");
    }
  };

  // ── Summary stats (computed from current list) ────────────
  // Backend fields: total (Decimal as string), advance, balance
  const totalBilling = invoices.reduce((s, inv) => s + Number(inv.total   || 0), 0);
  const totalPaid    = invoices.reduce((s, inv) => s + Number(inv.advance || 0), 0);
  const totalPending = invoices.reduce((s, inv) => s + Number(inv.balance || 0), 0);

  // ── Payment modes (dynamic list from loaded data) ─────────
  const paymentModes = ["All", ...new Set(invoices.map((i) => i.payment).filter(Boolean))];

  // ── Status badge class ────────────────────────────────────
  const badgeClass = (status) => {
    switch ((status || "Pending").toLowerCase()) {
      case "paid":    return "paid";
      case "partial": return "partial";
      default:        return "pending";
    }
  };

  return (
    <div className="invoice-history-page">

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "72px", left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, padding: "10px 24px", borderRadius: "100px",
          fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap",
          background: toast.type === "success" ? "#0e1b2e" : "#dc2626",
          color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="ih-header">
        <div className="ih-title-wrap">
          <h2 className="ih-title">Invoice History</h2>
          <p className="ih-subtitle">
            {loading ? "Loading…" : `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="ih-summary-row" role="status">
        <div className="ih-chip blue">
          <span>Total Billed</span>
          <strong>₹ {totalBilling.toLocaleString("en-IN")}</strong>
        </div>
        <div className="ih-chip green">
          <span>Collected</span>
          <strong>₹ {totalPaid.toLocaleString("en-IN")}</strong>
        </div>
        <div className="ih-chip red">
          <span>Pending</span>
          <strong>₹ {totalPending.toLocaleString("en-IN")}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="ih-filters">
        <div className="ih-search-wrap">
          <input
            className="ih-search"
            placeholder="🔍  Search by customer, invoice no or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status tabs */}
        <div className="ih-status-tabs">
          {["All", "Paid", "Partial", "Pending"].map((s) => (
            <button
              key={s}
              className={`ih-tab ${filterStatus === s ? "active" : ""}`}
              onClick={() => setFilterStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Payment mode filter */}
        {paymentModes.length > 2 && (
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            style={{
              padding: "8px 12px", borderRadius: "8px",
              border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff",
            }}
          >
            {paymentModes.map((m) => (
              <option key={m} value={m}>{m === "All" ? "All Payments" : m}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="ih-empty"><p>Loading invoices…</p></div>
      ) : invoices.length === 0 ? (
        <div className="ih-empty">
          <p>📄 No invoices found.</p>
          <small>Invoices you create will appear here.</small>
        </div>
      ) : (
        <div className="ih-table-wrap">
          <table className="ih-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={inv.id}>
                  <td>{i + 1}</td>

                  {/* Invoice No — backend field: invoice_id */}
                  <td className="inv-id">
                    <span style={{ fontSize: "0.78rem" }}>{inv.invoice_id || "—"}</span>
                    {inv.is_gst && (
                      <span style={{
                        marginLeft: "5px", fontSize: "0.6rem", fontWeight: 700,
                        background: "#dbeafe", color: "#1d4ed8",
                        padding: "1px 6px", borderRadius: "100px",
                      }}>
                        GST
                      </span>
                    )}
                  </td>

                  {/* Customer — backend fields: customer_name, customer_mobile */}
                  <td>
                    <div className="inv-customer">{inv.customer_name || "—"}</div>
                    {inv.customer_mobile && (
                      <small style={{ color: "#64748b" }}>{inv.customer_mobile}</small>
                    )}
                  </td>

                  {/* Date — backend field: date (DD/MM/YYYY) */}
                  <td style={{ fontSize: "0.83rem", color: "#64748b" }}>
                    {inv.date || "—"}
                  </td>

                  {/* Payment mode */}
                  <td style={{ fontSize: "0.83rem" }}>{inv.payment || "—"}</td>

                  {/* Amount — backend fields: total, discount */}
                  <td className="inv-amount">
                    ₹ {Number(inv.total || 0).toLocaleString("en-IN")}
                    {Number(inv.discount || 0) > 0 && (
                      <div style={{ fontSize: "0.68rem", color: "#16a34a" }}>
                        -₹{inv.discount} disc
                      </div>
                    )}
                  </td>

                  {/* Balance — backend field: balance */}
                  <td style={{
                    fontWeight: 600,
                    color: Number(inv.balance || 0) > 0 ? "#dc2626" : "#16a34a",
                    fontSize: "0.88rem",
                  }}>
                    ₹ {Number(inv.balance || 0).toLocaleString("en-IN")}
                  </td>

                  {/* Status */}
                  <td className="ih-status-cell">
                    <span className={`ih-badge ${badgeClass(inv.status)}`}>
                      {inv.status || "Pending"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="ih-actions-cell">
                    <div className="ih-actions">
                      {inv.status !== "Paid" && (
                        <button
                          className="ih-btn paid"
                          onClick={() => handleMarkPaid(inv.id)}
                          title="Mark as fully paid"
                        >
                          ✓ Paid
                        </button>
                      )}
                      <button
                        className="ih-btn del"
                        onClick={() => handleDelete(inv.id)}
                        title="Delete invoice"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
