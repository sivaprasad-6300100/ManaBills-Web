import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  useEffect(() => {
    if (!accessToken) {
      setSubscriptions({});
      setLoading(false);
      localStorage.removeItem("subscriptions"); // ← ADD THIS
      return;
    }

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
          localStorage.setItem("subscriptions", JSON.stringify(subMap));
          if (Object.keys(subMap).length > 0) {
            localStorage.setItem("mb_has_sub_history", "1"); // ← ADD THIS
          }
        }
      })


      // AFTER — only use localStorage as fallback if accessToken exists
// AND clear stale cache on logout
        .catch(() => {
          if (!cancelled) {
            // Only use cache as fallback, never as initial truth
            setSubscriptions({});  // show nothing on error — safer
          }
        })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [accessToken, sessionVersion, refreshTrigger]);

  // Called right after a successful /activate/ or /free-trial/ call.
  // Does NOT hit the backend again — it just pulls the real, fresh
  // subscription record so local state always matches the database.
  const subscribe = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const refreshSubscriptions = useCallback(() => {
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