// src/context/SubscriptionContext.jsx

import React, { createContext, useState, useEffect } from "react";
import { authAxios } from "../services/api";

export const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ FIX: Fetch from API, not localStorage
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    authAxios
      .get("subscriptions/my/")
      .then((res) => {
        // Convert array to object: { "business": {...}, "construction": {...} }
        const subMap = {};
        res.data.forEach((sub) => {
          subMap[sub.module] = sub;
        });
        setSubscriptions(subMap);
      })
      .catch(() => {
        // fallback: load from localStorage if API fails
        const saved = localStorage.getItem("subscriptions");
        if (saved) setSubscriptions(JSON.parse(saved));
      })
      .finally(() => setLoading(false));
  }, []);

  const subscribe = (moduleKey, data) => {
    setSubscriptions((prev) => {
      const updated = { ...prev, [moduleKey]: data };
      localStorage.setItem("subscriptions", JSON.stringify(updated)); // keep as backup
      return updated;
    });
  };

  const unsubscribe = (moduleKey) => {
    setSubscriptions((prev) => {
      const updated = { ...prev };
      delete updated[moduleKey];
      localStorage.setItem("subscriptions", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SubscriptionContext.Provider value={{ subscriptions, subscribe, unsubscribe, loading }}>
      {children}
    </SubscriptionContext.Provider>
  );
};