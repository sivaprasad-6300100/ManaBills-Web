import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const ExpenseLayout = () => {
  return (
    <div>
      {/* Sub Navigation */}
      <div className="sub-nav">
        <NavLink to="" end className="sub-link">
          Overview
        </NavLink>
        <NavLink to="add" className="sub-link">
          Add Expense
        </NavLink>
        <NavLink to="categories" className="sub-link">
          Categories
        </NavLink>
        <NavLink to="summary" className="sub-link">
          Monthly Summary
        </NavLink>
        <NavLink to="reports" className="sub-link">
          Reports
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
};

export default ExpenseLayout;
