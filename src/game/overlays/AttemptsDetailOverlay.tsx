// src/game/overlays/AttemptsDetailOverlay.tsx
import { useTranslation } from "../../i18n/useTranslation";
import OverlayCard from "./OverlayCard";
import ScrollableWord from "../../components/ScrollableWord";
import type { AttemptRecord } from "../../platform/PlatformService";

export default function AttemptsDetailOverlay({
  attemptsHistory,
  onClose,
}: {
  attemptsHistory: AttemptRecord[];
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <OverlayCard onClose={onClose}>
      <p className="font-bold text-[var(--color-accent)] mb-3 text-[clamp(15px,4.5cqw,20px)]">
        {t("game.normal.attemptsDetailTitle")}
      </p>
      {attemptsHistory.length === 0 ? (
        <p className="text-[var(--color-text-muted)] text-[clamp(12px,3.5cqw,15px)]">
          {t("game.normal.noAttemptsYetBody")}
        </p>
      ) : (
        <>
          <p className="text-[var(--color-text)] text-left mb-3 text-[clamp(11px,3.2cqw,14px)]">
            {t("game.normal.attemptsDetailBody")}
          </p>
          <table className="w-full text-left text-[clamp(13px,4cqw,16px)] table-fixed">
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: "67%" }} />
              <col style={{ width: "25%" }} />
            </colgroup>
            <tbody>
              {attemptsHistory.map((a, i) => (
                <tr key={i} className="border-t border-[var(--color-border)]">
                  <td className="py-2.5 align-middle">{i + 1}</td>
                  <td className="py-2.5 align-middle overflow-hidden max-w-0">
                    <ScrollableWord
                      text={a.word}
                      arrowBg="var(--color-surface)"
                      className={a.valid ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}
                    />
                  </td>
                  <td className="py-2.5 align-middle text-right text-[var(--color-accent)]">
                    {a.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </OverlayCard>
  );
}