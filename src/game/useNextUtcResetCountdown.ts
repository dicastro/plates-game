import { useEffect, useState } from "react";
import { timeService } from "../time/timeServiceInstance";

// Cosmetic/informational only — never anti-cheat. See doc/technical/time-service.md.
function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function useNextUtcResetCountdown(): string {
  const [display, setDisplay] = useState("00:00:00");

  useEffect(() => {
    const tick = () => {
      const now = timeService.getCosmeticDate();
      const next = new Date(now);
      next.setUTCHours(24, 0, 0, 0);
      setDisplay(formatRemaining(next.getTime() - now.getTime()));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return display;
}