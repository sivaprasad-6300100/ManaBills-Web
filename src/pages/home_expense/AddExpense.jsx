import React from "react";

const AddExpense = () => {
  return (
    <div>
      <h2>Add Expense</h2>

      <div className="form-box">
        <input placeholder="Amount" />
        <input placeholder="Category" />
        <input placeholder="Date" type="date" />
        <textarea placeholder="Notes" />

        <button className="primary-btn">Save Expense</button>
      </div>
    </div>
  );
};

export default AddExpense;
