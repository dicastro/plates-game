import { useEffect, useRef } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { usePlayerSession } from "../player/PlayerSessionContext";
import SplashAnimation from "../components/SplashAnimation";
import ScreenContainer from "../components/ScreenContainer";

const FORCED_DELAY_MS = Number(import.meta.env.VITE_SPLASH_FORCED_DELAY_MS ?? 0);

function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

export default function SplashScreen() {
  const { navigate } = useNavigation();
  const { initialize } = usePlayerSession();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    (async () => {
      const profile = await initialize();
      await delay(FORCED_DELAY_MS);

      navigate(profile ? "HOME" : "LOGIN");
    })();
  }, [navigate, initialize]);

  return (
    <ScreenContainer className="gap-4 px-6">
      <SplashAnimation />
    </ScreenContainer>
  );
}