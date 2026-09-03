const CACHE = "ee-field-v2";
const ROSTER_CACHE = "ee-roster-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Cache roster and my_day endpoints for offline field availability
  if (url.pathname.includes("get_my_day") || url.pathname.includes("roster") || url.pathname.includes("dispatch")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(ROSTER_CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.open(ROSTER_CACHE).then((cache) => cache.match(req)))
    );
    return;
  }

  if (req.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        const hit = await cache.match(req);
        if (hit) return hit;
        throw err;
      }
    })
  );
});
