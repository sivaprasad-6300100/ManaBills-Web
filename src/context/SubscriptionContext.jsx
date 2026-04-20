// src/context/SubscriptionContext.jsx

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authAxios } from "../services/api";
import { AuthContext } from "./AuthContext";

export const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { accessToken, sessionVersion } = useContext(AuthContext);
  const [subscriptions, setSubscriptions] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ FIX: Fetch from API, not localStorage
  useEffect(() => {
    const token = accessToken;
    if (!token) {
      setSubscriptions({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    authAxios
      .get("subscriptions/my/")
      .then((res) => {
        // Convert array to object: { "business": {...}, "construction": {...} }
        const subMap = {};
        res.data.forEach((sub) => {
          subMap[sub.module] = sub;
        });
        if (!cancelled) setSubscriptions(subMap);
      })
      .catch(() => {
        // fallback: load from localStorage if API fails
        const saved = localStorage.getItem("subscriptions");
        if (saved && !cancelled) setSubscriptions(JSON.parse(saved));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, sessionVersion]);

  const subscribe = useCallback((moduleKey, data) => {
    setSubscriptions((prev) => {
      const updated = { ...prev, [moduleKey]: data };
      localStorage.setItem("subscriptions", JSON.stringify(updated)); // keep as backup
      return updated;
    });
  }, []);

  const unsubscribe = useCallback((moduleKey) => {
    setSubscriptions((prev) => {
      const updated = { ...prev };
      delete updated[moduleKey];
      localStorage.setItem("subscriptions", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({ subscriptions, subscribe, unsubscribe, loading }),
    [subscriptions, subscribe, unsubscribe, loading]
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};
