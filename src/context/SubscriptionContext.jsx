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










// ─── Add this utility at the TOP of SubscriptionContext.jsx ───

const getDeviceId = () => {
    try {
        // Check if already generated
        const stored = localStorage.getItem("mb_device_id")
        if (stored) return stored

        // Generate fingerprint from browser info
        const raw = [
            navigator.userAgent,
            window.screen.width + "x" + window.screen.height,
            window.screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.language,
            navigator.platform,
        ].join("|")

        // Simple hash
        let hash = 0
        for (let i = 0; i < raw.length; i++) {
            const char = raw.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
        }
        const deviceId = "mb_" + Math.abs(hash).toString(36) + "_" + Date.now().toString(36)
        localStorage.setItem("mb_device_id", deviceId)
        return deviceId
    } catch {
        return "mb_fallback_" + Date.now().toString(36)
    }
}

const getDeviceName = () => {
    const ua = navigator.userAgent
    if (/Android/i.test(ua))        return "Android Phone"
    if (/iPhone/i.test(ua))         return "iPhone"
    if (/iPad/i.test(ua))           return "iPad"
    if (/Windows Phone/i.test(ua))  return "Windows Phone"
    if (/Windows/i.test(ua))        return "Windows PC"
    if (/Mac/i.test(ua))            return "Mac"
    if (/Linux/i.test(ua))          return "Linux PC"
    return "Browser"
}

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

  // ─── Update your existing useEffect in SubscriptionProvider ───

useEffect(() => {
    if (!accessToken) {
        setSubscriptions({})
        setLoading(false)
        return
    }

    if (skipNextFetch.current && !isExplicitRefresh.current) {
        skipNextFetch.current = false
        setLoading(false)
        return
    }

    skipNextFetch.current     = false
    isExplicitRefresh.current = false

    let cancelled = false
    setLoading(true)

    // ✅ NEW — Register device on every login/session start
    authAxios.post("auth/register-device/", {
        device_id:   getDeviceId(),
        device_name: getDeviceName(),
    }).catch((err) => {
        // Device limit exceeded
        if (err?.response?.status === 403) {
            const data = err.response.data
            alert(
                `⚠️ Device limit reached!\n\n` +
                `Your ${data.device_limit}-device limit is full.\n` +
                `Active devices: ${data.active_count}\n\n` +
                `Go to Account → Security to remove old devices.`
            )
        }
    })

    // Continue fetching subscriptions as before
    authAxios
        .get("subscriptions/my/")
        .then((res) => {
            const subMap = {}
            ;(res.data || []).forEach((sub) => {
                subMap[sub.module] = sub
            })
            if (!cancelled) {
                setSubscriptions(subMap)
                localStorage.setItem("subscriptions", JSON.stringify(subMap))
            }
        })
        .catch(() => {
            if (!cancelled) {
                try {
                    const saved = localStorage.getItem("subscriptions")
                    if (saved) setSubscriptions(JSON.parse(saved))
                } catch {}
            }
        })
        .finally(() => {
            if (!cancelled) setLoading(false)
        })

    return () => { cancelled = true }
}, [accessToken, sessionVersion, refreshTrigger])





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
