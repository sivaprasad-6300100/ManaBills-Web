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

  // skipNextFetch guards against the *automatic* re-fetch caused by
  // navigation (accessToken/sessionVersion change) overwriting the
  // optimistic update from subscribe(). It must NOT block an explicit
  // refreshSubscriptions() call — so we use a separate ref for that.
  const skipNextFetch   = useRef(false);
  const isExplicitRefresh = useRef(false); // true when refreshSubscriptions() triggered the run

  useEffect(() => {
    if (!accessToken) {
      setSubscriptions({});
      setLoading(false);
      return;
    }

    // Only skip if this is NOT an explicit refresh and subscribe() just ran.
    if (skipNextFetch.current && !isExplicitRefresh.current) {
      skipNextFetch.current = false;
      setLoading(false);
      return;
    }

    // Reset both flags for this run
    skipNextFetch.current    = false;
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
          } catch {
            // ignore parse errors
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, sessionVersion, refreshTrigger]);

  const subscribe = useCallback((moduleKey, data) => {
    // Optimistic update — instant UI
    setSubscriptions((prev) => {
      const updated = { ...prev, [moduleKey]: data };
      localStorage.setItem("subscriptions", JSON.stringify(updated));
      return updated;
    });

    // Block the *next automatic* re-fetch (navigation side-effect),
    // but NOT an explicit refreshSubscriptions() call.
    skipNextFetch.current = true;

    // Persist to backend (fire-and-forget)
    authAxios
      .post("subscriptions/activate/", {
        module:   moduleKey,
        plan:     data.plan,
        duration: data.duration,
      })
      .catch(() => {
        // Optimistic update still holds if POST fails
      });
  }, []);

  // Explicitly fetches fresh data from the server.
  // Always bypasses the skipNextFetch guard.
  const refreshSubscriptions = useCallback(() => {
    isExplicitRefresh.current = true; // mark as intentional — skip the guard
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
