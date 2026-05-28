// src/context/SubscriptionContext.jsx

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

  // ── Track whether a local subscribe() has been called recently.
  // If true, we skip the next API re-fetch so it doesn't overwrite
  // the optimistic update from subscribe().
  const skipNextFetch = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH subscriptions from API on mount / token change
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) {
      setSubscriptions({});
      setLoading(false);
      return;
    }

    // If subscribe() just ran (e.g. post-payment navigation), skip this
    // fetch so the optimistic state is not overwritten.
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    authAxios
      .get("subscriptions/my/")
      .then((res) => {
        // API returns array → convert to map keyed by module name
        // e.g. [{ module: "business", ... }] → { business: { ... } }
        const subMap = {};
        (res.data || []).forEach((sub) => {
          subMap[sub.module] = sub;
        });

        if (!cancelled) {
          setSubscriptions(subMap);
          // Keep localStorage in sync with latest server state
          localStorage.setItem("subscriptions", JSON.stringify(subMap));
        }
      })
      .catch(() => {
        // API failed — fall back to localStorage so the app still works
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
  }, [accessToken, sessionVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // subscribe(moduleKey, data)
  //   • Updates local state immediately (optimistic)
  //   • Persists to localStorage as backup
  //   • POSTs to backend to persist properly
  //   • Sets skipNextFetch so the next useEffect re-run doesn't overwrite us
  // ─────────────────────────────────────────────────────────────────────────
  const subscribe = useCallback((moduleKey, data) => {
    // Optimistic update — instant UI
    setSubscriptions((prev) => {
      const updated = { ...prev, [moduleKey]: data };
      localStorage.setItem("subscriptions", JSON.stringify(updated));
      return updated;
    });

    // Tell the effect to skip the next fetch triggered by navigation
    skipNextFetch.current = true;

    // Persist to backend (fire-and-forget — don't block UI)
    authAxios
      .post("subscriptions/activate/", {
        module:   moduleKey,
        duration: typeof data === "string" ? data : data?.duration || "",
        data,
      })
      .catch((err) => {
        // Non-fatal: localStorage already has it as fallback
        console.warn("SubscriptionContext: backend activate failed:", err?.response?.data || err.message);
      });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // unsubscribe(moduleKey)
  // ─────────────────────────────────────────────────────────────────────────
  const unsubscribe = useCallback((moduleKey) => {
    setSubscriptions((prev) => {
      const updated = { ...prev };
      delete updated[moduleKey];
      localStorage.setItem("subscriptions", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // isSubscribed(moduleKey) — convenience helper
  // ─────────────────────────────────────────────────────────────────────────
  // CORRECT — only truly active
const isSubscribed = useCallback(
  (moduleKey) => subscriptions[moduleKey]?.is_active === true,
  [subscriptions]
);

  const value = useMemo(
    () => ({ subscriptions, subscribe, unsubscribe, isSubscribed, loading }),
    [subscriptions, subscribe, unsubscribe, isSubscribed, loading]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
