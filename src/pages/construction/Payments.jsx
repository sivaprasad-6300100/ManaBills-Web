import React, { useEffect, useState } from "react";
// import "../../styles/Payments.css";

const STORAGE_KEY = "separateWorkBill";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalAmount: 0,
    balance: 0,
    worker: "",
    purpose: "",
  });

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!data) return;

    const totalPaid = data.payments?.reduce(
      (s, p) => s + Number(p.amount || 0),
      0
    );

    const totalAmount = data.sections?.reduce(
      (s, sec) => s + Number(sec.amount || 0),
      0
    );

    setPayments(data.payments || []);
    setSummary({
      totalPaid,
      totalAmount,
      balance: Math.max(totalAmount - totalPaid, 0),
      worker: data.workerName || "",
      purpose: data.estimatedData?.purpose || "",
    });
  }, []);

  return (
    <div className="pay-page">
      <h2 className="pay-title">💰 Payments</h2>

      {/* Summary Cards */}
      <div className="pay-summary">
        <div className="pay-card">
          <p>Total Bill</p>
          <h3>₹{summary.totalAmount}</h3>
        </div>
        <div className="pay-card warning">
          <p>Total Paid</p>
          <h3>₹{summary.totalPaid}</h3>
        </div>
        <div className="pay-card success">
          <p>Balance</p>
          <h3>₹{summary.balance}</h3>
        </div>
      </div>

      {/* Worker Info */}
      <div className="pay-info">
        <p><strong>Worker:</strong> {summary.worker || "-"}</p>
        <p><strong>Work:</strong> {summary.purpose || "-"}</p>
      </div>

      {/* Payment History */}
      <div className="pay-table-box">
        <h3>Payment History</h3>

        {payments.length === 0 ? (
          <p>No payments done yet</p>
        ) : (
          <table className="pay-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{p.date}</td>
                  <td>₹ {p.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Payments;
