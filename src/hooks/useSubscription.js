// src/hooks/useSubscription.js
import { useContext } from "react";
import { SubscriptionContext } from "../context/SubscriptionContext";

const useSubscription = () => {
  const { subscriptions, subscribe, loading } = useContext(SubscriptionContext);

  /**
   * hasAccess — the single source of truth for route guards.
   *
   * Handles three shapes of subscription data that can exist in state:
   *   1. Server response  → { is_active: true, expires_at: "2026-05-30" }
   *   2. Optimistic paid  → { is_active: true, plan: "basic", duration: "1 Month" }
   *   3. Optimistic trial → { status: "FREE_TRIAL", is_active: true, expiresAt: <ms> }
   */
  const hasAccess = (module) => {
    const sub = subscriptions[module];
    if (!sub) return false;

    // Must be explicitly active
    if (sub.is_active !== true) return false;

    // Check JS-timestamp expiry (optimistic free trial)
    if (sub.expiresAt && Date.now() > sub.expiresAt) return false;

    // Check ISO-string expiry (server response)
    if (sub.expires_at && new Date(sub.expires_at) < new Date()) return false;

    return true;
  };

  // Check if user is on a specific plan
  const hasPlan = (module, planKey) => {
    const sub = subscriptions[module];
    if (!sub) return false;
    return sub.plan === planKey;
  };

  const hasSmartFeatures = (module) => hasPlan(module, "smart");

  // Check if on trial
  const isOnTrial = (module) => {
    const sub = subscriptions[module];
    return sub?.is_trial === true || sub?.status === "FREE_TRIAL";
  };

  // Days left in trial
  const daysLeftInTrial = (module) => {
    const sub = subscriptions[module];
    if (!sub) return 0;
    // JS timestamp (optimistic)
    if (sub.expiresAt) {
      const diff = sub.expiresAt - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    // ISO string (server)
    if (sub.trial_ends_at) {
      const diff = new Date(sub.trial_ends_at) - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return 0;
  };

  return {
    subscriptions,
    hasAccess,
    hasPlan,
    hasSmartFeatures,
    isOnTrial,
    daysLeftInTrial,
    subscribe,
    loading,
  };
};

export default useSubscription;
