import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Quotations = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("custom_quotations")) || [];
    setQuotations(saved.reverse());
  }, []);

  const updateStatus = (id, status) => {
    const updated = quotations.map((q) =>
      q.id === id ? { ...q, status } : q
    );
    setQuotations(updated);
    localStorage.setItem("custom_quotations", JSON.stringify(updated.reverse()));
  };

  const convertToBill = (quotation) => {
    const bills = JSON.parse(localStorage.getItem("custom_bills")) || [];
    localStorage.setItem(
      "custom_bills",
      JSON.stringify([...bills, { ...quotation, billId: "BILL" + Date.now() }])
    );
    alert("Converted to Bill Successfully");
  };

  return (
    <div className="quotations-page">
      <h2>All Quotations</h2>

      {quotations.length === 0 ? (
        <p>No quotations created yet.</p>
      ) : (
        <table className="qt-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Worker</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {quotations.map((q) => (
              <tr key={q.id}>
                <td>{q.id}</td>
                <td>
                  {q.customer.name}
                  <br />
                  <small>{q.customer.mobile}</small>
                </td>
                <td>{q.workerType}</td>
                <td>₹ {q.total}</td>

                <td>
                  <span className={`badge ${q.status.toLowerCase()}`}>
                    {q.status}
                  </span>
                </td>

                <td className="action-col">
                  <button
                    className="btn approve"
                    onClick={() => updateStatus(q.id, "APPROVED")}
                  >
                    Approve
                  </button>

                  <button
                    className="btn reject"
                    onClick={() => updateStatus(q.id, "REJECTED")}
                  >
                    Reject
                  </button>

                  <button
                    className="btn bill"
                    disabled={q.status !== "APPROVED"}
                    onClick={() => convertToBill(q)}
                  >
                    Convert to Bill
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Quotations;
