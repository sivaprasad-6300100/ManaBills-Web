const CACHE = "manabills-v2";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
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

self.addEventListener("fetch", (e) => {
  const { request } = e;

  // Navigation requests: try network, fall back to cached index.html (works offline)
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Static assets: cache-first, fall back to network
  if (request.method === "GET") {
    e.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            // Cache successful responses for next time
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