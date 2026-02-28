import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SubscriptionContext } from "../../context/SubscriptionContext";

const HomeExpenseSubscription = () => {
  const navigate = useNavigate();
  const { subscribe } = useContext(SubscriptionContext); // ✅ CORRECT

  const plans = [
    {
      key: "free",
      name: "FREE TRIAL",
      tag: "7 Days Free",
      price: "₹0",
      duration: "No card required",
      highlight: false,
      features: [
        "10 Days add daily bills",
        "Single user (no family members)",
        "View monthly total spending",
        "1 reminder only (rent OR bill)",
        "Simple monthly summary (screen view only)",
      ],
      action: () => {
        subscribe("home-expense", {
          status: "FREE_TRIAL",
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        navigate("/dashboard/home-expense");
      },
      btnText: "Start Free Trial",
    },
    {
      key: "home_basic",
      name: "BASIC",
      tag: "Most Popular",
      price: "₹99 / month",
      duration: "per month",
      features: [
        "Up to 5 family members",
        "Category-wise expense tracking",
        "Budget planning with alerts",
        "Monthly PDF report",
        "Cloud backup",
        "Expense reminders",
      ],
      action: () =>
        navigate("/subscription/checkout", {
          state: { planKey: "home_basic" },
        }),
      btnText: "Choose Basic",
    },
    {
      key: "home_pro",
      name: "PRO",
      tag: "Smart Families",
      price: "₹149 / month",
      duration: "per month",
      features: [
        "All basic features included",
        "1 year expenses data view",
        "1 year reports showing wasteful spending",
        "How much you can save monthly",
      ],
      action: () =>
        navigate("/subscription/checkout", {
          state: { planKey: "home_pro" },
        }),
      btnText: "Go Pro",
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
          <span className="plan-tag">{plan.tag}</span>

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

export default HomeExpenseSubscription;
