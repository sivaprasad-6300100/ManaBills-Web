import React, { useContext } from "react";
import { SubscriptionContext } from "../../context/SubscriptionContext";

const SubscriptionHistory = () => {
  const { subscriptions } = useContext(SubscriptionContext);

  return (
    <div>
      <h2>Subscription History</h2>

      {subscriptions.length === 0 ? (
        <p>No active subscriptions.</p>
      ) : (
        <ul>
          {subscriptions.map((module) => (
            <li key={module}>{module.toUpperCase()} Plan</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SubscriptionHistory;
