import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/custom/custom.css"

const CustomLayout = () => {
  return (
    <div >
      
      {/* Sub Navigation */}
      <div className="sub-nav">
        <NavLink to="" end className="sub-link">
          Overview
        </NavLink>

        <NavLink to="create-estimate" className="sub-link">
          Create Estimate
        </NavLink>

        <NavLink to="quotations" className="sub-link">
          Quotations
        </NavLink>

        <NavLink to="custom-bills" className="sub-link">
          Bills
        </NavLink>

        <NavLink to="custom-payments" className="sub-link">
          Payments
        </NavLink>

        <NavLink to="custom-customers" className="sub-link">
          Customers
        </NavLink>

        <NavLink to="custom-summary" className="sub-link">
          Summary
        </NavLink>
      </div>

      {/* Page Content */}
      <div className="custom-content">
        <Outlet />
      </div>
    </div>
  );
};

export default CustomLayout;
