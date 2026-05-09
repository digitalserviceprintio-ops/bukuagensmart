// PWA cleanup: unregister stale service workers and reload if needed
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (!isPreviewHost && !isInIframe && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    let didUnregister = false;
    registrations.forEach((r) => {
      r.unregister();
      didUnregister = true;
    });
    if (didUnregister) {
      caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
    }
  });
}

// Apply saved theme before render
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
