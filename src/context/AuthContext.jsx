import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

export const AuthContext = createContext();

const getUserKey = (user) => {
  if (!user) return null;
  return (
    user.mobile_number ||
    user.username ||
    user.email ||
    user.id ||
    null
  );
};

export const AuthProvider = ({ children }) => {
  // ✅ FIX: initialize directly from localStorage instead of null
  // Previously was useState(null) + useEffect to load — this caused a brief
  // moment where accessToken was null on refresh, making SubscriptionContext
  // clear subscriptions and set loading=false before the token was available,
  // which caused SubscriptionGuard to redirect to the subscription page.
  const [user, setUser]               = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("access_token"));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refresh_token"));
  const [loading, setLoading]         = useState(false); // ✅ no longer needs to be true — data is already loaded
  const [sessionVersion, setSessionVersion] = useState(0);

  // ✅ Remove the old useEffect that loaded from localStorage — no longer needed
  // because state is initialized directly above. Keeping it would double-set state.

  const clearSessionStorage = useCallback(() => {
    localStorage.clear();
  }, []);

  const login = useCallback(
    (userData, tokens) => {
      const prevUser = JSON.parse(localStorage.getItem("user") || "null");
      const prevKey = getUserKey(prevUser);
      const nextKey = getUserKey(userData);

      if (prevKey && nextKey && prevKey !== nextKey) {
        clearSessionStorage();
      }

      if (tokens?.access) {
        localStorage.setItem("access_token", tokens.access);
        setAccessToken(tokens.access);
      } else {
        const existing = localStorage.getItem("access_token");
        setAccessToken(existing);
      }

      if (tokens?.refresh) {
        localStorage.setItem("refresh_token", tokens.refresh);
        setRefreshToken(tokens.refresh);
      } else {
        const existing = localStorage.getItem("refresh_token");
        setRefreshToken(existing);
      }

      setUser(userData || null);
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        localStorage.removeItem("user");
      }

      setSessionVersion((v) => v + 1);
    },
    [clearSessionStorage]
  );

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setSessionVersion((v) => v + 1);
    clearSessionStorage();
  }, [clearSessionStorage]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      loading,
      sessionVersion,
      login,
      logout,
    }),
    [user, accessToken, refreshToken, loading, sessionVersion, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
