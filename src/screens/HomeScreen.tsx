import { useNavigation } from "../navigation/NavigationContext";
import { useTranslation } from "../i18n/useTranslation";
import { useAudio } from "../audio/useAudio";
import ScreenContainer from "../components/ScreenContainer";
import PlatesLogo from "../components/PlatesLogo";
import Button from "../components/Button";

export default function HomeScreen() {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const { ensurePlayback } = useAudio();

  return (
    <ScreenContainer className="gap-8 landscape:gap-12 px-6">
      <PlatesLogo />

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button
          variant="primary"
          onClick={() => {
            ensurePlayback();
            navigate("NORMAL_GAME");
          }}
        >
          {t("home.play")}
        </Button>
        <Button variant="secondary" onClick={() => navigate("FRIENDS_HUB")}>
          {t("home.friends")}
        </Button>
        <Button variant="ghost" onClick={() => navigate("LEADERBOARD")}>
          {t("home.leaderboard")}
        </Button>
      </div>
    </ScreenContainer>
  );
}