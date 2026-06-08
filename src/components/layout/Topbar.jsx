import React, { useState, useRef, useEffect, useCallback, useContext } from "react";
import ReactDOM from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { getShopProfile } from "../../services/businessService";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { authAxios } from "../../services/api";







// ─────────────────────────────────────────────
// NOTIFICATION SYSTEM
// ─────────────────────────────────────────────

const NOTIF_TYPES = {
  WELCOME_LOGIN:       "welcome_login",
  SUBSCRIPTION_NEW:    "subscription_new",
  SUBSCRIPTION_RENEW:  "subscription_renewal",
  SUBSCRIPTION_EXPIRY: "subscription_expiry",
  BILLING_DUE:         "billing_due",
  BILLING_PAID:        "billing_paid",
  PROFILE_UPDATED:     "profile_updated",
  SECURITY_ALERT:      "security_alert",
  SYSTEM:              "system",
};

const NOTIF_META = {
  [NOTIF_TYPES.WELCOME_LOGIN]:       { icon: "👋", color: "#10b981", bg: "#ecfdf5" },
  [NOTIF_TYPES.SUBSCRIPTION_NEW]:    { icon: "🎉", color: "#6366f1", bg: "#eef2ff" },
  [NOTIF_TYPES.SUBSCRIPTION_RENEW]:  { icon: "🔄", color: "#3b82f6", bg: "#eff6ff" },
  [NOTIF_TYPES.SUBSCRIPTION_EXPIRY]: { icon: "⚠️", color: "#f59e0b", bg: "#fffbeb" },
  [NOTIF_TYPES.BILLING_DUE]:         { icon: "📋", color: "#ef4444", bg: "#fef2f2" },
  [NOTIF_TYPES.BILLING_PAID]:        { icon: "✅", color: "#10b981", bg: "#ecfdf5" },
  [NOTIF_TYPES.PROFILE_UPDATED]:     { icon: "✏️", color: "#8b5cf6", bg: "#f5f3ff" },
  [NOTIF_TYPES.SECURITY_ALERT]:      { icon: "🔐", color: "#ef4444", bg: "#fef2f2" },
  [NOTIF_TYPES.SYSTEM]:              { icon: "ℹ️", color: "#6b7280", bg: "#f9fafb" },
};

const STORAGE_KEY = "manabills_notifications";

const loadNotifications = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
};

const saveNotifications = (notifs) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, 50))); }
  catch {}
};

const createNotification = (type, title, message, data = {}) => ({
  id:        `${Date.now()}_${Math.random().toString(36).slice(2)}`,
  type, title, message, data,
  timestamp: new Date().toISOString(),
  read:      false,
});

const timeAgo = (isoString) => {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
};

// ─────────────────────────────────────────────────────────────────────────────
// usePlanExpiry  —  reads REAL backend subscription data from SubscriptionContext
//
// The context stores subscriptions as an object keyed by module:
//   { business: { module, plan_key, duration, status,
//                 expires_at, days_left, hours_left, is_active, ... } }
//
// We find whichever active subscription expires soonest and return a
// countdown descriptor for the Topbar chip.
// ─────────────────────────────────────────────────────────────────────────────

