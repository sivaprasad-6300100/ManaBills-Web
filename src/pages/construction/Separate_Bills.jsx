import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";
// import "../../styles/SeparateBills.css";

const STORAGE_KEY = "separateWorkBill";

const SeparateBills = () => {
  const location = useLocation();
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

  const [isEditable, setIsEditable] = useState(true); // ✅ NEW

  const [sections, setSections] = useState(
    saved?.sections || [{ title: "", amount: "", items: [""] }]
  );

  const [owner, setOwner] = useState(saved?.owner || {});
  const [workerName, setWorkerName] = useState(saved?.workerName || "");
  const [workerPhone, setWorkerPhone] = useState(saved?.workerPhone || "");

  const [estimatedData, setEstimatedData] = useState(
    saved?.estimatedData || { purpose: "", amount: 0 }
  );

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [payments, setPayments] = useState(saved?.payments || []);
  const [showPreview, setShowPreview] = useState(false);

  /* ===== LOAD FROM ESTIMATION ===== */
  useEffect(() => {
    if (location.state?.bill) {
      setEstimatedData({
        purpose: location.state.bill.purpose || "",
        amount: Number(location.state.bill.amount || 0),
      });
      setOwner(location.state.owner || {});
    }
  }, [location.state]);

  /* ===== SAVE STORAGE ===== */
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sections,
        owner,
        workerName,
        workerPhone,
        estimatedData,
        payments,
      })
    );
  }, [sections, owner, workerName, workerPhone, estimatedData, payments]);

  /* ===== SECTION ===== */
  const addSection = () => {
    if (!isEditable) return;
    setSections([...sections, { title: "", amount: "", items: [""] }]);
  };

  const updateSection = (i, key, val) => {
    if (!isEditable) return;
    const copy = [...sections];
    copy[i][key] = val;
    setSections(copy);
  };

  const deleteSection = (i) => {
    if (!isEditable || sections.length === 1) return;
    setSections(sections.filter((_, idx) => idx !== i));
  };

  /* ===== ITEM ===== */
  const addItem = (i) => {
    if (!isEditable) return;
    const copy = [...sections];
    copy[i].items.push("");
    setSections(copy);
  };

  const updateItem = (i, j, val) => {
    if (!isEditable) return;
    const copy = [...sections];
    copy[i].items[j] = val;
    setSections(copy);
  };

  const deleteItem = (i, j) => {
    if (!isEditable) return;
    const copy = [...sections];
    if (copy[i].items.length === 1) return;
    copy[i].items.splice(j, 1);
    setSections(copy);
  };

  /* ===== TOTALS ===== */
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  
  const totalSectionAmount = sections.reduce(
  (sum, sec) => sum + Number(sec.amount || 0),
  0
);


  const balanceAmount =
    totalSectionAmount - totalPaid > 0
      ? totalSectionAmount - totalPaid
      : 0;

  /* ===== PAYMENT ===== */
  const addPayment = () => {
    if (!isEditable) return;
    if (!paymentAmount || paymentAmount <= 0) return;

    setPayments([
      ...payments,
      { amount: Number(paymentAmount), date: paymentDate },
    ]);

    setPaymentAmount("");
  };

  /* ===== DELETE PROJECT ===== */
  const deleteFullProject = () => {
    if (!window.confirm("Delete entire project?")) return;

    localStorage.removeItem(STORAGE_KEY);
    setSections([{ title: "", amount: "", items: [""] }]);
    setWorkerPhone("");
    setPayments([]);
    setEstimatedData({ purpose: "", amount: 0 });
    setIsEditable(true);
  };

  /* ===== PDF ===== */
  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("ESTIMATION & WORK BILL", 105, y, { align: "center" });
    y += 10;

    doc.text(`Work: ${estimatedData.purpose}`, 20, y);
    y += 6;

    doc.text(`Estimated Amount: ₹${estimatedData.amount}`, 20, y);
    y += 6;

    doc.text(`Worker: ${workerName} (${workerPhone})`, 20, y);
    y += 10;

    sections.forEach((sec, i) => {
      doc.text(`${i + 1}. ${sec.title}`, 20, y);
      doc.text(`₹${sec.amount}`, 180, y, { align: "right" });
      y += 6;

      sec.items.forEach((it) => {
        if (it) {
          doc.text(`• ${it}`, 25, y);
          y += 5;
        }
      });
    });

    doc.text(`Total Paid: ₹${totalPaid}`, 20, y + 10);
    doc.text(`Balance: ₹${balanceAmount}`, 20, y + 18);

    setIsEditable(false); // ✅ DISABLE AFTER SAVE

    window.open(doc.output("bloburl"));
  };

  return (
    <div className="sb-page">
      <h1 className="sb-title">🧾 Estimation & Work Bills</h1>

      <div className="sb-layout">
        <div className="sb-left">
          {/* Estimation */}
          <div className="sb-card">
            <h3>Estimation</h3>

            <input
              className="sb-input"
              placeholder="Work Purpose"
              disabled={!isEditable}
              value={estimatedData.purpose}
              onChange={(e) =>
                setEstimatedData({ ...estimatedData, purpose: e.target.value })
              }
            />

            <input
              className="sb-input"
              type="number"
              disabled={!isEditable}
              placeholder="Estimated Amount"
              value={estimatedData.amount}
              onChange={(e) =>
                setEstimatedData({
                  ...estimatedData,
                  amount: Number(e.target.value),
                })
              }
            />
          </div>

          {/* Worker */}
          <div className="sb-card">
            <h3>Worker Details</h3>

            <input
              className="sb-input"
              placeholder="Worker Name"
              disabled={!isEditable}
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
            />

            <input
              className="sb-input"
              placeholder="Worker Mobile"
              disabled={!isEditable}
              value={workerPhone}
              onChange={(e) => setWorkerPhone(e.target.value)}
            />
          </div>

          {/* Sections */}
          {sections.map((sec, i) => (
            <div key={i} className="sb-card">
              <div className="sb-card-header">
                <strong>Section {i + 1}</strong>
                <button
                  className="danger"
                  disabled={!isEditable}
                  onClick={() => deleteSection(i)}
                >
                  Delete
                </button>
              </div>

              <input
                className="sb-input"
                placeholder="Section Name"
                disabled={!isEditable}
                value={sec.title}
                onChange={(e) => updateSection(i, "title", e.target.value)}
              />

              <input
                className="sb-input"
                type="number"
                disabled={!isEditable}
                placeholder="Section Amount"
                value={sec.amount}
                onChange={(e) => updateSection(i, "amount", e.target.value)}
              />

              {sec.items.map((item, j) => (
                <div key={j} className="sb-item-row">
                  <input
                    className="sb-input"
                    disabled={!isEditable}
                    placeholder="Item Description"
                    value={item}
                    onChange={(e) => updateItem(i, j, e.target.value)}
                  />
                  <button
                    className="danger small"
                    disabled={!isEditable}
                    onClick={() => deleteItem(i, j)}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                className="outline small"
                disabled={!isEditable}
                onClick={() => addItem(i)}
              >
                ➕ Add Item
              </button>
            </div>
          ))}

          <button
            className="primary full"
            disabled={!isEditable}
            onClick={addSection}
          >
            ➕ Add Section
          </button>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="sb-right">
          {balanceAmount > 0 && (
            <div className="sb-card sticky">
              <h3>Add Payment</h3>

              <input
                className="sb-input"
                type="number"
                disabled={!isEditable}
                placeholder="Paid Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />

              <input
                className="sb-input"
                type="date"
                disabled={!isEditable}
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />

              <button
                className="primary full"
                disabled={!isEditable}
                onClick={addPayment}
              >
                Save Payment
              </button>
            </div>
          )}

          <div className="sb-summary sticky">
            <div>
              Estimated <strong>₹{estimatedData.amount}</strong>
            </div>
            <div>
              TOATAL AMOUNT<strong>₹{totalSectionAmount}</strong>
            </div>
            <div>
              PAID AMOUNT <strong>₹{totalPaid}</strong>
            </div>
            <div className="balance">
              Balance <strong>₹{balanceAmount}</strong>
            </div>
          </div>

          <div className="sb-card sticky">
            <button
              className="outline full"
              onClick={() => setShowPreview(true)}
            >
              👁 Preview
            </button>

            <button className="danger full" onClick={deleteFullProject}>
              🗑 Delete
            </button>

            <button className="primary full" onClick={generatePDF}>
              📄 save and share
            </button>

            {/* ✅ NEW EDIT BUTTON */}
            {!isEditable && (
              <button
                className="outline full"
                onClick={() => setIsEditable(true)}
              >
                ✏ Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== PREVIEW (UNCHANGED) ===== */}
      {showPreview && (
        <div className="sb-preview-overlay">
          <div className="sb-preview pro-preview">

            <div className="preview-owner">
              <div className="owner-left">
                <h3 className="owner-name">Owner_Name:{owner?.name || "-"}</h3>
                <p className="owner-mobile">Owner_Mobile: {owner?.phone || "-"}</p>
              </div>
              <div className="owner-right">
                <h3 className="event-name">{owner?.eventType || "-"}</h3>
              </div>
            </div>

            <div className="preview-header">
              <div>
                <h2>WORK BILL DOCUMENT</h2>
                <p className="preview-sub">
                  Date : {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="preview-info-grid">
              <div className="info-box">
                <label>Work Purpose</label>
                <p>{estimatedData.purpose || "-"}</p>
              </div>

              <div className="info-box">
                <label>Worker Name</label>
                <p>{workerName || "-"}</p>
              </div>

              <div className="info-box">
                <label>Worker Mobile</label>
                <p>{workerPhone || "-"}</p>
              </div>
            </div>

            <table className="preview-table ">
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>Section</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {sections.map((sec, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{sec.title || "-"}</td>
                    <td>
                      <ul className="item-list">
                        {sec.items.map(
                          (it, j) => it && <li key={j}>{it}</li>
                        )}
                      </ul>
                    </td>
                    <td>₹ {sec.amount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {payments.length > 0 && (
              <div className="preview-payments ">
                <h4>Payment History</h4>

                {payments.map((p, i) => (
                  <div key={i} className="payment-row">
                    <span>{p.date}</span>
                    <strong>₹ {p.amount}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="preview-summary">
              <div>
                Total Paid :
                <strong> ₹ {totalPaid}</strong>
              </div>

              <div className="balance">
                Balance :
                <strong> ₹ {balanceAmount}</strong>
              </div>
            </div>

            <div className="preview-signature">
              <div>
                <p>Worker Signature</p>
                <div className="sign-line"></div>
              </div>

              <div>
                <p>Authorized Signature</p>
                <div className="sign-line"></div>
              </div>
            </div>

            <button
              className="btn-close"
              onClick={() => setShowPreview(false)}
            >
              Close Preview
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default SeparateBills;
