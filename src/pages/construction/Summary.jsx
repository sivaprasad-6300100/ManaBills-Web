import React, { useEffect, useState } from "react";
// import "../../styles/Summary.css";

const STORAGE_KEY = "separateWorkBill";

const Summary = () => {
  const [budget, setBudget] = useState(0);
  const [estimated, setEstimated] = useState(0);
  const [actual, setActual] = useState(0);
  const [paid, setPaid] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    const userKey = `constructionProjects_${user.mobile_number}`;
    const projects =
      JSON.parse(localStorage.getItem(userKey)) || [];

    if (projects.length > 0) {
      const last = projects[projects.length - 1];

      setBudget(Number(last.totalAmount || 0));

      const est = last.estimates?.reduce(
        (s, e) => s + Number(e.amount || 0),
        0
      );
      setEstimated(est);
    }

    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data) {
      const totalAmount = data.sections?.reduce(
        (s, sec) => s + Number(sec.amount || 0),
        0
      );

      const totalPaid = data.payments?.reduce(
        (s, p) => s + Number(p.amount || 0),
        0
      );

      setActual(totalAmount);
      setPaid(totalPaid);
    }
  }, []);

  const balancePayable = Math.max(actual - paid, 0);
  const remainingBudget = Math.max(budget - actual, 0);

  return (
    <div className="sum-page">
      <h2 className="sum-title">📊 Project Summary</h2>

      <div className="sum-grid">
        <SummaryCard title="Total Budget" value={budget} />
        <SummaryCard title="Estimated Bills" value={estimated} type="warn" />
        <SummaryCard title="Actual Bills" value={actual} />
        <SummaryCard title="Total Paid" value={paid} type="success" />
        <SummaryCard title="Balance Payable" value={balancePayable} type="danger" />
        <SummaryCard title="Remaining Budget" value={remainingBudget} type="success" />
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, type }) => (
  <div className={`sum-card ${type || ""}`}>
    <p>{title}</p>
    <h3>₹{value}</h3>
  </div>
);

export default Summary;
