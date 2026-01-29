import React from "react";

const SubscriptionPlanCard = ({ plan, price, features, onSubscribe, active }) => {
  return (
    <div
      className={`subscription-card ${active ? "active" : ""}`}
      style={{
        border: active ? "2px solid #0f172a" : "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "20px",
        margin: "10px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        width: "250px",
      }}
    >
      <h3 style={{ marginBottom: "10px" }}>{plan}</h3>
      <p style={{ fontWeight: "600", marginBottom: "10px" }}>₹{price} / month</p>

      <ul style={{ marginBottom: "15px", paddingLeft: "20px" }}>
        {features.map((f, i) => (
          <li key={i} style={{ marginBottom: "5px" }}>
            {f}
          </li>
        ))}
      </ul>

      <button
        className="primary-btn"
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#0f172a",
          color: "#fff",
          borderRadius: "6px",
        }}
        onClick={onSubscribe}
      >
        {active ? "Subscribed" : "Subscribe"}
      </button>
    </div>
  );
};

export default SubscriptionPlanCard;
