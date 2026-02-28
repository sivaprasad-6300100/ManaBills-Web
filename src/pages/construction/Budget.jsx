import React, { useState } from "react";
// import "../../styles/Budget.css";

const Budget = () => {
  const [projectName, setProjectName] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [owner, setOwner] = useState({
    name: "",
    phone: "",
    location: "",
  });

  const [costPurpose, setCostPurpose] = useState("");
  const [estimateAmount, setEstimateAmount] = useState("");
  const [date, setDate] = useState("");
  const [estimates, setEstimates] = useState([]);

  const totalEstimated = estimates.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  const remainingAmount = totalAmount - totalEstimated;

  const addEstimate = () => {
    if (!costPurpose || !estimateAmount || !date) return;

    setEstimates([
      ...estimates,
      {
        purpose: costPurpose,
        amount: Number(estimateAmount),
        date,
      },
    ]);

    setCostPurpose("");
    setEstimateAmount("");
    setDate("");
  };

  const saveProject = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("User not logged in");
      return;
    }

     // 🔑 USER BASED STORAGE KEY

    const userKey = `constructionProjects_${user.mobile_number}`;
    const oldProjects =
      JSON.parse(localStorage.getItem(userKey)) || [];

      const newProject = {
        id: Date.now(), // UNIQUE PROJECT ID
        projectName,
        totalAmount,
        owner,
        estimates,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        userKey,
        JSON.stringify([...oldProjects, newProject])
      );

      alert("Project Saved Successfully ✅");

  };

  return (
    <>
      {/* 🔵 TOP SUMMARY */}
      <div className="budget-page">
        <h2 className="budget-title">Project Estimation</h2>

        <div className="budget-summary">
          <div className="summary-card">
            <p>Total Budget</p>
            <h3>₹{totalAmount || 0}</h3>
          </div>

          <div className="summary-card warning">
            <p>Total Estimated</p>
            <h3>₹{totalEstimated}</h3>
          </div>

          <div className="summary-card success">
            <p>Remaining</p>
            <h3>₹{remainingAmount}</h3>
          </div>
        </div>
      </div>

      {/* 🟢 OWNER DETAILS */}
      <div className="budget-page2">
        <div className="form-box-ownerdetails owner-section">
          <h3 className="section-title">Owner Details</h3>

          <div className="owner-grid">
            <input
              placeholder="Owner Name"
              value={owner.name}
              onChange={(e) =>
                setOwner({ ...owner, name: e.target.value })
              }
            />

            <input
              placeholder="Phone"
              value={owner.phone}
              onChange={(e) =>
                setOwner({ ...owner, phone: e.target.value })
              }
            />
          </div>

          <input
            placeholder="Location"
            value={owner.location}
            onChange={(e) =>
              setOwner({ ...owner, location: e.target.value })
            }
          />
        </div>
      </div>

      {/* 🔴 PROJECT + ESTIMATES */}
      <div className="budget-page1">
        <div className="budget-grid">
          <div>
            <div className="form-box">
              <h4 className="section-title">Project Details</h4>

              <input
                placeholder="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />

              <input
                type="number"
                placeholder="Total Amount ₹"
                value={totalAmount}
                onChange={(e) =>
                  setTotalAmount(Number(e.target.value))
                }
              />
            </div>

            <div className="form-box">
              <h4 className="section-title">Add Estimated Cost</h4>

              <input
                placeholder="Purpose"
                value={costPurpose}
                onChange={(e) => setCostPurpose(e.target.value)}
              />

              <input
                type="number"
                placeholder="Amount ₹"
                value={estimateAmount}
                onChange={(e) =>
                  setEstimateAmount(e.target.value)
                }
              />

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <button
                className="primary-btn full"
                onClick={addEstimate}
              >
                + Add Cost
              </button>
            </div>
          </div>

          <div className="form-box estimate-box">
            <h4 className="section-title">
              Estimated Breakdown
            </h4>

            {estimates.length === 0 ? (
              <p className="empty-text">
                No estimates added
              </p>
            ) : (
              estimates.map((e, i) => (
                <div key={i} className="estimate-row">
                  <span>{e.purpose}</span>
                  <span>₹{e.amount}</span>
                  <span>{e.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          className="primary-btn save-project-btn"
          onClick={saveProject}
        >
          💾 Save Project
        </button>
      </div>
    </>
  );
};

export default Budget;
