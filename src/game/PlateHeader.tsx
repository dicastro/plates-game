import PlateBadge from "./PlateBadge";
import PlateBadgesRow from "./PlateBadgesRow";
import BonusBadgeButton from "./BonusBadgeButton";
import BestScorePanel from "./BestScorePanel";
import type { GameConfig } from "./types";
import type { AttemptRecord } from "../platform/PlatformService";
import { useTranslation } from "../i18n/useTranslation";

interface PlateHeaderProps {
  config: GameConfig;
  bestRecord: AttemptRecord | null;
  attemptsHistory: AttemptRecord[];
  onBonusInfo: () => void;
  onOpenAttemptsDetail: () => void;
}

function isJackpot(bonusType: GameConfig["bonusType"]): boolean {
  return bonusType !== "none";
}

export default function PlateHeader({
  config,
  bestRecord,
  attemptsHistory,
  onBonusInfo,
  onOpenAttemptsDetail,
}: PlateHeaderProps) {
  const { locale } = useTranslation();
  const jackpot = isJackpot(config.bonusType);
  const formattedDate = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${config.daySeed}T00:00:00Z`));

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-panel-label text-[var(--color-text-muted)] text-center capitalize">{formattedDate}</p>
      <PlateBadge digits={config.plateDigits} consonants={config.consonants} isJackpot={jackpot} />

      {jackpot && (
        <div className="game-plate-badges-row">
          <PlateBadgesRow>
            <BonusBadgeButton onClick={onBonusInfo} />
            {/* Future: difficulty badge goes here too — see doc/NEXT_STEPS.md */}
          </PlateBadgesRow>
        </div>
      )}

      <BestScorePanel
        bestRecord={bestRecord}
        attemptsHistory={attemptsHistory}
        attemptsLimit={config.attemptsLimit}
        onOpenDetail={onOpenAttemptsDetail}
      />
    </div>
  );
}