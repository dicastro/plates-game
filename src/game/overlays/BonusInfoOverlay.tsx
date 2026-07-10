import { useTranslation } from "../../i18n/useTranslation";
import OverlayCard from "../../components/OverlayCard";

export default function BonusInfoOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <OverlayCard onClose={onClose}>
      <p className="font-bold text-[var(--color-accent)] mb-3 text-[clamp(15px,4.5cqw,20px)]">{t("game.normal.bonusInfoTitle")}</p>
      {/* TODO: render real per-length word-count data once the Worker returns it
          alongside NormalModeStatus.puzzle — see doc/NEXT_STEPS.md (difficulty model). */}
    </OverlayCard>
  );
}