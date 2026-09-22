"use client";

import { useEffect, useState } from "react";

export function PwaRegistration() {
  const [updated, setUpdated] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js");
    const showUpdate = () => setUpdated(true);
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
    </div>
  ) : null;
}
