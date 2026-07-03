// src/context/BusinessStatsContext.jsx

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getDashboardStats } from "../services/businessService";
import { AuthContext } from "./AuthContext";

export const BusinessStatsContext = createContext();

export const BusinessStatsProvider = ({ children }) => {
  const { accessToken, sessionVersion } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch business stats", err);
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  // Change the useEffect to also refetch on focus:
  useEffect(() => {
    if (!accessToken) {
      setStats(null);
      setError(null);
      setLoading(false);
      return;
    }
    fetchStats();

    const onFocus = () => fetchStats();
    window.addEventListener("focus", onFocus);

    const onStatsDirty = () => fetchStats();              
    window.addEventListener("manabills:stats-dirty", onStatsDirty);   

    const scheduleMidnightRefetch = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      const msUntilMidnight = nextMidnight - now;

      return setTimeout(() => {
        fetchStats();
        midnightTimer = scheduleMidnightRefetch();
      }, msUntilMidnight);
    };

    let midnightTimer = scheduleMidnightRefetch();

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("manabills:stats-dirty", onStatsDirty);   
      clearTimeout(midnightTimer);
    };
  }, [accessToken, sessionVersion, fetchStats]);




  const value = useMemo(
    () => ({
      stats,
      loading,
      error,
      refetch: fetchStats,
    }),
    [stats, loading, error, fetchStats]
  );

  return (
    <BusinessStatsContext.Provider value={value}>
      {children}
    </BusinessStatsContext.Provider>
  );
};
