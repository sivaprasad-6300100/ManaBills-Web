import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../../styles/global/dashboard.css";

/* ── Clean SVG Icons for bottom nav ── */
const HomeIcon     = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);

const BusinessIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="2"/>
    <path d="M8 3v18M16 3v18M2 9h20M2 15h20"/>
  </svg>
);

const ExpenseIcon  = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

const BuildIcon    = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M9 21V7l3-4 3 4v14M5 21V11l4-2M19 21V11l-4-2"/>
  </svg>
);

const AccountIcon  = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#c9963a" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);

const NAV_ITEMS = [
  { to: "/dashboard",              Icon: HomeIcon,     label: "Home",     end: true },
  { to: "/dashboard/business",     Icon: BusinessIcon, label: "Business"            },
  { to: "/dashboard/home-expense", Icon: ExpenseIcon,  label: "Expenses"            },
  { to: "/dashboard/construction", Icon: BuildIcon,    label: "Build"               },
  { to: "/dashboard/account",      Icon: AccountIcon,  label: "Account"             },
];

const DashboardLayout = () => {
  return (
    <div className="dashboard-container">

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="dashboard-main">
        <Topbar />
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-nav-inner">
          {NAV_ITEMS.map(({ to, Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `mobile-nav-item${isActive ? " active" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="mobile-nav-icon">
                    <Icon active={isActive} />
                  </div>
                  <span className={`mobile-nav-label${isActive ? " active-label" : ""}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  );
};

export default DashboardLayout;
