import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/construction/construction.css"


const ConstructionLayout = () => {
  return (
    <div>
      {/* Sub Navigation */}
      <div className="sub-nav">
        <NavLink to="" end className="sub-link">
          Overview
        </NavLink>
        <NavLink to="Budget" className="sub-link">
          Budget
        </NavLink>
        <NavLink to="WorkBills" className="sub-link">
          Work & Bills
        </NavLink>
        <NavLink to="payments" className="sub-link">
          Payments
        </NavLink>
        <NavLink to="summary" className="sub-link">
          Summary
        </NavLink>
        {/* <NavLink to="Separate_Bills" className="sub-link"> */}
          {/* Separate_Bills */}
        {/* </NavLink> */}
      </div>

      <Outlet />
    </div>
  );
};

export default ConstructionLayout;
