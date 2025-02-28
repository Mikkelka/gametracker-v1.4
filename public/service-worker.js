const CACHE_NAME = "gametracker-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/login.html",
  "/statistics.html",
  "/css/utilities.css",
  "/js/app.js",
  "/js/ui.js",
  // Tilføj andre vigtige filer her
];

self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
});

self.addEventListener("fetch", (event) => {
  // console.log("Fetching:", event.request.url);
});
