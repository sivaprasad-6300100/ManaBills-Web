import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SubscriptionContext } from "../../context/SubscriptionContext";

/* ✅ ALL PLANS (BUSINESS + HOME + CONSTRUCTION) */
const ALL_PLANS = {
  business_basic: {
    name: "BUSINESS BASIC",
    dashboard: "/dashboard/business",
    durations: [
      { label: "1 Month", price: 199 },
      { label: "6 Months", price: 999 },
      { label: "1 Year", price: 1999 },
    ],
  },

  business_pro: {
    name: "BUSINESS PRO",
    dashboard: "/dashboard/business",
    durations: [
      { label: "1 Month", price: 299 },
      { label: "6 Months", price: 1599 },
      { label: "1 Year", price: 2799 },
    ],
  },

  home_basic: {
    name: "HOME BASIC",
    dashboard: "/dashboard/home-expense",
    durations: [
      { label: "1 Month", price: 99 },
      { label: "1 Year", price: 999 },
    ],
  },

  home_pro: {
    name: "HOME PRO",
    dashboard: "/dashboard/home-expense",
    durations: [
      { label: "1 Month", price: 149 },
      { label: "1 Year", price: 1499 },
    ],
  },

  construction_basic: {
    name: "CONSTRUCTION BASIC",
    dashboard: "/dashboard/construction",
    durations: [
      { label: "1 Month", price: 699 },
      { label: "6 Months", price: 3499 },
      { label: "1 Year", price: 6999 },
    ],
  },

  construction_pro: {
    name: "CONSTRUCTION PRO",
    dashboard: "/dashboard/construction",
    durations: [
      { label: "1 Month", price: 1299 },
      { label: "6 Months", price: 6999 },
      { label: "1 Year", price: 12999 },
    ],
  },

  custom_basic: {
    name : "CUSTOM BASIC",
    dashboard: "/dashboard/custom",
    durations:[
      { label: "1 month", price: 199 },
      { label: "6 months", price:999},
      { label: "1 year", price:1999},
    ],
  },

  custom_pro: {
    name :"CUSTOM PRO",
    dashboard:"/dashboard/custom",
    durations: [
      {label:"1 month", price :499},
      {label:"6 months", price:2499},
      {label:"1 year", price:4999}
    ],
  }
};

// 🔹 Platform Fee
const getPlatformFee = (price) => {
  if (price <= 199) return 5;
  if (price <= 999) return 10;
  return 15;
};

// 🔹 GST
const GST_RATE = 0.18;

const CheckoutSubscription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subscribe } = useContext(SubscriptionContext);

  const planKey = location.state?.planKey;
  const plan = ALL_PLANS[planKey];

  const [selected, setSelected] = useState(
    plan ? plan.durations[0] : null
  );

  useEffect(() => {
    if (!planKey || !plan) {
      navigate("/subscription");
    }
  }, [planKey, plan, navigate]);

  if (!plan || !selected) return null;

  const platformFee = getPlatformFee(selected.price);
  const gstAmount = Math.round(selected.price * GST_RATE);
  const total = selected.price + gstAmount + platformFee;

  const handleConfirm = () => {
    subscribe(planKey, selected.label);
    navigate(plan.dashboard);
  };

  return (
    <div style={{ maxWidth: "820px", margin: "0 auto", padding: "32px" }}>
      <h2>{plan.name} – Choose Duration</h2>

      {/* Duration Cards */}
      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
        }}
      >
        {plan.durations.map((d) => (
          <div
            key={d.label}
            onClick={() => setSelected(d)}
            style={{
              padding: "18px",
              borderRadius: "14px",
              cursor: "pointer",
              border:
                selected.label === d.label
                  ? "2px solid #4f46e5"
                  : "1px solid #e5e7eb",
              background:
                selected.label === d.label ? "#eef2ff" : "#fff",
            }}
          >
            <h4>{d.label}</h4>
            <p style={{ fontSize: "20px", fontWeight: 700 }}>
              ₹{d.price}
            </p>
            <span style={{ fontSize: 12, color: "#10b981" }}>
              Free
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div
        style={{
          marginTop: "28px",
          background: "#fff",
          padding: "22px",
          borderRadius: "14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Plan Price</span>
          <span>₹{selected.price}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>GST</span>
          <span>₹0</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Platform Fee</span>
          <span>₹{platformFee}</span>
        </div>

        <hr style={{ margin: "16px 0" }} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 700,
            fontSize: "18px",
          }}
        >
          <span>Total Payable</span>
          <span>₹{total}</span>
        </div>

        <button
          onClick={handleConfirm}
          style={{
            marginTop: "20px",
            width: "100%",
            padding: "14px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Proceed to Pay
        </button>
      </div>
    </div>
  );
};

export default CheckoutSubscription;
