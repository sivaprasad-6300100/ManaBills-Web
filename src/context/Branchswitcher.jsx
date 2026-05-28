import React, { useContext, useState } from "react";
import { BranchContext } from "../context/BranchContext";

const BranchSwitcher = () => {
  const {
    branches,
    activeBranch,
    switchBranch,
    addBranch,
    deleteBranch,
    canAddBranch,
    maxBranches,
  } = useContext(BranchContext);

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const branch = await addBranch({
        branch_name: newName.trim(),
        address: newAddress.trim(),
      });
      switchBranch(branch);
      setShowForm(false);
      setNewName("");
      setNewAddress("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBranch(id);
      setConfirmDeleteId(null);
    } catch {
      setError("Failed to delete branch.");
    }
  };

  return (
    <div style={{
      padding: "12px 16px",
      background: "#f8fafc",
      borderBottom: "1px solid #e2e8f0",
      fontFamily: "'Sora', sans-serif",
    }}>

      {/* ── Branch selector row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>

        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.08em" }}>
          📍 BRANCH:
        </span>

        {branches.map((b) => (
          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              onClick={() => switchBranch(b)}
              style={{
                padding: "5px 14px",
                borderRadius: "100px",
                border: "1.5px solid",
                borderColor: activeBranch?.id === b.id ? "#1a73e8" : "#e2e8f0",
                background: activeBranch?.id === b.id ? "#1a73e8" : "#fff",
                color: activeBranch?.id === b.id ? "#fff" : "#64748b",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {b.branch_name}
            </button>

            {/* Delete button — only show for non-active branches */}
            {activeBranch?.id !== b.id && (
              confirmDeleteId === b.id ? (
                <span style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <button
                    onClick={() => handleDelete(b.id)}
                    style={{
                      padding: "3px 10px", borderRadius: "100px",
                      border: "1.5px solid #dc2626", background: "#dc2626",
                      color: "#fff", fontSize: "0.72rem", fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    style={{
                      padding: "3px 10px", borderRadius: "100px",
                      border: "1.5px solid #e2e8f0", background: "#fff",
                      color: "#64748b", fontSize: "0.72rem", fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(b.id)}
                  title="Delete branch"
                  style={{
                    padding: "3px 8px", borderRadius: "100px",
                    border: "1.5px solid #e2e8f0", background: "#fff",
                    color: "#94a3b8", fontSize: "0.72rem",
                    cursor: "pointer", fontFamily: "inherit",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )
            )}
          </div>
        ))}

        {/* Add branch button or lock message */}
        {maxBranches === 0 ? (
          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
            🔒 Upgrade to Basic or PRO to add branches
          </span>
        ) : canAddBranch ? (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: "5px 14px", borderRadius: "100px",
              border: "1.5px dashed #1a73e8", background: "#fff",
              color: "#1a73e8", fontSize: "0.8rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            ➕ Add Branch
          </button>
        ) : (
          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
            🔒 Max {maxBranches} branches — Upgrade to PRO for more
          </span>
        )}
      </div>

      {/* ── Add branch form ── */}
      {showForm && (
        <div style={{
          marginTop: "10px",
          padding: "14px",
          background: "#fff",
          borderRadius: "12px",
          border: "1.5px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px",
        }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1a73e8", textTransform: "uppercase" }}>
            ➕ New Branch
          </span>
          <input
            placeholder="Branch name (e.g. Gandhi Nagar)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{
              padding: "9px 12px", borderRadius: "8px",
              border: "1.5px solid #e2e8f0", fontSize: "0.88rem",
              fontFamily: "inherit", outline: "none",
            }}
          />
          <input
            placeholder="Address (optional)"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            style={{
              padding: "9px 12px", borderRadius: "8px",
              border: "1.5px solid #e2e8f0", fontSize: "0.88rem",
              fontFamily: "inherit", outline: "none",
            }}
          />
          {error && (
            <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>⚠️ {error}</span>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              style={{
                padding: "8px 18px", borderRadius: "8px",
                background: newName.trim() ? "#1a73e8" : "#e2e8f0",
                color: newName.trim() ? "#fff" : "#94a3b8",
                border: "none", fontWeight: 700,
                fontSize: "0.85rem", cursor: newName.trim() ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              ✓ Save Branch
            </button>
            <button
              onClick={() => { setShowForm(false); setError(""); setNewName(""); setNewAddress(""); }}
              style={{
                padding: "8px 16px", borderRadius: "8px",
                background: "#f1f5f9", color: "#64748b",
                border: "none", fontWeight: 600,
                fontSize: "0.85rem", cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default BranchSwitcher;
