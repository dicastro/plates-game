import { useTranslation } from "../i18n/useTranslation";
import ScrollableWord from "../components/ScrollableWord";
import type { AttemptRecord } from "../platform/PlatformService";

interface BestScorePanelProps {
  bestRecord: AttemptRecord | null;
  attemptsHistory: AttemptRecord[];
  attemptsLimit: number;
  onOpenDetail: () => void;
}

export default function BestScorePanel({
  bestRecord,
  attemptsHistory,
  attemptsLimit,
  onOpenDetail,
}: BestScorePanelProps) {
  const { t } = useTranslation();

  const dots = Array.from({ length: attemptsLimit }, (_, i) => {
    const attempt = attemptsHistory[i];
    if (!attempt) return "empty";
    return attempt.valid ? "ok" : "err";
  });

  const bestLine = bestRecord
    ? `${bestRecord.word} · ${bestRecord.score} ${t("game.normal.pointsSuffix")}`
    : t("game.normal.noValidWordYet");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpenDetail();
      }}
      className="bg-[var(--color-surface)] rounded-[9px] px-[2.5cqw] py-[1.8cqw] flex flex-col gap-1 w-full text-left cursor-pointer [container-type:inline-size]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[clamp(9px,2.8cqw,12px)] text-[var(--color-text-muted)]">{t("game.normal.bestToday")}</p>
        <div className="flex gap-[1.2cqw] flex-shrink-0">
          {dots.map((status, i) => (
            <span
              key={i}
              className={`rounded-full ${
                status === "ok" ? "bg-[var(--color-success)]" : status === "err" ? "bg-[var(--color-danger)]" : "bg-[var(--color-text-muted)] opacity-40"
              }`}
              style={{ width: "clamp(5px, 1.6cqw, 8px)", height: "clamp(5px, 1.6cqw, 8px)" }}
            />
          ))}
        </div>
      </div>

      <ScrollableWord
        text={bestLine}
        arrowBg="var(--color-surface)"
        className={`font-semibold ${bestRecord ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}`}
        style={{ fontSize: "clamp(13px,4.5cqw,18px)" }}
      />
    </div>
  );
}