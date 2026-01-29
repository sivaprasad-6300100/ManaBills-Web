import React from "react";

const Categories = () => {
  return (
    <div>
      <h2>Expense Categories</h2>

      <div className="empty-box">
        No categories added yet.
      </div>

      <button className="primary-btn">➕ Add Category</button>
    </div>
  );
};

export default Categories;
