import PlateBadge from "./PlateBadge";
import PlateBadgesRow from "./PlateBadgesRow";
import BonusBadgeButton from "./BonusBadgeButton";
import BestScorePanel from "./BestScorePanel";
import type { GameConfig } from "./types";
import type { AttemptRecord } from "../platform/PlatformService";

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
  const jackpot = isJackpot(config.bonusType);

  return (
    <div className="flex flex-col gap-2 w-full">
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