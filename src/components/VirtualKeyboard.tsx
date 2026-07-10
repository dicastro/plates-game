import { useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "../i18n/useTranslation";
import { BackspaceIcon } from "../components/icons";
import { getKeyboardLayout } from "./keyboardLayouts";

const KEY_GAP_PX = 4;
const MAX_KEY_PX = 48;
const MAX_KEY_CQH = 9;
const PRESS_DEBOUNCE_MS = 75;
const DIGIT_ROW = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

interface VirtualKeyboardProps {
  lang: string;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  /** When true, adds a mode-toggle key (Aa ⇄ 123) switching to a digits-only
   *  layout. Digits are a primary character class (unlike accents), so they
   *  live on a dedicated mode, never folded into a per-key popover. */
  allowDigits?: boolean;
}

export default function VirtualKeyboard({ lang, onLetter, onBackspace, allowDigits = false }: VirtualKeyboardProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"letters" | "digits">("letters");
  const lastPressRef = useRef(0);

  function guardedPress(fn: () => void) {
    const now = Date.now();
    if (now - lastPressRef.current < PRESS_DEBOUNCE_MS) return;
    lastPressRef.current = now;
    fn();
  }

  if (mode === "digits") {
    const keyStyle: CSSProperties = {
      width: `min(${MAX_KEY_PX}px, ${MAX_KEY_CQH}cqh, calc((100% - ${9 * KEY_GAP_PX}px) / 10))`,
    };
    const wideKeyStyle: CSSProperties extends never ? CSSProperties : CSSProperties = {
      width: `min(${MAX_KEY_PX * 2}px, ${MAX_KEY_CQH}cqh, calc((100% - ${KEY_GAP_PX}px) / 2))`,
    };
    return (
      <div className="flex flex-col gap-1 w-full [container-type:inline-size]">
        <div className="flex justify-center" style={{ gap: `${KEY_GAP_PX}px` }}>
          {DIGIT_ROW.map((digit) => (
            <KeyButton key={digit} onClick={() => guardedPress(() => onLetter(digit))} style={keyStyle}>
              {digit}
            </KeyButton>
          ))}
        </div>
        <div className="flex justify-center" style={{ gap: `${KEY_GAP_PX}px` }}>
          <button
            type="button"
            onClick={() => guardedPress(() => setMode("letters"))}
            style={wideKeyStyle}
            className="rounded-[6px] flex items-center justify-center [aspect-ratio:2/1] bg-[var(--color-surface2)] text-[var(--color-accent)] text-[clamp(11px,3.5cqw,15px)] font-bold"
          >
            ABC
          </button>
          <button
            type="button"
            onClick={() => guardedPress(onBackspace)}
            aria-label={t("game.normal.backspaceAriaLabel")}
            style={wideKeyStyle}
            className="rounded-[6px] flex items-center justify-center [aspect-ratio:2/1] bg-[var(--color-surface2)] text-[var(--color-text-muted)]"
          >
            <BackspaceIcon />
          </button>
        </div>
      </div>
    );
  }

  const { rows } = getKeyboardLayout(lang);
  const lastRow = rows[rows.length - 1];
  const extraKeysInLastRow = allowDigits ? 2 : 1; // mode-toggle + backspace, or just backspace
  const maxColumns = Math.max(...rows.slice(0, -1).map((r) => r.length), lastRow.length + extraKeysInLastRow);

  const keyStyle: CSSProperties = {
    width: `min(${MAX_KEY_PX}px, ${MAX_KEY_CQH}cqh, calc((100% - ${(maxColumns - 1) * KEY_GAP_PX}px) / ${maxColumns}))`,
  };

  return (
    <div className="flex flex-col gap-1 w-full [container-type:inline-size]">
      {rows.slice(0, -1).map((row, i) => (
        <div key={i} className="flex justify-center" style={{ gap: `${KEY_GAP_PX}px` }}>
          {row.map((letter) => (
            <KeyButton key={letter} onClick={() => guardedPress(() => onLetter(letter))} style={keyStyle}>
              {letter}
            </KeyButton>
          ))}
        </div>
      ))}

      <div className="flex justify-center" style={{ gap: `${KEY_GAP_PX}px` }}>
        {allowDigits && (
          <button
            type="button"
            onClick={() => guardedPress(() => setMode("digits"))}
            style={keyStyle}
            className="rounded-[6px] flex items-center justify-center [aspect-ratio:1/1] bg-[var(--color-surface2)] text-[var(--color-accent)] text-[clamp(10px,3cqw,13px)] font-bold"
          >
            123
          </button>
        )}
        {lastRow.map((letter) => (
          <KeyButton key={letter} onClick={() => guardedPress(() => onLetter(letter))} style={keyStyle}>
            {letter}
          </KeyButton>
        ))}
        <button
          type="button"
          onClick={() => guardedPress(onBackspace)}
          aria-label={t("game.normal.backspaceAriaLabel")}
          style={keyStyle}
          className="rounded-[6px] flex items-center justify-center [aspect-ratio:1/1] bg-[var(--color-surface2)] text-[var(--color-text-muted)]"
        >
          <BackspaceIcon />
        </button>
      </div>
    </div>
  );
}

function KeyButton({ children, onClick, style }: { children: string; onClick: () => void; style: CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={children}
      style={style}
      className="rounded-[6px] flex items-center justify-center font-semibold [aspect-ratio:1/1] bg-[var(--color-surface)] text-[var(--color-text)] text-[clamp(13px,4cqw,22px)]"
    >
      {children}
    </button>
  );
}