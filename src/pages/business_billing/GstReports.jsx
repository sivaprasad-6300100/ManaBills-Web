import React, { useEffect, useState } from "react";
import { getGstReports } from "../../services/businessService";

// ─── Backend returns exactly this shape per row ───────────────
// { month, invoice_count, taxable_value, gst_collected, total_value }

const GstReports = () => {
  const [reportData,   setReportData]   = useState([]);
  const [view,         setView]         = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading,      setLoading]      = useState(true);
  const [years,        setYears]        = useState([new Date().getFullYear()]);

  // ── Load from API whenever year or view changes ───────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getGstReports(selectedYear, view);
        setReportData(data);
      } catch {
        setReportData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedYear, view]);

  // ── Build year list: current year ± a few ─────────────────
  useEffect(() => {
    const cur = new Date().getFullYear();
    setYears([cur - 1, cur, cur + 1]);
  }, []);

  // ── Grand totals ──────────────────────────────────────────
  const grandInvoices  = reportData.reduce((s, r) => s + (r.invoice_count || 0), 0);
  const grandTaxable   = reportData.reduce((s, r) => s + Number(r.taxable_value || 0), 0);
  const grandGst       = reportData.reduce((s, r) => s + Number(r.gst_collected || 0), 0);
  const grandTotal     = reportData.reduce((s, r) => s + Number(r.total_value   || 0), 0);

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

      {/* Summary cards */}
      <div className="gst-summary-row" role="region" aria-label="GST summary">
        <div className="gst-card blue">
          <span>GST Invoices</span>
          <strong>{grandInvoices}</strong>
        </div>
        <div className="gst-card blue">
          <span>Taxable Value</span>
          <strong>₹ {grandTaxable.toLocaleString("en-IN")}</strong>
        </div>
        <div className="gst-card green">
          <span>GST Collected (5%)</span>
          <strong>₹ {grandGst.toLocaleString("en-IN")}</strong>
        </div>
        <div className="gst-card purple">
          <span>Total Invoice Value</span>
          <strong>₹ {grandTotal.toLocaleString("en-IN")}</strong>
        </div>
      </div>

      {/* Empty state */}
      {!loading && grandInvoices === 0 ? (
        <div className="gst-empty">
          <p>📊 No GST invoices found for {selectedYear}.</p>
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
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>
                    Loading…
                  </td>
                </tr>
              ) : (
                reportData.map((row) => (
                  <tr
                    key={row.month}
                    className={row.invoice_count === 0 ? "gst-empty-row" : ""}
                  >
                    <td>{row.month}</td>
                    <td>{row.invoice_count || "—"}</td>
                    <td>
                      {Number(row.taxable_value) > 0
                        ? Number(row.taxable_value).toLocaleString("en-IN")
                        : "—"}
                    </td>
                    <td className="gst-collected">
                      {Number(row.gst_collected) > 0
                        ? Number(row.gst_collected).toLocaleString("en-IN")
                        : "—"}
                    </td>
                    <td className="gst-total">
                      {Number(row.total_value) > 0
                        ? Number(row.total_value).toLocaleString("en-IN")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="gst-foot">
                <td>Total ({selectedYear})</td>
                <td>{grandInvoices}</td>
                <td>{grandTaxable.toLocaleString("en-IN")}</td>
                <td>{grandGst.toLocaleString("en-IN")}</td>
                <td>{grandTotal.toLocaleString("en-IN")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="gst-note">
        * Only invoices created with GST enabled are included in this report.
        GST rate applied: <strong>5%</strong> on taxable value.
      </p>
    </div>
  );
};

export default GstReports;
