import React, { useEffect, useState } from "react";

const BLANK = { name: "", mobile: "", email: "", address: "", gstNumber: "" };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("customers")) || [];
    setCustomers(saved);
  }, []);

  const persist = (updated) => {
    setCustomers(updated);
    localStorage.setItem("customers", JSON.stringify(updated));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.mobile.trim()) {
      alert("Name and Mobile Number are required.");
      return;
    }

    if (editId !== null) {
      const updated = customers.map((c) =>
        c.id === editId ? { ...form, id: editId } : c
      );
      persist(updated);
      setEditId(null);
    } else {
      const newCustomer = { ...form, id: Date.now() };
      persist([...customers, newCustomer]);
    }

    setForm(BLANK);
    setShowForm(false);
  };

  const startEdit = (c) => {
    setForm({
      name: c.name,
      mobile: c.mobile,
      email: c.email || "",
      address: c.address || "",
      gstNumber: c.gstNumber || "",
    });
    setEditId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteCustomer = (id) => {
    if (!window.confirm("Delete this customer?")) return;
    persist(customers.filter((c) => c.id !== id));
  };

  const cancelForm = () => {
    setForm(BLANK);
    setEditId(null);
    setShowForm(false);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search)
  );

  return (
    <div className="customers-page">
      {/* Header */}
      <div className="cust-header">
        <div>
          <h2>Customers</h2>
          <p className="cust-sub">{customers.length} customers saved</p>
        </div>
        {!showForm && (
          <button
            className="cust-add-btn"
            onClick={() => { setShowForm(true); setEditId(null); setForm(BLANK); }}
          >
            ➕ Add Customer
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="cust-form-card">
          <h3>{editId ? "Edit Customer" : "New Customer"}</h3>
          <div className="cust-form-grid">
            <div className="cust-field">
              <label>Full Name *</label>
              <input
                name="name"
                placeholder="Customer name"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            <div className="cust-field">
              <label>Mobile Number *</label>
              <input
                name="mobile"
                placeholder="10-digit mobile"
                value={form.mobile}
                onChange={handleChange}
                maxLength={10}
              />
            </div>
            <div className="cust-field">
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div className="cust-field">
              <label>GST Number</label>
              <input
                name="gstNumber"
                placeholder="22AAAAA0000A1Z5"
                value={form.gstNumber}
                onChange={handleChange}
              />
            </div>
            <div className="cust-field full">
              <label>Address</label>
              <textarea
                name="address"
                placeholder="Full address"
                value={form.address}
                onChange={handleChange}
                rows={2}
              />
            </div>
          </div>
          <div className="cust-form-actions">
            <button className="cust-save-btn" onClick={handleSubmit}>
              {editId ? "Update Customer" : "Save Customer"}
            </button>
            <button className="cust-cancel-btn" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="cust-search-wrap">
        <input
          className="cust-search"
          placeholder="🔍  Search by name or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="cust-empty">
          {customers.length === 0
            ? "No customers added yet. Click ➕ Add Customer to get started."
            : "No customers match your search."}
        </div>
      ) : (
        <div className="cust-grid">
          {filtered.map((c) => (
            <div key={c.id} className="cust-card">
              <div className="cust-avatar">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="cust-info">
                <span className="cust-name">{c.name}</span>
                <span className="cust-mobile">📱 {c.mobile}</span>
                {c.email && (
                  <span className="cust-email">✉️ {c.email}</span>
                )}
                {c.gstNumber && (
                  <span className="cust-gst">🧾 GST: {c.gstNumber}</span>
                )}
                {c.address && (
                  <span className="cust-address">📍 {c.address}</span>
                )}
              </div>
              <div className="cust-card-actions">
                <button
                  className="cust-edit-btn"
                  onClick={() => startEdit(c)}
                >
                  ✏️
                </button>
                <button
                  className="cust-del-btn"
                  onClick={() => deleteCustomer(c.id)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;
