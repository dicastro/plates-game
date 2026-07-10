import { useState, useEffect, useMemo, useRef, type JSX } from "react";
import { useTranslation } from "../i18n/useTranslation";
import { useNavigation } from "../navigation/NavigationContext";
import { usePlayerSession } from "../player/PlayerSessionContext";
import { platformService } from "../platform/platformServiceInstance";
import ScreenContainer from "../components/ScreenContainer";
import Button from "../components/Button";
import OverlayCard from "../components/OverlayCard";
import {
  HelpIcon, ExitIcon, TrophyIcon, CalendarWeekIcon, CalendarMonthIcon, CalendarYearIcon,
  ChevronLeftIcon, ChevronRightIcon, SkipToEndIcon,
} from "../components/icons";
import { DICT_TARGET_LANG } from "../config/locale";
import { isoWeekKeyToRange } from "../leaderboard/weekRangeFormat";
import type { LeaderboardPeriod, LeaderboardResult, AvailableLeaderboardPeriods, LeaderboardEntry } from "../platform/PlatformService";

interface MonthOption { year: number; month: number }
type TFunc = (key: string, vars?: Record<string, string | number>) => string;
type OwnRowPosition = "above" | "in-view" | "below";

function useOwnRowPosition(containerRef: React.RefObject<HTMLDivElement | null>, anchorRef: React.RefObject<HTMLDivElement | null>, active: boolean): OwnRowPosition {
  const [position, setPosition] = useState<OwnRowPosition>("below");

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    const anchor = anchorRef.current;
    if (!container || !anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPosition("in-view");
        } else if (entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0)) {
          setPosition("above");
        } else {
          setPosition("below");
        }
      },
      { root: container, threshold: 0 }
    );
    observer.observe(anchor);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return position;
}

