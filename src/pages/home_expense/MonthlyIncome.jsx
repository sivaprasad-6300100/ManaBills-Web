import React, { useState } from "react";
// import "../../styles/MonthlyExpeses.css";

const MonthlyIncome = () => {
  const [income, setIncome] = useState({
    salary: "",
    bonus: "",
    wifeTransfer: "",
  });

  const [fixedBills, setFixedBills] = useState([
    { name: "", amount: "", date: "", createdBy: "Husband" },
  ]);

  const handleIncomeChange = (e) => {
    setIncome({ ...income, [e.target.name]: e.target.value });
  };

  const handleBillChange = (index, field, value) => {
    const updated = [...fixedBills];
    updated[index][field] = value;
    setFixedBills(updated);
  };

  const addBill = () => {
    setFixedBills([
      ...fixedBills,
      { name: "", amount: "", date: "", createdBy: "Husband" },
    ]);
  };

  const deleteBill = (index) => {
    setFixedBills(fixedBills.filter((_, i) => i !== index));
  };

  // CALCULATIONS
  const totalIncome =
    Number(income.salary || 0) + Number(income.bonus || 0);

  const wifePersonal = Number(income.wifeTransfer || 0);

  const totalFixedBills = fixedBills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  );

  const remainingHousehold =
    totalIncome - wifePersonal - totalFixedBills;

  return (
    <div className="income-wrapper">
      <div className="income-card">

        {/* ===== HOUSEHOLD INCOME ===== */}
        <h3 className="section-title">💰 Household Income</h3>

        <div className="grid-2">
          <input
            type="number"
            name="salary"
            placeholder="Husband Salary"
            value={income.salary}
            onChange={handleIncomeChange}
          />

          <input
            type="number"
            name="bonus"
            placeholder="Bonus / Extra Income"
            value={income.bonus}
            onChange={handleIncomeChange}
          />
        </div>

        <div className="highlight-box income-box">
          <span>Total Household Income</span>
          <strong>₹ {totalIncome.toLocaleString()}</strong>
        </div>

        {/* ===== TRANSFER TO WIFE (SEPARATE) ===== */}
        <h3 className="section-title">🔁 Internal Transfer</h3>

        <div className="grid-1">
          <input
            type="number"
            name="wifeTransfer"
            placeholder="Amount Given to Wife (Personal Use)"
            value={income.wifeTransfer}
            onChange={handleIncomeChange}
          />
        </div>

        <div className="highlight-box transfer-box">
          <span>Wife Personal Wallet</span>
          <strong>₹ {wifePersonal.toLocaleString()}</strong>
        </div>

        {/* ===== FIXED BILLS ===== */}
        <h3 className="section-title">🏠 Fixed Bills</h3>

        {fixedBills.map((bill, index) => (
          <div className="bill-row" key={index}>
            <input
              type="text"
              placeholder="Bill Name"
              value={bill.name}
              onChange={(e) =>
                handleBillChange(index, "name", e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Amount"
              value={bill.amount}
              onChange={(e) =>
                handleBillChange(index, "amount", e.target.value)
              }
            />

            <input
              type="date"
              value={bill.date}
              onChange={(e) =>
                handleBillChange(index, "date", e.target.value)
              }
            />

            <select
              value={bill.createdBy}
              onChange={(e) =>
                handleBillChange(index, "createdBy", e.target.value)
              }
            >
              <option>Husband</option>
              <option>Wife</option>
              <option>Child</option>
            </select>

            {fixedBills.length > 1 && (
              <button
                className="delete-btn"
                onClick={() => deleteBill(index)}
              >
                ❌
              </button>
            )}
          </div>
        ))}

        <button className="add-btn" onClick={addBill}>
          ➕ Add Bill
        </button>

        <div className="highlight-box bills-box">
          <span>Total Fixed Bills</span>
          <strong>₹ {totalFixedBills.toLocaleString()}</strong>
        </div>

        <div className="remaining-box">
          <span>Remaining Household Balance</span>
          <strong>₹ {remainingHousehold.toLocaleString()}</strong>
        </div>

        <button className="save-btn">Save Monthly Overview</button>
      </div>
    </div>
  );
};

export default MonthlyIncome;
