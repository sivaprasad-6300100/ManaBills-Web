import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SubscriptionContext } from "../../context/SubscriptionContext";

const CustomSubscription = () => {
  const navigate = useNavigate();
  const { subscribe } = useContext(SubscriptionContext); // ✅ FIXED

  const plans = [
    {
      key: "custom_free",
      name: "FREE",
      price: "₹0",
      tag: "3 Days Free",
      duration: "No card required",
      highlight: false,
      features: [
        "Custom billing formats",
        "Custom estimates",
        "Advanced reports",
        "Flexible workflows",
      ],
      action: () => {
        subscribe("custom", {
          status: "FREE_TRIAL",
          expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
        });

        navigate("/dashboard/custom");
      },
      btnText: "Start Free Trial",
    },
    {
      key: "custom_basic",
      name: "BASIC",
      price: "₹199",
      tag: "Best for Small Shops",
      duration: "per month",
      highlight: true,
      features: [
        "Custom billing formats",
        "Custom estimates",
        "Advanced reports",
        "Flexible workflows",
      ],
      action: () =>
        navigate("/subscription/checkout", {
          state: { planKey: "custom_basic" },
        }),
      btnText: "Choose Basic",
    },
    {
      key: "custom_pro",
      name: "PRO",
      tag: "Growing Business",
      price: "₹499",
      duration: "per month",
      highlight: false,
      features: [
        "Custom billing formats",
        "Custom estimates",
        "Advanced reports",
        "Flexible workflows",
        "Priority support",
      ],
      action: () =>
        navigate("/subscription/checkout", {
          state: { planKey: "custom_pro" },
        }),
      btnText: "Choose Pro",
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
            {plan.features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>

          <button className="plan-btn" onClick={plan.action}>
            {plan.btnText}
          </button>
        </div>
      ))}
    </div>
  );
};

export default CustomSubscription;