const usePlanExpiry = (subscriptions) => {
  // Re-render every minute so the countdown stays live
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!subscriptions || !Object.keys(subscriptions).length) return null;

  let soonest    = null;
  let soonestMs  = Infinity;

  Object.entries(subscriptions).forEach(([moduleKey, sub]) => {
    if (!sub || typeof sub !== "object") return;

    // Skip cancelled / expired subs
    if (sub.status && sub.status !== "active") return;

    // ── Resolve expires_at from real backend fields ──────────────────────
    // Backend serializer returns snake_case: expires_at
    // FREE_TRIAL objects from BusinessSubscription use camelCase: expiresAt
    let expiresMs = null;

    if (sub.expires_at)  expiresMs = new Date(sub.expires_at).getTime();
    else if (sub.expiresAt) expiresMs = new Date(sub.expiresAt).getTime();

    // Fallback: if context was set with just a duration string (no API yet)
    if (!expiresMs && sub.duration) {
      const now = Date.now();
      const durationMap = {
        "1 Year":   365 * 86_400_000,
        "6 Months": 182 * 86_400_000,
        "1 Month":   30 * 86_400_000,
        "FREE_TRIAL": 5 * 86_400_000,
      };
      if (durationMap[sub.duration]) expiresMs = now + durationMap[sub.duration];
    }

    // FREE_TRIAL shape: { status:"FREE_TRIAL", expiresAt: timestamp }
    if (sub.status === "FREE_TRIAL" && sub.expiresAt) {
      expiresMs = new Date(sub.expiresAt).getTime();
    }

    if (!expiresMs) return;

    const msLeft = expiresMs - Date.now();
    if (msLeft <= 0) return; // already expired

    if (msLeft < soonestMs) {
      soonestMs = msLeft;
      soonest   = { moduleKey, expiresMs, msLeft };
    }
  });

  if (!soonest) return null;

  const { msLeft, moduleKey } = soonest;

  // Only show chip within 7 days of expiry
  const days       = Math.floor(msLeft / 86_400_000);
  if (days > 7) return null;

  const totalHours = Math.floor(msLeft / 3_600_000);
  const totalMins  = Math.floor(msLeft / 60_000);
  const hours      = totalHours % 24;
  const mins       = totalMins  % 60;

  let label;
  if (days > 1)           label = `${days}d ${hours}h left`;
  else if (days === 1)    label = `${days}d ${hours}h left`;
  else if (totalHours >= 1) label = `${totalHours}h ${mins}m left`;
  else                    label = `${totalMins}m left`;

  const planLabels = {
    "business":     "Business",
    "home-expense": "Home",
    "construction": "Build",
    "custom":       "Custom",
  };

  return {
    label,
    planName: planLabels[moduleKey] || moduleKey,
    urgent:   days <= 1,        // < 24 hrs  → amber
    critical: totalHours <= 3,  // < 3 hrs   → red pulse
  };
};

// ─────────────────────────────────────────────
// getActivePlans  —  plain helper (NOT a hook)
// Returns active plan list sorted by expiry (soonest first).
// ─────────────────────────────────────────────

const getActivePlans = (subscriptions) => {
  if (!subscriptions) return [];
  return Object.entries(subscriptions)
    .filter(([, sub]) => sub && typeof sub === "object" && sub.status === "active")
    .map(([moduleKey, sub]) => ({
      moduleKey,
      planKey:   sub.plan_key   || "",
      duration:  sub.duration   || "",
      expiresAt: sub.expires_at || sub.expiresAt || null,
      daysLeft:  sub.days_left  ?? null,
    }))
    .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
};

// ─────────────────────────────────────────────
// EXPIRY CHIP
// ─────────────────────────────────────────────

