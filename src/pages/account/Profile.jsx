import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const [name, setName] = useState(user?.full_name || "");
  const [mobile, setMobile] = useState(user?.mobile_number || "");

  const handleUpdate = () => {
    const updatedUser = { ...user, full_name: name, mobile_number: mobile };
    login(updatedUser); // update context & localStorage
    alert("Profile updated successfully!");
  };

  return (
    <div>
      <h2>Profile Information</h2>
      <div className="form-box">
        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
        <button className="primary-btn" onClick={handleUpdate}>
          Update Profile
        </button>
      </div>
    </div>
  );
};

export default Profile;
