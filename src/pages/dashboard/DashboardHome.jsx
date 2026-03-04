import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import SummaryCard from "../../components/cards/SummaryCard";
import UpgradeCard from "../../components/cards/UpgradeCard";

/* ── Module config ── */
const MODULES = [
  {
    key:     "business",
    title:   "Business Billing",
    value:   "₹1,25,000",
    subtitle:"Total Billing This Month",
    icon:    "🧾",
    route:   "/business/invoices/create",
    color:   "blue",
    desc:    "Create and send GST invoices in under 30 seconds",
    trend:   "+12%",
    trendUp: true,
  },
  {
    key:     "home-expense",
    title:   "Home Expenses",
    value:   "₹45,000",
    subtitle:"Total Expenses This Month",
    icon:    "🏠",
    route:   "/home-expenses/add",
    color:   "green",
    desc:    "Add and track your daily household expenses",
    trend:   "-5%",
    trendUp: false,
  },
  {
    key:     "construction",
    title:   "Construction",
    value:   "₹8,90,000",
    subtitle:"Total Project Cost",
    icon:    "🏗️",
    route:   "/construction/projects/create",
    color:   "orange",
    desc:    "Manage construction projects, labour and materials",
    trend:   "+28%",
    trendUp: true,
  },
  {
    key:     "custom",
    title:   "Customized Billing",
    value:   "Active",
    subtitle:"Custom Estimations Enabled",
    icon:    "⚙️",
    route:   "/custom-billing/create",
    color:   "purple",
    desc:    "Create custom estimates and billing formats",
    trend:   "Live",
    trendUp: true,
  },
];

/* ── Helper: get display name — never show mobile number ── */
const getDisplayName = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    // If full_name is set and not empty, use first word of it
    if (user.full_name && user.full_name.trim().length > 0) {
      return user.full_name.trim().split(" ")[0];
    }
    // Never show raw mobile number — show generic greeting
    return "there";
  } catch {
    return "there";
  }
};

const DashboardHome = () => {
  const navigate = useNavigate();
  const { subscriptions: subData } = useContext(SubscriptionContext);
  const subscriptions = Object.keys(subData);
  const hasAny        = subscriptions.length > 0;

  /* Personalised greeting */
  const displayName = getDisplayName();
  const hour  = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* Temp stats — replace with API later */
  const dailyInvoices   = 6;
  const monthlyInvoices = 124;
  const activeModules   = MODULES.filter((m) => subscriptions.includes(m.key));

  return (
    <div className="dashboard-page">

      {/* ═══════════════════════════════
          NO SUBSCRIPTION STATE
      ═══════════════════════════════ */}
      {!hasAny && (
        <>
          {/* Welcome card */}
          <div className="welcome-section">
            <h2>
              {greet}, <span>👋</span> Welcome to ManaBills!
            </h2>
            <p>
              Manage billing, expenses and projects — all in one place only.
              Start by choosing a plan that fits your business needs.
            </p>
          </div>

          {/* Platform mini stats so page doesn't look empty */}
          <div className="db-mini-stats">
            <div className="db-mini-stat">
              <strong>50K+</strong>
              <span>Invoices/mo</span>
            </div>
            <div className="db-mini-stat">
              <strong>₹2Cr+</strong>
              <span>Tracked</span>
            </div>
            <div className="db-mini-stat">
              <strong>4.9★</strong>
              <span>Rating</span>
            </div>
          </div>

          {/* Upgrade CTA */}
          <UpgradeCard />

          {/* Available modules teaser */}
          <div>
            <div className="db-section-row">
              <div className="db-section-title">Available Modules</div>
              <button className="db-section-link" onClick={() => navigate("/subscription")}>
                View Plans →
              </button>
            </div>
            <div className="quick-actions">
              {MODULES.map((m) => (
                <div
                  key={m.key}
                  className={`quick-card ${m.color}`}
                  onClick={() => navigate("/subscription")}
                >
                  <div className="quick-icon-box">
                    <span className="quick-icon">{m.icon}</span>
                  </div>
                  <div className="quick-text">
                    <h3>{m.title}</h3>
                    <p>{m.desc}</p>
                  </div>
                  <span className="quick-arrow">→</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════
          ACTIVE SUBSCRIPTION STATE
      ═══════════════════════════════ */}
      {hasAny && (
        <>
          {/* Greeting header */}
          <div className="dashboard-header">
            <h2>{greet}, {displayName} 👋</h2>
            <p>Here is your business overview for today. Everything is looking good only.</p>
          </div>

          {/* Invoice stat cards */}
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
              <div className="invoice-stat-card">
                <h4>Pending</h4>
                <span>3</span>
                <p>Awaiting Payment</p>
              </div>
              <div className="invoice-stat-card">
                <h4>Collected</h4>
                <span>₹82K</span>
                <p>This Month</p>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div>
            <div className="db-section-row">
              <div className="db-section-title">Quick Actions</div>
              <button
                className="db-section-link"
                onClick={() => navigate("/subscription")}
              >
                + Add Module →
              </button>
            </div>
            <div className="quick-actions">
              {MODULES.filter((m) => subscriptions.includes(m.key)).map((m) => (
                <div
                  key={m.key}
                  className={`quick-card ${m.color}`}
                  onClick={() => navigate(m.route)}
                >
                  <div className="quick-icon-box">
                    <span className="quick-icon">{m.icon}</span>
                  </div>
                  <div className="quick-text">
                    <h3>{m.title}</h3>
                    <p>{m.desc}</p>
                  </div>
                  <span className="quick-arrow">→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Module summary cards */}
          {activeModules.length > 0 && (
            <div className="dashboard-section">
              <div className="db-section-row">
                <div className="db-section-title">Module Summary</div>
              </div>
              <div className="dashboard-cards">
                {activeModules.map((m) => (
                  <SummaryCard
                    key={m.key}
                    title={m.title}
                    value={m.value}
                    subtitle={m.subtitle}
                    icon={m.icon}
                    trend={m.trend}
                    trendUp={m.trendUp}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardHome;
