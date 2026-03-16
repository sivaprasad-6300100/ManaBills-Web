import React, { useEffect, useState } from "react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const MonthlySummary = () => {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("expenses")) || [];
    setExpenses(saved);

    const incomeData = JSON.parse(localStorage.getItem("monthly_income")) || {};
    const key = `${selectedYear}-${selectedMonth}`;
    setIncome(incomeData[key] || 0);
  }, [selectedMonth, selectedYear]);

  // Filter expenses for selected month/year
  const filtered = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Group by category
  const byCategory = filtered.reduce((acc, exp) => {
    const cat = exp.category || "Uncategorised";
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += Number(exp.amount) || 0;
    return acc;
  }, {});

  const catEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const totalExpenses = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const balance = income - totalExpenses;

  // Day-wise totals for mini chart
  const dayMap = {};
  filtered.forEach((e) => {
    const day = new Date(e.date).getDate();
    dayMap[day] = (dayMap[day] || 0) + Number(e.amount);
  });
  const maxDay = Math.max(...Object.values(dayMap), 1);

  const years = [...new Set(expenses.map((e) => new Date(e.date).getFullYear()))];
  if (!years.includes(selectedYear)) years.push(selectedYear);
  years.sort((a, b) => b - a);

  return (
    <div className="summary-page">
      {/* Controls */}
      <div className="ms-header">
        <h2>Monthly Summary</h2>
        <div className="ms-controls">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="ms-period">
        {MONTHS[selectedMonth]} {selectedYear}
      </p>

      {/* KPI Row */}
      <div className="ms-kpi-row">
        <div className="ms-kpi green">
          <span>Monthly Income</span>
          <strong>₹ {income.toLocaleString()}</strong>
        </div>
        <div className="ms-kpi red">
          <span>Total Expenses</span>
          <strong>₹ {totalExpenses.toLocaleString()}</strong>
        </div>
        <div className={`ms-kpi ${balance >= 0 ? "blue" : "orange"}`}>
          <span>Balance</span>
          <strong>₹ {balance.toLocaleString()}</strong>
        </div>
        <div className="ms-kpi grey">
          <span>Transactions</span>
          <strong>{filtered.length}</strong>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ms-empty">
          <p>📅 No expenses recorded for {MONTHS[selectedMonth]} {selectedYear}.</p>
          <small>Add expenses from the Add Expense page to see them here.</small>
        </div>
      ) : (
        <>
          {/* Category Breakdown */}
          <div className="ms-section">
            <h3>Spending by Category</h3>
            <div className="ms-cat-list">
              {catEntries.map(([cat, amt]) => {
                const pct = totalExpenses > 0
                  ? Math.round((amt / totalExpenses) * 100)
                  : 0;
                return (
                  <div key={cat} className="ms-cat-row">
                    <div className="ms-cat-info">
                      <span className="ms-cat-name">{cat}</span>
                      <span className="ms-cat-pct">{pct}%</span>
                    </div>
                    <div className="ms-bar-track">
                      <div
                        className="ms-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="ms-cat-amt">
                      ₹ {amt.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day-wise Mini Chart */}
          <div className="ms-section">
            <h3>Day-wise Spending</h3>
            <div className="ms-day-chart">
              {Object.entries(dayMap)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([day, amt]) => (
                  <div key={day} className="ms-day-col">
                    <div
                      className="ms-day-bar"
                      style={{
                        height: `${Math.round((amt / maxDay) * 80)}px`,
                      }}
                      title={`Day ${day}: ₹${amt}`}
                    />
                    <span className="ms-day-label">{day}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Expense Table */}
          <div className="ms-section">
            <h3>All Transactions</h3>
            <table className="ms-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Paid By</th>
                  <th>Mode</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((exp) => (
                    <tr key={exp.id}>
                      <td>{exp.date}</td>
                      <td>{exp.category}</td>
                      <td>{exp.paidBy}</td>
                      <td>{exp.paymentMode}</td>
                      <td className="ms-amt">₹ {Number(exp.amount).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="ms-foot">
                  <td colSpan={4}>Total</td>
                  <td>₹ {totalExpenses.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlySummary;
