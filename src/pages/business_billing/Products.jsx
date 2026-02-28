import React, { useState } from "react";
// import "../../styles/Stockentry.css";

const Products = () => {
  const [stock, setStock] = useState([]);
  const [item, setItem] = useState({
    itemName: "",
    category: "",
    quantity: "",
    price: "",
    expiryDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItem({ ...item, [name]: value });
  };

  const addStock = () => {
    if (!item.itemName || !item.quantity || !item.price) {
      alert("Please fill at least Item Name, Quantity, and Price!");
      return;
    }

    setStock([...stock, item]);
    setItem({
      itemName: "",
      category: "",
      quantity: "",
      price: "",
      expiryDate: "",
    });
  };

  const removeStock = (index) => {
    const newStock = [...stock];
    newStock.splice(index, 1);
    setStock(newStock);
  };

  return (
    <div className="stock-page">
      <h2>Stock Entry</h2>

      <div className="stock-form">
        <input
          type="text"
          name="itemName"
          placeholder="Item Name"
          value={item.itemName}
          onChange={handleChange}
        />

        <input
          type="text"
          name="category"
          placeholder="Category (Optional)"
          value={item.category}
          onChange={handleChange}
        />

        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={item.quantity}
          onChange={handleChange}
        />

        <input
          type="number"
          name="price"
          placeholder="Price per Unit"
          value={item.price}
          onChange={handleChange}
        />

        <input
          type="date"
          name="expiryDate"
          placeholder="Expiry Date (Optional)"
          value={item.expiryDate}
          onChange={handleChange}
        />

        <button onClick={addStock}>Add Stock</button>
      </div>

      <h3>Stock List</h3>
      {stock.length === 0 && <p>No items in stock yet.</p>}
      <ul>
        {stock.map((s, index) => (
          <li key={index}>
            {s.itemName} | {s.category} | Qty: {s.quantity} | ₹{s.price}{" "}
            {s.expiryDate && `| Exp: ${s.expiryDate}`}
            <button onClick={() => removeStock(index)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Products;
