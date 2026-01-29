import React from "react";
import { Navigate } from "react-router-dom";
import useSubscription from "../hooks/useSubscription";

const SubscriptionGuard = ({ module, children }) => {
  const { hasSubscription } = useSubscription();

  if (!hasSubscription(module)) {
    return <Navigate to={`/subscription/${module}`} replace />;
  }

  return children;
};

export default SubscriptionGuard;
