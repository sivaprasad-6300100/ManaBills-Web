import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import "../../styles/subscription.css"; // make sure path is correct

const ConstructionSubscription = () => {
  const navigate = useNavigate();
  const { subscriptions, subscribe } = useContext(SubscriptionContext);

  const plans = [
    {
      key: "construction_free",
      name: "FREE",
      tag: "Starter",
      price: "₹0",
      duration: "Forever",
      features: [
        "1 Project only",
        "Basic expense entry",
        "Manual contractor payments",
        "Basic project summary",
      ],
      action: () => navigate("/dashboard/construction"),
      btnText: "Start Free Trial",
    },
    {
      key: "construction_basic",
      name: "BASIC",
      tag: "Most Used",
      price: "₹699",
      duration: "per month",
      highlight: true,
      features: [
        "Up to 1 projects",
        "Project cost tracking",
        "Contractor & labor payments",
        "Project bills",
        "Monthly project report",
      ],
      action: () =>
        navigate("/subscription/checkout", {
          state: { planKey: "construction_basic" },
        }),
        btnText:"choose Basic"
    },
    {
      key: "construction_pro",
      name: "PRO",
      tag: "For Builders",
      price: "₹1299",
      duration: "per month",
      features: [
        " up to 3 projects",
        "Advanced cost tracking",
        "Material + labor management",
        "Profit / loss report",
        "PDF project reports",
        "Priority support",
      ],
      action: () =>
        navigate("/subscription/checkout",{
          state: {planKey: "construction_pro"},
        }),
        btnText:"Go Pro" 
    },
  ];


  return (
    <div className="subscription-wrapper">
      {plans.map((plan) => (
        <div
          key={plan.key}
          className={`plan-card ${plan.highlight ? "highlight" : ""}`}
        >
          <h3 className="plan-title">{plan.name}</h3>

          {plan.tag && <span className="plan-tag">{plan.tag}</span>}

          <div className="plan-price">{plan.price}</div>
          <div className="plan-duration">{plan.duration}</div>

          <ul className="plan-features">
            {plan.features.map((f,i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>

          <button
            className="plan-btn"
            onClick={() => plan.action()}>
            {plan.btnText}
          </button>
        </div>
      ))}
    </div>
  );
};

export default ConstructionSubscription;
