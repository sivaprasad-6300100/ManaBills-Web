const CACHE = "manabills-v5";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  // "/manifest.json",
  "/ManaBillsLogo192.png",
  "/ManaBillsLogo512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Helper: identify API requests that must NEVER be cached
// (these are user-specific and must always hit the network with the current JWT)
function isApiRequest(url) {
  return (
    url.includes("/api/") ||
    url.includes("api.manabills.com") ||
    url.includes("/media/")
  );
}

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = request.url;

  // Never intercept API requests — always go straight to network.
  // This ensures the current logged-in user's JWT and fresh data are used,
  // and prevents stale cached responses from a previous account/session.
  if (isApiRequest(url)) {
    return; // let the browser handle it normally (no caching, no interception)
  }

  // manifest.json — always network-first, never trust stale cache.
  // This file controls start_url, so a stale copy can silently break
  // app launch behavior (e.g. splash screen not appearing) after a deploy.
  if (url.includes("/manifest.json")) {
    e.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigation requests: try network, fall back to cached index.html (works offline)
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Static assets only: cache-first, fall back to network
  if (request.method === "GET") {
    e.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, responseClone));
            }
            return response;
          }).catch(() => cached)
        );
      })
    );
  }
});