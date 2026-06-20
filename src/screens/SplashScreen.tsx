import { useEffect, useRef } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { platformService } from "../platform/platformServiceInstance";
import SplashAnimation from "../components/SplashAnimation";

const FORCED_DELAY_MS = Number(import.meta.env.VITE_SPLASH_FORCED_DELAY_MS ?? 0);

function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

export default function SplashScreen() {
  const { navigate } = useNavigation();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    // Theme is already resolved synchronously by ThemeProvider before this renders.
    // Signal visual presence to the platform as early as possible.
    platformService.notifyFirstFrameReady();

    (async () => {
      await platformService.initialize();
      await platformService.loadData(); // restore settings — TODO: apply once SettingsContext exists
      await platformService.archiveFinishedSessions(); // no-op outside Travel/Remote-capable platforms
      // What's New check — system not yet implemented, treated as "nothing unread" for now.

      await delay(FORCED_DELAY_MS);

      platformService.notifyGameReady();
      navigate("HOME");
    })();
  }, [navigate]);

  return (
    <main className="w-screen h-screen flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)] text-[var(--color-text)]">
      <SplashAnimation />
    </main>
  );
}