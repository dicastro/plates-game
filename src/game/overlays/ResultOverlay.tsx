import { useTranslation } from "../../i18n/useTranslation";
import { ShareIcon, TrophyIcon, CheckCircleIcon, SearchIcon } from "../../components/icons";
import OverlayCard from "../../components/OverlayCard";
import ScrollableWord from "../../components/ScrollableWord";
import type { AttemptRecord } from "../../platform/PlatformService";

interface ResultOverlayProps {
  outcome: "NEW_BEST" | "VALID_NOT_BEST" | "INVALID";
  record: AttemptRecord;
  bestScore: number;
  attemptsRemaining: number;
  onClose: () => void;
}

const iconBoxStyle = { width: "clamp(32px, 11cqw, 56px)", height: "clamp(32px, 11cqw, 56px)" };

export default function ResultOverlay({ outcome, record, bestScore, attemptsRemaining, onClose }: ResultOverlayProps) {
  const { t } = useTranslation();
  const isExhausted = attemptsRemaining <= 0;

  if (outcome === "NEW_BEST") {
    return (
      <OverlayCard onClose={onClose} accent>
        <div className="flex justify-center text-[var(--color-accent)] mb-3 mx-auto" style={iconBoxStyle}><TrophyIcon /></div>
        <p className="font-bold text-[var(--color-accent)] mb-2 text-[clamp(16px,5cqw,24px)]">{t("game.normal.newBestTitle")}</p>
        <ScrollableWord
          text={record.word}
          wrapperClassName="mb-1"
          className="font-bold tracking-wide text-center"
          arrowBg="var(--color-surface)"
          style={{ fontSize: "clamp(16px,5cqw,24px)" }}
        />
        <p className="text-[var(--color-success)] mb-4 text-[clamp(12px,4cqw,16px)]">
          {record.score} {t("game.normal.points")}
        </p>
        <button
          type="button"
          onClick={() => {/* TODO: see doc/NEXT_STEPS.md — share semantics not resolved */}}
          className="w-full rounded-[9px] py-2.5 mb-2 bg-[var(--color-accent)] text-[#1a1a1a] font-bold flex items-center justify-center gap-2 text-[clamp(12px,3.5cqw,15px)]"
        >
          <span style={{ width: "1.2em", height: "1.2em" }}><ShareIcon /></span> {t("game.normal.shareResult")}
        </button>
        <button type="button" onClick={onClose} className="w-full rounded-lg border-[1.5px] border-[var(--color-accent)] text-[var(--color-accent)] font-bold py-2.5 text-[clamp(11px,3cqw,13px)]">
          {t("game.normal.continueButton")}
        </button>
      </OverlayCard>
    );
  }

  if (outcome === "VALID_NOT_BEST") {
    return (
      <OverlayCard onClose={onClose}>
        <div className="flex justify-center text-[var(--color-success)] mb-3 mx-auto" style={iconBoxStyle}><CheckCircleIcon /></div>
        <p className="font-bold mb-2 text-[clamp(16px,5cqw,24px)]">{t("game.normal.validNotBestTitle")}</p>
        <ScrollableWord
          text={record.word}
          wrapperClassName="mb-1"
          className="font-bold tracking-wide text-center"
          arrowBg="var(--color-surface)"
          style={{ fontSize: "clamp(16px,5cqw,24px)" }}
        />
        <p className="text-[var(--color-text-muted)] text-[clamp(12px,3.5cqw,15px)]">
          {record.score} {t("game.normal.points")}
        </p>
        <p className="text-[var(--color-text-muted)] mb-4 text-[clamp(11px,3cqw,13px)]">
          {t("game.normal.stillTodaysBestLine", { score: bestScore })}
        </p>
        <button
          type="button"
          onClick={() => {/* TODO: see doc/NEXT_STEPS.md — share semantics not resolved */}}
          className="w-full rounded-lg border-[1.5px] border-[var(--color-accent)] text-[var(--color-accent)] font-bold py-2.5 mb-2 flex items-center justify-center gap-2 text-[clamp(12px,3.5cqw,15px)]"
        >
          <span style={{ width: "1.2em", height: "1.2em" }}><ShareIcon /></span> {t("game.normal.shareChallenge")}
        </button>
        <button type="button" onClick={onClose} className="w-full rounded-[9px] py-2.5 bg-[var(--color-accent)] text-[#1a1a1a] font-bold text-[clamp(12px,3.5cqw,15px)]">
          {isExhausted ? t("game.normal.continueButton") : t("game.normal.tryAgain")}
        </button>
      </OverlayCard>
    );
  }

  return (
    <OverlayCard onClose={onClose}>
      <div className="flex justify-center text-[var(--color-danger)] mb-3 mx-auto" style={iconBoxStyle}><SearchIcon /></div>
      <p className="font-bold text-[var(--color-danger)] mb-2 text-[clamp(16px,5cqw,24px)]">{t("game.normal.notInDictionaryTitle")}</p>
      <ScrollableWord
        text={record.word}
        wrapperClassName="mb-3"
        className="font-bold text-[var(--color-text-muted)] line-through text-center"
        arrowBg="var(--color-surface)"
        style={{ fontSize: "clamp(14px,4.5cqw,20px)" }}
      />
      <p className="mb-4 text-[clamp(11px,3.2cqw,14px)]">
        {isExhausted
          ? t("game.normal.noAttemptsLeftBody")
          : t(attemptsRemaining === 1 ? "game.normal.attemptsLeftOne" : "game.normal.attemptsLeftOther", { count: attemptsRemaining })}
      </p>
      <button type="button" onClick={onClose} className="w-full rounded-[9px] py-2.5 bg-[var(--color-accent)] text-[#1a1a1a] font-bold text-[clamp(12px,3.5cqw,15px)]">
        {isExhausted ? t("game.normal.continueButton") : t("game.normal.tryAgain")}
      </button>
    </OverlayCard>
  );
}