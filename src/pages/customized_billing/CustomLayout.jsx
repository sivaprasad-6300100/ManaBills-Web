import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const CustomLayout = () => {
  return (
    <div>
      {/* Sub Navigation */}
      <div className="sub-nav">
        <NavLink to="" end className="sub-link">
          Overview
        </NavLink>
        <NavLink to="estimates" className="sub-link">
          Custom Estimates
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
};

export default CustomLayout;
