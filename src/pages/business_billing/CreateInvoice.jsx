import React, { useEffect, useRef, useState } from "react";
import "../../styles/CreateInvoice.css";

const CreateInvoice = () => {
  const [isGST, setIsGST] = useState(false);
  const [items, setItems] = useState([{ name: "", qty: 1, price: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [payment, setPayment] = useState("Cash");

  const itemNameRef = useRef(null);

  const addItem = () => {
    setItems([...items, { name: "", qty: 1, price: 0 }]);
    setTimeout(() => itemNameRef.current?.focus(), 0);
  };

  const updateItem = (i, field, value) => {
    const copy = [...items];
    copy[i][field] = value;
    setItems(copy);
  };

  const removeItem = (i) => {
    if (items.length > 1) {
      setItems(items.filter((_, index) => index !== i));
    }
  };

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const gst = isGST ? subtotal * 0.05 : 0;
  const total = subtotal + gst - discount;
  const balance = total - advance;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addItem();
      }
      if (e.ctrlKey && e.key === "Enter") {
        alert("Invoice Generated ✅");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [items]);

  return (
    <div className="invoice-page-full">
      <h2>Create Invoice</h2>

      {/* CUSTOMER */}
      <div className="top-grid">
        <input placeholder="Customer Name" />
        <input placeholder="Mobile Number" />

        <label className="gst-toggle">
          <input
            type="checkbox"
            checked={isGST}
            onChange={() => setIsGST(!isGST)}
          />
          GST Invoice
        </label>

        {isGST && <input placeholder="Customer GST Number" />}
      </div>

      <div className="invoice-layout">
        {/* LEFT */}
        <div className="items-section">
          <table className="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>
                    <input
                      ref={i === items.length - 1 ? itemNameRef : null}
                      value={item.name}
                      placeholder="Item name"
                      onChange={(e) =>
                        updateItem(i, "name", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.qty}
                      placeholder="Qty"
                      onChange={(e) =>
                        updateItem(i, "qty", +e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.price}
                      placeholder="Price"
                      onChange={(e) =>
                        updateItem(i, "price", +e.target.value)
                      }
                    />
                  </td>
                  <td>₹{item.qty * item.price}</td>
                  <td>
                    {items.length > 1 && (
                      <button
                        className="remove-btn"
                        onClick={() => removeItem(i)}
                      >
                        ✖
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="add-btn" onClick={addItem}>
            + Add Item (Enter)
          </button>
        </div>

        {/* RIGHT */}
        <div className="summary-panel">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          {isGST && (
            <div className="summary-row">
              <span>GST (5%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Discount</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(+e.target.value)}
            />
          </div>

          <div className="summary-total">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>

          <select value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option>Cash</option>
            <option>UPI</option>
            <option>PhonePe</option>
          </select>

          <input
            type="number"
            placeholder="Advance Paid"
            value={advance}
            onChange={(e) => setAdvance(+e.target.value)}
          />

          <div className="balance">
            Balance Amount: ₹{balance.toFixed(2)}
          </div>

          <button className="generate-btn">
            Generate Invoice (Ctrl + Enter)
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;
