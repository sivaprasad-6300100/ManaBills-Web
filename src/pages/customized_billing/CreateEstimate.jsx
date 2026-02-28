import React, { useState } from "react";

const workerTemplates = {
  carpenter: {
    label: "Carpenter",
    cols: ["Item", "Unit", "Qty", "Length", "Width", "Sqf", "Rate"]
  },
  aluminium: { label: "Aluminium", cols: ["Work", "Length", "Width", "Sqft", "Rate"] },
  glass: { label: "Glass", cols: ["Work", "Sqft", "Thickness", "Rate"] },
  caterer: { label: "Caterer", cols: ["Item", "Plates", "Rate"] },
  electrician: { label: "Electrician", cols: ["Work", "Points", "Rate"] },
  plumber: { label: "Plumber", cols: ["Work", "Qty", "Material", "Labor"] },
  custom: { label: "Custom", cols: ["Item", "Qty", "Rate"] }
};

const CreateEstimate = () => {
  const [workerType, setWorkerType] = useState("carpenter");
  const [customer, setCustomer] = useState({ name: "", mobile: "" });

  const [rows, setRows] = useState([
    {
      item: "",
      unit: "SET",
      qty: "",
      length: "",
      width: "",
      sqf: "",
      rate: "",
      total: 0
    }
  ]);

  const cols = workerTemplates[workerType].cols;

  const calculateRow = (row) => {
    let total = 0;

    if (workerType === "carpenter") {
      if (row.unit === "SET") {
        total = Number(row.qty || 0) * Number(row.rate || 0);
        return { ...row, total };
      }

      if (row.unit === "SQF") {
        const sqf = Number(row.length || 0) * Number(row.width || 0);
        total = sqf * Number(row.rate || 0);
        return { ...row, sqf, total };
      }
    }

    return row;
  };

  const handleChange = (i, field, value) => {
    const updated = [...rows];
    updated[i][field] = value;
    updated[i] = calculateRow(updated[i]);
    setRows(updated);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        item: "",
        unit: "SET",
        qty: "",
        length: "",
        width: "",
        sqf: "",
        rate: "",
        total: 0
      }
    ]);
  };

  const totalAmount = rows.reduce((sum, r) => sum + (Number(r.total) || 0), 0);

  const saveQuotation = () => {
    if (!customer.name || !customer.mobile) {
      alert("Enter customer details");
      return;
    }

    const quotation = {
      id: "QTN" + Date.now(),
      customer,
      workerType,
      rows,
      total: totalAmount,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    const old = JSON.parse(localStorage.getItem("custom_quotations")) || [];
    localStorage.setItem("custom_quotations", JSON.stringify([...old, quotation]));

    alert("Quotation Created Successfully!");
    setCustomer({ name: "", mobile: "" });
    setRows([{}]);
  };

  return (
    <div className="create-estimate">
      <h2>Create Estimate</h2>

      {/* Worker Type */}
      <div className="form-row">
        <label>Worker Type</label>
        <select value={workerType} onChange={(e) => setWorkerType(e.target.value)}>
          {Object.keys(workerTemplates).map((key) => (
            <option key={key} value={key}>
              {workerTemplates[key].label}
            </option>
          ))}
        </select>
      </div>

      {/* Customer */}
      <div className="customer-box">
        <input
          placeholder="Customer Name"
          value={customer.name}
          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
        />
        <input
          placeholder="Mobile Number"
          value={customer.mobile}
          onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
        />
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Unit</th>
            <th>Qty</th>
            <th>Length</th>
            <th>Width</th>
            <th>Sqf</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>
                <input
                  value={row.item || ""}
                  onChange={(e) => handleChange(i, "item", e.target.value)}
                />
              </td>

              <td>
                <select
                  value={row.unit}
                  onChange={(e) => handleChange(i, "unit", e.target.value)}
                >
                  <option value="SET">SET</option>
                  <option value="SQF">SQF</option>
                </select>
              </td>

              <td>
                {row.unit === "SET" && (
                  <input
                    value={row.qty || ""}
                    onChange={(e) => handleChange(i, "qty", e.target.value)}
                  />
                )}
              </td>

              <td>
                {row.unit === "SQF" && (
                  <input
                    value={row.length || ""}
                    onChange={(e) => handleChange(i, "length", e.target.value)}
                  />
                )}
              </td>

              <td>
                {row.unit === "SQF" && (
                  <input
                    value={row.width || ""}
                    onChange={(e) => handleChange(i, "width", e.target.value)}
                  />
                )}
              </td>

              <td>{row.unit === "SQF" ? row.sqf || 0 : "-"}</td>

              <td>
                <input
                  value={row.rate || ""}
                  onChange={(e) => handleChange(i, "rate", e.target.value)}
                />
              </td>

              <td className="total-cell">₹ {row.total || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="add-btn" onClick={addRow}>
        + Add Row
      </button>

      {/* Footer */}
      <div className="footer">
        <h3>Grand Total: ₹ {totalAmount}</h3>
        <button className="save-btn" onClick={saveQuotation}>
          Save Quotation
        </button>
      </div>
    </div>
  );
};

export default CreateEstimate;
