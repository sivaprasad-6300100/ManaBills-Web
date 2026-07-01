import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import SplashScreen from "../../components/splash/SplashScreen";

const AppEntry = () => {
  const [splashDone, setSplashDone] = useState(false);
  const isLoggedIn = !!localStorage.getItem("access_token");

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return <Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />;
};

export default AppEntry;