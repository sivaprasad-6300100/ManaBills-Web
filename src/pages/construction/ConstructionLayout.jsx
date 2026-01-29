import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const ConstructionLayout = () => {
  return (
    <div>
      {/* Sub Navigation */}
      <div className="sub-nav">
        <NavLink to="" end className="sub-link">
          Overview
        </NavLink>
        <NavLink to="add-cost" className="sub-link">
          Add Cost
        </NavLink>
        <NavLink to="bills" className="sub-link">
          Project Bills
        </NavLink>
        <NavLink to="payments" className="sub-link">
          Payments
        </NavLink>
        <NavLink to="summary" className="sub-link">
          Project Summary
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
};

export default ConstructionLayout;
