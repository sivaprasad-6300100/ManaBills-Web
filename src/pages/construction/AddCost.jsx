import React from "react";

const AddCost = () => {
  return (
    <div>
      <h2>Add Material / Labor Cost</h2>

      <div className="form-box">
        <input placeholder="Description" />
        <input placeholder="Cost Amount" />
        <select>
          <option>Material</option>
          <option>Labor</option>
        </select>
        <input type="date" />

        <button className="primary-btn">Save Cost</button>
      </div>
    </div>
  );
};

export default AddCost;
