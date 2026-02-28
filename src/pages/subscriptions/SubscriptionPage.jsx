import React from "react";
import { useNavigate } from "react-router-dom";

const SubscriptionPage = () => {
  const navigate = useNavigate();

  const modules = [
    {
      key: "business",
      title: "Business Billing",
      description: "Invoices, GST, stock & customer management",
      price: "₹199/month",
      trial: "3 Days Free Trial",
      route: "/subscription/business",
    },
    {
      key: "home-expense",
      title: "Home Expense Tracker",
      description: "Track family expenses & monthly savings",
      price: "₹99/month",
      trial: "7 Days Free Trial",
      route: "/subscription/home-expense",
    },
    {
      key: "construction",
      title: "Construction Billing",
      description: "Project cost, contractor & labor payments",
      price: "₹699/month",
      trial: "Free Plan Available",
      route: "/subscription/construction",
    },
    {
      key: "custom",
      title: "Customized Billing",
      description: "Tailor-made billing & workflows",
      price: "₹199/month",
      trial: "3 Days Free Trial",
      route: "/subscription/custom",
    },
  ];

  return (
    <div className="sp-container">
      <h2 className="sp-title">Select Your Module</h2>
      <p className="sp-subtitle">
        Each module has unique plans. Click on a module to explore its features.
      </p>

      <div className="sp-modules">
        {modules.map((module) => (
          <div key={module.key} className="sp-card">
            <h3 className="sp-card-title">{module.title}</h3>
            <p className="sp-card-desc">{module.description}</p>

            <div className="sp-card-price">{module.price}</div>
            <div className="sp-card-trial">{module.trial}</div>

            <button
              className="sp-btn"
              onClick={() => navigate(module.route)}
            >
              View Plans →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPage;
