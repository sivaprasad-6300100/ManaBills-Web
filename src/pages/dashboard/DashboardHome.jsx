import React from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import SummaryCard from "../../components/cards/SummaryCard";
import UpgradeCard from "../../components/cards/UpgradeCard";

const DashboardHome = () => {
  const navigate = useNavigate();

const { subscriptions: subData } = useContext(SubscriptionContext);
const subscriptions = Object.keys(subData);

  const hasAnySubscription = subscriptions.length > 0;

  // 🔹 TEMP DATA (later from API)
  const dailyInvoices = 6;
  const monthlyInvoices = 124;

  const modulesOrder = [
    {
      key: "business",
      title: "Business Billing",
      value: "₹1,25,000",
      subtitle: "Total Billing Amount",
      icon: "🧾",
    },
    {
      key: "home-expense",
      title: "Home Expenses",
      value: "₹45,000",
      subtitle: "Total Expenses This Month",
      icon: "🏠",
    },
    {
      key: "construction",
      title: "Construction",
      value: "₹8,90,000",
      subtitle: "Total Project Cost",
      icon: "🏗️",
    },
    {
      key: "custom",
      title: "Customized Billing",
      value: "Active",
      subtitle: "Custom Estimations Enabled",
      icon: "⚙️",
    },
  ];

  const activeModules = modulesOrder.filter((module) =>
    subscriptions.includes(module.key)
  );

  return (
    <div className="dashboard-page">
      {/* NO SUBSCRIPTION */}
      {!hasAnySubscription && (
        <div className="welcome-section">
          <h2>Welcome to ManaBills 👋</h2>
          <p>
            Manage billing, expenses, and projects in one powerful dashboard.
            Start by choosing a module that fits your needs.
          </p>
          <UpgradeCard />
        </div>
      )}

      {/* ACTIVE SUBSCRIPTIONS */}
      {hasAnySubscription && (
        <>
          <div className="dashboard-header">
            <h2>Dashboard Overview</h2>
            <p>Your subscribed modules at a glance</p>
          </div>

          {/* 🔥 QUICK ACTIONS – ALL MODULES */}
          <div className="quick-actions">
            {subscriptions.includes("business") && (
              <div
                className="quick-card blue"
                onClick={() => navigate("/business/invoices/create")}
              >
                <span className="quick-icon">🧾</span>
                <div className="quick-text">
                  <h3>Business Billing</h3>
                  <p>Create and send invoices in under 30 seconds</p>
                </div>
                <span className="quick-arrow">→</span>
              </div>
            )}

            {subscriptions.includes("home-expense") && (
              <div
                className="quick-card green"
                onClick={() => navigate("/home-expenses/add")}
              >
                <span className="quick-icon">🏠</span>
                <div className="quick-text">
                  <h3>Home Expenses</h3>
                  <p>Quickly add your daily household expenses</p>
                </div>
                <span className="quick-arrow">→</span>
              </div>
            )}

            {subscriptions.includes("construction") && (
              <div
                className="quick-card orange"
                onClick={() => navigate("/construction/projects/create")}
              >
                <span className="quick-icon">🏗️</span>
                <div className="quick-text">
                  <h3>Construction</h3>
                  <p>Create and manage construction projects</p>
                </div>
                <span className="quick-arrow">→</span>
              </div>
            )}

            {subscriptions.includes("custom") && (
              <div
                className="quick-card purple"
                onClick={() => navigate("/custom-billing/create")}
              >
                <span className="quick-icon">⚙️</span>
                <div className="quick-text">
                  <h3>Customized Billing</h3>
                  <p>Create custom estimates and billing formats</p>
                </div>
                <span className="quick-arrow">→</span>
              </div>
            )}
          </div>

          {/* 📊 BUSINESS STATS */}
          {subscriptions.includes("business") && (
            <div className="invoice-stats">
              <div className="invoice-stat-card">
                <h4>Today</h4>
                <span>{dailyInvoices}</span>
                <p>Invoices Created</p>
              </div>

              <div className="invoice-stat-card">
                <h4>This Month</h4>
                <span>{monthlyInvoices}</span>
                <p>Invoices Created</p>
              </div>
            </div>
          )}

          {/* MODULE SUMMARY CARDS */}
          <div className="dashboard-section">
            <div className="dashboard-cards">
              {activeModules.map((module) => (
                <SummaryCard
                  key={module.key}
                  title={module.title}
                  value={module.value}
                  subtitle={module.subtitle}
                  icon={module.icon}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome;
