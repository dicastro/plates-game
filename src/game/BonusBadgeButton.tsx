import { useTranslation } from "../i18n/useTranslation";

export default function BonusBadgeButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-bold rounded-md px-3 py-1 bg-[var(--color-accent)] text-[#4a3500]"
    >
      {t("game.normal.bonusBadge")}
    </button>
  );
}