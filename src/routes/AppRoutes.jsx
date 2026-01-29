// import React from "react";
// import { Routes, Route } from "react-router-dom";

// /* Layout */
// import DashboardLayout from "../components/layout/DashboardLayout";

// /* Public Pages */
// import HomePage from "../pages/public/HomePage";

// /* Dashboard */
// import DashboardHome from "../pages/dashboard/DashboardHome";

// /* Business */
// import BusinessLayout from "../pages/business_billing/BusinessLayout";
// import BusinessHome from "../pages/business_billing/BusinessHome";
// import CreateInvoice from "../pages/business_billing/CreateInvoice";
// import InvoiceHistory from "../pages/business_billing/InvoiceHistory";
// import Products from "../pages/business_billing/Products";
// import Customers from "../pages/business_billing/Customers";
// import GstReports from "../pages/business_billing/GstReports";

// /* Home Expense */
// import ExpenseLayout from "../pages/home_expense/ExpenseLayout";
// import ExpenseHome from "../pages/home_expense/ExpenseHome";
// import AddExpense from "../pages/home_expense/AddExpense";
// import Categories from "../pages/home_expense/Categories";
// import MonthlySummary from "../pages/home_expense/MonthlySummary";
// import Reports from "../pages/home_expense/Reports";

// /* Construction */
// import ConstructionLayout from "../pages/construction/ConstructionLayout";
// import ConstructionHome from "../pages/construction/ConstructionHome";
// import AddCost from "../pages/construction/AddCost";
// import ProjectBills from "../pages/construction/ProjectBills";
// import Payments from "../pages/construction/Payments";
// import ProjectSummary from "../pages/construction/ProjectSummary";

// /* Custom */
// import CustomLayout from "../pages/customized_billing/CustomLayout";
// import CustomHome from "../pages/customized_billing/CustomHome";
// import CustomEstimates from "../pages/customized_billing/CustomEstimates";

// /* Account */
// import Profile from "../pages/account/Profile";

// /* Subscription */
// import SubscriptionPage from "../pages/subscriptions/SubscriptionPage";

// /* Guards */
// import ProtectedRoute from "./ProtectedRoute";
// import SubscriptionGuard from "./SubscriptionGuard";

// const AppRoutes = () => {
//   return (
//     <Routes>
//       {/* Public */}
//       <Route path="/" element={<HomePage />} />

//       {/* Dashboard */}
//       <Route
//         path="/dashboard"
//         element={
//           <ProtectedRoute>
//             <DashboardLayout />
//           </ProtectedRoute>
//         }
//       >
//         <Route index element={<DashboardHome />} />

//         {/* Business Billing */}
//         <Route
//           path="business"
//           element={
//             <SubscriptionGuard module="business">
//               <BusinessLayout />
//             </SubscriptionGuard>
//           }
//         >
//           <Route index element={<BusinessHome />} />
//           <Route path="products" element={<Products />} />
//           <Route path="create-invoice" element={<CreateInvoice />} />
//           <Route path="invoices" element={<InvoiceHistory />} />
//           <Route path="customers" element={<Customers />} />
//           <Route path="gst" element={<GstReports />} />
//         </Route>

//         {/* Home Expense */}
//         <Route
//           path="home-expense"
//           element={
//             <SubscriptionGuard module="home-expense">
//               <ExpenseLayout />
//             </SubscriptionGuard>
//           }
//         >
//           <Route index element={<ExpenseHome />} />
//           <Route path="add" element={<AddExpense />} />
//           <Route path="categories" element={<Categories />} />
//           <Route path="summary" element={<MonthlySummary />} />
//           <Route path="reports" element={<Reports />} />
//         </Route>

//         {/* Construction */}
//         <Route
//           path="construction"
//           element={
//             <SubscriptionGuard module="construction">
//               <ConstructionLayout />
//             </SubscriptionGuard>
//           }
//         >
//           <Route index element={<ConstructionHome />} />
//           <Route path="add-cost" element={<AddCost />} />
//           <Route path="bills" element={<ProjectBills />} />
//           <Route path="payments" element={<Payments />} />
//           <Route path="summary" element={<ProjectSummary />} />
//         </Route>

//         {/* Customized */}
//         <Route
//           path="custom"
//           element={
//             <SubscriptionGuard module="custom">
//               <CustomLayout />
//             </SubscriptionGuard>
//           }
//         >
//           <Route index element={<CustomHome />} />
//           <Route path="estimates" element={<CustomEstimates />} />
//         </Route>
//       </Route>

//       {/* Account */}
//       <Route
//         path="/account/profile"
//         element={
//           <ProtectedRoute>
//             <Profile />
//           </ProtectedRoute>
//         }
//       />

//       {/* Subscription */}
//       <Route
//         path="/subscription"
//         element={
//           <ProtectedRoute>
//             <SubscriptionPage />
//           </ProtectedRoute>
//         }
//       />
//     </Routes>
//   );
// };

// export default AppRoutes;


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
import AddExpense from "../pages/home_expense/AddExpense";
import Categories from "../pages/home_expense/Categories";
import MonthlySummary from "../pages/home_expense/MonthlySummary";
import Reports from "../pages/home_expense/Reports";

/* Construction */
import ConstructionLayout from "../pages/construction/ConstructionLayout";
import ConstructionHome from "../pages/construction/ConstructionHome";
import AddCost from "../pages/construction/AddCost";
import ProjectBills from "../pages/construction/ProjectBills";
import Payments from "../pages/construction/Payments";
import ProjectSummary from "../pages/construction/ProjectSummary";

/* Custom */
import CustomLayout from "../pages/customized_billing/CustomLayout";
import CustomHome from "../pages/customized_billing/CustomHome";
import CustomEstimates from "../pages/customized_billing/CustomEstimates";

/* Account */
import Profile from "../pages/account/Profile";

/* Subscription Pages (MODULE WISE) */
import SubscriptionPage from '../pages/subscriptions/SubscriptionPage'
import BusinessSubscription from "../pages/subscriptions/BusinessSubscription";
import HomeExpenseSubscription from "../pages/subscriptions/HomeExpenseSubscription";
import ConstructionSubscription from "../pages/subscriptions/ConstructionSubscription";
import CustomSubscription from "../pages/subscriptions/CustomSubscription";
import CheckoutSubscription from "../pages/subscriptions/CheckoutSubscription";
/* Guards */
import ProtectedRoute from "./ProtectedRoute";
import SubscriptionGuard from "./SubscriptionGuard";

// All Css Pages =========
import  '../styles/All_Billing.css'
import '../styles/main.css'
import '../styles/sidebar.css'
import '../styles/CreateInvoice.css'

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
          <Route path="add-cost" element={<AddCost />} />
          <Route path="bills" element={<ProjectBills />} />
          <Route path="payments" element={<Payments />} />
          <Route path="summary" element={<ProjectSummary />} />
        </Route>

        {/* Customized */}
        <Route
          path="custom"
          element={
            <SubscriptionGuard module="custom">
              <CustomLayout />
            </SubscriptionGuard>
          }
        >
          <Route index element={<CustomHome />} />
          <Route path="estimates" element={<CustomEstimates />} />
        </Route>
      </Route>

      {/* Account */}
      <Route
        path="/account/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* MODULE SUBSCRIPTIONS */}
      <Route
        path="/subscription/business"
        element={
          <ProtectedRoute>
            <BusinessSubscription />
          </ProtectedRoute>
        }
      />
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
        element={<CheckoutSubscription />} />
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
