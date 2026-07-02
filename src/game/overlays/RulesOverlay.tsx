import { useState } from "react";
import { useTranslation } from "../../i18n/useTranslation";
import OverlayCard from "./OverlayCard";

interface RulesOverlayProps {
  attemptsLimit: number;
  onClose: (dontShowAgain: boolean) => void;
}

export default function RulesOverlay({ attemptsLimit, onClose }: RulesOverlayProps) {
  const { t } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <OverlayCard onClose={() => onClose(dontShowAgain)}>
      <p className="font-bold text-[var(--color-accent)] mb-3 text-[clamp(15px,4.5cqw,20px)]">{t("game.normal.rulesTitle")}</p>
      <p className="text-[var(--color-text)] text-left mb-4 text-[clamp(11px,3.2cqw,14px)]">
        {t("game.normal.rulesBody", { limit: attemptsLimit })}
      </p>
      <label className="flex items-center gap-2 text-[var(--color-text-muted)] mb-3 text-[clamp(11px,3.2cqw,14px)]">
        <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
        {t("game.normal.dontShowAgain")}
      </label>
      <button
        type="button"
        onClick={() => onClose(dontShowAgain)}
        className="w-full rounded-[9px] py-2.5 bg-[var(--color-accent)] text-[#1a1a1a] font-bold text-[clamp(12px,3.5cqw,15px)]"
      >
        {t("game.normal.gotIt")}
      </button>
    </OverlayCard>
  );
}