import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { publicAxios } from "../../services/api";
import useAuth from "../../hooks/useAuth";

const styles = {
  wrap: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#0a1422 0%,#16263f 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 20px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  logo: {
    fontSize: 28,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 6,
  },
  logoGold: { color: "#e8b94a" },
  tagline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: "0.12em",
    marginBottom: 36,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "#fff",
    borderRadius: 20,
    padding: "28px 24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },
  tabRow: { display: "flex", marginBottom: 24, background: "#f1f5f9", borderRadius: 12, padding: 4 },
  tab: (active) => ({
    flex: 1,
    textAlign: "center",
    padding: "10px 0",
    borderRadius: 9,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    background: active ? "#1e4fba" : "transparent",
    color: active ? "#fff" : "#64748b",
    transition: "all 0.2s",
  }),
  field: { marginBottom: 16 },
  label: { fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 6, display: "block" },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 12,
    fontSize: 14.5,
    outline: "none",
    boxSizing: "border-box",
    background: "#faf8f4",
  },
  btn: {
    width: "100%",
    padding: "13px 0",
    background: "#1e4fba",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 6,
  },
  msg: (type) => ({
    marginTop: 12,
    fontSize: 13,
    fontWeight: 600,
    textAlign: "center",
    color: type === "error" ? "#dc2626" : "#16a34a",
  }),
  otpRow: { display: "flex", gap: 8 },
  otpBtn: {
    padding: "0 16px",
    background: "#1e4fba",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  link: { color: "#1e4fba", fontWeight: 600, cursor: "pointer", textDecoration: "underline" },
};

const AppLogin = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Login
  const [loginData, setLoginData] = useState({ identifier: "", password: "" });

  // Signup / OTP
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetSignup = () => {
    setStep(1);
    setMobile("");
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
    setFullName("");
    setPassword("");
    setConfirmPassword("");
  };

  const switchMode = (m) => {
    setMode(m);
    setMessage({ text: "", type: "" });
    resetSignup();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    const isMobile = /^\d+$/.test(loginData.identifier.trim());
    const payload = isMobile
      ? { mobile_number: loginData.identifier.trim(), password: loginData.password }
      : { username: loginData.identifier.trim(), password: loginData.password };
    try {
      const res = await publicAxios.post("auth/login/", payload);
      authLogin(
        { mobile_number: res.data.mobile_number || loginData.identifier, full_name: res.data.full_name || "" },
        { access: res.data.access, refresh: res.data.refresh }
      );
      navigate("/dashboard", { replace: true });
    } catch {
      setMessage({ text: "Invalid mobile/username or password.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(mobile)) {
      setMessage({ text: "Enter valid 10-digit mobile number.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await publicAxios.post("auth/send-signup-otp/", { mobile_number: mobile });
      setOtpSent(true);
      setMessage({ text: "OTP sent ✅", type: "success" });
    } catch (err) {
      setMessage({ text: err?.response?.data?.error || "Failed to send OTP.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setMessage({ text: "Enter valid 6-digit OTP.", type: "error" });
      return;
    }
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await publicAxios.post("auth/verify-signup-otp/", { mobile_number: mobile, otp });
      setOtpVerified(true);
      setStep(2);
      setMessage({ text: "", type: "" });
    } catch (err) {
      setMessage({ text: err?.response?.data?.error || "Wrong OTP.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return setMessage({ text: "Enter your full name.", type: "error" });
    if (password.length < 6) return setMessage({ text: "Password must be at least 6 characters.", type: "error" });
    if (password !== confirmPassword) return setMessage({ text: "Passwords do not match.", type: "error" });

    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await publicAxios.post("auth/signup/", { full_name: fullName, mobile_number: mobile, password });
      setMessage({ text: "Account created! Please sign in.", type: "success" });
      setTimeout(() => switchMode("login"), 1200);
    } catch {
      setMessage({ text: "Mobile number already registered.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.logo}>Mana<span style={styles.logoGold}>Bills</span></div>
      <div style={styles.tagline}>GST BILLING, SIMPLIFIED</div>

      <div style={styles.card}>
        <div style={styles.tabRow}>
          <div style={styles.tab(mode === "login")} onClick={() => switchMode("login")}>Sign In</div>
          <div style={styles.tab(mode === "signup")} onClick={() => switchMode("signup")}>Sign Up</div>
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin}>
            <div style={styles.field}>
              <label style={styles.label}>Mobile Number or Username</label>
              <input
                style={styles.input}
                value={loginData.identifier}
                onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>
            <button style={styles.btn} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        )}

        {mode === "signup" && step === 1 && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>Mobile Number</label>
              <div style={styles.otpRow}>
                <input
                  style={styles.input}
                  value={mobile}
                  disabled={otpVerified}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                />
                {!otpVerified && (
                  <button type="button" style={styles.otpBtn} onClick={sendOtp} disabled={loading || mobile.length !== 10}>
                    {otpSent ? "Resend" : "Get OTP"}
                  </button>
                )}
              </div>
            </div>
            {otpSent && !otpVerified && (
              <div style={styles.field}>
                <label style={styles.label}>Enter OTP</label>
                <div style={styles.otpRow}>
                  <input
                    style={{ ...styles.input, letterSpacing: "4px", textAlign: "center" }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                  />
                  <button type="button" style={styles.otpBtn} onClick={verifyOtp} disabled={loading || otp.length !== 6}>
                    Verify
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {mode === "signup" && step === 2 && (
          <form onSubmit={handleSignup}>
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input style={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Create Password</label>
              <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Confirm Password</label>
              <input style={styles.input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button style={styles.btn} disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}

        {message.text && <div style={styles.msg(message.type)}>{message.text}</div>}

        {mode === "login" && (
          <p style={{ textAlign: "center", fontSize: 12.5, marginTop: 16, color: "#64748b" }}>
            New here? <span style={styles.link} onClick={() => switchMode("signup")}>Create an account</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default AppLogin;