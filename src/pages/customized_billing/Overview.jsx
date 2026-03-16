import React, { useEffect, useState } from "react";
import "../../styles/custom/custom.css"; // ✅ FIXED: was pointing to wrong path

const Overview = () => {
  const [stats, setStats] = useState({
    totalEstimates: 0,
    approvedQuotes: 0,
    totalBilling: 0,
    totalPaid: 0,
    pendingAmount: 0,
  });

  useEffect(() => {
    const quotations = JSON.parse(localStorage.getItem("custom_quotations")) || [];
    const bills = JSON.parse(localStorage.getItem("custom_bills")) || [];
    const payments = JSON.parse(localStorage.getItem("custom_payments")) || [];

    const approved = quotations.filter(q => q.status === "APPROVED");

    const totalBilling = bills.reduce((sum, b) => sum + (Number(b.grandTotal) || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    setStats({
      totalEstimates: quotations.length,
      approvedQuotes: approved.length,
      totalBilling,
      totalPaid,
      pendingAmount: totalBilling - totalPaid,
    });
  }, []);

  return (
    <div className="overview-container">
      <h2>Dashboard Overview</h2>

      <div className="overview-grid">

        <div className="overview-card">
          <h3>Total Estimates</h3>
          <p>{stats.totalEstimates}</p>
        </div>

        <div className="overview-card">
          <h3>Approved Quotations</h3>
          <p>{stats.approvedQuotes}</p>
        </div>

        <div className="overview-card">
          <h3>Total Billing (₹)</h3>
          <p>{stats.totalBilling}</p>
        </div>

        <div className="overview-card">
          <h3>Total Paid (₹)</h3>
          <p>{stats.totalPaid}</p>
        </div>

        <div className="overview-card highlight">
          <h3>Pending Amount (₹)</h3>
          <p>{stats.pendingAmount}</p>
        </div>

      </div>
    </div>
  );
};

export default Overview;
