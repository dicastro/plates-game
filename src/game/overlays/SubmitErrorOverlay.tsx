import { useTranslation } from "../../i18n/useTranslation";
import { WarningIcon } from "../../components/icons";
import OverlayCard from "../../components/OverlayCard";

export default function SubmitErrorOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <OverlayCard onClose={onClose}>
      <div className="flex justify-center text-[var(--color-danger)] mb-3 mx-auto" style={{ width: "clamp(32px, 11cqw, 56px)", height: "clamp(32px, 11cqw, 56px)" }}>
        <WarningIcon />
      </div>
      <p className="font-bold text-[var(--color-danger)] mb-2 text-[clamp(16px,5cqw,24px)]">{t("game.normal.submitErrorTitle")}</p>
      <p className="text-[var(--color-text)] mb-4 text-[clamp(12px,3.5cqw,15px)]">{t("game.normal.submitErrorBody")}</p>
      <button type="button" onClick={onClose} className="w-full rounded-[9px] py-2.5 bg-[var(--color-accent)] text-[#1a1a1a] font-bold text-[clamp(12px,3.5cqw,15px)]">
        {t("game.normal.tryAgain")}
      </button>
    </OverlayCard>
  );
}