import React, { useEffect, useState } from "react";

const CustomSummary = () => {
  const [quotations, setQuotations] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    setQuotations(JSON.parse(localStorage.getItem("custom_quotations")) || []);
    setBills(JSON.parse(localStorage.getItem("custom_bills")) || []);
    setPayments(JSON.parse(localStorage.getItem("custom_payments")) || []);
  }, []);

  const totalEstimate = quotations.reduce((s, q) => s + Number(q.total), 0);
  const approvedCount = quotations.filter(q => q.status === "APPROVED").length;
  const totalBilling = bills.reduce((s, b) => s + Number(b.total), 0);
  const totalReceived = payments.reduce((s, p) => s + Number(p.amount), 0);
  const pendingAmount = totalBilling - totalReceived;

  return (
    <div className="summary-page">
      <h2>Business Summary</h2>

      <div className="summary-grid">
        <div className="sum-card">
          <p>Total Quotations</p>
          <h3>{quotations.length}</h3>
        </div>

        <div className="sum-card success">
          <p>Approved Quotations</p>
          <h3>{approvedCount}</h3>
        </div>

        <div className="sum-card primary">
          <p>Total Billing</p>
          <h3>₹ {totalBilling}</h3>
        </div>

        <div className="sum-card info">
          <p>Total Received</p>
          <h3>₹ {totalReceived}</h3>
        </div>

        <div className="sum-card danger">
          <p>Pending Amount</p>
          <h3>₹ {pendingAmount}</h3>
        </div>
      </div>
    </div>
  );
};

export default CustomSummary;
