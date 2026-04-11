import React, { useEffect, useState } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../services/businessService";

// ─── Backend field names (snake_case) ────────────────────────
// id, name, mobile, email, gst_number, address

const BLANK = { name: "", mobile: "", email: "", address: "", gst_number: "" };

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [form,      setForm]      = useState(BLANK);
  const [editId,    setEditId]    = useState(null);
  const [search,    setSearch]    = useState("");
  const [showForm,  setShowForm]  = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load customers from API ───────────────────────────────
  const loadCustomers = async (q = "") => {
    try {
      const data = await getCustomers(q);
      setCustomers(data);
    } catch {
      showToast("Failed to load customers.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // ── Search — debounced via useEffect ─────────────────────
  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Create or Update ─────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.mobile.trim()) {
      showToast("Name and Mobile Number are required.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editId !== null) {
        // UPDATE
        const updated = await updateCustomer(editId, form);
        setCustomers((prev) =>
          prev.map((c) => (c.id === editId ? updated : c))
        );
        showToast("Customer updated ✓");
        setEditId(null);
      } else {
        // CREATE
        const created = await createCustomer(form);
        setCustomers((prev) => [created, ...prev]);
        showToast("Customer saved ✓");
      }
      setForm(BLANK);
      setShowForm(false);
    } catch {
      showToast("Failed to save customer.", "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setForm({
      name:       c.name,
      mobile:     c.mobile     || "",
      email:      c.email      || "",
      address:    c.address    || "",
      gst_number: c.gst_number || "",
    });
    setEditId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      showToast("Customer deleted.");
    } catch {
      showToast("Failed to delete.", "error");
    }
  };

  const cancelForm = () => {
    setForm(BLANK);
    setEditId(null);
    setShowForm(false);
  };

  return (
    <div className="customers-page">

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "72px", left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, padding: "10px 24px", borderRadius: "100px",
          fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap",
          background: toast.type === "success" ? "#0e1b2e" : "#dc2626",
          color: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        }}>
          {toast.msg}
        </div>
      )}

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
                name="gst_number"
                placeholder="22AAAAA0000A1Z5"
                value={form.gst_number}
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
            <button
              className="cust-save-btn"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Saving…" : editId ? "Update Customer" : "Save Customer"}
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
      {loading ? (
        <div className="cust-empty">Loading customers…</div>
      ) : customers.length === 0 ? (
        <div className="cust-empty">
          {search
            ? "No customers match your search."
            : "No customers added yet. Click ➕ Add Customer to get started."}
        </div>
      ) : (
        <div className="cust-grid">
          {customers.map((c) => (
            <div key={c.id} className="cust-card">
              <div className="cust-avatar">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="cust-info">
                <span className="cust-name">{c.name}</span>
                {c.mobile     && <span className="cust-mobile">📱 {c.mobile}</span>}
                {c.email      && <span className="cust-email">✉️ {c.email}</span>}
                {c.gst_number && <span className="cust-gst">🧾 GST: {c.gst_number}</span>}
                {c.address    && <span className="cust-address">📍 {c.address}</span>}
              </div>
              <div className="cust-card-actions">
                <button className="cust-edit-btn" onClick={() => startEdit(c)}>✏️</button>
                <button className="cust-del-btn"  onClick={() => handleDelete(c.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;
