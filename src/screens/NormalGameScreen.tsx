import { useEffect, useState } from "react";
import { useNavigation } from "../navigation/NavigationContext";
import { platformService } from "../platform/platformServiceInstance";
import { NORMAL_MODE_DAILY_ATTEMPTS_LIMIT } from "../../shared/gameConfig";
import type { NormalModeStatus } from "../platform/PlatformService";
import type { GameConfig } from "../game/types";
import GameEngine from "../game/GameEngine";
import ScreenContainer from "../components/ScreenContainer";

const NORMAL_MODE_LANG = import.meta.env.VITE_DICT_TARGET as string;

function buildConfig(status: NormalModeStatus, onExit: () => void): GameConfig {
  return {
    mode: "NORMAL",
    lang: NORMAL_MODE_LANG,
    attemptsLimit: NORMAL_MODE_DAILY_ATTEMPTS_LIMIT,
    countdownSeconds: null,
    consonants: status.puzzle.consonants,
    plateDigits: status.puzzle.digits,
    bonusType: status.puzzle.bonusType,
    initialAttemptsUsed: status.attemptsUsedToday,
    initialBestScore: status.bestScoreToday,
    initialAttemptsHistory: status.attemptsHistory,
    onExit,
  };
}

export default function NormalGameScreen() {
  const { navigate } = useNavigation();
  const [config, setConfig] = useState<GameConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    platformService.enterNormalMode(NORMAL_MODE_LANG).then((status) => {
      if (cancelled) return;
      setConfig(buildConfig(status, () => navigate("HOME")));
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!config) {
    return (
      <ScreenContainer orientation="always-column">
        <p>Loading…</p>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer orientation="always-column" className="p-0">
      <GameEngine config={config} />
    </ScreenContainer>
  );
}