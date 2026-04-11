// src/context/BusinessStatsContext.jsx

import React, { createContext, useState, useEffect, useCallback } from "react";
import { getDashboardStats } from "../services/businessService";

export const BusinessStatsContext = createContext();

export const BusinessStatsProvider = ({ children }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
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
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [fetchStats]);

  const value = {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };

  return (
    <BusinessStatsContext.Provider value={value}>
      {children}
    </BusinessStatsContext.Provider>
  );
};
