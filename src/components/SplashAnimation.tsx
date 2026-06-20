import { useTranslation } from "../i18n/useTranslation";

const REEL_LETTERS: string[][] = [
  ["P", "W", "Q", "X", "B", "M", "Z", "K", "P"],
  ["L", "J", "R", "V", "N", "H", "G", "D", "L"],
  ["A", "Z", "G", "C", "F", "T", "Y", "S", "A"],
  ["T", "X", "C", "Q", "K", "F", "N", "V", "T"],
  ["E", "R", "V", "J", "Z", "W", "H", "M", "E"],
  ["S", "G", "H", "M", "Q", "B", "D", "F", "S"],
];

export default function SplashAnimation() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative inline-flex items-center bg-white border-[5px] border-[#1a1a1a] rounded-2xl px-5 py-3">
        <span className="absolute top-[7px] left-2 w-[9px] h-[9px] rounded-full bg-[#d8d8d8] border-[1.5px] border-[#666]" />
        <span className="absolute top-[7px] right-2 w-[9px] h-[9px] rounded-full bg-[#d8d8d8] border-[1.5px] border-[#666]" />
        <span className="absolute bottom-[7px] left-2 w-[9px] h-[9px] rounded-full bg-[#d8d8d8] border-[1.5px] border-[#666]" />
        <span className="absolute bottom-[7px] right-2 w-[9px] h-[9px] rounded-full bg-[#d8d8d8] border-[1.5px] border-[#666]" />

        <div className="flex items-center h-[50px] overflow-hidden">
          {REEL_LETTERS.map((letters, i) => (
            <div key={i} className="w-9 h-[50px] overflow-hidden">
              <div className={`flex flex-col plates-reel-${i}`}>
                {letters.map((letter, j) => (
                  <span
                    key={j}
                    className="h-[50px] w-9 flex items-center justify-center font-black text-[42px] text-[#1a1a1a]"
                    style={{ fontFamily: "'Arial Black', Arial, sans-serif" }}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
        {t("app.tagline")}
      </p>

      <div className="flex gap-[7px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[7px] h-[7px] rounded-full bg-[var(--color-accent)] plates-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}