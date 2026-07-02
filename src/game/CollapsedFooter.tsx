import { useTranslation } from "../i18n/useTranslation";
import { useNextUtcResetCountdown } from "./useNextUtcResetCountdown";
import { platformService } from "../platform/platformServiceInstance";
import { PlayIcon } from "../components/icons";
import Button from "../components/Button";

interface CollapsedFooterProps {
  attemptsUsed: number;
  attemptsLimit: number;
  adsEnabled: boolean;
  onTryAWord: () => void;
  onExtraAttemptGranted: () => void;
}

export default function CollapsedFooter({
  attemptsUsed,
  attemptsLimit,
  adsEnabled,
  onTryAWord,
  onExtraAttemptGranted,
}: CollapsedFooterProps) {
  const { t } = useTranslation();
  const countdown = useNextUtcResetCountdown();
  const isExhausted = attemptsUsed >= attemptsLimit;

  async function handleWatchAd() {
    const completed = await platformService.showRewardedAd();
    if (completed) onExtraAttemptGranted();
  }

  if (!isExhausted) {
    return (
      <Button variant="primary" onClick={onTryAWord} className="w-full">
        {t("game.normal.tryAWord")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <Button variant="primary" disabled className="w-full">
        {t("game.normal.newPlateIn", { time: countdown })}
      </Button>
      <p className="text-[9px] text-[var(--color-text-muted)] text-center">
        {t("game.normal.comeBackTomorrow")}
      </p>
      {adsEnabled && (
        <Button variant="secondary" onClick={handleWatchAd} className="w-full flex items-center justify-center gap-1.5">
          <PlayIcon /> {t("game.normal.watchAdForExtraAttempt")}
        </Button>
      )}
    </div>
  );
}