import React, { useEffect, useState } from "react";

const CustomPayments = () => {
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const billsData = JSON.parse(localStorage.getItem("custom_bills")) || [];
    const paymentsData = JSON.parse(localStorage.getItem("custom_payments")) || [];
    setBills(billsData);
    setPayments(paymentsData);
  }, []);

  const totalReceived = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="payments-page">
      <h2>Payments Ledger</h2>

      <div className="payment-summary">
        <div className="card">
          <p>Total Bills</p>
          <h3>{bills.length}</h3>
        </div>

        <div className="card success">
          <p>Total Received</p>
          <h3>₹ {totalReceived}</h3>
        </div>
      </div>

      <table className="payment-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Bill No</th>
            <th>Customer</th>
            <th>Paid</th>
            <th>Mode</th>
          </tr>
        </thead>

        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan="5">No payments recorded yet</td>
            </tr>
          ) : (
            payments.map((p, i) => (
              <tr key={i}>
                <td>{p.date}</td>
                <td>{p.billId}</td>
                <td>{p.customer}</td>
                <td>₹ {p.amount}</td>
                <td>{p.mode}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomPayments;
