import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import {
  getShopProfile,
  saveShopProfile,
  deleteShopProfile,
  getProducts,
} from "../../services/businessService";
import { useShop } from "../../context/ShopContext";
import useAuth from "../../hooks/useAuth";



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
  "Kirana Store":    "🛒",
  "HardWare":        "🔧",
  "Clothing":        "👗",
  "Resturants":      "🍽️",
  "Aluminium Shop":  "🪟",
  "Medical":         "💊",
  "Genral Store":    "🏪",
  "Gold and Silver": "💍",
  "Others":          "🏢",
};

const ALL_UNITS = [
  "piece","kg","gram","litre","ml","bag","box","dozen","metre","set",
  "packet","roll","bundle","strip","bottle","tube","sachet","vial",
  "pair","sqft","foot","inch","sqm","sheet","plate","can","jar","carton",
];

const ShopProfile = () => {
  const { setProfileReady } = useShop();
  const [hasStock,           setHasStock]           = useState(false);
  const [shop,               setShop]               = useState(defaultShop);
  const [savedShop,          setSavedShop]          = useState(null);
  const [isEditing,          setIsEditing]          = useState(true);
  const [saving,             setSaving]             = useState(false);
  const [toast,              setToast]              = useState(null);
  const [customShopType,     setCustomShopType]     = useState("");
  const [showCustomShopType, setShowCustomShopType] = useState(false);
  const [customShopUnits,    setCustomShopUnits]    = useState([]);
  const [showCustomPicker,   setShowCustomPicker]   = useState(false);
  const { accessToken } = useAuth();
  const { subscriptions } = useContext(SubscriptionContext);
  const isBasicPlan = subscriptions?.["business"]?.plan_key === "business_basic";
  const isFreeTrial = !subscriptions?.["business"] || subscriptions?.["business"]?.plan_key === "free_trial";


  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const location = useLocation();
  const { isFirstSetup, paymentSuccess, planName, duration } = location.state || {};
  const [showBanner, setShowBanner] = useState(isFirstSetup || paymentSuccess || false);

 


  useEffect(() => {
     if (!accessToken) return;  // ← 

    getShopProfile()
      .then((data) => {
        const complete = !!(data?.shop_name && data?.owner_name && data?.mobile && data?.address);
        setProfileReady(complete);
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
        setProfileReady(false);
        setIsEditing(true);
      });

    getProducts()
      .then((products) => setHasStock(products.length > 0))
      .catch(() => setHasStock(false));
  }, [accessToken]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setShop((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const saveShopDetails = async () => {
    if (!shop.shop_name || !shop.owner_name || !shop.mobile || !shop.address || !shop.shop_type) {
      showToast("Please fill all required fields (marked with *)", "error");
      return;
    }
    if (!isBasicPlan && shop.gst_enabled && !shop.gst_number.trim()) {
      showToast("GST Number is required when GST is enabled", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        shop_name:    shop.shop_name,
        owner_name:   shop.owner_name,
        mobile:       shop.mobile,
        extra_mobile: shop.extra_mobile,
        address:      shop.address,
        shop_type:    shop.shop_type,
        timings:      shop.timings,
        gst_enabled:  (isBasicPlan || isFreeTrial) ? false : shop.gst_enabled,   // ← force off
        gst_number:   (isBasicPlan || isFreeTrial) ? ""    : shop.gst_number,    // ← force empty
        logo_url:     shop.logo_url || "",
      };
      const data = await saveShopProfile(payload);
      setSavedShop(data);
      setProfileReady(true);
      setIsEditing(false);
      showToast("Shop details saved successfully ✅");
    } catch {
      showToast("Failed to save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const clearProfile = async () => {
    if (!window.confirm("Reset shop profile? This cannot be undone.")) return;
    try {
      await deleteShopProfile();
      setSavedShop(null);
      setShop(defaultShop);
      setProfileReady(false);
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

        .sp-root *, .sp-root *::before, .sp-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sp-root {
          font-family: 'Sora', sans-serif;
          min-height: 100vh;
          background: #f0f2f7;
          padding: 24px 16px 60px;
        }

        /* ── Toast ── */
        .sp-toast {
          position: fixed;
          top: 20px; left: 50%;
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
          pointer-events: none;
        }
        .sp-toast.success { background: linear-gradient(135deg, #1a73e8, #0d47a1); }
        .sp-toast.error   { background: linear-gradient(135deg, #e53935, #b71c1c); }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-14px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* ── Page header ── */
        .sp-page-header {
          max-width: 700px;
          margin: 0 auto 24px;
        }
        .sp-page-header h1 {
          font-size: 1.55rem;
          font-weight: 700;
          color: #0d1b2a;
          letter-spacing: -0.03em;
        }
        .sp-page-header p {
          font-size: 0.86rem;
          color: #6b7a99;
          margin-top: 4px;
          font-weight: 400;
        }

        /* ── Card ── */
        .sp-card {
          max-width: 700px;
          margin: 0 auto;
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 2px 24px rgba(13,27,42,0.08), 0 1px 4px rgba(13,27,42,0.04);
          overflow: hidden;
        }

        /* ══════════ DISPLAY MODE ══════════ */
        .sp-display-hero {
          background: linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%);
          padding: 32px 28px 26px;
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
          pointer-events: none;
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
        .sp-hero-left { display: flex; gap: 14px; align-items: flex-start; flex: 1; }
        .sp-hero-icon {
          width: 52px; height: 52px;
          background: rgba(255,255,255,0.15);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.7rem;
          flex-shrink: 0;
        }
        .sp-hero-label {
          font-size: 0.68rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          opacity: 0.65; margin-bottom: 4px;
        }
        .sp-hero-name { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }
        .sp-hero-meta { font-size: 0.80rem; opacity: 0.70; margin-top: 5px; }
        .sp-hero-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .sp-gst-chip {
          padding: 5px 13px; border-radius: 50px;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase;
        }
        .sp-gst-chip.on  { background: rgba(76,175,80,0.25); color: #a5d6a7; border: 1px solid rgba(76,175,80,0.3); }
        .sp-gst-chip.off { background: rgba(255,255,255,0.10); color: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.15); }
        .sp-btn-edit {
          padding: 8px 18px;
          background: rgba(255,255,255,0.15); color: #fff;
          border: 1px solid rgba(255,255,255,0.28); border-radius: 10px;
          font-size: 0.80rem; font-weight: 600;
          cursor: pointer; font-family: inherit;
          transition: background 0.18s;
        }
        .sp-btn-edit:hover { background: rgba(255,255,255,0.25); }
        .sp-btn-reset {
          padding: 8px 14px;
          background: transparent; color: rgba(255,255,255,0.50);
          border: none; border-radius: 10px;
          font-size: 0.80rem; font-weight: 500;
          cursor: pointer; font-family: inherit;
          transition: color 0.18s;
        }
        .sp-btn-reset:hover { color: #ffcdd2; }

        /* Detail grid */
        .sp-detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1px;
          background: #eef0f5;
          border-top: 1px solid #eef0f5;
        }
        .sp-detail-cell { background: #fff; padding: 18px 22px; transition: background 0.15s; }
        .sp-detail-cell:hover { background: #f8f9ff; }
        .sp-detail-cell.full { grid-column: 1 / -1; }
        .sp-detail-lbl { font-size: 0.68rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }
        .sp-detail-val { font-size: 0.92rem; font-weight: 600; color: #1e293b; font-family: 'JetBrains Mono', monospace; }
        .sp-detail-val.normal { font-family: 'Sora', sans-serif; font-size: 0.90rem; }
        .sp-detail-val.empty  { color: #cbd5e1; font-weight: 400; }

        /* ══════════ EDIT MODE ══════════ */
        .sp-form-header {
          padding: 26px 28px 20px;
          border-bottom: 1px solid #eef0f5;
        }
        .sp-form-title {
          font-size: 1rem; font-weight: 700;
          color: #0d1b2a; letter-spacing: -0.01em;
        }
        .sp-form-subtitle {
          font-size: 0.78rem; color: #94a3b8;
          margin-top: 3px; font-weight: 400;
        }

        .sp-form-body { padding: 26px 28px; display: flex; flex-direction: column; gap: 0; }

        /* Section divider */
        .sp-section-label {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          padding: 5px 10px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
        }
        .sp-section-label.required { background: #eff6ff; color: #1a73e8; }
        .sp-section-label.optional { background: #f8fafc; color: #94a3b8; }

        .sp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .sp-field { display: flex; flex-direction: column; gap: 6px; }
        .sp-field.full { grid-column: 1 / -1; }

        .sp-field label {
          font-size: 0.75rem; font-weight: 600;
          color: #475569; letter-spacing: 0.02em;
          display: flex; align-items: center; gap: 4px;
        }
        .sp-req { color: #ef4444; font-size: 0.78rem; }
        .sp-opt { color: #94a3b8; font-size: 0.68rem; font-weight: 500; }

        .sp-field input,
        .sp-field select,
        .sp-field textarea {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.88rem;
          font-family: 'Sora', sans-serif;
          color: #1e293b;
          background: #f8fafc;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          outline: none;
        }
        .sp-field input:focus,
        .sp-field select:focus,
        .sp-field textarea:focus {
          border-color: #1a73e8;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(26,115,232,0.10);
        }
        .sp-field input.has-value,
        .sp-field select.has-value,
        .sp-field textarea.has-value {
          border-color: #22c55e;
          background: #f0fdf4;
        }
        .sp-field textarea { resize: vertical; min-height: 80px; line-height: 1.55; }
        .sp-field select   { cursor: pointer; }

        /* Section separator */
        .sp-sep {
          height: 1px;
          background: #eef0f5;
          margin: 22px 0;
          border: none;
        }

        /* GST box */
        .sp-gst-box {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          padding: 18px;
        }
        .sp-gst-row { display: flex; align-items: center; gap: 14px; }
        .sp-toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
        .sp-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
        .sp-toggle-track {
          position: absolute; inset: 0;
          background: #cbd5e1; border-radius: 50px;
          cursor: pointer; transition: background 0.2s;
        }
        .sp-toggle input:checked + .sp-toggle-track { background: #1a73e8; }
        .sp-toggle-track::after {
          content: '';
          position: absolute; top: 3px; left: 3px;
          width: 18px; height: 18px;
          background: #fff; border-radius: 50%;
          transition: transform 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .sp-toggle input:checked + .sp-toggle-track::after { transform: translateX(20px); }
        .sp-gst-text h4 { font-size: 0.88rem; font-weight: 600; color: #1e293b; }
        .sp-gst-text p  { font-size: 0.76rem; color: #94a3b8; margin-top: 2px; font-weight: 400; }
        .sp-gst-number  { margin-top: 14px; padding-top: 14px; border-top: 1px solid #e2e8f0; animation: fadeDown 0.22s ease; }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Custom shop input */
        .sp-custom-box {
          margin-top: 10px;
          background: #f0f9ff;
          border: 1.5px solid rgba(26,115,232,0.30);
          border-radius: 10px;
          padding: 12px;
          display: flex; flex-direction: column; gap: 8px;
          animation: fadeDown 0.2s ease;
        }
        .sp-custom-box-title { font-size: 0.68rem; font-weight: 800; color: #1a73e8; text-transform: uppercase; letter-spacing: 0.06em; }
        .sp-custom-row { display: flex; gap: 8px; }
        .sp-custom-row input {
          flex: 1; padding: 9px 12px; border-radius: 8px;
          border: 1.5px solid #e2e8f0; font-size: 0.86rem; outline: none;
          font-family: 'Sora', sans-serif; background: #fff; color: #1e293b;
        }
        .sp-custom-row input:focus { border-color: #1a73e8; }
        .sp-custom-confirm {
          padding: 9px 16px; border-radius: 8px; border: none;
          font-weight: 700; font-size: 0.82rem; cursor: pointer; white-space: nowrap;
          transition: background 0.15s;
        }
        .sp-custom-hint { font-size: 0.68rem; color: #0369a1; }

        /* Unit picker */
        .sp-picker-box {
          margin-top: 14px;
          background: #f8fafc;
          border: 1.5px solid rgba(26,115,232,0.25);
          border-radius: 12px;
          padding: 16px;
          display: flex; flex-direction: column; gap: 14px;
          animation: fadeDown 0.2s ease;
        }
        .sp-picker-title { font-size: 0.76rem; font-weight: 700; color: #1a73e8; }
        .sp-picker-sub   { font-size: 0.68rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
        .sp-chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .sp-chip {
          padding: 5px 12px; border-radius: 100px;
          font-size: 0.76rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
          border: 1.5px solid #e2e8f0;
          background: #fff; color: #64748b;
        }
        .sp-chip.selected { background: #ea580c; color: #fff; border-color: #ea580c; }
        .sp-picker-confirm {
          padding: 10px 20px; border-radius: 10px; border: none;
          font-weight: 700; font-size: 0.86rem; cursor: pointer;
          align-self: flex-start; transition: all 0.15s;
          font-family: 'Sora', sans-serif;
        }

        /* Form actions */
        .sp-form-actions {
          display: flex; gap: 12px; align-items: center;
          padding: 18px 28px 26px;
          border-top: 1px solid #eef0f5;
          flex-wrap: wrap;
        }
        .sp-btn-primary {
          padding: 12px 28px;
          background: linear-gradient(135deg, #1a73e8, #0d47a1);
          color: #fff; border: none; border-radius: 10px;
          font-size: 0.86rem; font-weight: 700;
          cursor: pointer; font-family: 'Sora', sans-serif;
          transition: opacity 0.18s, transform 0.12s;
          box-shadow: 0 4px 16px rgba(26,115,232,0.28);
        }
        .sp-btn-primary:hover:not(:disabled) { opacity: 0.90; transform: translateY(-1px); }
        .sp-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .sp-btn-secondary {
          padding: 12px 18px;
          background: #f1f5f9; color: #64748b;
          border: none; border-radius: 10px;
          font-size: 0.86rem; font-weight: 600;
          cursor: pointer; font-family: 'Sora', sans-serif;
          transition: background 0.18s;
        }
          /* ── Welcome / Success Banner ── */
        .sp-welcome-banner {
          max-width: 700px;
          margin: 0 auto 18px;
          background: linear-gradient(135deg, #0d47a1, #1976d2);
          color: #fff;
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          box-shadow: 0 6px 24px rgba(13,71,161,0.25);
          animation: toastIn 0.3s ease forwards;
        }
        .sp-welcome-banner-text h3 {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 3px;
        }
        .sp-welcome-banner-text p {
          font-size: 0.78rem;
          opacity: 0.85;
          font-weight: 400;
        }
        .sp-welcome-banner-close {
          background: rgba(255,255,255,0.15);
          border: none;
          color: #fff;
          width: 26px; height: 26px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.85rem;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-welcome-banner-close:hover { background: rgba(255,255,255,0.25); }
                .sp-btn-secondary:hover { background: #e2e8f0; }

        /* Warning / hint pills */
        .sp-hint {
          font-size: 0.73rem; margin-top: 5px;
          display: flex; align-items: flex-start; gap: 4px; line-height: 1.4;
        }
        .sp-hint.warn  { color: #f59e0b; }
        .sp-hint.error { color: #dc2626; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .sp-root { padding: 14px 12px 48px; }
          .sp-page-header h1 { font-size: 1.25rem; }
          .sp-display-hero { padding: 20px 18px; }
          .sp-hero-name { font-size: 1.15rem; }
          .sp-hero-top { flex-direction: column; gap: 14px; }
          .sp-hero-actions { width: 100%; }
          .sp-form-header { padding: 20px 18px 16px; }
          .sp-form-body { padding: 18px; }
          .sp-form-grid { grid-template-columns: 1fr; }
          .sp-field.full { grid-column: 1; }
          .sp-form-actions { padding: 14px 18px 22px; }
          .sp-detail-cell { padding: 14px 18px; }
        }
      `}</style>

      <div className="sp-root">

        {/* Toast */}
        {toast && <div className={`sp-toast ${toast.type}`}>{toast.msg}</div>}


        {showBanner && (
            <div className="sp-welcome-banner">
              <div className="sp-welcome-banner-text">
                {paymentSuccess ? (
                  <>
                    <h3>🎉 {planName} Activated!</h3>
                    <p>Your {duration} plan is now active. Let's set up your shop details below.</p>
                  </>
                ) : (
                  <>
                    <h3>👋 Welcome to ManaBills!</h3>
                    <p>Your free trial is active. Let's set up your shop details to get started.</p>
                  </>
                )}
              </div>
              <button className="sp-welcome-banner-close" onClick={() => setShowBanner(false)}>✕</button>
            </div>
          )}

        {/* Page Header */}
        <div className="sp-page-header">
          <h1>Shop / Business Profile</h1>
          <p>Set up your shop details, contact info and GST settings.</p>
        </div>

        <div className="sp-card">

          {showProfile ? (
            /* ══════════ DISPLAY MODE ══════════ */
            <>
              <div className="sp-display-hero">
                <div className="sp-hero-top">
                  <div className="sp-hero-left">
                    <div className="sp-hero-icon">{shopIcon}</div>
                    <div>
                      <div className="sp-hero-label">Saved Shop Profile</div>
                      <div className="sp-hero-name">{display.shopName}</div>
                      <div className="sp-hero-meta">
                        {display.shopType || "Business"} · {display.timings || "No timing set"}
                      </div>
                    </div>
                  </div>
                  <div className="sp-hero-actions">
                    {!isBasicPlan && !isFreeTrial && (
                      <span className={`sp-gst-chip ${display.gstEnabled ? "on" : "off"}`}>
                        {display.gstEnabled ? "GST On" : "GST Off"}
                      </span>
                    )}
                    <button className="sp-btn-edit" onClick={() => setIsEditing(true)}>Edit Profile</button>
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
                {!isBasicPlan && !isFreeTrial && (
                  <div className="sp-detail-cell">
                    <div className="sp-detail-lbl">GST Number</div>
                    <div className={`sp-detail-val ${display.gstEnabled && display.gstNumber ? "" : "empty"}`}>
                      {display.gstEnabled ? (display.gstNumber || "Not set") : "N/A"}
                    </div>
                  </div>
                )}
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
                <div className="sp-form-subtitle">
                  Fill in required fields to get started. Optional fields can be added anytime.
                </div>
              </div>

              <div className="sp-form-body">

                {/* ─── REQUIRED SECTION ─── */}
                <span className="sp-section-label required">✳ Required Information</span>

                <div className="sp-form-grid">

                  {/* Shop Name */}
                  <div className="sp-field">
                    <label>Shop Name <span className="sp-req">*</span></label>
                    <input
                      type="text"
                      name="shop_name"
                      placeholder="e.g. Ravi General Store"
                      value={shop.shop_name}
                      onChange={handleChange}
                      className={shop.shop_name ? "has-value" : ""}
                    />
                  </div>

                  {/* Owner Name */}
                  <div className="sp-field">
                    <label>Owner Name <span className="sp-req">*</span></label>
                    <input
                      type="text"
                      name="owner_name"
                      placeholder="e.g. Ravi Kumar"
                      value={shop.owner_name}
                      onChange={handleChange}
                      className={shop.owner_name ? "has-value" : ""}
                    />
                  </div>

                  {/* Primary Mobile */}
                  <div className="sp-field">
                    <label>Primary Mobile <span className="sp-req">*</span></label>
                    <input
                      type="tel"
                      name="mobile"
                      placeholder="e.g. 9876543210"
                      value={shop.mobile}
                      onChange={handleChange}
                      className={shop.mobile ? "has-value" : ""}
                    />
                  </div>

                  {/* Shop Type */}
                  <div className="sp-field">
                    <label>Shop Type <span className="sp-req">*</span></label>
                    <select
                      name="shop_type"
                      value={shop.shop_type}
                      disabled={hasStock}
                      style={{ opacity: hasStock ? 0.6 : 1, cursor: hasStock ? "not-allowed" : "pointer" }}
                      className={shop.shop_type && shop.shop_type !== "__custom__" ? "has-value" : ""}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setShowCustomShopType(true);
                          setShowCustomPicker(false);
                        } else {
                          setShowCustomShopType(false);
                          setShowCustomPicker(false);
                          handleChange(e);
                        }
                      }}
                    >
                      <option value="">Select shop type</option>
                      <option value="Kirana Store">🛒 Kirana Store</option>
                      <option value="HardWare">🔧 Hardware</option>
                      <option value="Aluminium Shop">🪟 Aluminium Shop</option>
                      <option value="Clothing">👗 Clothing</option>
                      <option value="Medical">💊 Medical</option>
                      <option value="Gold and Silver">💍 Gold and Silver</option>
                      {JSON.parse(localStorage.getItem("customShopTypes") || "[]").map((t) => (
                        <option key={t} value={t}>🏷️ {t} ✓</option>
                      ))}
                      <option value="__custom__">✏️ Add Custom…</option>
                    </select>

                    {hasStock && (
                      <span className="sp-hint error">🔒 Clear all stock items first to change shop type</span>
                    )}
                    {!hasStock && shop.shop_type && shop.shop_type !== "__custom__" && (
                      <span className="sp-hint warn">⚠️ Changing shop type resets your categories and units</span>
                    )}

                    {/* Custom shop type input */}
                    {showCustomShopType && (
                      <div className="sp-custom-box">
                        <span className="sp-custom-box-title">✏️ Custom Shop Type</span>
                        <div className="sp-custom-row">
                          <input
                            placeholder="e.g. Bakery, Salon, Pharmacy…"
                            value={customShopType}
                            onChange={(e) => setCustomShopType(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && customShopType.trim()) {
                                const name = customShopType.trim();
                                setShop((prev) => ({ ...prev, shop_type: name }));
                                setShowCustomShopType(false);
                                setShowCustomPicker(true);
                              }
                            }}
                          />
                          <button
                            className="sp-custom-confirm"
                            onClick={() => {
                              if (!customShopType.trim()) return;
                              const name = customShopType.trim();
                              setShop((prev) => ({ ...prev, shop_type: name }));
                              setShowCustomShopType(false);
                              setShowCustomPicker(true);
                            }}
                            style={{
                              background: customShopType.trim() ? "#1a73e8" : "#e2e8f0",
                              color: customShopType.trim() ? "#fff" : "#94a3b8",
                              cursor: customShopType.trim() ? "pointer" : "not-allowed",
                            }}
                          >
                            ✓ Set
                          </button>
                        </div>
                        <span className="sp-custom-hint">Press Set or Enter to confirm.</span>
                      </div>
                    )}

                    {/* Unit picker for custom shop type */}
                    {showCustomPicker && (
                      <div className="sp-picker-box">
                        <span className="sp-picker-title">🏷️ Select Units for "{shop.shop_type}"</span>
                        <div>
                          <div className="sp-picker-sub">Select Units (choose all that apply)</div>
                          <div className="sp-chips">
                            {ALL_UNITS.map((unit) => {
                              const selected = customShopUnits.includes(unit);
                              return (
                                <button
                                  key={unit}
                                  className={`sp-chip ${selected ? "selected" : ""}`}
                                  onClick={() =>
                                    setCustomShopUnits((prev) =>
                                      selected ? prev.filter((u) => u !== unit) : [...prev, unit]
                                    )
                                  }
                                >
                                  {selected ? "✓ " : ""}{unit}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          className="sp-picker-confirm"
                          onClick={() => {
                            if (customShopUnits.length === 0) { alert("Please select at least one unit."); return; }
                            const name = shop.shop_type;
                            const existing = JSON.parse(localStorage.getItem("customShopTypes") || "[]");
                            if (!existing.includes(name)) {
                              localStorage.setItem("customShopTypes", JSON.stringify([...existing, name]));
                            }
                            localStorage.setItem(`customUnits_shoptype_${name}`, JSON.stringify(customShopUnits));
                            setShowCustomPicker(false);
                            showToast(`"${name}" saved with ${customShopUnits.length} units ✅`);
                          }}
                          disabled={customShopUnits.length === 0}
                          style={{
                            background: customShopUnits.length > 0 ? "#1a73e8" : "#e2e8f0",
                            color: customShopUnits.length > 0 ? "#fff" : "#94a3b8",
                            cursor: customShopUnits.length > 0 ? "pointer" : "not-allowed",
                          }}
                        >
                          ✅ Confirm — Save Units
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Shop Address — full width */}
                  <div className="sp-field full">
                    <label>Shop Address <span className="sp-req">*</span></label>
                    <textarea
                      name="address"
                      placeholder="Enter complete shop address"
                      value={shop.address}
                      onChange={handleChange}
                      className={shop.address ? "has-value" : ""}
                    />
                  </div>

                </div>

                {/* ─── SEPARATOR ─── */}
                <hr className="sp-sep" />

                {/* ─── OPTIONAL SECTION ─── */}
                <span className="sp-section-label optional">○ Optional Information</span>

                <div className="sp-form-grid">

                  {/* Shop Timings */}
                  <div className="sp-field">
                    <label>Shop Timings <span className="sp-opt">(optional)</span></label>
                    <input
                      type="text"
                      name="timings"
                      placeholder="e.g. 9AM – 9PM"
                      value={shop.timings}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Extra Mobile */}
                  <div className="sp-field">
                    <label>Extra Mobile <span className="sp-opt">(optional)</span></label>
                    <input
                      type="tel"
                      name="extra_mobile"
                      placeholder="e.g. 9123456789"
                      value={shop.extra_mobile}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Shop Logo */}
                  <div className="sp-field full">
                    <label>Shop Logo <span className="sp-opt">(optional)</span></label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setShop((prev) => ({
                          ...prev,
                          logo_file:    file,
                          logo_preview: URL.createObjectURL(file),
                        }));
                      }}
                    />
                    {(shop.logo_preview || shop.logo_url) && (
                      <img
                        src={shop.logo_preview || shop.logo_url}
                        alt="Logo Preview"
                        style={{ width: 76, height: 76, marginTop: 10, borderRadius: 10, objectFit: "cover", border: "1.5px solid #e2e8f0" }}
                      />
                    )}
                  </div>

                </div>

                {/* ─── GST SECTION — hidden for Basic plan ─── */}
                  {!isBasicPlan && !isFreeTrial && (
                    <>
                      <hr className="sp-sep" />
                  
                      <span className="sp-section-label optional">○ GST &amp; Tax — Optional</span>
                  
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
                            <p>Turn on to include GST on your invoices and bills</p>
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
                                className={shop.gst_number ? "has-value" : ""}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

              {/* Form Actions */}
              <div className="sp-form-actions">
                <button className="sp-btn-primary" onClick={saveShopDetails} disabled={saving}>
                  {saving ? "Saving…" : savedShop ? "Update Shop Details" : "Save Shop Details"}
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
