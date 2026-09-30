"use client";

import { useEffect, useState } from "react";

export function PwaRegistration() {
  const [updated, setUpdated] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    if (!("serviceWorker" in navigator)) return;
    const hadController = !!navigator.serviceWorker.controller;
    void navigator.serviceWorker.register("/sw.js");
    const showUpdate = () => {
      if (hadController) setUpdated(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", showUpdate);
    return () =>
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        showUpdate,
      );
  }, []);
  return updated ? (
    <div role="status" className="update-notice">
      Nova versão disponível. Recarregue a página.
      <button
        className="button button-secondary"
        onClick={() => window.location.reload()}
      >
        Recarregar agora
      </button>
    </div>
  ) : null;
}
