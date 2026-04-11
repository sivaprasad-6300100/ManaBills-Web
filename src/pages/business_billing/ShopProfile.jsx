import React, { useEffect, useState } from "react";
import { getShopProfile, saveShopProfile, deleteShopProfile } from "../../services/businessService";

// ─── Field names match the backend serializer exactly ────────
// Backend fields: shop_name, owner_name, mobile, extra_mobile,
//   address, shop_type, timings, gst_enabled, gst_number, logo_url

const defaultShop = {
  shop_name:    "",
  owner_name:   "",
  mobile:       "",
  extra_mobile: "",
  address:      "",
  shop_type:    "",
  timings:      "",
  gst_enabled:  false,
  gst_number:   "",
  logo_url:     "",
};

// ─── Map backend snake_case → frontend legacy keys (for display) ──
const toDisplay = (d) => ({
  shopName:    d.shop_name    || "",
  ownerName:   d.owner_name   || "",
  mobile:      d.mobile       || "",
  extraMobile: d.extra_mobile || "",
  address:     d.address      || "",
  shopType:    d.shop_type    || "",
  timings:     d.timings      || "",
  gstEnabled:  d.gst_enabled  || false,
  gstNumber:   d.gst_number   || "",
  logo:        d.logo_url     || null,
});

const ShopProfile = () => {
  const [shop,      setShop]      = useState(defaultShop);
  const [savedShop, setSavedShop] = useState(null);  // raw API data
  const [isEditing, setIsEditing] = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load from API on mount ────────────────────────────────
  useEffect(() => {
    getShopProfile()
      .then((data) => {
        setSavedShop(data);
        setShop({
          shop_name:    data.shop_name    || "",
          owner_name:   data.owner_name   || "",
          mobile:       data.mobile       || "",
          extra_mobile: data.extra_mobile || "",
          address:      data.address      || "",
          shop_type:    data.shop_type    || "",
          timings:      data.timings      || "",
          gst_enabled:  data.gst_enabled  || false,
          gst_number:   data.gst_number   || "",
          logo_url:     data.logo_url     || "",
        });
        setIsEditing(false);
      })
      .catch(() => {
        // 404 means no profile yet — stay in edit mode
        setIsEditing(true);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setShop((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ── Save to API ───────────────────────────────────────────
  const saveShopDetails = async () => {
    if (!shop.shop_name || !shop.owner_name || !shop.mobile || !shop.address) {
      showToast("Please fill in Shop Name, Owner Name, Mobile, and Address.", "error");
      return;
    }
    setSaving(true);
    try {
      const data = await saveShopProfile(shop);
      setSavedShop(data);
      setIsEditing(false);
      showToast("Shop details saved successfully ✅");
    } catch (err) {
      showToast("Failed to save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setIsEditing(true);
  };

  // ── Delete from API ───────────────────────────────────────
  const clearProfile = async () => {
    if (!window.confirm("Reset shop profile? This cannot be undone.")) return;
    try {
      await deleteShopProfile();
      setSavedShop(null);
      setShop(defaultShop);
      setIsEditing(true);
      showToast("Shop profile cleared.");
    } catch {
      showToast("Failed to clear profile.", "error");
    }
  };

  const showProfile = savedShop && !isEditing;
  const display     = savedShop ? toDisplay(savedShop) : {};

  return (
    <div className="shop-profile-page">

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

      <div className="shop-profile-header">
        <div className="header-content">
          <h1>Shop / Business Details</h1>
          <p className="header-description">
            Keep one place for your shop profile and GST settings.
          </p>
        </div>
      </div>

      <div className="shop-profile-card">
        {showProfile ? (
          /* ── DISPLAY MODE ── */
          <div className="profile-display-section">
            <div className="profile-header-section">
              <div className="profile-info">
                <span className="profile-label">Saved Shop Profile</span>
                <h2 className="profile-title">{display.shopName}</h2>
                <p className="profile-meta">
                  {display.shopType || "Business"} · {display.timings || "No timing set"}
                </p>
              </div>
              <div className="profile-controls">
                <span className={`gst-status-chip ${display.gstEnabled ? "gst-enabled" : "gst-disabled"}`}>
                  {display.gstEnabled ? "GST Enabled" : "GST Disabled"}
                </span>
                <button className="btn-secondary" onClick={startEdit}>
                  Edit Profile
                </button>
                <button className="btn-text" onClick={clearProfile}>
                  Reset Profile
                </button>
              </div>
            </div>

            <div className="profile-details-grid">
              <div className="detail-card">
                <span className="detail-label">Owner</span>
                <strong className="detail-value">{display.ownerName}</strong>
              </div>
              <div className="detail-card">
                <span className="detail-label">Mobile</span>
                <strong className="detail-value">{display.mobile}</strong>
              </div>
              <div className="detail-card">
                <span className="detail-label">Extra Mobile</span>
                <strong className="detail-value">{display.extraMobile || "—"}</strong>
              </div>
              <div className="detail-card">
                <span className="detail-label">GST Number</span>
                <strong className="detail-value">
                  {display.gstEnabled ? (display.gstNumber || "Not set") : "N/A"}
                </strong>
              </div>
              <div className="detail-card full-width">
                <span className="detail-label">Address</span>
                <strong className="detail-value">{display.address}</strong>
              </div>
            </div>
          </div>
        ) : (
          /* ── EDIT MODE ── */
          <div className="profile-form-section">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Shop Name *</label>
                <input
                  type="text"
                  name="shop_name"
                  placeholder="Enter shop name"
                  value={shop.shop_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Name *</label>
                <input
                  type="text"
                  name="owner_name"
                  placeholder="Enter owner name"
                  value={shop.owner_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="Enter mobile number"
                  value={shop.mobile}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Extra Mobile</label>
                <input
                  type="tel"
                  name="extra_mobile"
                  placeholder="Enter extra mobile (optional)"
                  value={shop.extra_mobile}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Shop Address *</label>
                <textarea
                  name="address"
                  placeholder="Enter complete shop address"
                  value={shop.address}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Shop Type</label>
                <select name="shop_type" value={shop.shop_type} onChange={handleChange}>
                  <option value="">Select shop type</option>
                  <option value="Kirana Store">Kirana Store</option>
                  <option value="HardWare">Hardware</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Resturants">Restaurants</option>
                  <option value="Medical">Medical</option>
                  <option value="Genral Store">General Store</option>
                  <option value="Gold and Silver">Gold and Silver</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Shop Timings</label>
                <input
                  type="text"
                  name="timings"
                  placeholder="e.g., 9AM - 9PM"
                  value={shop.timings}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="gst-section">
              <div className="gst-toggle">
                <input
                  id="gstEnabled"
                  type="checkbox"
                  name="gst_enabled"
                  checked={shop.gst_enabled}
                  onChange={handleChange}
                />
                <label htmlFor="gstEnabled" className="gst-label">
                  Enable GST Billing
                </label>
              </div>
              {shop.gst_enabled && (
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input
                    type="text"
                    name="gst_number"
                    placeholder="Enter GST number"
                    value={shop.gst_number}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={saveShopDetails}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save Shop Details"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShop(defaultShop)}
              >
                Clear Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopProfile;