const ExpiryChip = ({ expiry, onClick }) => {
  if (!expiry) return null;

  const bg     = expiry.critical ? "#fef2f2" : expiry.urgent ? "#fffbeb" : "rgba(14,27,46,0.06)";
  const border = expiry.critical ? "rgba(239,68,68,0.35)" : expiry.urgent ? "rgba(245,158,11,0.4)" : "rgba(14,27,46,0.12)";
  const color  = expiry.critical ? "#dc2626" : expiry.urgent ? "#d97706" : "#374151";
  const dot    = expiry.critical ? "#ef4444" : expiry.urgent ? "#f59e0b" : "#10b981";

  return (
    <>
      <style>{`
        @keyframes expiry-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.6; transform:scale(1.25); }
        }
        @keyframes expiry-shake {
          0%,100% { transform:translateX(0); }
          20%     { transform:translateX(-2px); }
          40%     { transform:translateX(2px); }
          60%     { transform:translateX(-1px); }
          80%     { transform:translateX(1px); }
        }
        .expiry-chip {
          display:inline-flex; align-items:center; gap:5px;
          padding:0 10px; height:28px; border-radius:8px;
          border:1px solid ${border}; background:${bg};
          cursor:pointer; transition:all 0.18s ease;
          white-space:nowrap; flex-shrink:0;
          animation:${expiry.critical ? "expiry-shake 2.5s ease-in-out infinite" : "none"};
        }
        .expiry-chip:hover { transform:translateY(-1px); box-shadow:0 3px 10px rgba(14,27,46,0.12); }
        .expiry-dot {
          width:6px; height:6px; border-radius:50%; background:${dot}; flex-shrink:0;
          animation:${expiry.urgent ? "expiry-pulse 1.6s ease-in-out infinite" : "none"};
        }
        .expiry-label { font-size:11px; font-weight:700; color:${color}; letter-spacing:0.01em; }
        .expiry-plan  { font-size:9.5px; font-weight:600; color:${color}; opacity:0.65; text-transform:uppercase; letter-spacing:0.05em; }
        @media (max-width:360px) { .expiry-plan { display:none; } }
      `}</style>
      <div className="expiry-chip" onClick={onClick} title={`${expiry.planName} plan — ${expiry.label}`}>
        <div className="expiry-dot" />
        <span className="expiry-plan">{expiry.planName}</span>
        <span className="expiry-label">{expiry.label}</span>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
// ROUTE LABELS / MENU
// ─────────────────────────────────────────────

const ROUTE_LABELS = {
  "/dashboard":              "Home",
  "/dashboard/business":     "Business Billing",
  "/dashboard/home-expense": "Home Expenses",
  "/dashboard/construction": "Construction",
  "/dashboard/custom":       "Custom",
  "/dashboard/account":      "Account & Settings",
};

const MENU_ITEMS = [
  { icon: "👤", label: "My Profile",       tab: "profile"       },
  { icon: "📦", label: "My Subscriptions", tab: "subscriptions" },
  { icon: "🔐", label: "Security",         tab: "security"      },
  { icon: "💬", label: "Help & Support",   tab: "support"       },
  { icon: "ℹ️",  label: "About ManaBills",  tab: "about"         },
];

// ─────────────────────────────────────────────
// MOBILE DETECT
// ─────────────────────────────────────────────

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 480);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
};

// ─────────────────────────────────────────────
// NOTIFICATION PANEL
// ─────────────────────────────────────────────

