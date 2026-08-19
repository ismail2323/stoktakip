const CACHE_ADI = "parca-depo-v1";
const KABUK = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_ADI).then((cache) => cache.addAll(KABUK)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((anahtarlar) =>
      Promise.all(anahtarlar.filter((k) => k !== CACHE_ADI).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const kopya = response.clone();
        caches.open(CACHE_ADI).then((cache) => cache.put(request, kopya));
        return response;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match("/")))
  );
});
