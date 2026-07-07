// src/screens/HomeScreen.tsx
import { useEffect } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { useTranslation } from "../i18n/useTranslation";
import { useAudio } from "../audio/useAudio";
import { usePlayerSession } from "../player/PlayerSessionContext";
import ScreenContainer from "../components/ScreenContainer";
import PlatesLogo from "../components/PlatesLogo";
import Button from "../components/Button";

export default function HomeScreen() {
  const { navigate, navigateToLogin } = useNavigation();
  const { t } = useTranslation();
  const { ensurePlayback } = useAudio();
  const { initialize } = usePlayerSession();

  useEffect(() => {
    initialize(); // no-op if already loaded — enriches the screen when it is resolved
  }, [initialize]);

  async function playNow() {
    ensurePlayback();
    const profile = await initialize();
    if (!profile) { navigateToLogin("NORMAL_GAME"); return; }
    navigate("NORMAL_GAME");
  }

  return (
    <ScreenContainer className="gap-8 landscape:gap-12 px-6">
      <PlatesLogo />
      {/* TODO: variante enriquecida (racha, badges, cuenta atrás) una vez
          `player` resuelva — diseño visual pendiente, ver doc/NEXT_STEPS.md */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button variant="primary" onClick={playNow}>{t("home.play")}</Button>
        <Button variant="secondary" onClick={() => navigate("FRIENDS_HUB")}>{t("home.friends")}</Button>
        <Button variant="ghost" onClick={() => navigate("LEADERBOARD")}>{t("home.leaderboard")}</Button>
      </div>
    </ScreenContainer>
  );
}