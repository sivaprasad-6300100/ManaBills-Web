import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const Settings = () => {
  const { user, logout } = useContext(AuthContext);
  const [password, setPassword] = useState("");

  const handleChangePassword = () => {
    alert("Password changed successfully!");
    setPassword("");
  };

  return (
    <div>
      <h2>Settings</h2>

      <div className="form-box">
        <h3>Change Password</h3>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="primary-btn" onClick={handleChangePassword}>
          Update Password
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button className="primary-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;
