import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
// import "../../styles/WorkBills.css";

const WorkBills = () => {
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [estimatedBills, setEstimatedBills] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

  const [owner, setOwner] = useState({
    eventType: "",
    totalAmount: "",
    name: "",
    phone: "",
    location: "",
  });

  // ⭐ Load Project Data
  const loadProject = (selectedProject) => {
    if (!selectedProject) return;

    setProject(selectedProject);
    setEstimatedBills(selectedProject.estimates || []);

    setOwner({
      eventType: selectedProject.projectName || "",
      totalAmount: selectedProject.totalAmount || "",
      name: selectedProject.owner?.name || "",
      phone: selectedProject.owner?.phone || "",
      location: selectedProject.owner?.location || "",
    });
  };

  // ⭐ Load All Projects
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    const userKey = `constructionProjects_${user.mobile_number}`;
    const savedProjects =
      JSON.parse(localStorage.getItem(userKey)) || [];

    setProjects(savedProjects);

    if (savedProjects.length > 0) {
      loadProject(savedProjects[savedProjects.length - 1]);
    }
  }, []);

  // ⭐ Handle Input Change
  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    setOwner((s) => ({ ...s, [name]: value }));
  };

  // ⭐ Save Edited Project
  const saveOwnerDetails = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !project) return;

    const userKey = `constructionProjects_${user.mobile_number}`;
    const savedProjects =
      JSON.parse(localStorage.getItem(userKey)) || [];

    const updatedProject = {
      ...project,
      projectName: owner.eventType,
      totalAmount: owner.totalAmount,
      owner: {
        name: owner.name,
        phone: owner.phone,
        location: owner.location,
      },
    };

    const updatedProjects = savedProjects.map((p) =>
      p.id === project.id ? updatedProject : p
    );

    localStorage.setItem(
      userKey,
      JSON.stringify(updatedProjects)
    );

    setProject(updatedProject);
    setIsEdit(false);
  };

  // ⭐ DELETE PROJECT FUNCTION (NEW)
  const deleteProject = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !project) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this entire project?"
    );

    if (!confirmDelete) return;

    const userKey = `constructionProjects_${user.mobile_number}`;
    const savedProjects =
      JSON.parse(localStorage.getItem(userKey)) || [];

    const updatedProjects = savedProjects.filter(
      (p) => p.id !== project.id
    );

    localStorage.setItem(
      userKey,
      JSON.stringify(updatedProjects)
    );

    setProjects(updatedProjects);
    setProject(null);
    setEstimatedBills([]);
  };

  // ⭐ Generate PDF
  const generateAllPDF = () => {
    const doc = new jsPDF();
    let y = 24;

    doc.setFontSize(18);
    doc.text("Project Estimation Report", 20, y);
    y += 12;

    doc.setFontSize(11);
    doc.text(`Project: ${owner.eventType}`, 20, y);
    y += 8;
    doc.text(`Total Budget: ₹${owner.totalAmount}`, 20, y);
    y += 8;
    doc.text(`Owner: ${owner.name}`, 20, y);
    y += 8;
    doc.text(`Phone: ${owner.phone}`, 20, y);
    y += 8;
    doc.text(`Location: ${owner.location}`, 20, y);
    y += 12;

    let total = 0;

    estimatedBills.forEach((b, i) => {
      total += Number(b.amount) || 0;

      doc.text(
        `${i + 1}. ${b.purpose} — ₹${b.amount} (${b.date})`,
        20,
        y
      );

      y += 8;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 10;
    doc.setFontSize(13);
    doc.text(`Total Estimated: ₹${total}`, 20, y);

    window.open(doc.output("bloburl"), "_blank");
  };

  return (
    <main className="wb-page">
      <header className="wb-header">
        <div>
          <h1 className="wb-title">Work & Bills</h1>
          <p className="wb-subtitle">
            Manage estimated work bills and export PDFs.
          </p>
        </div>

        <div className="wb-actions">
          <button
            className="wb-btn wb-btn-outline"
            onClick={generateAllPDF}
            disabled={estimatedBills.length === 0}
          >
            Preview All PDF
          </button>
        </div>
      </header>

      {/* ⭐ PROJECT SELECTOR */}
      <section className="wb-card-all">
        <h2 className="wb-card-title">Select Project</h2>

        {projects.length === 0 ? (
          <p>No Projects Found</p>
        ) : (
          <select
            className="wb-input"
            value={project?.id || ""}
            onChange={(e) => {
              const selected = projects.find(
                (p) => p.id === Number(e.target.value)
              );
              loadProject(selected);
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="wb-grid">
        {/* OWNER DETAILS */}
        <section className="wb-card wb-owner">
          <h2 className="wb-card-title">
            Owner / Project Details
          </h2>

          <label className="wb-field">
            <span className="wb-label">Project / Event</span>
            <input
              name="eventType"
              className="wb-input"
              value={owner.eventType}
              onChange={handleOwnerChange}
              disabled={!isEdit}
            />
          </label>

          <label className="wb-field">
            <span className="wb-label">Total Budget</span>
            <input
              name="totalAmount"
              className="wb-input"
              value={owner.totalAmount}
              onChange={handleOwnerChange}
              disabled={!isEdit}
            />
          </label>

          <label className="wb-field">
            <span className="wb-label">Owner Name</span>
            <input
              name="name"
              className="wb-input"
              value={owner.name}
              onChange={handleOwnerChange}
              disabled={!isEdit}
            />
          </label>

          <div className="wb-row">
            <label className="wb-field wb-half">
              <span className="wb-label">Phone</span>
              <input
                name="phone"
                className="wb-input"
                value={owner.phone}
                onChange={handleOwnerChange}
                disabled={!isEdit}
              />
            </label>

            <label className="wb-field wb-half">
              <span className="wb-label">Location</span>
              <input
                name="location"
                className="wb-input"
                value={owner.location}
                onChange={handleOwnerChange}
                disabled={!isEdit}
              />
            </label>
          </div>

          {/* ⭐ EDIT + DELETE BUTTONS */}
          <div className="wb-actions">
            {!isEdit ? (
              <>
                <button
                  className="wb-btn wb-btn-outline"
                  onClick={() => setIsEdit(true)}
                >
                  ✏️ Edit Details
                </button>

                <button
                  className="wb-btn wb-btn-danger"
                  onClick={deleteProject}
                >
                  🗑 Delete Project
                </button>
              </>
            ) : (
              <button
                className="wb-btn wb-btn-secondary"
                onClick={saveOwnerDetails}
              >
                💾 Save Details
              </button>
            )}
          </div>
        </section>

        {/* ESTIMATED BILLS */}
        <section className="wb-card wb-bills">
          <h2 className="wb-card-title">Estimated Bills</h2>

          {estimatedBills.length === 0 ? (
            <div className="wb-empty">
              No estimated bills found.
            </div>
          ) : (
            <ul className="wb-list">
              {estimatedBills.map((bill, idx) => (
                <li key={idx} className="wb-item">
                  <div className="wb-item-main">
                    <div className="wb-item-title">
                      {bill.purpose}
                    </div>
                    <div className="wb-item-meta">
                      {bill.date}
                    </div>
                  </div>

                  <div className="wb-item-right">
                    <div className="wb-amount">
                      ₹{bill.amount}
                    </div>

                    <button
                      className="wb-btn wb-btn-ghost"
                      onClick={() =>
                        navigate(
                          "/dashboard/construction/Separate_Bills",
                          {
                            state: { bill, owner },
                          }
                        )
                      }
                    >
                      Generate
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      {/* FOOTER */}
      <footer className="wb-footer">
        {estimatedBills.length > 0 && (
          <button
            className="wb-btn wb-btn-secondary"
            onClick={() =>
              navigate(
                "/dashboard/construction/Separate_Bills",
                {
                  state: { bills: estimatedBills, owner },
                }
              )
            }
          >
            Generate Default Estimated PDF
          </button>
        )}
      </footer>
    </main>
  );
};

export default WorkBills;
