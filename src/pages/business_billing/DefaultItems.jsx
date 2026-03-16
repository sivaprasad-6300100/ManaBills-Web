import React, { useState } from "react";

const DefaultItems = () => {
  const [items, setItems] = useState([]);
  const [item, setItem] = useState({ name: "", price: "", quantity: 1 });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItem({ ...item, [name]: value });
  };

  const addItem = () => {
    if (!item.name || !item.price) {
      alert("Please enter Item Name and Price");
      return;
    }

    setItems([...items, { ...item, id: Date.now() }]);
    setItem({ name: "", price: "", quantity: 1 });
  };

  const removeItem = (id) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="default-page default-items-page">
      <h2>Default Items</h2>

      <div className="default-form default-items-form">
        <input
          type="text"
          name="name"
          placeholder="Item Name"
          value={item.name}
          onChange={handleChange}
          className="default-input"
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={item.price}
          onChange={handleChange}
          className="default-input"
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={item.quantity}
          onChange={handleChange}
          className="default-input"
        />
        <button className="default-save-btn" onClick={addItem}>
          Add Default Item
        </button>
      </div>

      <h3>Saved Default Items</h3>
      <ul className="default-items-list">
        {items.length === 0 && (
          <li className="default-empty">No default items yet.</li>
        )}
        {items.map((i) => (
          <li key={i.id} className="default-items-list-item">
            <div className="default-items-item-row">
              <span className="item-name"><strong>{i.name}</strong></span>
              <span className="item-qty">Qty: {i.quantity}</span>
              <span className="item-price">₹{i.price}</span>
            </div>
            <button className="default-remove-btn" onClick={() => removeItem(i.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DefaultItems;
