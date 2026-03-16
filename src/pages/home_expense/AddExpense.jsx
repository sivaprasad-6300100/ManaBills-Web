import React, { useEffect, useState } from "react";

const DEFAULT_CATEGORIES = [
  "🥦 Groceries",
  "⛽ Transport / Fuel",
  "💡 Electricity",
  "💧 Water",
  "🌐 Internet / Mobile",
  "🏠 Rent / EMI",
  "🏥 Medical",
  "🎓 Education",
  "🎁 Miscellaneous",
];

const AddExpense = () => {
  const [form, setForm] = useState({
    amount: "",
    category: "",
    customCategory: "",
    date: new Date().toISOString().split("T")[0],
    paidBy: "Husband",
    paymentMode: "Cash",
    notes: "",
  });
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedCats = JSON.parse(localStorage.getItem("expense_categories")) || [];
    if (savedCats.length > 0) setCategories(savedCats);

    const expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    setRecentExpenses(expenses.slice(-5).reverse());
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.amount || !form.category) {
      alert("Please enter Amount and select a Category.");
      return;
    }

    const finalCategory =
      form.category === "__custom__" ? form.customCategory : form.category;

    if (!finalCategory.trim()) {
      alert("Please enter a custom category name.");
      return;
    }

    const expense = {
      id: Date.now(),
      amount: Number(form.amount),
      category: finalCategory,
      date: form.date,
      paidBy: form.paidBy,
      paymentMode: form.paymentMode,
      notes: form.notes,
    };

    const existing = JSON.parse(localStorage.getItem("expenses")) || [];
    const updated = [...existing, expense];
    localStorage.setItem("expenses", JSON.stringify(updated));

    setRecentExpenses(updated.slice(-5).reverse());
    setForm({
      amount: "",
      category: "",
      customCategory: "",
      date: new Date().toISOString().split("T")[0],
      paidBy: "Husband",
      paymentMode: "Cash",
      notes: "",
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const deleteRecent = (id) => {
    const existing = JSON.parse(localStorage.getItem("expenses")) || [];
    const updated = existing.filter((e) => e.id !== id);
    localStorage.setItem("expenses", JSON.stringify(updated));
    setRecentExpenses(updated.slice(-5).reverse());
  };

  return (
    <div className="add-expense-page">
      <div className="ae-card">
        <h2>➕ Add Expense</h2>

        {saved && (
          <div className="ae-success">✅ Expense saved successfully!</div>
        )}

        <div className="ae-grid">
          {/* Amount */}
          <div className="ae-field full">
            <label>Amount (₹) *</label>
            <input
              type="number"
              name="amount"
              placeholder="Enter amount"
              value={form.amount}
              onChange={handleChange}
            />
          </div>

          {/* Category */}
          <div className="ae-field full">
            <label>Category *</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="">-- Select Category --</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom__">+ Add Custom</option>
            </select>
          </div>

          {form.category === "__custom__" && (
            <div className="ae-field full">
              <label>Custom Category Name</label>
              <input
                type="text"
                name="customCategory"
                placeholder="e.g. Gym, Subscription..."
                value={form.customCategory}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Date */}
          <div className="ae-field">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </div>

          {/* Paid By */}
          <div className="ae-field">
            <label>Paid By</label>
            <select name="paidBy" value={form.paidBy} onChange={handleChange}>
              <option>Husband</option>
              <option>Wife</option>
              <option>Child</option>
              <option>Other</option>
            </select>
          </div>

          {/* Payment Mode */}
          <div className="ae-field">
            <label>Payment Mode</label>
            <select
              name="paymentMode"
              value={form.paymentMode}
              onChange={handleChange}
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Net Banking</option>
              <option>PhonePe</option>
              <option>GPay</option>
            </select>
          </div>

          {/* Notes */}
          <div className="ae-field full">
            <label>Notes (optional)</label>
            <textarea
              name="notes"
              placeholder="Any extra details..."
              value={form.notes}
              onChange={handleChange}
              rows={2}
            />
          </div>
        </div>

        <button className="ae-save-btn" onClick={handleSubmit}>
          Save Expense
        </button>
      </div>

      {/* Recent Expenses */}
      {recentExpenses.length > 0 && (
        <div className="ae-recent">
          <h3>🕐 Recent Entries</h3>
          <ul className="ae-recent-list">
            {recentExpenses.map((exp) => (
              <li key={exp.id} className="ae-recent-item">
                <div className="ae-recent-left">
                  <span className="ae-cat">{exp.category}</span>
                  <small>{exp.date} · {exp.paidBy} · {exp.paymentMode}</small>
                </div>
                <div className="ae-recent-right">
                  <span className="ae-amt">₹ {exp.amount.toLocaleString()}</span>
                  <button
                    className="ae-del"
                    onClick={() => deleteRecent(exp.id)}
                  >
                    ✖
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddExpense;
