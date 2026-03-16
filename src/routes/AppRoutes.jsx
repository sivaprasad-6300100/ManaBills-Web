import React from "react";
import { Routes, Route } from "react-router-dom";

/* Layout */
import DashboardLayout from "../components/layout/DashboardLayout";

/* Public Pages */
import HomePage from "../pages/public/HomePage";

/* Dashboard */
import DashboardHome from "../pages/dashboard/DashboardHome";

/* Business */
import BusinessLayout from "../pages/business_billing/BusinessLayout";
import BusinessHome from "../pages/business_billing/BusinessHome";
import CreateInvoice from "../pages/business_billing/CreateInvoice";
import InvoiceHistory from "../pages/business_billing/InvoiceHistory";
import Products from "../pages/business_billing/Products";
import Customers from "../pages/business_billing/Customers";
import GstReports from "../pages/business_billing/GstReports";
import ShopProfile from "../pages/business_billing/ShopProfile";
import DefaultItems from "../pages/business_billing/DefaultItems";

/* Home Expense */
import ExpenseLayout from "../pages/home_expense/ExpenseLayout";
import ExpenseHome from "../pages/home_expense/ExpenseHome";
import EstimatedAmount from "../pages/home_expense/EstimatedAmount";
import AddExpense from "../pages/home_expense/AddExpense";
import Categories from "../pages/home_expense/Categories";
import MonthlyIncome from "../pages/home_expense/MonthlyIncome";
import MonthlySummary from "../pages/home_expense/MonthlySummary";
import Reports from "../pages/home_expense/Reports";

/* Construction */
import ConstructionLayout from "../pages/construction/ConstructionLayout";
import ConstructionHome from "../pages/construction/ConstructionHome";
import Budget from "../pages/construction/Budget";
import WorkBills from "../pages/construction/WorkBills";
import Payments from "../pages/construction/Payments";
import Summary from "../pages/construction/Summary";
import SeparateBills from "../pages/construction/Separate_Bills";

/* Custom Billing ← NEW */
import CustomLayout from "../pages/customized_billing/CustomLayout";
import Overview from "../pages/customized_billing/Overview";
import CreateEstimate from "../pages/customized_billing/CreateEstimate";
import Quotations from "../pages/customized_billing/Quotations";
import Bills from "../pages/customized_billing/Bills";
import CustomPayments from "../pages/customized_billing/CustomPayments";
import CustomCustomers from "../pages/customized_billing/CustomCustomers";
import CustomSummary from "../pages/customized_billing/CustomSummary";

/* Account */
import AccountPage from "../pages/account/AccountPage";

/* Subscriptions */
import SubscriptionPage from "../pages/subscriptions/SubscriptionPage";
import BusinessSubscription from "../pages/subscriptions/BusinessSubscription";
import HomeExpenseSubscription from "../pages/subscriptions/HomeExpenseSubscription";
import ConstructionSubscription from "../pages/subscriptions/ConstructionSubscription";
import CustomSubscription from "../pages/subscriptions/CustomSubscription"; // ← NEW
import CheckoutSubscription from "../pages/subscriptions/CheckoutSubscription";

/* Guards */
import ProtectedRoute from "./ProtectedRoute";
import SubscriptionGuard from "./SubscriptionGuard";

/* Styles */
import "../styles/global/dashboard.css";
import "../styles/global/subscription.css";
import "../styles/global/index.css";
import "../styles/global/public.css";
import "../styles/global/account.css";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />

        {/* Business Billing */}
        <Route
          path="business"
          element={
            <SubscriptionGuard module="business">
              <BusinessLayout />
            </SubscriptionGuard>
          }
        >
          <Route index element={<BusinessHome />} />
          <Route path="products" element={<Products />} />
          <Route path="create-invoice" element={<CreateInvoice />} />
          <Route path="invoices" element={<InvoiceHistory />} />
          <Route path="customers" element={<Customers />} />
          <Route path="default-items" element={<DefaultItems />} />
          <Route path="shop-profile" element={<ShopProfile />} />
          <Route path="gst" element={<GstReports />} />
        </Route>

        {/* Home Expense */}
        <Route
          path="home-expense"
          element={
            <SubscriptionGuard module="home-expense">
              <ExpenseLayout />
            </SubscriptionGuard>
          }
        >
          <Route index element={<ExpenseHome />} />
          <Route path="add" element={<AddExpense />} />
          <Route path="categories" element={<Categories />} />
          <Route path="monthly-income" element={<MonthlyIncome />} />
          <Route path="estimate-amount" element={<EstimatedAmount />} />
          <Route path="summary" element={<MonthlySummary />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Construction */}
        <Route
          path="construction"
          element={
            <SubscriptionGuard module="construction">
              <ConstructionLayout />
            </SubscriptionGuard>
          }
        >
          <Route index element={<ConstructionHome />} />
          <Route path="Budget" element={<Budget />} />
          <Route path="WorkBills" element={<WorkBills />} />
          <Route path="payments" element={<Payments />} />
          <Route path="summary" element={<Summary />} />
          <Route path="Separate_Bills" element={<SeparateBills />} />
        </Route>

        {/* Custom Billing ← NEW */}
        <Route
          path="custom"
          element={
            <SubscriptionGuard module="custom">
              <CustomLayout />
            </SubscriptionGuard>
          }
        >
          <Route index element={<Overview />} />
          <Route path="create-estimate" element={<CreateEstimate />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="custom-bills" element={<Bills />} />
          <Route path="custom-payments" element={<CustomPayments />} />
          <Route path="custom-customers" element={<CustomCustomers />} />
          <Route path="custom-summary" element={<CustomSummary />} />
        </Route>

        {/* Account */}
        <Route path="account" element={<AccountPage />} />
      </Route>

      {/* Subscriptions */}
      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription/checkout"
        element={<CheckoutSubscription />}
      />
      <Route
        path="/subscription/business"
        element={
          <ProtectedRoute>
            <BusinessSubscription />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription/home-expense"
        element={
          <ProtectedRoute>
            <HomeExpenseSubscription />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription/construction"
        element={
          <ProtectedRoute>
            <ConstructionSubscription />
          </ProtectedRoute>
        }
      />
      {/* Custom Subscription ← NEW */}
      <Route
        path="/subscription/custom"
        element={
          <ProtectedRoute>
            <CustomSubscription />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
