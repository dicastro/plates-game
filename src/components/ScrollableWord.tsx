import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { useTranslation } from "../i18n/useTranslation";

interface ScrollableWordProps {
  text: string;
  wrapperClassName?: string;
  className?: string;
  style?: CSSProperties;
  followEnd?: boolean;
  arrowBg: string;
}

// MS per character for the right-arrow animation. Constant velocity — no
// ease-in/ease-out. Adjust to taste once tested on real devices.
const MS_PER_CHAR = 60;
const DUR_LEFT = 160; // fast — always goes to absolute start

type EasingType = "linear" | "cubic-ease-in-out";

function animateScroll(
  el: HTMLElement,
  target: number,
  duration: number,
  easing: EasingType,
  onDone: () => void,
): void {
  const start = el.scrollLeft;
  const distance = target - start;
  if (Math.abs(distance) < 1) { onDone(); return; }
  const t0 = performance.now();
  function step(now: number) {
    const elapsed = Math.min(now - t0, duration);
    const t = elapsed / duration;
    const progress =
      easing === "linear"
        ? t
        : t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    el.scrollLeft = start + distance * progress;
    if (elapsed < duration) requestAnimationFrame(step);
    else { el.scrollLeft = target; onDone(); }
  }
  requestAnimationFrame(step);
}

function isAtEnd(el: HTMLElement): boolean {
  return el.scrollWidth - el.scrollLeft - el.clientWidth < 1;
}

const ICON_PX = 20;
const BTN_W = ICON_PX;

export default function ScrollableWord({
  text,
  wrapperClassName = "",
  className = "",
  style,
  followEnd = false,
  arrowBg,
}: ScrollableWordProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [animating, setAnimating] = useState(false);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollWidth > el.clientWidth && !isAtEnd(el));
  }

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (followEnd) el.scrollLeft = el.scrollWidth;
    updateArrows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function onScrollAnimationDone() {
    setAnimating(false);
    updateArrows();
  }

  function handleLeft() {
    const el = scrollRef.current;
    if (!el || animating) return;
    setAnimating(true);
    animateScroll(el, 0, DUR_LEFT, "cubic-ease-in-out", onScrollAnimationDone);
  }

  function handleRight() {
    const el = scrollRef.current;
    if (!el || animating) return;
    const target = el.scrollWidth - el.clientWidth;
    setAnimating(true);
    animateScroll(el, target, text.length * MS_PER_CHAR, "linear", onScrollAnimationDone);
  }

  const btnStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    top: 0,
    bottom: 0,
    [side]: 0,
    width: BTN_W,
    background: arrowBg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  });

  const showLeft = !animating && canScrollLeft;
  const showRight = !animating && canScrollRight;

  return (
    <div
      className={wrapperClassName}
      style={{ position: "relative", overflow: "hidden", width: "100%", minWidth: 0 }}
    >
      <div
        ref={scrollRef}
        onScroll={!animating ? updateArrows : undefined}
        className={`overflow-x-auto no-scrollbar whitespace-nowrap ${className}`}
        style={style}
      >
        {text}
      </div>

      {showLeft && (
        <button type="button" onClick={handleLeft} aria-label={t("game.normal.scrollToStart")} style={btnStyle("left")}>
          <span style={{ width: ICON_PX, height: ICON_PX, display: "flex" }} className="text-[var(--color-accent)]">
            <ChevronLeftIcon />
          </span>
        </button>
      )}

      {showRight && (
        <button type="button" onClick={handleRight} aria-label={t("game.normal.scrollToEnd")} style={btnStyle("right")}>
          <span style={{ width: ICON_PX, height: ICON_PX, display: "flex" }} className="text-[var(--color-accent)]">
            <ChevronRightIcon />
          </span>
        </button>
      )}
    </div>
  );
}