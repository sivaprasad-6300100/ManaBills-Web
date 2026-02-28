import React from "react";
import { Navigate } from "react-router-dom";
import useSubscription from "../hooks/useSubscription";

const SubscriptionGuard = ({ module, children }) => {
  const { subscriptions, hasAccess, loading } = useSubscription();

  // ⏳ show loader instead of blank screen
  if (loading) {
    return <div>Loading...</div>;
  }

  // ❌ no access → redirect
  if (!hasAccess(module)) {
    return <Navigate to={`/subscription/${module}`} replace />;
  }

  // ✅ allowed
  return children;
};

export default SubscriptionGuard;
