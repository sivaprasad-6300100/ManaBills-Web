// src/hooks/useSubscription.js
import { useContext } from "react";
import { SubscriptionContext } from "../context/SubscriptionContext";

const useSubscription = () => {
  const { subscriptions, subscribe, unsubscribe, loading } = useContext(SubscriptionContext);

  // Check if user can access a module at all
  const hasAccess = (module) => {
    const sub = subscriptions[module];
    if (!sub) return false;
    if (sub.expiresAt && Date.now() > sub.expiresAt) return false;
    return true;
  };

  // Check if user is on a specific plan
  const hasPlan = (module, planKey) => {
    const sub = subscriptions[module];
    if (!sub) return false;
    return sub.plan === planKey;
  };

  // Check if Smart Dukan features are available
  const hasSmartFeatures = (module) => hasPlan(module, "smart");

  // Check if on trial
  const isOnTrial = (module) => {
    const sub = subscriptions[module];
    return sub?.is_trial === true;
  };

  // Days left in trial
  const daysLeftInTrial = (module) => {
    const sub = subscriptions[module];
    if (!sub?.trial_ends_at) return 0;
    const diff = new Date(sub.trial_ends_at) - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return {
    subscriptions,
    hasAccess,
    hasPlan,
    hasSmartFeatures,
    isOnTrial,
    daysLeftInTrial,
    subscribe,
    unsubscribe,
    loading,
  };
};

export default useSubscription;