import React, { useState } from "react";
import "../../styles/ShopProfile.css";

const ShopProfile = () => {
  const [shop, setShop] = useState({
    shopName: "",
    ownerName: "",
    mobile: "",
    extraMobile: "",
    address: "",
    shopType: "",
    timings: "",
    gstEnabled: false,
    gstNumber: "",
    logo: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setShop({ ...shop, [name]: checked });
    } else if (type === "file") {
      setShop({ ...shop, [name]: files[0] });
    } else {
      setShop({ ...shop, [name]: value });
    }
  };

  const saveShopDetails = () => {
    console.log("Shop Details Saved:", shop);
    alert("Shop details saved successfully ✅");
  };

  return (
    <div className="shop-page">
      <h2>Shop / Business Details</h2>

      <div className="shop-card">
        <div className="grid">
          <input
            type="text"
            name="shopName"
            placeholder="Shop Name"
            value={shop.shopName}
            onChange={handleChange}
          />

          <input
            type="text"
            name="ownerName"
            placeholder="Owner Name"
            value={shop.ownerName}
            onChange={handleChange}
          />

          <input
            type="tel"
            name="mobile"
            placeholder="Mobile Number"
            value={shop.mobile}
            onChange={handleChange}
          />

          <input
            type="tel"
            name="extraMobile"
            placeholder="Extra Mobile Number (Optional)"
            value={shop.extraMobile}
            onChange={handleChange}
          />

          <textarea
            name="address"
            placeholder="Shop Address"
            value={shop.address}
            onChange={handleChange}
          />

          <select
            name="shopType"
            value={shop.shopType}
            onChange={handleChange}
          >
            <option value="">Select Shop Type</option>
            <option value="Kirana">Kirana</option>
            <option value="Medical">Medical</option>
            <option value="Hardware">Hardware</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="text"
            name="timings"
            placeholder="Shop Timings (e.g., 9AM - 9PM)"
            value={shop.timings}
            onChange={handleChange}
          />

          <input
            type="file"
            name="logo"
            accept="image/*"
            onChange={handleChange}
          />
        </div>

        <div className="gst-box">
          <label>
            <input
              type="checkbox"
              name="gstEnabled"
              checked={shop.gstEnabled}
              onChange={handleChange}
            />
            Enable GST Billing
          </label>

          {shop.gstEnabled && (
            <input
              type="text"
              name="gstNumber"
              placeholder="GST Number"
              value={shop.gstNumber}
              onChange={handleChange}
            />
          )}
        </div>

        <button className="save-btn" onClick={saveShopDetails}>
          Save Shop Details
        </button>
      </div>
    </div>
  );
};

export default ShopProfile;
