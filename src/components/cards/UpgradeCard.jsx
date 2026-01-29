import React from "react";
import { useNavigate } from "react-router-dom";

const UpgradeCard = () => {
  const navigate = useNavigate();

  return (
    <div className="upgrade-card">
      <h3>No Active Subscription</h3>
      <p>Choose a plan to unlock powerful features.</p>
      <button onClick={() => navigate("/subscription")}>
        View Plans
      </button>
    </div>
  );
};

export default UpgradeCard;
