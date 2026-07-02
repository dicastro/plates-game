import { PlateSeparatorIcon } from "../components/icons";

interface PlateBadgeProps {
  digits: string;
  consonants: string[];
  isJackpot: boolean;
}

export default function PlateBadge({ digits, consonants, isJackpot }: PlateBadgeProps) {
  return (
    <div
      className={`relative w-full [container-type:inline-size] flex items-center justify-center bg-white border-[6px] rounded-2xl ${
        isJackpot ? "border-[var(--color-accent)] shadow-[0_0_0_3px_rgba(240,192,64,0.35)]" : "border-[#1a1a1a]"
      }`}
      style={{ padding: "min(3cqw, 4cqh) min(4cqw, 5cqh)" }}
    >
      <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-[#d8d8d8] border border-[#666]" />
      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#d8d8d8] border border-[#666]" />
      <span className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-[#d8d8d8] border border-[#666]" />
      <span className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#d8d8d8] border border-[#666]" />

      <div className="flex items-center justify-center whitespace-nowrap">
        <span
          className={`font-black tracking-[0.08em] leading-none ${isJackpot ? "text-[#a07000]" : "text-[#1a1a1a]"}`}
          style={{ fontSize: "clamp(28px, min(13cqw, 13cqh), 72px)" }}
        >
          {digits}
        </span>
        <span
          className="text-[#aaa] mx-[1.8cqw] flex-shrink-0"
          style={{ width: "clamp(8px, min(3.5cqw,3.5cqh), 16px)", height: "clamp(8px, min(3.5cqw,3.5cqh), 16px)" }}
        >
          <PlateSeparatorIcon />
        </span>
        <span
          className="font-black tracking-[0.08em] leading-none text-[#1a1a1a]"
          style={{ fontSize: "clamp(28px, min(13cqw, 13cqh), 72px)" }}
        >
          {consonants.join("")}
        </span>
      </div>
    </div>
  );
}