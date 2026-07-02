import { useEffect, useState } from "react";
import { MIN_PLAYABLE_HEIGHT_PX } from "../../shared/gameConfig";

export type ViewportSupport = "supported" | "needs-rotation" | "unsupported";

function evaluate(): ViewportSupport {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (h >= MIN_PLAYABLE_HEIGHT_PX) return "supported";
  if (w >= MIN_PLAYABLE_HEIGHT_PX) return "needs-rotation"; // rotating swaps w/h, so current width is the other orientation's height
  return "unsupported";
}

export function useViewportSupport(): ViewportSupport {
  const [support, setSupport] = useState<ViewportSupport>(evaluate);

  useEffect(() => {
    function handle() {
      setSupport(evaluate());
    }
    window.addEventListener("resize", handle);
    window.addEventListener("orientationchange", handle);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("orientationchange", handle);
    };
  }, []);

  return support;
}