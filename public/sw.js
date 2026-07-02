// Minimal app-shell cache — enables the install prompt's offline-capability
// requirement and a basic "you're offline" fallback on navigation. Does NOT
// cache game data, the dictionary, or any Worker response — gameplay itself
// still requires a live connection, per security-anticheat.md.

const CACHE_NAME = "plates-shell-v1";
const SHELL_ASSETS = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return; // only intercept page loads, nothing else

  event.respondWith(
    fetch(event.request).catch(() =>
      caches
        .match("/index.html")
        .then((cached) => cached || new Response("Offline — please check your connection.", { status: 503 }))
    )
  );
});