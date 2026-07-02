import { useTranslation } from "../i18n/useTranslation";
import { CheckIcon, CloseIcon } from "../components/icons";
import ScrollableWord from "../components/ScrollableWord";

interface InputRowProps {
  typedWord: string;
  isSubmitEnabled: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export default function InputRow({ typedWord, isSubmitEnabled, onSubmit, onClose }: InputRowProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-[var(--color-surface2)] rounded-lg p-1 flex items-center gap-2 [container-type:inline-size]">
      <button
        type="button"
        onClick={onSubmit}
        disabled={!isSubmitEnabled}
        aria-label={t("game.normal.submitAriaLabel")}
        style={{ width: "clamp(24px, min(8cqw, 9cqh), 40px)", height: "clamp(24px, min(8cqw, 9cqh), 40px)" }}
        className="flex-shrink-0 rounded-md border-none bg-[var(--color-accent)] text-[#1a1a1a] disabled:opacity-40 disabled:bg-[var(--color-surface2)] disabled:text-[var(--color-text-muted)] flex items-center justify-center"
      >
        <CheckIcon />
      </button>

      <div className="flex-1 min-w-0">
        <ScrollableWord
          text={typedWord || "\u00A0"}
          followEnd
          arrowBg="var(--color-surface2)"
          className="font-semibold tracking-wide text-[var(--color-text)] text-center"
          style={{ fontSize: "clamp(16px,6cqw,26px)" }}
        />
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={t("game.normal.closeAriaLabel")}
        style={{ width: "clamp(24px, min(8cqw, 9cqh), 40px)", height: "clamp(24px, min(8cqw, 9cqh), 40px)" }}
        className="flex-shrink-0 rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] flex items-center justify-center"
      >
        <CloseIcon />
      </button>
    </div>
  );
}