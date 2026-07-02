import LoadingOverlay from "./LoadingOverlay";
import ResultOverlay from "./ResultOverlay";
import SubmitErrorOverlay from "./SubmitErrorOverlay";
import AttemptsDetailOverlay from "./AttemptsDetailOverlay";
import BonusInfoOverlay from "./BonusInfoOverlay";
import RulesOverlay from "./RulesOverlay";
import { useTranslation } from "../../i18n/useTranslation";
import { useGameRuntime } from "../GameRuntimeContext";
import type { GameConfig } from "../types";

export default function OverlayHost({
  config,
  onRulesClosed,
}: {
  config: GameConfig;
  onRulesClosed: (dontShowAgain: boolean) => void;
}) {
  const { t } = useTranslation();
  const { submissionStatus, activeOverlay, attemptsHistory, bestScore, attemptsUsed, closeOverlay } =
    useGameRuntime();

  if (submissionStatus === "loading") {
    return <LoadingOverlay message={t("game.normal.checkingDictionary")} />;
  }

  if (!activeOverlay) return null;

  switch (activeOverlay.type) {
    case "RESULT":
      return (
        <ResultOverlay
          outcome={activeOverlay.outcome}
          record={activeOverlay.record}
          bestScore={bestScore}
          attemptsRemaining={Math.max(0, config.attemptsLimit - attemptsUsed)}
          onClose={closeOverlay}
        />
      );
    case "SUBMIT_ERROR":
      return <SubmitErrorOverlay onClose={closeOverlay} />;
    case "ATTEMPTS_DETAIL":
      return <AttemptsDetailOverlay attemptsHistory={attemptsHistory} onClose={closeOverlay} />;
    case "BONUS_INFO":
      return <BonusInfoOverlay onClose={closeOverlay} />;
    case "RULES":
      return (
        <RulesOverlay
          attemptsLimit={config.attemptsLimit}
          onClose={(dontShowAgain) => {
            onRulesClosed(dontShowAgain);
            closeOverlay();
          }}
        />
      );
    default:
      return null;
  }
}