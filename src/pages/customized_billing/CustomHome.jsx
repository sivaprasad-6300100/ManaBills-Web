import React from "react";
import SummaryCard from "../../components/cards/SummaryCard";

const CustomHome = () => {
  return (
    <div>
      <h2>Customized Billing</h2>
      <p>Create custom estimates and personalized invoices</p>

      <div className="summary-grid">
        <SummaryCard
          title="Active Custom Estimates"
          value="5"
          subtitle="Currently in progress"
        />
        <SummaryCard
          title="Completed"
          value="12"
          subtitle="Delivered estimates"
        />
      </div>
    </div>
  );
};

export default CustomHome;
