import React, { useEffect, useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const QUARTERS = [
  { label: "Q1 (Apr–Jun)", months: [3, 4, 5] },
  { label: "Q2 (Jul–Sep)", months: [6, 7, 8] },
  { label: "Q3 (Oct–Dec)", months: [9, 10, 11] },
  { label: "Q4 (Jan–Mar)", months: [0, 1, 2] },
];

const GstReports = () => {
  const [invoices, setInvoices] = useState([]);
  const [view, setView] = useState("monthly"); // "monthly" | "quarterly"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("invoices")) || [];
    const gstOnly = saved.filter((inv) => inv.isGST);
    setInvoices(gstOnly);
  }, []);

  const years = [
    ...new Set(
      invoices.map((inv) => new Date(inv.date).getFullYear()).filter(Boolean)
    ),
    selectedYear,
  ].sort((a, b) => b - a);

  const forYear = invoices.filter(
    (inv) => new Date(inv.date).getFullYear() === selectedYear
  );

  // Monthly data
  const monthlyData = MONTHS.map((month, idx) => {
    const monthInvoices = forYear.filter(
      (inv) => new Date(inv.date).getMonth() === idx
    );
    const taxableValue = monthInvoices.reduce(
      (s, inv) => s + (Number(inv.subtotal) || 0), 0
    );
    const gstCollected = monthInvoices.reduce(
      (s, inv) => s + (Number(inv.gst) || 0), 0
    );
    return {
      label: month,
      invoices: monthInvoices.length,
      taxableValue,
      gstCollected,
      total: taxableValue + gstCollected,
    };
  });

  // Quarterly data
  const quarterlyData = QUARTERS.map((q) => {
    const rows = q.months.map((m) => monthlyData[m]);
    return {
      label: q.label,
      invoices: rows.reduce((s, r) => s + r.invoices, 0),
      taxableValue: rows.reduce((s, r) => s + r.taxableValue, 0),
      gstCollected: rows.reduce((s, r) => s + r.gstCollected, 0),
      total: rows.reduce((s, r) => s + r.total, 0),
    };
  });

  const displayData = view === "monthly" ? monthlyData : quarterlyData;
  const grandTaxable = displayData.reduce((s, r) => s + r.taxableValue, 0);
  const grandGst = displayData.reduce((s, r) => s + r.gstCollected, 0);
  const grandTotal = displayData.reduce((s, r) => s + r.total, 0);

  return (
    <div className="gst-page">
      {/* Header */}
      <div className="gst-header">
        <div className="gst-title-wrap">
          <h2 className="gst-title">GST Reports</h2>
          <p className="gst-subtitle">
            Monthly &amp; quarterly GST summary for your business
          </p>
        </div>
        <div className="gst-controls">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="gst-select"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="gst-toggle-buttons">
            <button
              className={`gst-view-btn ${view === "monthly" ? "active" : ""}`}
              onClick={() => setView("monthly")}
            >
              Monthly
            </button>
            <button
              className={`gst-view-btn ${view === "quarterly" ? "active" : ""}`}
              onClick={() => setView("quarterly")}
            >
              Quarterly
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="gst-summary-row" role="region" aria-label="GST summary">
        <div className="gst-card blue">
          <span>Taxable Value</span>
          <strong>₹ {grandTaxable.toLocaleString()}</strong>
        </div>
        <div className="gst-card green">
          <span>GST Collected</span>
          <strong>₹ {grandGst.toLocaleString()}</strong>
        </div>
        <div className="gst-card purple">
          <span>Total Invoice Value</span>
          <strong>₹ {grandTotal.toLocaleString()}</strong>
        </div>
      </div>

      {/* Table */}
      {invoices.length === 0 ? (
        <div className="gst-empty">
          <p>📊 No GST invoices found.</p>
          <small>Enable GST while creating an invoice to see reports here.</small>
        </div>
      ) : (
        <div className="gst-table-wrap">
          <table className="gst-table">
            <thead>
              <tr>
                <th>{view === "monthly" ? "Month" : "Quarter"}</th>
                <th>Invoices</th>
                <th>Taxable Value (₹)</th>
                <th>GST Collected (₹)</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row) => (
                <tr
                  key={row.label}
                  className={row.invoices === 0 ? "gst-empty-row" : ""}
                >
                  <td>{row.label}</td>
                  <td>{row.invoices}</td>
                  <td>{row.taxableValue.toLocaleString()}</td>
                  <td className="gst-collected">
                    {row.gstCollected.toLocaleString()}
                  </td>
                  <td className="gst-total">
                    {row.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="gst-foot">
                <td>Total</td>
                <td>—</td>
                <td>{grandTaxable.toLocaleString()}</td>
                <td>{grandGst.toLocaleString()}</td>
                <td>{grandTotal.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="gst-note">
        * Only invoices created with GST enabled are included in this report.
      </p>
    </div>
  );
};

export default GstReports;
