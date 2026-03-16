import React, { useEffect, useState } from "react";

const DEFAULT_CATEGORIES = [
  "🥦 Groceries",
  "⛽ Transport / Fuel",
  "💡 Electricity",
  "💧 Water",
  "🌐 Internet / Mobile",
  "🏠 Rent / EMI",
  "🏥 Medical",
  "🎓 Education",
  "🎁 Miscellaneous",
];

const EMOJIS = ["🏷️","🛒","🚗","💊","📚","🎮","🍕","✈️","🏋️","💼","🛠️","🎁"];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🏷️");
  const [editIdx, setEditIdx] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("expense_categories")) || DEFAULT_CATEGORIES;
    setCategories(saved);
  }, []);

  const save = (updated) => {
    setCategories(updated);
    localStorage.setItem("expense_categories", JSON.stringify(updated));
  };

  const addCategory = () => {
    if (!newCat.trim()) return;
    const label = `${selectedEmoji} ${newCat.trim()}`;
    if (categories.includes(label)) {
      alert("Category already exists.");
      return;
    }
    save([...categories, label]);
    setNewCat("");
  };

  const deleteCategory = (idx) => {
    if (!window.confirm("Delete this category?")) return;
    const updated = categories.filter((_, i) => i !== idx);
    save(updated);
  };

  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditValue(categories[idx]);
  };

  const saveEdit = (idx) => {
    if (!editValue.trim()) return;
    const updated = [...categories];
    updated[idx] = editValue.trim();
    save(updated);
    setEditIdx(null);
    setEditValue("");
  };

  const resetDefaults = () => {
    if (window.confirm("Reset to default categories?")) {
      save(DEFAULT_CATEGORIES);
    }
  };

  return (
    <div className="categories-page">
      <div className="cat-header">
        <h2>Expense Categories</h2>
        <button className="cat-reset-btn" onClick={resetDefaults}>
          ↺ Reset Defaults
        </button>
      </div>

      {/* Add New */}
      <div className="cat-add-box">
        <h3>Add New Category</h3>
        <div className="cat-add-row">
          <div className="cat-emoji-pick">
            {EMOJIS.map((e) => (
              <button
                key={e}
                className={`emoji-btn ${selectedEmoji === e ? "selected" : ""}`}
                onClick={() => setSelectedEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="cat-input-row">
            <span className="cat-emoji-preview">{selectedEmoji}</span>
            <input
              type="text"
              placeholder="Category name..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <button className="cat-add-btn" onClick={addCategory}>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="cat-list-box">
        <h3>{categories.length} Categories</h3>
        {categories.length === 0 ? (
          <p className="cat-empty">No categories yet.</p>
        ) : (
          <ul className="cat-list">
            {categories.map((cat, idx) => (
              <li key={idx} className="cat-item">
                {editIdx === idx ? (
                  <div className="cat-edit-row">
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(idx)}
                      autoFocus
                    />
                    <button className="cat-save-btn" onClick={() => saveEdit(idx)}>
                      ✓
                    </button>
                    <button
                      className="cat-cancel-btn"
                      onClick={() => setEditIdx(null)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="cat-label">{cat}</span>
                    <div className="cat-actions">
                      <button
                        className="cat-edit-btn"
                        onClick={() => startEdit(idx)}
                      >
                        ✏️
                      </button>
                      <button
                        className="cat-del-btn"
                        onClick={() => deleteCategory(idx)}
                      >
                        🗑
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Categories;
