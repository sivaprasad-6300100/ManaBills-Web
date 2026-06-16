import React from "react";
import * as Sentry from "@sentry/react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import { BusinessStatsProvider } from "./context/BusinessStatsContext";
import { ShopProvider } from "./context/ShopContext";



Sentry.init({
  dsn: "https://e3be5a82b2025ea264b80b4b9abe6da8@o4511576070225920.ingest.us.sentry.io/4511576099192832",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: []
  }
});

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

// error finding
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN_HERE",
  tracesSampleRate: 1.0,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <ShopProvider> 
              <BusinessStatsProvider>
                <App />
              </BusinessStatsProvider>
          </ShopProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
