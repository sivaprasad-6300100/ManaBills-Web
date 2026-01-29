import React from "react";
import SummaryCard from "../../components/cards/SummaryCard";

const ConstructionHome = () => {
  return (
    <div>
      <h2>Construction / Apartment Billing</h2>
      <p>Track project costs, bills, and payments</p>

      <div className="summary-grid">
        <SummaryCard
          title="Total Estimate"
          value="₹15,00,000"
          subtitle="Project estimate"
        />
        <SummaryCard
          title="Total Spent"
          value="₹9,40,000"
          subtitle="Till date"
        />
        <SummaryCard
          title="Pending Amount"
          value="₹5,60,000"
          subtitle="Remaining budget"
        />
      </div>
    </div>
  );
};

export default ConstructionHome;
