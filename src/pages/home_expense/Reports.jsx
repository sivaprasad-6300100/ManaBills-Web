import React, { useEffect, useState } from "react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const Reports = () => {
  const [expenses, setExpenses] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterPaidBy, setFilterPaidBy] = useState("All");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("expenses")) || [];
    setExpenses(saved);

    const cats = JSON.parse(localStorage.getItem("expense_categories")) || [];
    setCategories(cats);
  }, []);

  // Set default date range to current month
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    setFromDate(`${y}-${m}-01`);
    setToDate(`${y}-${m}-${new Date(y, now.getMonth() + 1, 0).getDate()}`);
  }, []);

  const filtered = expenses.filter((e) => {
    const d = new Date(e.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    const matchDate = (!from || d >= from) && (!to || d <= to);
    const matchCat = filterCategory === "All" || e.category === filterCategory;
    const matchPaidBy = filterPaidBy === "All" || e.paidBy === filterPaidBy;
    return matchDate && matchCat && matchPaidBy;
  });

  const totalAmount = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Group by month for summary
  const byMonth = filtered.reduce((acc, e) => {
    const d = new Date(e.date);
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!acc[key]) acc[key] = 0;
    acc[key] += Number(e.amount) || 0;
    return acc;
  }, {});

  // Export CSV
  const exportCSV = () => {
    if (filtered.length === 0) {
      alert("No data to export.");
      return;
    }

    const headers = ["Date", "Category", "Amount (₹)", "Paid By", "Payment Mode", "Notes"];
    const rows = filtered.map((e) => [
      e.date,
      e.category,
      e.amount,
      e.paidBy,
      e.paymentMode,
      e.notes || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense_report_${fromDate}_to_${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-page">
      <div className="rp-header">
        <div>
          <h2>Expense Reports</h2>
          <p className="rp-sub">Filter, analyse and export your spending data</p>
        </div>
        <button className="rp-export-btn" onClick={exportCSV}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rp-filters">
        <div className="rp-filter-group">
          <label>From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="rp-filter-group">
          <label>To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="rp-filter-group">
          <label>Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="rp-filter-group">
          <label>Paid By</label>
          <select
            value={filterPaidBy}
            onChange={(e) => setFilterPaidBy(e.target.value)}
          >
            <option value="All">All</option>
            <option>Husband</option>
            <option>Wife</option>
            <option>Child</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="rp-kpi-row">
        <div className="rp-kpi">
          <span>Total Transactions</span>
          <strong>{filtered.length}</strong>
        </div>
        <div className="rp-kpi red">
          <span>Total Spent</span>
          <strong>₹ {totalAmount.toLocaleString()}</strong>
        </div>
        <div className="rp-kpi">
          <span>Avg per Transaction</span>
          <strong>
            ₹ {filtered.length > 0 ? Math.round(totalAmount / filtered.length).toLocaleString() : 0}
          </strong>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rp-empty">
          <p>📊 No expenses match the selected filters.</p>
          <small>Try adjusting the date range or category filter.</small>
        </div>
      ) : (
        <>
          {/* Monthly Summary */}
          {Object.keys(byMonth).length > 1 && (
            <div className="rp-section">
              <h3>Month-wise Summary</h3>
              <div className="rp-month-grid">
                {Object.entries(byMonth).map(([month, amt]) => (
                  <div key={month} className="rp-month-card">
                    <span>{month}</span>
                    <strong>₹ {amt.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Table */}
          <div className="rp-section">
            <h3>Transactions ({filtered.length})</h3>
            <div className="rp-table-wrap">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Paid By</th>
                    <th>Mode</th>
                    <th>Notes</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filtered]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((exp, i) => (
                      <tr key={exp.id}>
                        <td>{i + 1}</td>
                        <td>{exp.date}</td>
                        <td>{exp.category}</td>
                        <td>{exp.paidBy}</td>
                        <td>{exp.paymentMode}</td>
                        <td className="rp-notes">{exp.notes || "—"}</td>
                        <td className="rp-amt">₹ {Number(exp.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="rp-foot">
                    <td colSpan={6}>Total</td>
                    <td>₹ {totalAmount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
