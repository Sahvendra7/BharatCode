"use client";

import { useEffect, useState } from "react";

export interface Health {
  model: { configured: boolean; id: string };
}

/** null while loading. Treats a failed health check as "AI not available" so the manual path is offered. */
export function useHealth(): Health | null {
  const [health, setHealth] = useState<Health | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((h: Health) => alive && setHealth(h))
      .catch(() => alive && setHealth({ model: { configured: false, id: "qwen-3.8-27b" } }));
    return () => {
      alive = false;
    };
  }, []);
  return health;
}
