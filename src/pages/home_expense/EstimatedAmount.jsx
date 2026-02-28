import React, { useState } from "react";

const EstimatedAmount = () => {
  // State for income
  const [income, setIncome] = useState(50000);

  // State for expenses
  const [expenses, setExpenses] = useState({
    rent: 0,
    emi: 0,
    electricity: 0,
    water: 0,
    internet: 0,
    groceries: 0,
    transport: 0,
    medical: 0,
    household: 0,
    misc: 0,
  });

  // Handle input change
  const handleChange = (key, value) => {
    setExpenses((prev) => ({
      ...prev,
      [key]: Number(value),
    }));
  };

  // Calculate total expenses
  const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);

  // Calculate savings
  const savings = income - totalExpenses;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>🏠 Monthly Home Expenses Tracker</h2>

      {/* Income input */}
      <div style={styles.row}>
        💰 <strong>Income:</strong>{" "}
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(Number(e.target.value))}
          style={styles.input}
        />
      </div>

      <hr style={styles.hr} />

      <h3 style={{ marginBottom: "10px" }}>📋 Fixed Expenses</h3>
      {["rent", "emi", "electricity", "water", "internet"].map((key) => (
        <div key={key} style={styles.row}>
          {getEmoji(key)} <strong>{formatKey(key)}:</strong>{" "}
          <input
            type="number"
            value={expenses[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            style={styles.input}
          />
        </div>
      ))}

      <h3 style={{ margin: "10px 0" }}>📋 Variable Expenses</h3>
      {["groceries", "transport", "medical", "household", "misc"].map((key) => (
        <div key={key} style={styles.row}>
          {getEmoji(key)} <strong>{formatKey(key)}:</strong>{" "}
          <input
            type="number"
            value={expenses[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            style={styles.input}
          />
        </div>
      ))}

      <hr style={styles.hr} />

      {/* Summary */}
      <div style={styles.row}>
        🧮 <strong>Total Expenses:</strong> ₹{totalExpenses}
      </div>

      <div
        style={{
          ...styles.savings,
          color: savings >= 0 ? "#16a34a" : "#dc2626",
        }}
      >
        💵 Estimated Savings: ₹{savings}
      </div>

      {/* Message */}
      <p style={{ marginTop: "16px", color: "#555" }}>
        Enter your monthly income and all expenses above. Track your spending
        and savings easily!
      </p>
    </div>
  );
};

// Helper functions
const formatKey = (key) => {
  switch (key) {
    case "rent":
      return "Rent / Mortgage";
    case "emi":
      return "EMI / Loans";
    case "electricity":
      return "Electricity Bill";
    case "water":
      return "Water Bill";
    case "internet":
      return "Internet / Mobile";
    case "groceries":
      return "Groceries / Food";
    case "transport":
      return "Transport / Fuel";
    case "medical":
      return "Medical / Health";
    case "household":
      return "Household Items";
    case "misc":
      return "Miscellaneous";
    default:
      return key;
  }
};

const getEmoji = (key) => {
  switch (key) {
    case "rent":
      return "🏠";
    case "emi":
      return "🧾";
    case "electricity":
      return "💡";
    case "water":
      return "💧";
    case "internet":
      return "🌐";
    case "groceries":
      return "🥦";
    case "transport":
      return "⛽";
    case "medical":
      return "🏥";
    case "household":
      return "🧹";
    case "misc":
      return "🎁";
    default:
      return "💸";
  }
};

// Styles
const styles = {
  container: {
    maxWidth: "550px",
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
    fontFamily: "sans-serif",
  },
  header: {
    marginBottom: "16px",
  },
  row: {
    marginBottom: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hr: {
    margin: "16px 0",
    opacity: 0.3,
  },
  savings: {
    marginTop: "14px",
    fontWeight: "800",
    fontSize: "1.1rem",
  },
  input: {
    width: "120px",
    padding: "6px 8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    textAlign: "right",
  },
};

export default EstimatedAmount;
