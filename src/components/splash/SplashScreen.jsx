import React, { useEffect, useState } from "react";

const TOTAL_DURATION = 4000;

const SplashScreen = ({ onFinish }) => {
  const [mounted, setMounted] = useState(false);

  const goNext = () => {
    // localStorage.setItem("manabills_splash_seen", "1");
    if (onFinish) onFinish();
  };

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    const timer = setTimeout(goNext, TOTAL_DURATION);
    return () => {
      cancelAnimationFrame(t);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={styles.wrapper}>
      {/* Ambient rings */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 380 580"
        style={{ ...styles.rings, opacity: mounted ? 1 : 0 }}
      >
        <circle cx="190" cy="250" r="92" fill="none" stroke="rgba(201,150,58,0.22)" strokeWidth="0.75" />
        <circle cx="190" cy="250" r="132" fill="none" stroke="rgba(201,150,58,0.12)" strokeWidth="0.75" />
        <circle cx="190" cy="250" r="172" fill="none" stroke="rgba(201,150,58,0.06)" strokeWidth="0.75" />
      </svg>

      <div style={styles.center}>
        {/* Logomark */}
        <svg
          width="76"
          height="76"
          viewBox="0 0 76 76"
          style={{
            ...styles.logoMark,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "scale(1) rotateY(0deg)" : "scale(0.5) rotateY(40deg)",
          }}
        >
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="76" y2="76" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#f4c542" />
              <stop offset="0.5" stopColor="#c9963a" />
              <stop offset="1" stopColor="#a3781f" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="72" height="72" rx="18" fill="url(#goldGrad)" />
          <rect x="2" y="2" width="72" height="72" rx="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.75" />
          <path
            d="M22 50 V28 a4 4 0 0 1 4 -4 H32 L38 30 L44 24 H50 a4 4 0 0 1 4 4 V50"
            fill="none"
            stroke="#0e1b2e"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="22" y1="50" x2="54" y2="50" stroke="#0e1b2e" strokeWidth="3.4" strokeLinecap="round" />
          <circle cx="38" cy="40" r="2.6" fill="#0e1b2e" />
        </svg>

        {/* Wordmark */}
        <div style={styles.wordmarkRow}>
          <span
            style={{
              ...styles.word,
              color: "#fff",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(36px)",
              transitionDelay: "0.45s",
            }}
          >
            Mana
          </span>
          <span
            style={{
              ...styles.word,
              color: "#e8b94a",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(36px)",
              transitionDelay: "0.57s",
            }}
          >
            Bills
          </span>
        </div>

        {/* Underline */}
        <div
          style={{
            ...styles.underline,
            width: mounted ? "100px" : "0%",
            transitionDelay: "0.75s",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            ...styles.tagline,
            opacity: mounted ? 1 : 0,
            transitionDelay: "1s",
          }}
        >
          GST BILLING, SIMPLIFIED
        </div>

        {/* Loader */}
        <div
          style={{
            ...styles.loaderTrack,
            opacity: mounted ? 1 : 0,
            transitionDelay: "1.25s",
          }}
        >
          <div
            style={{
              ...styles.loaderFill,
              width: mounted ? "100%" : "0%",
              transitionDelay: "1.25s",
            }}
          />
        </div>
      </div>

      <button onClick={goNext} style={styles.skip}>
        Skip
      </button>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    width: "100%",
    background: "radial-gradient(circle at 50% 35%, #16263f 0%, #0a1422 75%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  rings: {
    position: "absolute",
    inset: 0,
    transition: "opacity 1.4s ease-out",
  },
  center: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoMark: {
    marginBottom: 26,
    filter: "drop-shadow(0 8px 20px rgba(201,150,58,0.35))",
    transition: "all 0.7s cubic-bezier(.22,.68,0,1.15)",
  },
  wordmarkRow: {
    display: "flex",
    fontSize: 32,
    fontWeight: 500,
    letterSpacing: "0.01em",
  },
  word: {
    display: "inline-block",
    transition: "all 0.5s ease-out",
  },
  underline: {
    marginTop: 8,
    height: 1.5,
    background: "linear-gradient(90deg,transparent,#c9963a,transparent)",
    transition: "width 0.5s ease-out",
  },
  tagline: {
    marginTop: 14,
    fontSize: 11.5,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: "0.18em",
    transition: "opacity 0.6s ease-out",
  },
  loaderTrack: {
    marginTop: 38,
    width: 104,
    height: 2,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
    transition: "opacity 0.4s ease-out",
  },
  loaderFill: {
    height: "100%",
    background: "linear-gradient(90deg,#c9963a,#f4c542)",
    transition: "width 1.2s ease-in-out",
  },
  skip: {
    position: "absolute",
    bottom: 20,
    right: 20,
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    cursor: "pointer",
    padding: 6,
  },
};

export default SplashScreen;