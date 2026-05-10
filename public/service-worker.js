const CACHE_NAME = "community-pantry-v5";
const APP_SHELL = ["/community-pantry/", "/community-pantry/manifest.webmanifest", "/community-pantry/pantry-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();

        if (new URL(request.url).origin === self.location.origin) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }

        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/community-pantry/"))),
  );
});
