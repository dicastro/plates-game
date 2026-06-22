import { useEffect, useRef } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { usePlayerData } from "../player/PlayerDataContext";
import { platformService } from "../platform/platformServiceInstance";
import SplashAnimation from "../components/SplashAnimation";
import ScreenContainer from "../components/ScreenContainer";

const FORCED_DELAY_MS = Number(import.meta.env.VITE_SPLASH_FORCED_DELAY_MS ?? 0);

function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

export default function SplashScreen() {
  const { navigate } = useNavigation();
  const { load } = usePlayerData();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    // Theme is already resolved synchronously by ThemeProvider before this renders.
    // Signal visual presence to the platform as early as possible.
    platformService.notifyFirstFrameReady();

    (async () => {
      await platformService.initialize();
      await load(); // restore settings — TODO: apply once SettingsContext exists
      await platformService.archiveFinishedSessions(); // no-op outside Travel/Remote-capable platforms
      // What's New check — system not yet implemented, treated as "nothing unread" for now.

      await delay(FORCED_DELAY_MS);

      platformService.notifyGameReady();
      navigate("HOME");
    })();
  }, [navigate]);

  return (
    <ScreenContainer className="gap-4 px-6">
      <SplashAnimation />
    </ScreenContainer>
  );
}