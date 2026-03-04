import React from "react";

const SummaryCard = ({ title, value, subtitle, icon, trend, trendUp }) => {
  return (
    <div className="summary-card">
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h4>{title}</h4>
      </div>

      <div className="card-value">{value}</div>
      <p className="card-subtitle">{subtitle}</p>

      {trend && (
        <div
          className="card-trend"
          style={{
            marginTop: "0.6rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            fontSize: "0.72rem",
            fontWeight: 700,
            padding: "0.18rem 0.6rem",
            borderRadius: "100px",
            background: trendUp
              ? "rgba(21,128,61,0.1)"
              : "rgba(220,38,38,0.1)",
            color: trendUp ? "#15803d" : "#dc2626",
          }}
        >
          {trendUp ? "↑" : "↓"} {trend}
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
