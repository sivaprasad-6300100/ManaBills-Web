import { authAxios, publicAxios } from "./api";

/* 📦 Get all subscription plans */
export const getSubscriptionPlans = async () => {
  const res = await publicAxios.get("subscriptions/plans/");
  return res.data;
};

/* 📄 Get logged-in user's subscriptions */
export const getMySubscriptions = async () => {
  const res = await authAxios.get("subscriptions/my/");
  return res.data;
};

/* 💳 Subscribe to a plan */
export const subscribeToPlan = async (planId) => {
  const res = await authAxios.post("subscriptions/subscribe/", {
    plan_id: planId,
  });
  return res.data;
};

/* 🔍 Check module access (Business, Home, Construction, etc.) */
export const checkModuleAccess = async (module) => {
  const res = await authAxios.get(
    `subscriptions/check-access/?module=${module}`
  );
  return res.data;
};
