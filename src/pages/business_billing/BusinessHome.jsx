import React from "react";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../../components/cards/SummaryCard";



const BusinessHome = () => {
  const navigate = useNavigate();

  const stats = {
    todaySales: "₹12,450",
    todayInvoices: 8,
    unpaidAmount: "₹1,20,000",
    paidAmount: "₹6,65,000",
    totalBilling: "₹7,85,000",
    invoiceCount: 128,
    stockValue: "₹3,40,000",
  };

  return (
    <div className="business-home">

      {/* HERO */}
      <div className="business-hero">
        <div>
          <h2>Business Billing</h2>
          <p>Track sales, invoices, customers and GST in one place</p>
        </div>

        <button
          className="primary-action"
          onClick={() => navigate("create-invoice")}
        >
          + Create Invoice
        </button>
      </div>

      {/* QUICK ACTIONS */}
      <div className="business-quick-actions">
        <div className="business-quick-card" onClick={() => navigate("create-invoice")}>
          <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" />
          <span>Create Invoice</span>
        </div>

        <div className="business-quick-card" onClick={() => navigate("products")}>
          <img src="https://cdn-icons-png.flaticon.com/512/679/679922.png" />
          <span>Manage Products</span>
        </div>

        <div className="business-quick-card" onClick={() => navigate("customers")}>
          <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" />
          <span>Customers</span>
        </div>
      </div>

      {/* KPI: TODAY */}
      <h3 className="section-title">Today</h3>
      <div className="summary-grid">
        <SummaryCard
          title="Today’s Sales"
          value={stats.todaySales}
          subtitle={`${stats.todayInvoices} invoices`}
        />
        <SummaryCard
          title="Unpaid Amount"
          value={stats.unpaidAmount}
          subtitle="Pending payments"
        />
        <SummaryCard
          title="Paid Amount"
          value={stats.paidAmount}
          subtitle="Received payments"
        />
      </div>

      {/* KPI: OVERVIEW */}
      <h3 className="section-title">Business Overview</h3>
      <div className="summary-grid">
        <SummaryCard
          title="Total Billing"
          value={stats.totalBilling}
          subtitle="Overall sales"
        />
        <SummaryCard
          title="Invoices Created"
          value={stats.invoiceCount}
          subtitle="This month"
        />
        <SummaryCard
          title="Total Stock Value"
          value={stats.stockValue}
          subtitle="Inventory worth"
        />
      </div>
    </div>
  );
};

export default BusinessHome;
