import React, { useEffect, useState } from "react";

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("invoices")) || [];
    setInvoices(saved.reverse());
  }, []);

  const deleteInvoice = (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    const updated = invoices.filter((inv) => inv.id !== id);
    setInvoices(updated);
    localStorage.setItem("invoices", JSON.stringify([...updated].reverse()));
  };

  const markPaid = (id) => {
    const updated = invoices.map((inv) =>
      inv.id === id ? { ...inv, status: "Paid" } : inv
    );
    setInvoices(updated);
    localStorage.setItem("invoices", JSON.stringify([...updated].reverse()));
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.id?.toString().includes(search);
    const matchStatus =
      filterStatus === "All" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalBilling = filtered.reduce(
    (sum, inv) => sum + (Number(inv.total) || 0),
    0
  );
  const totalPaid = filtered
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalPending = totalBilling - totalPaid;

  return (
    <div className="invoice-history-page">
      {/* Header */}
      <div className="ih-header">
        <div className="ih-title-wrap">
          <h2 className="ih-title">Invoice History</h2>
          <p className="ih-subtitle">{filtered.length} invoices found</p>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="ih-summary-row" role="status">
        <div className="ih-chip blue">
          <span>Total Billed</span>
          <strong>₹ {totalBilling.toLocaleString()}</strong>
        </div>
        <div className="ih-chip green">
          <span>Collected</span>
          <strong>₹ {totalPaid.toLocaleString()}</strong>
        </div>
        <div className="ih-chip red">
          <span>Pending</span>
          <strong>₹ {totalPending.toLocaleString()}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="ih-filters">
        <div className="ih-search-wrap">
          <input
            className="ih-search"
            placeholder="🔍  Search by customer or invoice no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ih-status-tabs">
          {["All", "Paid", "Pending", "Partial"].map((s) => (
            <button
              key={s}
              className={`ih-tab ${filterStatus === s ? "active" : ""}`}
              onClick={() => setFilterStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
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
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => (
                <tr key={inv.id}>
                  <td>{i + 1}</td>
                  <td className="inv-id">#{inv.id || "—"}</td>
                  <td>
                    <div className="inv-customer">{inv.customerName || "—"}</div>
                    <small>{inv.mobile || ""}</small>
                  </td>
                  <td>{inv.date || "—"}</td>
                  <td className="inv-amount">₹ {Number(inv.total || 0).toLocaleString()}</td>
                  <td className="ih-status-cell">
                    <span className={`ih-badge ${(inv.status || "pending").toLowerCase()}`}>
                      {inv.status || "Pending"}
                    </span>
                  </td>
                  <td className="ih-actions-cell">
                    <div className="ih-actions">
                      {inv.status !== "Paid" && (
                        <button
                          className="ih-btn paid"
                          onClick={() => markPaid(inv.id)}
                        >
                        ✓ Paid
                      </button>
                    )}
                        <button
                          className="ih-btn del"
                          onClick={() => deleteInvoice(inv.id)}
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
