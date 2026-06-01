// src/context/ShopContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getShopProfile } from "../services/businessService";
import { AuthContext } from "./AuthContext";

const ShopContext = createContext();

export function ShopProvider({ children }) {
  const { accessToken } = useContext(AuthContext);
  const [profileReady, setProfileReady] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      setProfileReady(null); // not logged in — stop, don't call API
      return;
    }

    getShopProfile()
      .then((data) => {
        const complete = !!(data?.shop_name && data?.owner_name && data?.mobile && data?.address);
        setProfileReady(complete);
      })
      .catch(() => setProfileReady(false));

  }, [accessToken]); // only runs when login state changes

  return (
    <ShopContext.Provider value={{ profileReady, setProfileReady }}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);