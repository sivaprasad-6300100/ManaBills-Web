const SummaryCard = ({ title, value, subtitle, icon }) => {
  return (
    <div className="summary-card">
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h4>{title}</h4>
      </div>

      <div className="card-value">{value}</div>
      <p className="card-subtitle">{subtitle}</p>
    </div>
  );
};

export default SummaryCard;
