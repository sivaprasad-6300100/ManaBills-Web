import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { authAxios } from "../services/api";
import { AuthContext } from "./AuthContext";

export const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { accessToken, sessionVersion } = useContext(AuthContext);

  const [subscriptions, setSubscriptions] = useState({});
  const [loading, setLoading]             = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const skipNextFetch     = useRef(false);
  const isExplicitRefresh = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      setSubscriptions({});
      setLoading(false);
      return;
    }

    if (skipNextFetch.current && !isExplicitRefresh.current) {
      skipNextFetch.current = false;
      setLoading(false);
      return;
    }

    skipNextFetch.current     = false;
    isExplicitRefresh.current = false;

    let cancelled = false;
    setLoading(true);

    authAxios
      .get("subscriptions/my/")
      .then((res) => {
        const subMap = {};
        (res.data || []).forEach((sub) => {
          subMap[sub.module] = sub;
        });
        if (!cancelled) {
          setSubscriptions(subMap);
          localStorage.setItem("subscriptions", JSON.stringify(subMap));
        }
      })
      .catch(() => {
        if (!cancelled) {
          try {
            const saved = localStorage.getItem("subscriptions");
            if (saved) setSubscriptions(JSON.parse(saved));
          } catch {}
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [accessToken, sessionVersion, refreshTrigger]);

  const subscribe = useCallback((moduleKey, data) => {
    setSubscriptions((prev) => {
      const updated = { ...prev, [moduleKey]: data };
      localStorage.setItem("subscriptions", JSON.stringify(updated));
      return updated;
    });

    skipNextFetch.current = true;

    authAxios
      .post("subscriptions/activate/", {
        module:   moduleKey,
        plan:     data.plan,
        duration: data.duration,
      })
      .catch(() => {});
  }, []);

  const refreshSubscriptions = useCallback(() => {
    isExplicitRefresh.current = true;
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const isSubscribed = useCallback((moduleKey) => {
    const sub = subscriptions[moduleKey];
    return sub && sub.is_active === true;
  }, [subscriptions]);

  const value = useMemo(
    () => ({
      subscriptions,
      loading,
      subscribe,
      refreshSubscriptions,
      isSubscribed,
    }),
    [subscriptions, loading, subscribe, refreshSubscriptions, isSubscribed]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
