import React from "react";
import { useNavigate } from "react-router-dom";

const Topbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className="topbar">
      <h3 className="topbar-title">Dashboard</h3>

      <div className="topbar-actions">
        <span className="user-name">Hi, User</span>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
