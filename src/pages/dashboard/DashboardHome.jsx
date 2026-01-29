import React from "react";
import SummaryCard from "../../components/cards/SummaryCard";
import UpgradeCard from "../../components/cards/UpgradeCard";

const DashboardHome = () => {
  // Later this comes from API / Context
  const subscriptions =
    JSON.parse(localStorage.getItem("subscriptions")) || [];

  const hasAnySubscription = subscriptions.length > 0;

  return (
    <div>
      {/* No Subscription */}
      {!hasAnySubscription && (
        <div className="welcome-section">
          <h2>Hi, Welcome to ManaBills 👋</h2>
          <p>
            Manage your billing, expenses, and projects in one place — fast, secure,
            and built for growing businesses.
          </p>
          {/* <ul className="welcome-points"> */}
            {/* <li>📄 Create & manage invoices easily</li> */}
            {/* <li>📦 Track products & stock in real time</li> */}
            {/* <li>📊 View reports & unpaid amounts instantly</li> */}
          {/* </ul> */}
          <UpgradeCard />
        </div>
      )}

      {/* Subscription Active */}
      {hasAnySubscription && (
        <>
          <h2>Dashboard Overview</h2>

          <div className="summary-grid">
            {subscriptions.includes("business") && (
              <SummaryCard
                title="Business Billing"
                value="₹1,25,000"
                subtitle="Total Billing Amount"
              />
            )}

            {subscriptions.includes("home-expense") && (
              <SummaryCard
                title="Home Expenses"
                value="₹45,000"
                subtitle="Total Expenses This Month"
              />
            )}

            {subscriptions.includes("construction") && (
              <SummaryCard
                title="Construction"
                value="₹8,90,000"
                subtitle="Total Project Cost"
              />
            )}

            {subscriptions.includes("custom") && (
              <SummaryCard
                title="Customized Billing"
                value="Active"
                subtitle="Custom Estimations Enabled"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome;
