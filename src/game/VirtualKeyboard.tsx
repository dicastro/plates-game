import { useRef, type CSSProperties } from "react";
import { useTranslation } from "../i18n/useTranslation";
import { BackspaceIcon } from "../components/icons";
import { getKeyboardLayout } from "./keyboardLayouts";

const KEY_GAP_PX = 4;
const MAX_KEY_PX = 48;
const MAX_KEY_CQH = 9;
const PRESS_DEBOUNCE_MS = 75;

interface VirtualKeyboardProps {
  lang: string;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
}

export default function VirtualKeyboard({ lang, onLetter, onBackspace }: VirtualKeyboardProps) {
  const { t } = useTranslation();
  const { rows } = getKeyboardLayout(lang);
  const lastRow = rows[rows.length - 1];
  const maxColumns = Math.max(...rows.slice(0, -1).map((r) => r.length), lastRow.length + 1);
  const lastPressRef = useRef(0);

  function guardedPress(fn: () => void) {
    const now = Date.now();
    if (now - lastPressRef.current < PRESS_DEBOUNCE_MS) return;
    lastPressRef.current = now;
    fn();
  }

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