export default function LeaderboardScreen() {
  const { t, locale } = useTranslation();
  const { navigate } = useNavigation();
  const { player } = usePlayerSession();

  const [available, setAvailable] = useState<AvailableLeaderboardPeriods | null>(null);
  const [activeTab, setActiveTab] = useState<LeaderboardPeriod | null>(null);
  const [monthIndex, setMonthIndex] = useState(0);
  const [yearIndex, setYearIndex] = useState(0);
  const [country, setCountry] = useState<string | undefined>(undefined);
  const [helpOpen, setHelpOpen] = useState(false);
  const [accumHelpOpen, setAccumHelpOpen] = useState(false);
  const [result, setResult] = useState<LeaderboardResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const listRef = useRef<HTMLDivElement>(null);
  const ownRowAnchorRef = useRef<HTMLDivElement>(null);

  const isOwnAlias = (alias: string) => player?.alias === alias;

  const hasOwnRow = !!result?.ownEntry || (result?.entries.some((e) => isOwnAlias(e.alias)) ?? false);
  const ownRowPosition = useOwnRowPosition(listRef, ownRowAnchorRef, hasOwnRow);
  const ownRowData: LeaderboardEntry | undefined = result?.ownEntry ?? result?.entries.find((e) => isOwnAlias(e.alias));

  const monthsAsc = useMemo(() => [...(available?.months ?? [])].sort((a, b) => a.year - b.year || a.month - b.month), [available]);
  const yearsAsc = useMemo(() => [...(available?.years ?? [])].sort((a, b) => a - b), [available]);

  function defaultTab(periods: AvailableLeaderboardPeriods): LeaderboardPeriod | null {
    if (periods.week) return "week";
    if (periods.months.length > 0) return "month";
    if (periods.years.length > 0) return "year";
    return null;
  }

  useEffect(() => {
    let cancelled = false;
    platformService.getAvailableLeaderboardPeriods(DICT_TARGET_LANG).then((periods) => {
      if (cancelled) return;
      setAvailable(periods);
      const tab = defaultTab(periods);
      setActiveTab(tab);
      if (tab === null) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  function handleTabClick(tabId: LeaderboardPeriod) {
    setResult(null);
    setIsLoading(true);
    setActiveTab(tabId);
    if (tabId === "month") setMonthIndex(monthsAsc.length - 1);
    if (tabId === "year") setYearIndex(yearsAsc.length - 1);
  }

  function handleMonthIndexChange(i: number) { setResult(null); setIsLoading(true); setMonthIndex(i); }
  function handleYearIndexChange(i: number) { setResult(null); setIsLoading(true); setYearIndex(i); }
  function handleCountryChange(c: string | undefined) { setResult(null); setIsLoading(true); setCountry(c); }

  const selectedMonth: MonthOption | null = activeTab === "month" ? (monthsAsc[monthIndex] ?? null) : null;
  const selectedYear: number | null = activeTab === "year" ? (yearsAsc[yearIndex] ?? null) : null;

  useEffect(() => {
    if (!activeTab) return;
    if (activeTab === "month" && !selectedMonth) return;
    if (activeTab === "year" && selectedYear === null) return;

    let cancelled = false;
    platformService
      .getLeaderboard(DICT_TARGET_LANG, activeTab, country, selectedMonth?.year ?? selectedYear ?? undefined, selectedMonth?.month)
      .then((res) => { if (!cancelled) { setResult(res); setIsLoading(false); } });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, monthIndex, yearIndex, country]);

  const isLatestMonth = activeTab === "month" && monthIndex === monthsAsc.length - 1;
  const isLatestYear = activeTab === "year" && yearIndex === yearsAsc.length - 1;

  const tabs: Array<{ id: LeaderboardPeriod; icon: JSX.Element; label: string }> = [];
  if (available?.week) tabs.push({ id: "week", icon: <CalendarWeekIcon />, label: t("leaderboard.tabWeek") });
  if (monthsAsc.length > 0) tabs.push({ id: "month", icon: <CalendarMonthIcon />, label: t("leaderboard.tabMonth") });
  if (yearsAsc.length > 0) tabs.push({ id: "year", icon: <CalendarYearIcon />, label: t("leaderboard.tabYear") });
  if (available?.week) tabs.push({ id: "total", icon: <TrophyIcon />, label: t("leaderboard.tabTotal") });

  function intervalLabel(label: string): string | null {
    if (activeTab === "week" || activeTab === "total") {
        const { start, end } = isoWeekKeyToRange(label);
        if (activeTab === "week") {
          const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
          return t("leaderboard.intervalWeek", { start: fmt.format(start), end: fmt.format(end) });
        }
        const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });
        return t("leaderboard.intervalTotal", { date: fmt.format(end) });
    }
    return null; // month/year: the navigator already conveys this, no redundant text
  }

  const helpBodyKey =
    activeTab === "week" ? "leaderboard.helpBodyWeek"
      : activeTab === "month" ? "leaderboard.helpBodyMonth"
        : activeTab === "year" ? "leaderboard.helpBodyYear"
          : "leaderboard.helpBodyTotal";

  const accumHelpBodyKey =
    activeTab === "week" ? "leaderboard.accumHelpBodyWeek"
      : activeTab === "month" ? "leaderboard.accumHelpBodyMonth"
        : activeTab === "year" ? "leaderboard.accumHelpBodyYear"
          : "leaderboard.accumHelpBodyTotal";

  const accumScoreValue =
    activeTab === "week" ? player?.weekCurrentScore ?? 0
      : activeTab === "month" && isLatestMonth ? player?.monthCurrentScore ?? 0
        : activeTab === "year" && isLatestYear ? player?.yearCurrentScore ?? 0
          : activeTab === "total" ? player?.weekCurrentScore ?? 0
            : null;

  const accumulatorText =
    accumScoreValue === null ? null
      : activeTab === "week" ? t("leaderboard.yourScoreWeek", { score: accumScoreValue })
        : activeTab === "month" ? t("leaderboard.yourScoreMonth", { score: accumScoreValue })
          : activeTab === "year" ? t("leaderboard.yourScoreYear", { score: accumScoreValue })
            : t("leaderboard.yourScoreNotYetIncluded", { score: accumScoreValue });

  return (
    <ScreenContainer orientation="always-column" className="fluid-text-area gap-0 px-0 relative">
      <div className="absolute top-4 right-4 flex gap-1.5 z-10">
        <button type="button" onClick={() => setHelpOpen(true)} aria-label={t("leaderboard.helpAriaLabel")}
          className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center">
          <HelpIcon />
        </button>
        <button type="button" onClick={() => navigate("HOME")} aria-label={t("leaderboard.exitAriaLabel")}
          className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center">
          <ExitIcon />
        </button>
      </div>

      <div className="w-full max-w-[560px] mx-auto h-full flex flex-col p-3 pt-16 gap-3">
        {!activeTab && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="w-10 h-10 text-[var(--color-accent)]"><TrophyIcon /></div>
            <p className="text-overlay-title-sm font-bold text-[var(--color-text)]">{t("leaderboard.emptyNoPlayersTitle")}</p>
            <p className="text-overlay-body text-[var(--color-text-muted)]">{t("leaderboard.emptyNoPlayersBody")}</p>
            <Button variant="primary" onClick={() => navigate("HOME")}>{t("leaderboard.ctaPlayNow")}</Button>
          </div>
        )}

        {activeTab && (
          <>
            {result?.intervalLabel !== undefined && (
              <p className="text-panel-label text-[var(--color-text-muted)] text-center">{intervalLabel(result.intervalLabel)}</p>
            )}

            {accumulatorText && (
              <div className="bg-[var(--color-surface)] rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-panel-label text-[var(--color-accent)] font-semibold">{accumulatorText}</span>
                {accumScoreValue !== null && accumScoreValue > 0 && (
                  <button type="button" onClick={() => setAccumHelpOpen(true)} aria-label={t("leaderboard.accumHelpAriaLabel")}
                    className="w-5 h-5 flex-shrink-0 text-[var(--color-text-muted)] flex items-center justify-center">
                    <HelpIcon />
                  </button>
                )}
              </div>
            )}

            {activeTab === "month" && selectedMonth && (
              <PeriodNavigator
                label={t("leaderboard.monthSelectorLabel")}
                options={monthsAsc}
                index={monthIndex}
                onChange={handleMonthIndexChange}
                formatOption={(m) => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(Date.UTC(m.year, m.month - 1, 1)))}
                t={t}
              />
            )}

            {activeTab === "year" && selectedYear !== null && (
              <PeriodNavigator
                label={t("leaderboard.yearSelectorLabel")}
                options={yearsAsc}
                index={yearIndex}
                onChange={handleYearIndexChange}
                formatOption={(y) => String(y)}
                t={t}
              />
            )}

            <select
              value={country ?? ""}
              onChange={(e) => handleCountryChange(e.target.value || undefined)}
              className="w-full text-panel-label text-[var(--color-text)] bg-[var(--color-surface2)] rounded-lg px-3 py-2 border border-[var(--color-border)]"
            >
              <option value="">
                {result?.totalCountries !== undefined
                  ? t("leaderboard.allCountriesWithCount", { count: result.totalCountries })
                  : t("leaderboard.allCountries")}
              </option>
              {player?.country && <option value={player.country}>{player.country}</option>}
            </select>

            <div ref={listRef} className="flex-1 overflow-y-auto flex flex-col gap-1 relative">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-5 rounded-md leaderboard-skeleton" />)
              ) : result && result.entries.length > 0 ? (
                <>
                  {ownRowData && ownRowPosition === "above" && (
                    <div className="sticky top-0 z-10 bg-[var(--color-bg)] pb-1">
                      <RankRow entry={ownRowData} isSelf t={t} />
                    </div>
                  )}

                  {result.entries.map((entry) => (
                    <div key={entry.rank} ref={isOwnAlias(entry.alias) ? ownRowAnchorRef : undefined}>
                      <RankRow entry={entry} isSelf={isOwnAlias(entry.alias)} t={t} />
                    </div>
                  ))}

                  {result.ownEntry && (
                    <>
                      <div className="text-center text-[var(--color-text-muted)] text-panel-label">&#8942;</div>
                      <div ref={ownRowAnchorRef}>
                        <RankRow entry={result.ownEntry} isSelf t={t} />
                      </div>
                    </>
                  )}

                  {result.totalPlayers > result.entries.length && (
                    <p className="text-panel-label text-[var(--color-text-muted)] text-center mt-2">
                      {t("leaderboard.totalPlayers", { count: result.entries.length, total: result.totalPlayers })}
                    </p>
                  )}

                  {ownRowData && ownRowPosition === "below" && (
                    <div className="sticky bottom-0 z-10 bg-[var(--color-bg)] pt-1">
                      <RankRow entry={ownRowData} isSelf t={t} />
                    </div>
                  )}

                  {!result.ownEntry && !result.entries.some((e) => isOwnAlias(e.alias)) && (
                    <p className="text-panel-label text-[var(--color-text-muted)] text-center mt-2">{t("leaderboard.notPlayedYetBody")}</p>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
                  <p className="text-overlay-title-sm font-bold text-[var(--color-text)]">{t("leaderboard.emptyNoPlayersTitle")}</p>
                  <p className="text-overlay-body text-[var(--color-text-muted)]">{t("leaderboard.emptyNoPlayersBody")}</p>
                  <Button variant="primary" onClick={() => navigate("NORMAL_GAME")}>{t("leaderboard.ctaPlayNow")}</Button>
                </div>
              )}
            </div>
          </>
        )}

        {tabs.length > 0 && (
          <div className="flex gap-1 pt-2 border-t border-[var(--color-border)]">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => handleTabClick(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg text-panel-label ${activeTab === tab.id ? "bg-[var(--color-accent)] text-[#1a1a1a]" : "text-[var(--color-text-muted)]"
                  }`}>
                <span className="w-5 h-5">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {helpOpen && (
        <OverlayCard onClose={() => setHelpOpen(false)}>
          <p className="text-overlay-title-sm font-bold text-[var(--color-accent)] mb-3">{t("leaderboard.helpTitle")}</p>
          <p className="text-overlay-body text-[var(--color-text)] text-left">{t(helpBodyKey)}</p>
        </OverlayCard>
      )}

      {accumHelpOpen && (
        <OverlayCard onClose={() => setAccumHelpOpen(false)}>
          <p className="text-overlay-title-sm font-bold text-[var(--color-accent)] mb-3">{t("leaderboard.accumHelpTitle")}</p>
          <p className="text-overlay-body text-[var(--color-text)] text-left">{t(accumHelpBodyKey)}</p>
        </OverlayCard>
      )}
    </ScreenContainer>
  );
}

function PeriodNavigator<T>({
  label, options, index, onChange, formatOption, t,
}: {
  label: string;
  options: T[];
  index: number;
  onChange: (index: number) => void;
  formatOption: (option: T) => string;
  t: TFunc;
}) {
  const atStart = index <= 0;
  const atEnd = index >= options.length - 1;
  const disabled = options.length <= 1;
  // Displayed most-recent-first; underlying index stays ascending (0 =
  // oldest) so prev/next semantics (older/newer) don't have to change.
  const displayOrder = options.map((opt, i) => ({ opt, i })).slice().reverse();

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-overlay-body-sm text-[var(--color-text-muted)]">{label}</span>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => onChange(index - 1)} disabled={atStart} aria-label={t("leaderboard.prevAriaLabel")}
          className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-[var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeftIcon />
        </button>
        <select value={index} onChange={(e) => onChange(Number(e.target.value))} disabled={disabled}
          className="flex-1 text-panel-value text-center bg-[var(--color-surface2)] text-[var(--color-text)] rounded-md px-2 py-1.5 border border-[var(--color-border)] disabled:opacity-60">
          {displayOrder.map(({ opt, i }) => (<option key={i} value={i}>{formatOption(opt)}</option>))}
        </select>
        <button type="button" onClick={() => onChange(index + 1)} disabled={atEnd} aria-label={t("leaderboard.nextAriaLabel")}
          className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-[var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRightIcon />
        </button>
        <button type="button" onClick={() => onChange(options.length - 1)} disabled={atEnd} aria-label={t("leaderboard.latestAriaLabel")}
          className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-[var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed">
          <SkipToEndIcon />
        </button>
      </div>
    </div>
  );
}

function RankRow({ entry, isSelf, t }: { entry: LeaderboardEntry; isSelf: boolean; t: TFunc }) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-table-row ${isSelf ? "bg-[var(--color-accent)] text-[#1a1a1a] font-bold" : "text-[var(--color-text)]"}`}>
      <span className="w-7 flex-shrink-0 text-right tabular-nums">{entry.rank}</span>
      <span className="flex-1 truncate text-left">{entry.alias}</span>
      <span className="w-8 flex-shrink-0 text-center text-panel-label" aria-label={t("leaderboard.rankAriaCountry", { country: entry.country })}>{entry.country}</span>
      <span className="w-14 flex-shrink-0 text-right tabular-nums font-semibold">{entry.score}</span>
    </div>
  );
}