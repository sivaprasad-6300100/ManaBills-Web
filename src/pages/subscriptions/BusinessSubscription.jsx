import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/subscription.css";

const BusinessSubscription = () => {
  const navigate = useNavigate();

  const plans = [
    {
      key: "free",
      name: "FREE TRIAL",
      tag: "3 Days Free",
      price: "₹0",
      duration: "No card required",
      highlight: false,
      features: [
        "10  invoices (GST & Non-GST)",
        "Professional invoice PDF",
        "Sales summary dashboard",
        "Basic stock tracking",
        "Customer database",
        "WhatsApp invoice sharing",
      ],
      action: () => navigate("/dashboard/business"),
      btnText: "Start Free Trial",
    },
    {
      key: "basic",
      name: "BASIC",
      tag: "Best for Small Shops",
      price: "₹199",
      duration: "per month",
      highlight: true,
      features: [
        "Login up to 2 devices",
        "Stock auto update",
        "Invoice edit & cancel",
        "Customer credit tracking",
        "Monthly sales report (PDF)",
        "Business logo on invoice",
        "Email & WhatsApp sharing",
      ],
      action: () =>
        navigate("/subscription/checkout", {
          state: { planKey: "business_basic" },
        }),
      btnText: "Choose Basic",
    },
    {
      key: "pro",
      name: "PRO",
      tag: "Growing Business",
      price: "₹299",
      duration: "per month",
      highlight: false,
      features: [
        "Login up to 4 devices",
        "All Basic features available 199  plan included" ,
        "GST & Non-GST reports",
        "Low-stock alerts",
        "GST filing reminders",
        "Profit & expense insights",
        "Priority WhatsApp support",
        "Early access to new features",
      ],
      action: () =>
        navigate("/subscription/checkout", {
          state: {  planKey: "business_pro" },
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

          {plan.key !== "free" && (
            <p className="plan-note">Cancel anytime • GST included</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default BusinessSubscription;
