import React from "react";

const SummaryCard = ({ title, value, subtitle }) => {
  return (
    <div className="summary-card">
      <h4>{title}</h4>
      <h2>{value}</h2>
      <p>{subtitle}</p>
    </div>
  );
};

export default SummaryCard;