const NotifContent = ({ notifications, onMarkRead, onMarkAllRead, onDelete, onClearAll, onClose, isMobile }) => {
  const [filter, setFilter] = useState("all");
  const displayed = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className={isMobile ? "notif-panel notif-panel--mobile" : "notif-panel"} onClick={(e) => e.stopPropagation()}>

      {/* Header */}
      <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid rgba(14,27,46,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div>
          <div style={{ fontSize:"0.92rem", fontWeight:700, color:"#0e1b2e" }}>Notifications</div>
          <div style={{ fontSize:"0.70rem", color:"#9ca3af", marginTop:"1px" }}>{notifications.filter(n => !n.read).length} unread</div>
        </div>
        <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
          {notifications.filter(n => !n.read).length > 0 && (
            <button onClick={onMarkAllRead} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.72rem", color:"#6366f1", fontWeight:600, padding:"4px 8px", borderRadius:"6px" }}
              onMouseEnter={(e) => e.currentTarget.style.background="#eef2ff"}
              onMouseLeave={(e) => e.currentTarget.style.background="none"}>
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={onClearAll} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.72rem", color:"#9ca3af", fontWeight:500, padding:"4px 8px", borderRadius:"6px" }}
              onMouseEnter={(e) => e.currentTarget.style.background="rgba(14,27,46,0.04)"}
              onMouseLeave={(e) => e.currentTarget.style.background="none"}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding:"8px 16px 6px", display:"flex", gap:"4px", borderBottom:"1px solid rgba(14,27,46,0.06)", flexShrink:0 }}>
        {["all","unread"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:"4px 12px", borderRadius:"20px", border:"none", cursor:"pointer", fontSize:"0.75rem", fontWeight:600, background: filter===f ? "#0e1b2e" : "transparent", color: filter===f ? "#fff" : "#6b7280", transition:"all 0.15s", textTransform:"capitalize" }}>
            {f === "unread" ? `Unread (${notifications.filter(n => !n.read).length})` : `All (${notifications.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ overflowY:"auto", flex:1 }}>
        {displayed.length === 0 ? (
          <div style={{ padding:"40px 20px", textAlign:"center", color:"#9ca3af" }}>
            <div style={{ fontSize:"2rem", marginBottom:"8px" }}>🔔</div>
            <div style={{ fontSize:"0.82rem", fontWeight:500 }}>No notifications</div>
            <div style={{ fontSize:"0.72rem", marginTop:"4px" }}>You're all caught up!</div>
          </div>
        ) : (
          displayed.map((notif) => {
            const meta = NOTIF_META[notif.type] || NOTIF_META[NOTIF_TYPES.SYSTEM];
            return (
              <div key={notif.id} onClick={() => onMarkRead(notif.id)}
                style={{ display:"flex", alignItems:"flex-start", gap:"10px", padding:"11px 16px", background: notif.read ? "transparent" : "rgba(99,102,241,0.03)", borderBottom:"1px solid rgba(14,27,46,0.05)", cursor:"pointer", transition:"background 0.15s", position:"relative" }}
                onMouseEnter={(e) => e.currentTarget.style.background="rgba(14,27,46,0.03)"}
                onMouseLeave={(e) => e.currentTarget.style.background= notif.read ? "transparent" : "rgba(99,102,241,0.03)"}>
                {!notif.read && (
                  <div style={{ position:"absolute", left:"6px", top:"50%", transform:"translateY(-50%)", width:"5px", height:"5px", borderRadius:"50%", background:"#6366f1" }} />
                )}
                <div style={{ width:"34px", height:"34px", borderRadius:"10px", background:meta.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0, marginLeft:"4px" }}>
                  {meta.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"0.80rem", fontWeight: notif.read ? 500 : 700, color:"#0e1b2e", marginBottom:"2px" }}>{notif.title}</div>
                  <div style={{ fontSize:"0.73rem", color:"#6b7280", lineHeight:1.4 }}>{notif.message}</div>
                  <div style={{ fontSize:"0.68rem", color:"#9ca3af", marginTop:"3px" }}>{timeAgo(notif.timestamp)}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"#d1d5db", fontSize:"14px", padding:"2px 4px", borderRadius:"4px", lineHeight:1, flexShrink:0, transition:"color 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color="#ef4444"}
                  onMouseLeave={(e) => e.currentTarget.style.color="#d1d5db"}
                  title="Remove">×</button>
              </div>
            );
          })
        )}
      </div>

      {isMobile && (
        <div style={{ position:"absolute", top:"8px", left:"50%", transform:"translateX(-50%)", width:"36px", height:"4px", borderRadius:"2px", background:"rgba(14,27,46,0.15)" }} />
      )}
    </div>
  );
};

const NotificationPanel = (props) => {
  const isMobile = useIsMobile();
  if (!isMobile) return <NotifContent {...props} isMobile={false} />;
  return ReactDOM.createPortal(
    <>
      <div onClick={props.onClose} style={{ position:"fixed", inset:0, zIndex:10998, background:"rgba(14,27,46,0.35)", backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)", animation:"fadeIn 0.2s ease both" }} />
      <NotifContent {...props} isMobile={true} />
    </>,
    document.body
  );
};

// ─────────────────────────────────────────────
// MAIN TOPBAR
// ─────────────────────────────────────────────

const Topbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── SubscriptionContext — already fetches from real backend ───────────────
  // subscriptions shape: { business: { module, plan_key, duration, status,
  //   expires_at, days_left, hours_left, is_active, payment_id, ... }, ... }
  const { subscriptions, loading: subLoading } = useContext(SubscriptionContext);

  const [open,             setOpen]          = useState(false);
  const [notifOpen,        setNotifOpen]     = useState(false);
  const [shop,             setShop]          = useState(null);
  const [notifications,    setNotifications] = useState(loadNotifications);

  const dropRef  = useRef(null);
  const notifRef = useRef(null);
  const initDone = useRef(false);

  const pageTitle = ROUTE_LABELS[location.pathname] || "Dashboard";
  const user      = JSON.parse(localStorage.getItem("user") || "{}");

  const loginDetails = {
    fullName:     user.full_name     || "",
    mobileNumber: user.mobile_number || "",
    email:        user.email         || "",
  };

  // ── Expiry countdown from real backend expires_at ─────────────────────────
  const expiry = usePlanExpiry(subscriptions);



  const DateTimeChip = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const date = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "3px 10px", borderRadius: "8px",
      background: "rgba(12, 103, 239, 0.05)", border: "1px solid rgba(155, 186, 234, 0.1)",
      lineHeight: 1.3, flexShrink: 0,
    }}>
      <span style={{ fontSize: "13px", fontWeight: 700, color: "#0e1b2e", fontFamily: "monospace", letterSpacing: "0.04em" }}>
        {time}
      </span>
      <span style={{ fontSize: "10px", fontWeight: 500, color: "#6b7280", letterSpacing: "0.02em" }}>
        {date}
      </span>
    </div>
  );
};

  // ── Build active plans list for dropdown (plain function, no hook) ──────────
  const activePlans = getActivePlans(subscriptions);

  const pushNotif = useCallback((type, title, message, data = {}) => {
  setNotifications((prev) => [createNotification(type, title, message, data), ...prev]);
}, []);

  // ── Persist notifications to localStorage ─────────────────────────────────
  useEffect(() => { saveNotifications(notifications); }, [notifications]);

  // ── Drain any notification queued by CheckoutSubscription ────────────
useEffect(() => {
  const raw = localStorage.getItem("manabills_pending_notif");
  if (!raw) return;
  try {
    const { type, title, message } = JSON.parse(raw);
    pushNotif(type, title, message);
  } catch {}
  localStorage.removeItem("manabills_pending_notif");
}, [location.pathname, pushNotif]); // fires on every route change


  // ── Welcome notification once per session ─────────────────────────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    if (!sessionStorage.getItem("manabills_session_welcomed")) {
      sessionStorage.setItem("manabills_session_welcomed", "1");
      const name = loginDetails.fullName ? loginDetails.fullName.split(" ")[0] : "there";
      pushNotif(NOTIF_TYPES.WELCOME_LOGIN, `Welcome back, ${name}! 👋`, "You've successfully signed in to ManaBills. Have a great session!");
    }
  }, []); // eslint-disable-line

  // ── Expiry warning notification (once per session, when <24h left) ────────
  useEffect(() => {
    if (!expiry || !expiry.urgent) return;
    if (sessionStorage.getItem("manabills_expiry_warned")) return;
    sessionStorage.setItem("manabills_expiry_warned", "1");
    pushNotif(
      NOTIF_TYPES.SUBSCRIPTION_EXPIRY,
      `${expiry.planName} Plan Expiring Soon ⚠️`,
      `Your ${expiry.planName} plan expires in ${expiry.label}. Renew now to avoid losing access.`,
    );
  }, [expiry, pushNotif]);

  // ── Check subscription health from backend on mount ──────────────────────
  // Re-validates active plans to catch any that expired server-side
  useEffect(() => {
    if (subLoading || !subscriptions || !Object.keys(subscriptions).length) return;

    Object.entries(subscriptions).forEach(([moduleKey, sub]) => {
      if (!sub || sub.status !== "active") return;

      // Call backend check endpoint to get fresh days_left / hours_left
      authAxios
        .get(`subscriptions/check/?module=${moduleKey}`)
        .then((res) => {
          const data = res.data;
          // If backend says expired but context still says active, fire a warning
          if (!data.is_active && !sessionStorage.getItem(`expired_warned_${moduleKey}`)) {
            sessionStorage.setItem(`expired_warned_${moduleKey}`, "1");
            pushNotif(
              NOTIF_TYPES.SUBSCRIPTION_EXPIRY,
              `${moduleKey} Plan Expired`,
              `Your ${moduleKey} subscription has expired. Renew to regain access.`,
            );
          }
        })
        .catch(() => {}); // silent — context already has data
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subLoading]);

  // ── Shop profile from backend ─────────────────────────────────────────────
  useEffect(() => {
    getShopProfile().then(setShop).catch(() => {});
  }, []);

  const shopDetails = {
    shopName:  shop?.shop_name    || "",
    ownerName: shop?.owner_name   || "",
    mobile1:   shop?.mobile       || "",
    mobile2:   shop?.extra_mobile || "",
    gstNumber: shop?.gst_number   || "",
    address:   shop?.address      || "",
    logoUrl:   shop?.logo_url     || "",
  };

  const rawName     = shopDetails.ownerName || loginDetails.fullName || "";
  const mobile      = shopDetails.mobile1   || loginDetails.mobileNumber || "";
  const initials    = rawName ? rawName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "U";

  // ── Outside click to close dropdowns ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current  && !dropRef.current.contains(e.target))  setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead    = (id) => setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAllRead = ()   => setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  const deleteNotif = (id) => setNotifications((p) => p.filter((n) => n.id !== id));
  const clearAll    = ()   => setNotifications([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Expose notify API to window (for CheckoutSubscription etc.) ───────────
  useEffect(() => {
    window.manaBillsNotify       = pushNotif;
    window.MANABILLS_NOTIF_TYPES = NOTIF_TYPES;
    return () => { delete window.manaBillsNotify; delete window.MANABILLS_NOTIF_TYPES; };
  }, [pushNotif]);

  const handleMenuClick = (tab) => { setOpen(false); navigate("/dashboard/account", { state: { tab } }); };
  const handleLogout    = ()    => { setOpen(false); localStorage.clear(); navigate("/"); };

  // Format expiry date for dropdown display
  const formatExpiry = (isoString) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const planLabels = {
    "business":     "Business",
    "home-expense": "Home Expenses",
    "construction": "Construction",
    "custom":       "Custom",
  };

  return (
    <header className="topbar">

      {/* ── LEFT ── */}
      <div className="topbar-left">
        <div className="topbar-logo" onClick={() => navigate("/dashboard")} style={{ cursor:"pointer" }}>
          Mana<span>Bills</span>
        </div>
        <div className="topbar-divider" />
        <span className="topbar-title">{pageTitle}</span>
      </div>

      {/* ── RIGHT ── */}
      <div className="topbar-actions">

         {/* Date & Time */}
        <DateTimeChip />



        {/* Expiry chip — driven by real backend expires_at */}
        <ExpiryChip expiry={expiry} onClick={() => navigate("/subscription")} />

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position:"relative" }}>
          <button
            onClick={() => { const o = !notifOpen; setNotifOpen(o); setOpen(false); if (o) markAllRead(); }}
            title="Notifications"
            style={{ position:"relative", background: notifOpen ? "rgba(99,102,241,0.10)" : "rgba(14,27,46,0.05)", border:"none", cursor:"pointer", width:"36px", height:"36px", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", transition:"background 0.2s" }}
            onMouseEnter={(e) => !notifOpen && (e.currentTarget.style.background="rgba(14,27,46,0.09)")}
            onMouseLeave={(e) => !notifOpen && (e.currentTarget.style.background="rgba(14,27,46,0.05)")}>
            🔔
            {unreadCount > 0 && (
              <span style={{ position:"absolute", top:"6px", right:"6px", width:"8px", height:"8px", borderRadius:"50%", background:"#ef4444", border:"2px solid #fff", animation:"pulse 2s infinite" }} />
            )}
          </button>

          {notifOpen && (
            <NotificationPanel
              notifications={notifications}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onDelete={deleteNotif}
              onClearAll={clearAll}
              onClose={() => { setNotifOpen(false); markAllRead(); }}
            />
          )}
        </div>

        {/* Avatar pill */}
        <div ref={dropRef} style={{ position:"relative" }}>
          <div className="topbar-user" onClick={() => { setOpen((p) => !p); setNotifOpen(false); }} title="Account" style={{ cursor:"pointer", userSelect:"none" }}>
            <div className="topbar-user-av">
              {shopDetails.logoUrl
                ? <img src={shopDetails.logoUrl} alt="shop logo" style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }} />
                : initials}
            </div>
            <span className="topbar-user-arrow" style={{ display:"inline-block", transition:"transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>↓</span>
          </div>

          {open && (
            <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:"240px", background:"#ffffff", border:"1.5px solid rgba(14,27,46,0.09)", borderRadius:"16px", boxShadow:"0 8px 32px rgba(14,27,46,0.14)", zIndex:9999, overflow:"hidden", animation:"dropIn 0.15s ease both" }}>

              {/* User info */}
              <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(14,27,46,0.08)", display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#0e1b2e,#1a2d47)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:700, color:"#fff", flexShrink:0, overflow:"hidden" }}>
                  {shopDetails.logoUrl ? <img src={shopDetails.logoUrl} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : initials}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:"0.88rem", fontWeight:700, color:"#0e1b2e", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {shopDetails.shopName || loginDetails.fullName || "User"}
                  </div>
                  {shopDetails.ownerName && (
                    <div style={{ fontSize:"0.72rem", color:"#374151", fontWeight:500 }}>{shopDetails.ownerName}</div>
                  )}
                  <div style={{ fontSize:"0.72rem", color:"#6b7280" }}>{mobile}</div>
                  {loginDetails.email && (
                    <div style={{ fontSize:"0.70rem", color:"#9ca3af", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{loginDetails.email}</div>
                  )}
                </div>
              </div>

              {/* ── Active Plans from real backend ── */}
              {!subLoading && activePlans.length > 0 && (
                <div style={{ padding:"8px 10px", borderBottom:"1px solid rgba(14,27,46,0.07)" }}>
                  <div style={{ fontSize:"0.67rem", fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"5px", paddingLeft:"4px" }}>
                    Active Plans
                  </div>
                  {activePlans.map((plan) => (
                    <div
                      key={plan.moduleKey}
                      onClick={() => { setOpen(false); navigate("/subscription"); }}
                      style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius:"10px", background:"rgba(14,27,46,0.03)", marginBottom:"4px", cursor:"pointer", border:"1px solid rgba(14,27,46,0.06)", transition:"background 0.15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background="rgba(14,27,46,0.07)"}
                      onMouseLeave={(e) => e.currentTarget.style.background="rgba(14,27,46,0.03)"}>
                      <div>
                        <div style={{ fontSize:"0.75rem", fontWeight:700, color:"#0e1b2e" }}>
                          {planLabels[plan.moduleKey] || plan.moduleKey}
                        </div>
                        <div style={{ fontSize:"0.68rem", color:"#6b7280" }}>
                          {plan.duration}
                          {plan.daysLeft !== null && (
                            <span style={{ marginLeft:"4px", color: plan.daysLeft <= 3 ? "#dc2626" : plan.daysLeft <= 7 ? "#d97706" : "#10b981", fontWeight:600 }}>
                              · {plan.daysLeft}d left
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:"0.65rem", color:"#9ca3af" }}>Expires</div>
                        <div style={{ fontSize:"0.68rem", fontWeight:600, color:"#374151" }}>
                          {formatExpiry(plan.expiresAt) || "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Expiry urgent banner in dropdown */}
              {expiry && (
                <div onClick={() => { setOpen(false); navigate("/subscription"); }}
                  style={{ margin:"8px 10px", padding:"8px 10px", borderRadius:"10px", background: expiry.critical ? "#fef2f2" : expiry.urgent ? "#fffbeb" : "rgba(14,27,46,0.04)", border:`1px solid ${expiry.critical ? "rgba(239,68,68,0.25)" : expiry.urgent ? "rgba(245,158,11,0.3)" : "rgba(14,27,46,0.08)"}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:"0.68rem", fontWeight:700, color: expiry.critical ? "#dc2626" : expiry.urgent ? "#d97706" : "#374151", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                      {expiry.planName} · Expiring
                    </div>
                    <div style={{ fontSize:"0.75rem", fontWeight:800, color: expiry.critical ? "#dc2626" : expiry.urgent ? "#d97706" : "#0e1b2e", marginTop:"1px" }}>
                      {expiry.label}
                    </div>
                  </div>
                  <span style={{ fontSize:"0.72rem", fontWeight:700, color:"#c9963a" }}>Renew →</span>
                </div>
              )}

              {/* Shop details */}
              {shop && (
                <div style={{ padding:"8px 16px", borderBottom:"1px solid rgba(14,27,46,0.08)", display:"flex", flexDirection:"column", gap:"3px" }}>
                  {shopDetails.gstNumber && <div style={{ fontSize:"0.70rem", color:"#6b7280" }}>GST: <span style={{ color:"#0e1b2e", fontWeight:600 }}>{shopDetails.gstNumber}</span></div>}
                  {shopDetails.mobile2   && <div style={{ fontSize:"0.70rem", color:"#6b7280" }}>Alt: <span style={{ color:"#0e1b2e" }}>{shopDetails.mobile2}</span></div>}
                  {shopDetails.address   && <div style={{ fontSize:"0.68rem", color:"#9ca3af", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{shopDetails.address}</div>}
                </div>
              )}

              {/* Menu items */}
              <div style={{ padding:"6px 0" }}>
                {MENU_ITEMS.map((item) => (
                  <button key={item.tab} onClick={() => handleMenuClick(item.tab)}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"9px 16px", background:"none", border:"none", cursor:"pointer", fontSize:"0.85rem", fontWeight:500, color:"#0e1b2e", textAlign:"left", transition:"background 0.15s", fontFamily:"inherit" }}
                    onMouseEnter={(e) => e.currentTarget.style.background="rgba(14,27,46,0.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background="none"}>
                    <span style={{ fontSize:"15px", width:"18px", textAlign:"center" }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
                <div style={{ height:"1px", background:"rgba(14,27,46,0.08)", margin:"4px 0" }} />
                <button onClick={handleLogout}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:"10px", padding:"9px 16px", background:"none", border:"none", cursor:"pointer", fontSize:"0.85rem", fontWeight:500, color:"#dc2626", textAlign:"left", transition:"background 0.15s", fontFamily:"inherit" }}
                  onMouseEnter={(e) => e.currentTarget.style.background="rgba(220,38,38,0.06)"}
                  onMouseLeave={(e) => e.currentTarget.style.background="none"}>
                  <span style={{ fontSize:"15px", width:"18px", textAlign:"center" }}>🚪</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dropIn  { from { opacity:0; transform:translateY(-8px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse   { 0%,100% { transform:scale(1); } 50% { transform:scale(1.18); } }

        .notif-panel {
          position:absolute; top:calc(100% + 10px); right:0;
          width:340px; max-height:520px;
          background:#ffffff; border:1.5px solid rgba(14,27,46,0.09);
          border-radius:20px; box-shadow:0 16px 48px rgba(14,27,46,0.18);
          z-index:9999; display:flex; flex-direction:column; overflow:hidden;
          animation:dropIn 0.18s cubic-bezier(.22,.68,0,1.2) both;
        }
        .notif-panel--mobile {
          position:fixed; bottom:0; left:0; right:0; top:auto;
          width:100%; max-height:78vh;
          border-radius:24px 24px 0 0; border:none;
          border-top:1.5px solid rgba(14,27,46,0.08);
          background:rgba(255,255,255,0.92);
          backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
          box-shadow:0 -8px 48px rgba(14,27,46,0.22);
          z-index:10999; animation:slideUp 0.28s cubic-bezier(.22,.68,0,1.1) both;
          padding-top:20px; padding-bottom:env(safe-area-inset-bottom,16px);
        }
      `}</style>
    </header>
  );
};

export default Topbar;
