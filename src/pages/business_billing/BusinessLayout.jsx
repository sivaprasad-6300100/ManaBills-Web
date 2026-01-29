import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const BusinessLayout = () => {
  return (
    <div>
      {/* Business Sub Navigation */}
      <div className="sub-nav">
        <NavLink to="" end className="sub-link">
          Overview
        </NavLink>
         <NavLink to="shop-profile" className="sub-link">
            Shop Profile
         </NavLink>
        
        <NavLink to="create-invoice" className="sub-link">
          Create Invoice
        </NavLink>
        <NavLink to="products" className="sub-link">
          Stock Entry
        </NavLink>
        <NavLink to="default-items" className="sub-link">
          Default Items
        </NavLink>
                
        <NavLink to="customers" className="sub-link">
          Customers
        </NavLink>
        <NavLink to="invoices" className="sub-link">
          Invoices
        </NavLink>
        <NavLink to="gst" className="sub-link">
          GST Reports
        </NavLink>
      </div>

      {/* Business Page Content */}
      <Outlet />
    </div>
  );
};

export default BusinessLayout;
