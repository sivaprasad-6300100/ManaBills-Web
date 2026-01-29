import React, { createContext, useState, useEffect } from "react";

export const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    const savedSubs =
      JSON.parse(localStorage.getItem("subscriptions")) || [];
    setSubscriptions(savedSubs);
  }, []);

  const subscribe = (moduleKey) => {
    const updated = [...new Set([...subscriptions, moduleKey])];
    setSubscriptions(updated);
    localStorage.setItem("subscriptions", JSON.stringify(updated));
  };

  const unsubscribe = (moduleKey) => {
    const updated = subscriptions.filter((key) => key !== moduleKey);
    setSubscriptions(updated);
    localStorage.setItem("subscriptions", JSON.stringify(updated));
  };

  return (
    <SubscriptionContext.Provider
      value={{ subscriptions, subscribe, unsubscribe }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
