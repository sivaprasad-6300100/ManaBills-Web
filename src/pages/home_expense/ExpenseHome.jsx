import React from "react";
import SummaryCard from "../../components/cards/SummaryCard";

const ExpenseHome = () => {
  return (
    <div>
      <h2>Home Expense Tracker</h2>
      <p>Track your daily expenses and monthly balance</p>

      <div className="summary-grid">
        <SummaryCard
          title="Monthly Income"
          value="₹60,000"
          subtitle="This month"
        />
        <SummaryCard
          title="Total Expenses"
          value="₹35,500"
          subtitle="This month"
        />
        <SummaryCard
          title="Remaining Balance"
          value="₹24,500"
          subtitle="Available"
        />
      </div>
    </div>
  );
};

export default ExpenseHome;
