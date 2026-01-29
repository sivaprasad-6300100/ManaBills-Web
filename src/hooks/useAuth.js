import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  const { user, login, logout } = context;

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };
};

export default useAuth;
