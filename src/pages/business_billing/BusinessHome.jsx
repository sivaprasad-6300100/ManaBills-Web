import React from "react";
import { useNavigate } from "react-router-dom";
import SummaryCard from "../../components/cards/SummaryCard";


const BusinessHome = () => {
  const navigate = useNavigate();

  // Dummy data (later from API)
  const stats = {
    stockValue: "₹3,40,000",
    totalBilling: "₹7,85,000",
    unpaidAmount: "₹1,20,000",
  };

  return (
    <div>
      <h2>Business Billing</h2>
      <p>Manage invoices, products, customers and GST</p>

      <div className="summary-grid">
        <SummaryCard
          title="Total Stock Value"
          value={stats.stockValue}
          subtitle="Available inventory worth"
        />

        <SummaryCard
          title="Total Billing"
          value={stats.totalBilling}
          subtitle="Overall sales amount"
        />

        <SummaryCard
          title="Unpaid Amount"
          value={stats.unpaidAmount}
          subtitle="Pending payments"
        />
      </div>

      <div className="business-actions">
        <button onClick={() => navigate("create-invoice")}>
          ➕ Create Invoice
        </button>
        <button onClick={() => navigate("products")}>
          📦 Manage Products
        </button>
        <button onClick={() => navigate("customers")}>
          👥 Customers
        </button>
      </div>
    </div>
  );
};

export default BusinessHome;
