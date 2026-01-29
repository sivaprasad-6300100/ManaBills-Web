import { useContext } from "react";
import { SubscriptionContext } from "../context/SubscriptionContext";

const useSubscription = () => {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error("useSubscription must be used inside SubscriptionProvider");
  }

  const { subscriptions, subscribe, unsubscribe } = context;

  const hasSubscription = (moduleKey) => {
    return subscriptions.includes(moduleKey);
  };

  return {
    subscriptions,
    hasSubscription,
    subscribe,
    unsubscribe,
  };
};

export default useSubscription;
