// Offline-Speicher der App ("Service Worker").
// Bei jeder Änderung an der App die Versionsnummer erhöhen, damit das Handy die neuen Dateien lädt.
const VERSION = "italienisch-v51";
const DATEIEN = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data/wortschatz.js",
  "./data/phrasen.js",
  "./data/grammatik.js",
  "./data/grammatik-a1.js",
  "./data/gespraech.js",
  "./data/dialoge.js",
  "./data/lektionen.js",
  "./data/lektionen-a1.js",
  "./data/hinweise.js",
  "./data/woerterbuch.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (e) => {
  // cache: "reload" = immer frisch vom Server holen, nicht aus dem Zwischenspeicher des Browsers
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(DATEIEN.map((d) => new Request(d, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst im Offline-Speicher nachsehen, sonst aus dem Internet holen
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((treffer) => treffer || fetch(e.request))
  );
});
