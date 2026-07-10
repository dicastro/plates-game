import { useState, useEffect, useRef } from "react";
import { useTranslation } from "../i18n/useTranslation";
import { useNavigation } from "../navigation/NavigationContext";
import { usePlayerSession } from "../player/PlayerSessionContext";
import { platformService } from "../platform/platformServiceInstance";
import ScreenContainer from "../components/ScreenContainer";
import PlatesLogo from "../components/PlatesLogo";
import VirtualKeyboard from "../components/VirtualKeyboard";
import OverlayCard from "../components/OverlayCard";
import Button from "../components/Button";
import { CheckIcon, CloseIcon } from "../components/icons";
import { DICT_TARGET_LANG } from "../config/locale";
import { ALIAS_MIN_LENGTH, ALIAS_MAX_LENGTH } from "../../shared/gameConfig";

const CHECK_DEBOUNCE_MS = 400;
type AvailabilityState = "idle" | "checking" | "available" | "taken";

export default function AliasSetupScreen() {
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const { updatePlayer } = usePlayerSession();

  const [alias, setAlias] = useState("");
  const [availability, setAvailability] = useState<AvailabilityState>("idle");
  const [serverError, setServerError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAlias, setConfirmedAlias] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (alias.length < ALIAS_MIN_LENGTH) {
      setAvailability("idle");
      return;
    }

    setAvailability("checking");
    const seq = ++requestSeqRef.current;

    debounceRef.current = setTimeout(async () => {
      const check = await platformService.checkAliasAvailability(alias);
      if (seq !== requestSeqRef.current) return;
      setAvailability(check.available ? "available" : "taken");
    }, CHECK_DEBOUNCE_MS);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [alias]);

  function handleLetter(letter: string) {
    setServerError(false);
    setAlias((prev) => (prev.length < ALIAS_MAX_LENGTH ? prev + letter : prev));
  }

  function handleBackspace() {
    setServerError(false);
    setAlias((prev) => prev.slice(0, -1));
  }

  const canSubmit = availability === "available" && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setServerError(false);

    const result = await platformService.setupAlias(alias);
    setIsSubmitting(false);

    if (!result.success) {
      setServerError(true);
      setAvailability("taken");
      return;
    }

    updatePlayer(result.player);
    setConfirmedAlias(result.player.alias);
  }

  const helperText =
    availability === "checking" ? t("alias.checking")
    : availability === "available" ? t("alias.available")
    : availability === "taken" ? t("alias.taken")
    : t("alias.helperRules", { min: ALIAS_MIN_LENGTH, max: ALIAS_MAX_LENGTH });

  const inputBorderClass =
    availability === "available" ? "border-[var(--color-success)]"
    : availability === "taken" ? "border-[var(--color-danger)]"
    : "border-[var(--color-border)]";

  return (
    <ScreenContainer orientation="always-column" className="p-0">
      <div className="game-area relative w-full h-full overflow-hidden p-3">
        <div className="h-full flex flex-col items-center justify-between gap-3 pt-6 w-full max-w-[560px] mx-auto">
          <div className="flex flex-col items-center gap-3 w-full">
            <PlatesLogo />
            <p className="text-overlay-title-sm font-bold text-[var(--color-accent)] text-center">{t("alias.title")}</p>
            <p className="text-overlay-body text-[var(--color-text-muted)] text-center max-w-xs">{t("alias.subtitle")}</p>

            {serverError && (
              <div className="rounded-lg px-3 py-2 text-overlay-caption text-center bg-[rgba(192,57,43,0.18)] border border-[rgba(192,57,43,0.4)] text-[#e87070] w-full">
                {t("alias.takenServerBanner")}
              </div>
            )}

            <div className={`bg-[var(--color-surface2)] rounded-lg px-3 py-2 flex items-center gap-2 border-[1.5px] w-full ${inputBorderClass}`}>
              <span className={`flex-1 text-panel-value font-semibold tracking-wide text-center ${alias ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}>
                {alias || t("alias.placeholder")}
              </span>
              {availability === "checking" && (
                <span className="w-3 h-3 rounded-full border-2 border-[var(--color-text-muted)] border-t-[var(--color-accent)] animate-spin flex-shrink-0" />
              )}
              {availability === "available" && <span className="flex-shrink-0 w-4 h-4 text-[var(--color-success)]"><CheckIcon /></span>}
              {availability === "taken" && <span className="flex-shrink-0 w-4 h-4 text-[var(--color-danger)]"><CloseIcon /></span>}
            </div>

            <p className={`text-panel-label text-center ${availability === "taken" ? "text-[var(--color-danger)] font-semibold" : "text-[var(--color-text-muted)]"}`}>
              {helperText}
            </p>
          </div>

          <div className="flex-1" />

          <div className="flex flex-col gap-2 w-full">
            <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit} className="w-full">
              {t("alias.confirmButton")}
            </Button>
            <VirtualKeyboard lang={DICT_TARGET_LANG} onLetter={handleLetter} onBackspace={handleBackspace} allowDigits />
          </div>
        </div>

        {confirmedAlias && (
          <OverlayCard accent>
            <div className="w-10 h-10 mx-auto mb-2 text-[var(--color-success)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><polyline points="8.5 12.5 11 15 16 9" />
              </svg>
            </div>
            <p className="text-overlay-title-sm font-bold text-[var(--color-accent)] mb-2">
              {t("alias.successTitle", { alias: confirmedAlias })}
            </p>
            <p className="text-overlay-body text-[var(--color-text)] mb-4">{t("alias.successBody")}</p>
            <button
              type="button"
              onClick={() => navigate("HOME")}
              className="w-full rounded-[9px] py-2.5 bg-[var(--color-accent)] text-[#1a1a1a] font-bold text-overlay-body"
            >
              {t("alias.continueButton")}
            </button>
          </OverlayCard>
        )}
      </div>
    </ScreenContainer>
  );
}