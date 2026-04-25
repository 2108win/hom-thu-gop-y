"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations
            .filter((registration) => {
              const workers = [
                registration.active,
                registration.installing,
                registration.waiting,
              ];

              return workers.some((worker) =>
                worker?.scriptURL.endsWith("/sw.js"),
              );
            })
            .forEach((registration) => {
              registration.unregister().catch(() => undefined);
            });
        })
        .catch(() => undefined);

      if ("caches" in window) {
        window.caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith("hom-thu-"))
                .map((key) => window.caches.delete(key)),
            ),
          )
          .catch(() => undefined);
      }

      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .catch(() => undefined);
  }, []);

  return null;
}
