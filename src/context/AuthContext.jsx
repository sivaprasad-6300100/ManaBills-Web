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
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionVersion, setSessionVersion] = useState(0);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    const savedAccess = localStorage.getItem("access_token");
    const savedRefresh = localStorage.getItem("refresh_token");

    setUser(savedUser);
    setAccessToken(savedAccess);
    setRefreshToken(savedRefresh);
    setLoading(false);
  }, []);

  const clearSessionStorage = useCallback(() => {
    // Clear everything because many screens store user-specific data under generic keys.
    localStorage.clear();
  }, []);

  const login = useCallback(
    (userData, tokens) => {
      const prevUser = JSON.parse(localStorage.getItem("user") || "null");
      const prevKey = getUserKey(prevUser);
      const nextKey = getUserKey(userData);

      // If a different account logs in on the same device/session, wipe cached user data.
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
