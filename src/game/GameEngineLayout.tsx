import { useEffect, useState } from "react";
import { useTranslation } from "../i18n/useTranslation";
import { usePlayerSession } from "../player/PlayerSessionContext";
import { platformService } from "../platform/platformServiceInstance";
import { useGameRuntime } from "./GameRuntimeContext";
import { getKeyboardLayout } from "./keyboardLayouts";
import { ExitIcon, HelpIcon } from "../components/icons";
import type { GameConfig } from "./types";
import PlateHeader from "./PlateHeader";
import InputRow from "./InputRow";
import VirtualKeyboard from "./VirtualKeyboard";
import CollapsedFooter from "./CollapsedFooter";
import OverlayHost from "./overlays/OverlayHost";

export default function GameEngineLayout({ config }: { config: GameConfig }) {
  const { t } = useTranslation();
  const { player, updatePlayer } = usePlayerSession();
  const {
    typedWord,
    isKeyboardExpanded,
    activeOverlay,
    attemptsUsed,
    attemptsHistory,
    isSubmitEnabled,
    typeLetter,
    backspace,
    expandKeyboard,
    collapseKeyboard,
    submit,
    openOverlay,
    closeOverlay,
  } = useGameRuntime();

  const [hasOfferedRulesThisMount, setHasOfferedRulesThisMount] = useState(false);

  useEffect(() => {
    if (!hasOfferedRulesThisMount && player && !player.hasSeenRulesIntro) {
      openOverlay({ type: "RULES" });
      setHasOfferedRulesThisMount(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const allowedLetters = new Set(getKeyboardLayout(config.lang).rows.flat());

    function handleKeyDown(e: KeyboardEvent) {
      if (activeOverlay) {
        if (e.key === "Escape") closeOverlay();
        return;
      }
      if (!isKeyboardExpanded) return;

      if (e.key === "Escape") {
        collapseKeyboard();
        return;
      }
      if (e.key === "Enter") {
        if (isSubmitEnabled) submit();
        return;
      }
      if (e.key === "Backspace") {
        backspace();
        return;
      }
      const letter = e.key.toUpperCase();
      if (allowedLetters.has(letter)) typeLetter(letter);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeOverlay,
    isKeyboardExpanded,
    isSubmitEnabled,
    config.lang,
    closeOverlay,
    collapseKeyboard,
    submit,
    backspace,
    typeLetter,
  ]);

  async function handleRulesClosed(dontShowAgain: boolean) {
    if (dontShowAgain && player) {
      await platformService.markRulesIntroSeen();
      updatePlayer({ ...player, hasSeenRulesIntro: true });
    }
  }

  function handleExtraAttemptGranted() {
    // TODO: see doc/NEXT_STEPS.md — extra-attempt Worker endpoint not yet
    // implemented. Reducer has no action for this yet either.
  }

  const bestRecord = attemptsHistory.reduce<typeof attemptsHistory[number] | null>(
    (best, current) => (current.valid && (!best || current.score > best.score) ? current : best),
    null
  );

  const keyboardOrFooter = isKeyboardExpanded ? (
    <>
      <InputRow
        typedWord={typedWord}
        isSubmitEnabled={isSubmitEnabled}
        onSubmit={submit}
        onClose={collapseKeyboard}
      />
      <VirtualKeyboard lang={config.lang} onLetter={typeLetter} onBackspace={backspace} />
    </>
  ) : (
    <CollapsedFooter
      attemptsUsed={attemptsUsed}
      attemptsLimit={config.attemptsLimit}
      adsEnabled={player?.adsEnabled ?? false}
      onTryAWord={expandKeyboard}
      onExtraAttemptGranted={handleExtraAttemptGranted}
    />
  );

  const plateHeader = (
    <PlateHeader
      config={config}
      bestRecord={bestRecord}
      attemptsHistory={attemptsHistory}
      onBonusInfo={() => openOverlay({ type: "BONUS_INFO" })}
      onOpenAttemptsDetail={() => openOverlay({ type: "ATTEMPTS_DETAIL" })}
    />
  );

  return (
    <div className="game-area relative w-full h-full overflow-hidden p-3">
      <div className="absolute top-4 right-4 flex gap-1.5 z-10">
        <button
          type="button"
          onClick={() => openOverlay({ type: "RULES" })}
          aria-label={t("game.normal.helpAriaLabel")}
          className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center"
        >
          <HelpIcon />
        </button>
        <button
          type="button"
          onClick={config.onExit}
          aria-label={t("game.normal.exitAriaLabel")}
          className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center"
        >
          <ExitIcon />
        </button>
      </div>

      <div className="h-full flex flex-col justify-between gap-3 pt-16 w-full max-w-[560px] mx-auto">
        {plateHeader}
        <div className="flex flex-col gap-2 w-full">{keyboardOrFooter}</div>
      </div>

      <OverlayHost config={config} onRulesClosed={handleRulesClosed} />
    </div>
  );
}