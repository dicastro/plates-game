import { useEffect, useRef } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { usePlayerSession } from "../player/PlayerSessionContext";
import SplashAnimation from "../components/SplashAnimation";
import ScreenContainer from "../components/ScreenContainer";
import type { AppScreen } from "../navigation/types";
import { needsAliasSetup } from "../player/aliasGate";

const FORCED_DELAY_MS = Number(import.meta.env.VITE_SPLASH_FORCED_DELAY_MS ?? 0);
const POST_LOGIN_INTENTS: AppScreen[] = ["NORMAL_GAME"]; // TODO include rest of screens that needs login

function delay(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function readPostLoginIntent(): AppScreen | null {
  const raw = new URLSearchParams(window.location.search).get("intent");
  return raw && (POST_LOGIN_INTENTS as string[]).includes(raw) ? (raw as AppScreen) : null;
}

export default function SplashScreen() {
  const { navigate } = useNavigation();
  const { initialize } = usePlayerSession();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    (async () => {
      await delay(FORCED_DELAY_MS);

      const intent = readPostLoginIntent();
      if (intent) {
        // callback from a login redirect with a pending intent — only case
        // where Splash resolves session eagerly, to land
        // directly where player intended to go
        const profile = await initialize();
        window.history.replaceState(null, "", window.location.pathname);
        if (!profile) {
          navigate("HOME");
          return;
        }
        navigate(needsAliasSetup(profile) ? "ALIAS_SETUP" : intent);
        return;
      }

      navigate("HOME"); 
    })();
  }, [navigate, initialize]);

  return (
    <ScreenContainer className="gap-4 px-6">
      <SplashAnimation />
    </ScreenContainer>
  );
}