// AppEntry.jsx
import { Navigate } from "react-router-dom";

const AppEntry = () => {
  const isLoggedIn = !!localStorage.getItem("access_token");
  return <Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />;
};

export default AppEntry;