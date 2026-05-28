import React, { createContext, useCallback, useContext,
                useEffect, useMemo, useState } from "react";
import { authAxios } from "../services/api";
import { AuthContext } from "./AuthContext";
import { SubscriptionContext } from "./SubscriptionContext";

export const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
  const { accessToken } = useContext(AuthContext);
  const { subscriptions } = useContext(SubscriptionContext);
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Max branches by plan ──────────────────────────────────
  const getMaxBranches = () => {
    const sub = subscriptions["business"];
    if (!sub) return 0;                    // free trial → 0 branches
    if (sub.plan === "pro") return 4;      // pro → 4 branches
    if (sub.plan === "basic") return 2;    // basic → 2 branches
    return 0;
  };

  const maxBranches = getMaxBranches();
  const canAddBranch = branches.length < maxBranches;

  // ── Load branches from backend ────────────────────────────
  useEffect(() => {
    if (!accessToken) {
      setBranches([]);
      setActiveBranch(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    authAxios.get("business/branches/")
      .then((res) => {
        setBranches(res.data);
        // Restore last active branch from localStorage
        const saved = localStorage.getItem("activeBranchId");
        const found = res.data.find((b) => String(b.id) === saved);
        setActiveBranch(found || res.data[0] || null);
      })
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  // ── Add branch ────────────────────────────────────────────
  const addBranch = useCallback(async (data) => {
    if (!canAddBranch) {
      throw new Error(
        maxBranches === 0
          ? "Upgrade to Basic (2 branches) or PRO (4 branches) to use this feature"
          : maxBranches === 2
          ? "Upgrade to PRO plan to add up to 4 branches"
          : "Maximum 4 branches reached on PRO plan"
      );
    }
    const res = await authAxios.post("business/branches/", data);
    setBranches((prev) => [...prev, res.data]);
    return res.data;
  }, [canAddBranch, maxBranches]);

  // ── Switch active branch ──────────────────────────────────
  const switchBranch = useCallback((branch) => {
    setActiveBranch(branch);
    localStorage.setItem("activeBranchId", String(branch.id));
  }, []);

  // ── Delete branch ─────────────────────────────────────────
  const deleteBranch = useCallback(async (id) => {
    await authAxios.delete(`business/branches/${id}/`);
    setBranches((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      if (activeBranch?.id === id) {
        const next = updated[0] || null;
        setActiveBranch(next);
        localStorage.setItem("activeBranchId", String(next?.id || ""));
      }
      return updated;
    });
  }, [activeBranch]);

  const value = useMemo(() => ({
    branches,
    activeBranch,
    loading,
    switchBranch,
    addBranch,
    deleteBranch,
    maxBranches,
    canAddBranch,
  }), [branches, activeBranch, loading,
      switchBranch, addBranch, deleteBranch,
      maxBranches, canAddBranch]);

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};
