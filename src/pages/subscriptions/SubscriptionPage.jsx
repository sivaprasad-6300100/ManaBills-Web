import React, { useContext } from "react";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import SubscriptionPlanCard from "../../context/SubscriptionPlanCard";
const SubscriptionPage = () => {
  const { subscriptions, subscribe } = useContext(SubscriptionContext);

  const plans = [
    {
      key: "business",
      name: "Business Billing",
      price: 499,
      features: ["Create invoices", "Manage products", "GST reports"],
    },
    {
      key: "home-expense",
      name: "Home Expense",
      price: 299,
      features: ["Track expenses", "Monthly summary", "Export reports"],
    },
    {
      key: "construction",
      name: "Construction Billing",
      price: 699,
      features: ["Project costs", "Payments", "Project summary"],
    },
    {
      key: "custom",
      name: "Customized Billing",
      price: 999,
      features: ["Custom estimates", "Advanced features"],
    },
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", padding: "20px" }}>
      {plans.map((plan) => (
        <SubscriptionPlanCard
          key={plan.key}
          plan={plan.name}
          price={plan.price}
          features={plan.features}
          active={subscriptions[plan.key] === true}
          onSubscribe={() => subscribe(plan.key)}
        />
      ))}
    </div>
  );
};

export default SubscriptionPage;
