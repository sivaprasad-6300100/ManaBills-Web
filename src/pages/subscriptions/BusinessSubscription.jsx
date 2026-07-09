import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { activateFreeTrial } from "../../services/subscriptionService";

const BusinessSubscription = () => {
  const navigate = useNavigate();
  const { subscribe, refreshSubscriptions, subscriptions } = useContext(SubscriptionContext);
  const businessSub = subscriptions?.["business"];
  const trialAlreadyUsed = !!(
    businessSub?.plan_key === "free_trial" ||
    businessSub?.status === "expired" ||
    businessSub?.status === "active"
  );
  const [trialLoading, setTrialLoading] = useState(false);


  // ── Free Trial handler — hits backend, gives real 5-day subscription ──
  const handleFreeTrial = async () => {
    setTrialLoading(true);
    try {
      await activateFreeTrial("business");
      // Update context so sidebar/nav unlocks immediately
      subscribe("business", {
        status:    "active",
        plan:      "free_trial",
        duration:  "FREE_TRIAL",
        is_active: true,
      });
      refreshSubscriptions(); // sync from server
      navigate("/dashboard/business/shop-profile", {
        state: { isFirstSetup: true },
      });
    } catch (err) {
      const msg = err?.response?.data?.error;
      if (msg) {
        alert(msg); // "Free trial already used" or "Already active"
      } else {
        alert("Could not activate free trial. Please try again.");
      }
    } finally {
      setTrialLoading(false);
    }
  };

  const plans = [
    {
      key:      "free",
      name:     "FREE TRIAL",
      tag:      "7 Days Free",
      price:    "₹0",
      duration: "No card required",
      highlight: false,
      features: [
        "Unlimited (GST)",
        "Professional invoice PDF",
        "Sales summary dashboard",
        "Basic stock tracking",
        "Customer database",
        "WhatsApp invoice sharing",
      ],
      action:  handleFreeTrial,
      btnText: trialLoading ? "Activating..." : "Start Free Trial",
      disabled: trialLoading,
    },
    {
      key:      "basic",
      name:     "BASIC",
      tag:      "Best for Small Shops",
      price:    "₹199",
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
          state: { planKey: "business_basic", isFirstSetup: true },
        }),
      btnText: "Choose Basic",
    },
    {
      key:      "pro",
      name:     "PRO",
      tag:      "Growing Business",
      price:    "₹299",
      duration: "per month",
      highlight: false,
      features: [
        "Login up to 4 devices",
        "All Basic features (199 plan included)",
        "GST & Non-GST reports",
        "Low-stock alerts",
        "GST filing reminders",
        "Profit & expense insights",
        "Priority WhatsApp support",
        "Early access to new features",
      ],
      action: () =>
        navigate("/subscription/checkout", {
          state: { planKey: "business_pro", isFirstSetup: true },
        }),
      btnText: "Go Pro",
    },
  ];

  const visiblePlans = trialAlreadyUsed ? plans.filter((p) => p.key !== "free") : plans;


  return (
    <div className="subscription-wrapper">
      {visiblePlans.map((plan) => (
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
          <button
            className="plan-btn"
            onClick={plan.action}
            disabled={plan.disabled || false}
            style={{ opacity: plan.disabled ? 0.7 : 1, cursor: plan.disabled ? "not-allowed" : "pointer" }}
          >
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
