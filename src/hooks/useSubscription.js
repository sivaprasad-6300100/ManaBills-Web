// src/hooks/useSubscription.js
import { useContext } from "react";
import { SubscriptionContext } from "../context/SubscriptionContext";

const useSubscription = () => {
  const { subscriptions, subscribe, unsubscribe, loading } = useContext(SubscriptionContext);

  const hasAccess = (module) => {
    const sub = subscriptions[module];
    if (!sub) return false;
    if (sub.expiresAt && Date.now() > sub.expiresAt) return false;
    return true;  
  };

  return { subscriptions, hasAccess, subscribe, unsubscribe, loading };
};

export default useSubscription;