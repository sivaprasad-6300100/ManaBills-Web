// src/pages/business_billing/ShopProfileGuard.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../context/ShopContext";

export default function ShopProfileGuard({ children }) {
  const navigate = useNavigate();
  const { profileReady } = useShop();

  useEffect(() => {
    if (profileReady === false) {
      navigate("/dashboard/business/shop-profile");
    }
  }, [profileReady, navigate]);

  if (profileReady === null) return null;  // checking server — show nothing
  if (profileReady === false) return null; // redirecting

  return children; // ✅ profile confirmed — show page
}