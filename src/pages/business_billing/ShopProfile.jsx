import React, { useEffect, useState } from "react";
import { getShopProfile, saveShopProfile, deleteShopProfile } from "../../services/businessService";

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

const shopTypeIcons = {
  "Kirana Store": "🛒",
  "HardWare": "🔧",
  "Clothing": "👗",
  "Resturants": "🍽️",
  "Medical": "💊",
  "Genral Store": "🏪",
  "Gold and Silver": "💍",
  "Others": "🏢",
};

const ShopProfile = () => {
  const [shop,      setShop]      = useState(defaultShop);
  const [savedShop, setSavedShop] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [activeSection, setActiveSection] = useState("basic");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const startEdit = () => setIsEditing(true);

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
  const shopIcon    = shopTypeIcons[display.shopType] || "🏢";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .sp-root * { box-sizing: border-box; margin: 0; padding: 0; }

        .sp-root {
          font-family: 'Sora', sans-serif;
          min-height: 100vh;
          background: #f0f2f7;
          padding: 24px 16px 48px;
        }

        /* ── Toast ── */
        .sp-toast {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%) translateY(-8px);
          z-index: 9999;
          padding: 12px 28px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.82rem;
          white-space: nowrap;
          color: #fff;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          animation: toastIn 0.3s ease forwards;
          letter-spacing: 0.01em;
        }
        .sp-toast.success { background: linear-gradient(135deg, #1a73e8, #0d47a1); }
        .sp-toast.error   { background: linear-gradient(135deg, #e53935, #b71c1c); }
        @keyframes toastIn {
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
          from { opacity: 0; }
        }

        /* ── Page Header ── */
        .sp-page-header {
          max-width: 860px;
          margin: 0 auto 28px;
        }
        .sp-page-header h1 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #0d1b2a;
          letter-spacing: -0.03em;
        }
        .sp-page-header p {
          font-size: 0.88rem;
          color: #6b7a99;
          margin-top: 4px;
          font-weight: 400;
        }

        /* ── Card ── */
        .sp-card {
          max-width: 860px;
          margin: 0 auto;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 2px 24px rgba(13,27,42,0.08), 0 1px 4px rgba(13,27,42,0.04);
          overflow: hidden;
        }

        /* ════════════════════════════════
           DISPLAY MODE
        ════════════════════════════════ */
        .sp-display-hero {
          background: linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%);
          padding: 32px 32px 28px;
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .sp-display-hero::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 200px; height: 200px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
        }
        .sp-display-hero::after {
          content: '';
          position: absolute;
          bottom: -60px; left: -20px;
          width: 160px; height: 160px;
          background: rgba(255,255,255,0.04);
          border-radius: 50%;
        }
        .sp-hero-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        .sp-hero-icon {
          width: 56px; height: 56px;
          background: rgba(255,255,255,0.15);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.8rem;
          backdrop-filter: blur(8px);
          flex-shrink: 0;
        }
        .sp-hero-info { flex: 1; }
        .sp-hero-label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.7;
          margin-bottom: 4px;
        }
        .sp-hero-name {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .sp-hero-meta {
          font-size: 0.82rem;
          opacity: 0.75;
          margin-top: 6px;
          font-weight: 400;
        }
        .sp-hero-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .sp-gst-chip {
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .sp-gst-chip.on  { background: rgba(76,175,80,0.25); color: #a5d6a7; border: 1px solid rgba(76,175,80,0.3); }
        .sp-gst-chip.off { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.15); }
        .sp-btn-edit {
          padding: 8px 20px;
          background: rgba(255,255,255,0.15);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
          backdrop-filter: blur(8px);
        }
        .sp-btn-edit:hover { background: rgba(255,255,255,0.25); }
        .sp-btn-reset {
          padding: 8px 16px;
          background: transparent;
          color: rgba(255,255,255,0.55);
          border: none;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.2s;
        }
        .sp-btn-reset:hover { color: #ffcdd2; }

        /* Detail Grid */
        .sp-detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1px;
          background: #eef0f5;
          border-top: 1px solid #eef0f5;
        }
        .sp-detail-cell {
          background: #fff;
          padding: 20px 24px;
          transition: background 0.15s;
        }
        .sp-detail-cell:hover { background: #f8f9ff; }
        .sp-detail-cell.full { grid-column: 1 / -1; }
        .sp-detail-lbl {
          font-size: 0.72rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .sp-detail-val {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
          font-family: 'JetBrains Mono', monospace;
        }
        .sp-detail-val.normal {
          font-family: 'Sora', sans-serif;
          font-size: 0.92rem;
        }
        .sp-detail-val.empty { color: #cbd5e1; font-weight: 400; }

        /* ════════════════════════════════
           EDIT MODE
        ════════════════════════════════ */
        .sp-form-header {
          padding: 28px 32px 0;
          border-bottom: 1px solid #eef0f5;
        }
        .sp-form-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0d1b2a;
          margin-bottom: 20px;
        }
        .sp-tabs {
          display: flex;
          gap: 0;
        }
        .sp-tab {
          padding: 10px 20px;
          font-size: 0.83rem;
          font-weight: 600;
          color: #94a3b8;
          border: none;
          background: none;
          cursor: pointer;
          font-family: inherit;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .sp-tab.active {
          color: #1a73e8;
          border-bottom-color: #1a73e8;
        }
        .sp-tab:hover:not(.active) { color: #64748b; }

        .sp-form-body { padding: 28px 32px; }

        .sp-section { display: none; }
        .sp-section.visible { display: block; }

        .sp-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .sp-field { display: flex; flex-direction: column; gap: 7px; }
        .sp-field.full { grid-column: 1 / -1; }
        .sp-field label {
          font-size: 0.78rem;
          font-weight: 600;
          color: #475569;
          letter-spacing: 0.03em;
        }
        .sp-field label span.req { color: #ef4444; margin-left: 2px; }

        .sp-field input,
        .sp-field select,
        .sp-field textarea {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.9rem;
          font-family: 'Sora', sans-serif;
          color: #1e293b;
          background: #f8fafc;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .sp-field input:focus,
        .sp-field select:focus,
        .sp-field textarea:focus {
          border-color: #1a73e8;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(26,115,232,0.1);
        }
        .sp-field textarea {
          resize: vertical;
          min-height: 90px;
          line-height: 1.5;
        }
        .sp-field select { cursor: pointer; }

        /* GST Toggle */
        .sp-gst-box {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 20px;
          margin-top: 4px;
        }
        .sp-gst-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .sp-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        .sp-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .sp-toggle-track {
          position: absolute;
          inset: 0;
          background: #cbd5e1;
          border-radius: 50px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .sp-toggle input:checked + .sp-toggle-track { background: #1a73e8; }
        .sp-toggle-track::after {
          content: '';
          position: absolute;
          top: 3px; left: 3px;
          width: 18px; height: 18px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .sp-toggle input:checked + .sp-toggle-track::after { transform: translateX(20px); }
        .sp-gst-text h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
        }
        .sp-gst-text p {
          font-size: 0.78rem;
          color: #94a3b8;
          margin-top: 2px;
          font-weight: 400;
        }
        .sp-gst-number {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          animation: fadeDown 0.25s ease;
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Form Actions */
        .sp-form-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 20px 32px 28px;
          border-top: 1px solid #eef0f5;
          flex-wrap: wrap;
        }
        .sp-btn-primary {
          padding: 12px 28px;
          background: linear-gradient(135deg, #1a73e8, #0d47a1);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.2s, transform 0.1s;
          letter-spacing: 0.01em;
          box-shadow: 0 4px 16px rgba(26,115,232,0.3);
        }
        .sp-btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .sp-btn-primary:active { transform: translateY(0); }
        .sp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .sp-btn-secondary {
          padding: 12px 20px;
          background: #f1f5f9;
          color: #64748b;
          border: none;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }
        .sp-btn-secondary:hover { background: #e2e8f0; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .sp-root { padding: 16px 12px 40px; }
          .sp-page-header h1 { font-size: 1.3rem; }
          .sp-display-hero { padding: 24px 20px; }
          .sp-hero-name { font-size: 1.2rem; }
          .sp-hero-top { flex-direction: column; gap: 16px; }
          .sp-hero-actions { width: 100%; justify-content: flex-start; }
          .sp-form-header { padding: 20px 20px 0; }
          .sp-form-body { padding: 20px; }
          .sp-form-grid { grid-template-columns: 1fr; }
          .sp-field.full { grid-column: 1; }
          .sp-form-actions { padding: 16px 20px 24px; }
          .sp-detail-cell { padding: 16px 20px; }
          .sp-tabs { overflow-x: auto; padding-bottom: 0; }
          .sp-tab { padding: 10px 14px; font-size: 0.78rem; }
        }
      `}</style>

      <div className="sp-root">

        {/* Toast */}
        {toast && (
          <div className={`sp-toast ${toast.type}`}>{toast.msg}</div>
        )}

        {/* Page Header */}
        <div className="sp-page-header">
          <h1>Shop / Business Details</h1>
          <p>Manage your shop profile, contact info, and GST settings in one place.</p>
        </div>

        <div className="sp-card">

          {showProfile ? (
            /* ══════════ DISPLAY MODE ══════════ */
            <>
              <div className="sp-display-hero">
                <div className="sp-hero-top">
                  <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flex: 1 }}>
                    <div className="sp-hero-icon">{shopIcon}</div>
                    <div className="sp-hero-info">
                      <div className="sp-hero-label">Saved Shop Profile</div>
                      <div className="sp-hero-name">{display.shopName}</div>
                      <div className="sp-hero-meta">
                        {display.shopType || "Business"} · {display.timings || "No timing set"}
                      </div>
                    </div>
                  </div>
                  <div className="sp-hero-actions">
                    <span className={`sp-gst-chip ${display.gstEnabled ? "on" : "off"}`}>
                      {display.gstEnabled ? "GST On" : "GST Off"}
                    </span>
                    <button className="sp-btn-edit" onClick={startEdit}>Edit Profile</button>
                    <button className="sp-btn-reset" onClick={clearProfile}>Reset</button>
                  </div>
                </div>
              </div>

              <div className="sp-detail-grid">
                <div className="sp-detail-cell">
                  <div className="sp-detail-lbl">Owner</div>
                  <div className="sp-detail-val normal">{display.ownerName || <span className="empty">—</span>}</div>
                </div>
                <div className="sp-detail-cell">
                  <div className="sp-detail-lbl">Mobile</div>
                  <div className="sp-detail-val">{display.mobile || <span className="empty">—</span>}</div>
                </div>
                <div className="sp-detail-cell">
                  <div className="sp-detail-lbl">Extra Mobile</div>
                  <div className={`sp-detail-val ${display.extraMobile ? "" : "empty"}`}>
                    {display.extraMobile || "Not set"}
                  </div>
                </div>
                <div className="sp-detail-cell">
                  <div className="sp-detail-lbl">GST Number</div>
                  <div className={`sp-detail-val ${display.gstEnabled && display.gstNumber ? "" : "empty"}`}>
                    {display.gstEnabled ? (display.gstNumber || "Not set") : "N/A"}
                  </div>
                </div>
                <div className="sp-detail-cell full">
                  <div className="sp-detail-lbl">Address</div>
                  <div className="sp-detail-val normal">{display.address}</div>
                </div>
              </div>
            </>

          ) : (
            /* ══════════ EDIT MODE ══════════ */
            <>
              <div className="sp-form-header">
                <div className="sp-form-title">
                  {savedShop ? "Edit Shop Profile" : "Set Up Your Shop"}
                </div>
                <div className="sp-tabs">
                  <button
                    className={`sp-tab ${activeSection === "basic" ? "active" : ""}`}
                    onClick={() => setActiveSection("basic")}
                  >
                    Basic Info
                  </button>
                  <button
                    className={`sp-tab ${activeSection === "contact" ? "active" : ""}`}
                    onClick={() => setActiveSection("contact")}
                  >
                    Contact
                  </button>
                  <button
                    className={`sp-tab ${activeSection === "gst" ? "active" : ""}`}
                    onClick={() => setActiveSection("gst")}
                  >
                    GST & Tax
                  </button>
                </div>
              </div>

              <div className="sp-form-body">

                {/* ── Tab: Basic Info ── */}
                <div className={`sp-section ${activeSection === "basic" ? "visible" : ""}`}>
                  <div className="sp-form-grid">
                    <div className="sp-field">
                      <label>Shop Name <span className="req">*</span></label>
                      <input
                        type="text"
                        name="shop_name"
                        placeholder="e.g. Ravi General Store"
                        value={shop.shop_name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="sp-field">
                      <label>Owner Name <span className="req">*</span></label>
                      <input
                        type="text"
                        name="owner_name"
                        placeholder="e.g. Ravi Kumar"
                        value={shop.owner_name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="sp-field">
                      <label>Shop Type</label>
                      <select name="shop_type" value={shop.shop_type} onChange={handleChange}>
                        <option value="">Select shop type</option>
                        <option value="Kirana Store">🛒 Kirana Store</option>
                        <option value="HardWare">🔧 Hardware</option>
                        <option value="Clothing">👗 Clothing</option>
                        <option value="Resturants">🍽️ Restaurants</option>
                        <option value="Medical">💊 Medical</option>
                        <option value="Genral Store">🏪 General Store</option>
                        <option value="Gold and Silver">💍 Gold and Silver</option>
                        <option value="Others">🏢 Others</option>
                      </select>
                      <div className="sp-field full">
                        <label>Shop Logo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                          
                            // preview
                            const previewUrl = URL.createObjectURL(file);
                          
                            setShop((prev) => ({
                              ...prev,
                              logo_file: file,       // actual file
                              logo_preview: previewUrl, // preview
                            }));
                          }}
                        />
                      
                        {/* Preview */}
                        {(shop.logo_preview || shop.logo_url) && (
                          <img
                            src={shop.logo_preview || shop.logo_url}
                            alt="Logo Preview"
                            style={{
                              width: "80px",
                              height: "80px",
                              marginTop: "10px",
                              borderRadius: "10px",
                              objectFit: "cover",
                              border: "1px solid #ccc",
                            }}
                          />
                        )}
                      </div>

                    </div>
                    <div className="sp-field">
                      <label>Shop Timings</label>
                      <input
                        type="text"
                        name="timings"
                        placeholder="e.g. 9AM – 9PM"
                        value={shop.timings}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="sp-field full">
                      <label>Shop Address <span className="req">*</span></label>
                      <textarea
                        name="address"
                        placeholder="Enter complete shop address"
                        value={shop.address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Tab: Contact ── */}
                <div className={`sp-section ${activeSection === "contact" ? "visible" : ""}`}>
                  <div className="sp-form-grid">
                    <div className="sp-field">
                      <label>Primary Mobile <span className="req">*</span></label>
                      <input
                        type="tel"
                        name="mobile"
                        placeholder="e.g. 9876543210"
                        value={shop.mobile}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="sp-field">
                      <label>Extra Mobile</label>
                      <input
                        type="tel"
                        name="extra_mobile"
                        placeholder="e.g. 9123456789 (optional)"
                        value={shop.extra_mobile}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Tab: GST ── */}
                <div className={`sp-section ${activeSection === "gst" ? "visible" : ""}`}>
                  <div className="sp-gst-box">
                    <div className="sp-gst-row">
                      <label className="sp-toggle">
                        <input
                          type="checkbox"
                          name="gst_enabled"
                          checked={shop.gst_enabled}
                          onChange={handleChange}
                        />
                        <span className="sp-toggle-track"></span>
                      </label>
                      <div className="sp-gst-text">
                        <h4>Enable GST Billing</h4>
                        <p>Turn on to add GST to your invoices and bills</p>
                      </div>
                    </div>
                    {shop.gst_enabled && (
                      <div className="sp-gst-number">
                        <div className="sp-field">
                          <label>GST Number</label>
                          <input
                            type="text"
                            name="gst_number"
                            placeholder="e.g. 29ABCDE1234F1Z5"
                            value={shop.gst_number}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="sp-form-actions">
                <button className="sp-btn-primary" onClick={saveShopDetails} disabled={saving}>
                  {saving ? "Saving…" : "Save Shop Details"}
                </button>
                <button className="sp-btn-secondary" onClick={() => setShop(defaultShop)}>
                  Clear Form
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default ShopProfile;
