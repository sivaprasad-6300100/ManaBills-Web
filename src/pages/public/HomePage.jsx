import React, { useState, useEffect } from "react";
import { publicAxios } from "../../services/api";
import { useNavigate } from "react-router-dom";
import "../../App.css";

const HomePage = () => {
  const navigate = useNavigate();

  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [imageUrl] = useState("/hero-ai.png");

  const [loginData, setLoginData] = useState({
    mobile_number: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    full_name: "",
    mobile_number: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  /* ✅ Auto-login redirect */
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  /* ================= LOGIN ================= */
  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await publicAxios.post("auth/login/", loginData);

      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);

      setIsLoggedIn(true);
      setShowLogin(false);
      setMessage("Login successful ✅");

      navigate("/dashboard");
    } catch {
      setMessage("Invalid login ❌");
    }
  };

  /* ================= SIGNUP ================= */
  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await publicAxios.post("auth/signup/", signupData);

      setMessage("Signup successful 🎉 Please login");
      setShowSignup(false);
      setShowLogin(true);
    } catch (err) {
      console.error(err.response?.data);
      setMessage("User already exists ❌ Please login");
    }
  };

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="homepage">
      {/* Navbar */}
      <nav className="public-navbar">
        <div className="brand">ManaBills</div>
        <div className="buttons">
          {isLoggedIn ? (
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <button
                className="login-btn"
                onClick={() => {
                  setShowLogin(true);
                  setShowSignup(false);
                }}
              >
                Login
              </button>
              <button
                className="signup-btn"
                onClick={() => {
                  setShowSignup(true);
                  setShowLogin(false);
                }}
              >
                Signup
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <h1>AI Billing & Home Expense</h1>
          <p>
            Simplify billing, track expenses, and manage finances with AI-powered
            insights.
          </p>
          <div className="hero-buttons">
            <button
              className="login-btn"
              onClick={() => {
                setShowLogin(true);
                setShowSignup(false);
              }}
            >
              Login
            </button>
            <button
              className="signup-btn"
              onClick={() => {
                setShowSignup(true);
                setShowLogin(false);
              }}
            >
              Signup
            </button>
          </div>
        </div>

        <div className="hero-image">
          <div className="glow"></div>
          <img src="/icon-bill.png" alt="Billing" className="floating bill" />
          <img
            src="/icon-expense.png"
            alt="Expenses"
            className="floating expense"
          />
          <img src="/icon-ai.png" alt="AI" className="floating ai" />
          <img src={imageUrl} alt="AI Illustration" className="main" />
        </div>
      </section>

      {/* Login / Signup */}
      <div className="form-container">
        {showLogin && (
          <form onSubmit={handleLoginSubmit}>
            <h2>Login</h2>
            <input
              type="text"
              name="mobile_number"
              placeholder="Mobile Number"
              value={loginData.mobile_number}
              onChange={handleLoginChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleLoginChange}
              required
            />
            <button className="login-btnform" type="submit">
              Login
            </button>
          </form>
        )}

        {showSignup && (
          <form onSubmit={handleSignupSubmit}>
            <h2>Signup</h2>
            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={signupData.full_name}
              onChange={handleSignupChange}
              required
            />
            <input
              type="text"
              name="mobile_number"
              placeholder="Mobile Number"
              value={signupData.mobile_number}
              onChange={handleSignupChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={signupData.password}
              onChange={handleSignupChange}
              required
            />
            <button className="signup-btnform" type="submit">
              Signup
            </button>
          </form>
        )}

        {message && <p>{message}</p>}
      </div>

      {/* Footer */}
      <footer className="footer">
        &copy; 2026 ManaBills. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
