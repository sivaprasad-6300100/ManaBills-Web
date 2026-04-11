import React, { useEffect, useState } from "react";

/* ─── helpers ─────────────────────────────────────────────── */
const nextAutoCode = (items) => {
  const used = new Set(items.map((i) => i.shortcode));
  let n = 1;
  while (used.has(String(n))) n++;
  return String(n);
};

/* ─── component ───────────────────────────────────────────── */
const DefaultItems = () => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("defaultItems");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState({
    shortcode: "",
    name: "",
    price: "",
    unit: "KG",
  });

  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem("defaultItems", JSON.stringify(items));
  }, [items]);

  /* ── form change ── */
  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ── save / update ── */
  const saveItem = () => {
    const name = form.name.trim();
    const price = parseFloat(form.price);
    const shortcode = form.shortcode.trim() || nextAutoCode(items);

    if (!name) return setError("Item name రాయండి / enter item name");
    if (!price || price <= 0) return setError("Valid price enter చేయండి");

    // duplicate shortcode check (skip if editing same item)
    const duplicate = items.find(
      (i) =>
        i.shortcode.toLowerCase() === shortcode.toLowerCase() &&
        i.id !== editId
    );
    if (duplicate) {
      return setError(
        `Shortcode "${shortcode}" already used for "${duplicate.name}"`
      );
    }

    if (editId) {
      setItems(
        items.map((i) =>
          i.id === editId
            ? { ...i, shortcode, name, price, unit: form.unit }
            : i
        )
      );
      setEditId(null);
    } else {
      setItems([
        ...items,
        { id: Date.now(), shortcode, name, price, unit: form.unit },
      ]);
    }
    setForm({ shortcode: "", name: "", price: "", unit: "KG" });
    setError("");
  };

  /* ── edit ── */
  const startEdit = (item) => {
    setEditId(item.id);
    setForm({
      shortcode: item.shortcode,
      name: item.name,
      price: String(item.price),
      unit: item.unit || "KG",
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── remove ── */
  const removeItem = (id) => {
    if (window.confirm("ఈ item delete చేయాలా?")) {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  /* ── cancel edit ── */
  const cancelEdit = () => {
    setEditId(null);
    setForm({ shortcode: "", name: "", price: "", unit: "KG" });
    setError("");
  };

  /* ── filtered list ── */
  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.shortcode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="default-page default-items-page">

      {/* ── HEADER ── */}
      <div className="di-header">
        <h2>📦 Default Items (Stock)</h2>
        <p className="di-subtitle">
          Shortcode type చేస్తే invoice లో automatically item + price fill అవుతుంది
        </p>
      </div>

      {/* ── FORM ── */}
      <div className="di-form-card">
        <h3>{editId ? "✏️ Item Edit చేయండి" : "➕ కొత్త Item Add చేయండి"}</h3>

        {/* shortcode tip */}
        <div className="di-tip">
          💡 <strong>Shortcode</strong> — మీకు నచ్చిన key రాయండి (1, A, E, IDR, ఇడ్లీ...).
          Empty వదిలితే auto number వస్తుంది.
        </div>

        <div className="di-form-grid">
          {/* shortcode */}
          <div className="di-field">
            <label>Shortcode (Quick Key)</label>
            <input
              name="shortcode"
              value={form.shortcode}
              onChange={handleChange}
              placeholder={`Auto → ${nextAutoCode(
                editId ? items.filter((i) => i.id !== editId) : items
              )}`}
              className="di-shortcode-input"
              maxLength={10}
            />
          </div>

          {/* item name - Telugu / English both */}
          <div className="di-field di-field-wide">
            <label>Item Name (Telugu / English)</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="ఉదా: IDLY RAVVA / బియ్యం / Toor Dal"
              className="default-input"
            />
          </div>

          {/* price */}
          <div className="di-field">
            <label>Price (₹)</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              className="default-input"
            />
          </div>

          {/* unit */}
          <div className="di-field">
            <label>Unit</label>
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="di-select"
            >
              <option value="KG">KG</option>
              <option value="G">Gram (G)</option>
              <option value="L">Litre (L)</option>
              <option value="ML">ML</option>
              <option value="Piece">Piece</option>
              <option value="Dozen">Dozen</option>
              <option value="Box">Box</option>
              <option value="Packet">Packet</option>
              <option value="Bundle">Bundle</option>
            </select>
          </div>
        </div>

        {error && <p className="di-error">⚠️ {error}</p>}

        <div className="di-form-actions">
          <button className="di-save-btn" onClick={saveItem}>
            {editId ? "✅ Update Item" : "✅ Save Item"}
          </button>
          {editId && (
            <button className="di-cancel-btn" onClick={cancelEdit}>
              ❌ Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── LIST ── */}
      <div className="di-list-section">
        <div className="di-list-header">
          <h3>📋 Saved Items ({items.length})</h3>
          <input
            className="di-search"
            placeholder="🔍 Search by name or shortcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="di-empty">
            {items.length === 0
              ? "Items ఏమీ లేవు. పై form లో add చేయండి."
              : "Search result లేదు."}
          </div>
        ) : (
          <div className="di-table-wrapper">
            <table className="di-table">
              <thead>
                <tr>
                  <th>Shortcode</th>
                  <th>Item Name</th>
                  <th>Price</th>
                  <th>Unit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className={editId === item.id ? "di-row-editing" : ""}>
                    <td>
                      <span className="di-badge">{item.shortcode}</span>
                    </td>
                    <td className="di-item-name">{item.name}</td>
                    <td className="di-price">₹{item.price}</td>
                    <td>{item.unit}</td>
                    <td className="di-actions">
                      <button
                        className="di-edit-btn"
                        onClick={() => startEdit(item)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="di-del-btn"
                        onClick={() => removeItem(item.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── HOW TO USE ── */}
      <div className="di-howto">
        <h4>🚀 Invoice లో ఎలా వాడాలి?</h4>
        <ol>
          <li>Invoice page లో Item field లో <strong>shortcode</strong> type చేయండి (ఉదా: <code>1</code>)</li>
          <li>Item name + price <strong>auto fill</strong> అవుతుంది</li>
          <li>Quantity మార్చుకోవచ్చు — amount automatically calculate అవుతుంది</li>
        </ol>
        <div className="di-example">
          <span className="di-ex-code">1</span>
          <span className="di-ex-arrow">→</span>
          <span className="di-ex-item">IDLY RAVVA &nbsp;·&nbsp; ₹60/KG</span>
        </div>
      </div>

    </div>
  );
};

export default DefaultItems;
