// Module keys (used everywhere: guards, sidebar, backend)
export const MODULES = {
  BUSINESS: "business",
  HOME_EXPENSE: "home-expense",
  CONSTRUCTION: "construction",
  CUSTOM: "custom",
};

// Dashboard routes
export const DASHBOARD_ROUTES = {
  DASHBOARD: "/dashboard",
  BUSINESS: "/dashboard/business",
  HOME_EXPENSE: "/dashboard/home-expense",
  CONSTRUCTION: "/dashboard/construction",
  CUSTOM: "/dashboard/custom", // ✅ was already defined
};

// Account routes
export const ACCOUNT_ROUTES = {
  PROFILE: "/account/profile",
  SUBSCRIPTION_HISTORY: "/account/subscription-history",
  SETTINGS: "/account/settings",
};

// Subscription routes
export const SUBSCRIPTION_ROUTES = {
  BASE: "/subscription",
  BUSINESS: "/subscription/business",
  HOME_EXPENSE: "/subscription/home-expense",
  CONSTRUCTION: "/subscription/construction",
  CUSTOM: "/subscription/custom",   // ✅ NEW — was missing
  CHECKOUT: "/subscription/checkout",
};

// Subscription plans (used in SubscriptionPage)
export const SUBSCRIPTION_PLANS = [
  {
    key: MODULES.BUSINESS,
    name: "Business Billing",
    price: 499,
    features: ["Invoices", "Products", "GST Reports"],
  },
  {
    key: MODULES.HOME_EXPENSE,
    name: "Home Expense",
    price: 299,
    features: ["Daily Expenses", "Monthly Summary", "Reports"],
  },
  {
    key: MODULES.CONSTRUCTION,
    name: "Construction Billing",
    price: 699,
    features: ["Project Cost", "Payments", "Summary"],
  },
  {
    key: MODULES.CUSTOM,
    name: "Customized Billing",
    price: 999,
    features: ["Custom Estimates", "Advanced Billing"],
  },
];
