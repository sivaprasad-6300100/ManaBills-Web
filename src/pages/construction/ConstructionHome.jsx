import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import "../../styles/ConstructionHome.css";

const STORAGE_KEY = "separateWorkBill";

const ConstructionHome = () => {
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({
    budget: 0,
    estimated: 0,
    actual: 0,
    paid: 0,
    balance: 0,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    const userKey = `constructionProjects_${user.mobile_number}`;
    const projects =
      JSON.parse(localStorage.getItem(userKey)) || [];

    if (projects.length > 0) {
      const last = projects[projects.length - 1];
      setProject(last);

      const est = last.estimates?.reduce(
        (s, e) => s + Number(e.amount || 0),
        0
      );

      setStats((s) => ({ ...s, budget: last.totalAmount, estimated: est }));
    }

    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data) {
      const actual = data.sections?.reduce(
        (s, sec) => s + Number(sec.amount || 0),
        0
      );

      const paid = data.payments?.reduce(
        (s, p) => s + Number(p.amount || 0),
        0
      );

      setStats((s) => ({
        ...s,
        actual,
        paid,
        balance: Math.max(actual - paid, 0),
      }));
    }
  }, []);

  return (
    <div className="ov-page">
      <h2 className="ov-title">🏗 Construction Overview</h2>

      {/* Summary Cards */}
      <div className="ov-grid">
        <Card title="Total Budget" value={stats.budget} />
        <Card title="Estimated" value={stats.estimated} type="warn" />
        <Card title="Actual Bills" value={stats.actual} />
        <Card title="Total Paid" value={stats.paid} type="success" />
        <Card title="Balance" value={stats.balance} type="danger" />
      </div>

      {/* Project Info */}
      {project && (
        <div className="ov-card">
          <h3>📌 Current Project</h3>
          <p><strong>Name:</strong> {project.projectName}</p>
          <p><strong>Owner:</strong> {project.owner?.name}</p>
          <p><strong>Phone:</strong> {project.owner?.phone}</p>
          <p><strong>Location:</strong> {project.owner?.location}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="ov-actions">
        <button onClick={() => navigate("Budget")}>➕ Add Budget</button>
        <button onClick={() => navigate("WorkBills")}>🧾 Work Bills</button>
        <button onClick={() => navigate("payments")}>💰 Payments</button>
        <button onClick={() => navigate("summary")}>📊 Summary</button>
      </div>
    </div>
  );
};

const Card = ({ title, value, type }) => (
  <div className={`ov-card-mini ${type || ""}`}>
    <p>{title}</p>
    <h3>₹{value}</h3>
  </div>
);

export default ConstructionHome;
