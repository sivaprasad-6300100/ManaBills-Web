import React from "react";

const Customers = () => {
  return (
    <div>
      <h2>Customers</h2>

      <div className="empty-box">
        No customers added yet.
      </div>

      <button className="primary-btn">
        ➕ Add Customer
      </button>
    </div>
  );
};

export default Customers;
