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
    <div style={{ padding: "20px" }}>
      <h2>Default Items</h2>
      <input
        type="text"
        name="name"
        placeholder="Item Name"
        value={item.name}
        onChange={handleChange}
      />
      <input
        type="number"
        name="price"
        placeholder="Price"
        value={item.price}
        onChange={handleChange}
      />
      <input
        type="number"
        name="quantity"
        placeholder="Quantity"
        value={item.quantity}
        onChange={handleChange}
      />
      <button onClick={addItem}>Add Default Item</button>

      <h3>Saved Default Items</h3>
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            {i.name} | ₹{i.price} | Qty: {i.quantity}{" "}
            <button onClick={() => removeItem(i.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DefaultItems;
