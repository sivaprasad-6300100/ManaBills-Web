import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";

const Bills = () => {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("custom_bills")) || [];
    setBills(saved.reverse());
  }, []);

  const generatePDF = (bill) => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("WORK BILL", 105, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.text(`Bill No: ${bill.billId}`, 20, y);
    y += 6;
    doc.text(`Customer: ${bill.customer.name}`, 20, y);
    y += 6;
    doc.text(`Mobile: ${bill.customer.mobile}`, 20, y);
    y += 6;
    doc.text(`Worker: ${bill.workerType}`, 20, y);
    y += 10;

    bill.rows.forEach((r, i) => {
      doc.text(
        `${i + 1}. ${r.work || r.item || ""} - ₹${r.total || 0}`,
        20,
        y
      );
      y += 6;
    });

    y += 10;
    doc.text(`Total Amount: ₹${bill.total}`, 20, y);

    window.open(doc.output("bloburl"), "_blank");
  };

  return (
    <div className="bills-page">
      <h2>All Bills</h2>

      {bills.length === 0 ? (
        <p>No bills generated yet.</p>
      ) : (
        <table className="bill-table">
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Customer</th>
              <th>Worker</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {bills.map((b) => (
              <tr key={b.billId}>
                <td>{b.billId}</td>
                <td>
                  {b.customer.name}
                  <br />
                  <small>{b.customer.mobile}</small>
                </td>
                <td>{b.workerType}</td>
                <td>₹ {b.total}</td>
                <td>
                  <button
                    className="btn pdf"
                    onClick={() => generatePDF(b)}
                  >
                    PDF
                  </button>
                  <button className="btn whatsapp">
                    WhatsApp
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

export default Bills;
