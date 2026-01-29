import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import '../../styles/sidebar.css'


const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">ManaBills</div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" end className="nav-link">Home</NavLink>
        <NavLink to="/dashboard/business" className="nav-link">Business Billing</NavLink>
        <NavLink to="/dashboard/home-expense" className="nav-link">Home Expenses</NavLink>
        <NavLink to="/dashboard/construction" className="nav-link">Construction</NavLink>
        <NavLink to="/dashboard/custom" className="nav-link">Customized Billing</NavLink>
        <NavLink to="/coming soon " className="nav-link">School Management</NavLink>
        <NavLink to="/dashboard/account" className="nav-link">Account / Settings</NavLink>
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
