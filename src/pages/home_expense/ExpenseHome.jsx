import React from "react";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../../components/cards/SummaryCard";
import { FaPlus, FaWallet, FaList } from "react-icons/fa";
// import "../../styles/ExpenseHome.css";

const ExpenseHome = () => {
  const navigate = useNavigate();

  return (
    <div className="expense-home">

      {/* HERO BANNER (Same as Business Billing) */}
      <div className="expense-hero">
        <div>
          <h2>Home Expenses</h2>
          <p>Track daily spending, income and balance in one place</p>
        </div>

        <button
          className="hero-action"
          onClick={() =>
            navigate("/dashboard/home-expense/add-expense")
          }
        >
          + Add Expense
        </button>
      </div>

      {/* QUICK ACTION CARDS */}
      <div className="expense-actions-grid">
        <div
          className="expense-action-card"
          onClick={() =>
            navigate("/dashboard/home-expense/add-expense")
          }
        >
          <FaPlus />
          <span>Add Expense</span>
        </div>

        <div
          className="expense-action-card"
          onClick={() =>
            navigate("/dashboard/home-expense/monthly-income")
          }
        >
          <FaWallet />
          <span>Add Income</span>
        </div>

        <div
          className="expense-action-card"
          onClick={() =>
            navigate("/dashboard/home-expense/categories")
          }
        >
          <FaList />
          <span>Categories</span>
        </div>
      </div>

      {/* SUMMARY */}
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
