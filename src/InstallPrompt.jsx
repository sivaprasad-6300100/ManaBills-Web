import React, { useState, useEffect, useRef } from "react";

/**
 * InstallPrompt
 * ─────────────────────────────────────────────────────────
 * A self-controlled "Install App" banner that does NOT wait for
 * Chrome's native beforeinstallprompt heuristics. It appears a few
 * seconds after page load for every visitor, and adapts its message
 * based on the device/browser:
 *
 *   1. Android Chrome / Edge (native install supported)
 *      → Real "Install" button using the captured native prompt.
 *
 *   2. iOS Safari (native install NOT supported by Apple)
 *      → Step-by-step "Add to Home Screen" instructions.
 *
 *   3. Any other browser (WhatsApp in-app browser, UC Browser,
 *      Mi Browser, desktop, etc.)
 *      → Friendly fallback message / instructions.
 */

const STORAGE_KEY = "manabills_install_prompt_dismissed_at";
const SHOW_DELAY_MS = 2500; // appears a few seconds after load
const RE_SHOW_AFTER_DAYS = 7; // don't pester someone who dismissed recently

function getPlatform() {
  const ua = window.navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  const isInAppBrowser =
    /FBAN|FBAV|Instagram|Line\/|WhatsApp|Snapchat/i.test(ua);
  const isSafari =
    /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  const isChrome = /Chrome/.test(ua) && !/Edg|OPR/.test(ua);

  return { isIOS, isAndroid, isStandalone, isInAppBrowser, isSafari, isChrome };
}

function hasRecentlyDismissed() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  const days = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return days < RE_SHOW_AFTER_DAYS;
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState(null); // "native" | "ios" | "fallback"
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    const platform = getPlatform();

    // Already installed, or user dismissed recently — don't show.
    if (platform.isStandalone || hasRecentlyDismissed()) return;

    // Capture the native event quietly, the moment it fires.
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // Decide what we'll show, after a short delay — don't wait for Chrome.
    const timer = setTimeout(() => {
      if (platform.isIOS && platform.isSafari) {
        setMode("ios");
      } else if (platform.isInAppBrowser) {
        setMode("fallback");
      } else if (deferredPromptRef.current) {
        setMode("native");
      } else if (platform.isAndroid) {
        // Android, native event hasn't fired yet — still guide them.
        setMode("native-pending");
      } else {
        setMode("fallback");
      }
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  async function handleInstallClick() {
    const deferred = deferredPromptRef.current;
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferredPromptRef.current = null;
      if (outcome === "accepted" || outcome === "dismissed") {
        dismiss();
      }
      return;
    }
    // Native prompt not ready yet — re-check shortly, otherwise fall back.
    setMode("fallback");
  }

  if (!visible || !mode) return null;

  return (
    <div role="dialog" aria-label="Install ManaBills app" style={styles.overlay}>
      <div style={styles.card}>
        <button
          onClick={dismiss}
          aria-label="Close"
          style={styles.closeBtn}
        >
          ✕
        </button>

        <div style={styles.header}>
          <img
            src="/ManaBillsLogo.jpeg"
            alt="ManaBills"
            style={styles.logo}
          />
          <div>
            <div style={styles.title}>Install ManaBills</div>
            <div style={styles.subtitle}>
              Faster billing, right from your home screen
            </div>
          </div>
        </div>

        {mode === "native" && (
          <>
            <p style={styles.body}>
              Add ManaBills to your home screen for one-tap access — no
              browser, no waiting.
            </p>
            <button style={styles.primaryBtn} onClick={handleInstallClick}>
              Install App
            </button>
          </>
        )}

        {mode === "native-pending" && (
          <>
            <p style={styles.body}>
              Add ManaBills to your home screen for one-tap access.
            </p>
            <button style={styles.primaryBtn} onClick={handleInstallClick}>
              Install App
            </button>
            <p style={styles.hint}>
              If nothing happens, open your browser menu (⋮) and choose{" "}
              <strong>Add to Home screen</strong>.
            </p>
          </>
        )}

        {mode === "ios" && (
          <>
            <p style={styles.body}>To install ManaBills on your iPhone:</p>
            <ol style={styles.steps}>
              <li>
                Tap the <strong>Share</strong> icon{" "}
                <span style={styles.iconInline}>⬆️</span> in Safari's toolbar
              </li>
              <li>
                Scroll down and tap <strong>Add to Home Screen</strong>
              </li>
              <li>
                Tap <strong>Add</strong> in the top right
              </li>
            </ol>
            <button style={styles.secondaryBtn} onClick={dismiss}>
              Got it
            </button>
          </>
        )}

        {mode === "fallback" && (
          <>
            <p style={styles.body}>
              For the smoothest install, open this page in{" "}
              <strong>Chrome</strong>, then tap the menu (⋮) and choose{" "}
              <strong>Add to Home screen</strong>.
            </p>
            <button style={styles.secondaryBtn} onClick={dismiss}>
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const BRAND = "#1e4fba";

const styles = {
  overlay: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    padding: "0 16px 16px",
    animation: "manabills-slide-up 0.35s ease-out",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: 420,
    background: "#ffffff",
    borderRadius: 16,
    boxShadow:
      "0 12px 32px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.08)",
    padding: "20px 20px 18px",
    fontFamily:
      "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    border: "1px solid rgba(30, 79, 186, 0.08)",
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    border: "none",
    background: "transparent",
    fontSize: 16,
    lineHeight: 1,
    color: "#94a3b8",
    cursor: "pointer",
    padding: 6,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingRight: 20,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 10,
    objectFit: "cover",
    flexShrink: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 12.5,
    color: "#64748b",
    marginTop: 2,
  },
  body: {
    fontSize: 13.5,
    color: "#334155",
    lineHeight: 1.5,
    margin: "0 0 14px",
  },
  steps: {
    fontSize: 13.5,
    color: "#334155",
    lineHeight: 1.7,
    margin: "0 0 14px",
    paddingLeft: 20,
  },
  iconInline: {
    fontSize: 13,
  },
  hint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 10,
  },
  primaryBtn: {
    width: "100%",
    background: BRAND,
    color: "#ffffff",
    border: "none",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 14.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    width: "100%",
    background: "#f1f5f9",
    color: "#0f172a",
    border: "none",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 14.5,
    fontWeight: 600,
    cursor: "pointer",
  },
};

// Inject the slide-up keyframes once.
if (typeof document !== "undefined" && !document.getElementById("manabills-install-kf")) {
  const styleTag = document.createElement("style");
  styleTag.id = "manabills-install-kf";
  styleTag.innerHTML = `
    @keyframes manabills-slide-up {
      from { transform: translateY(24px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(styleTag);
}