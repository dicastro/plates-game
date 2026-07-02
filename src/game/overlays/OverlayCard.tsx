import type { ReactNode } from "react";
import { CloseIcon } from "../../components/icons";

interface OverlayCardProps {
  children: ReactNode;
  onClose?: () => void;
  accent?: boolean;
}

export default function OverlayCard({ children, onClose, accent = false }: OverlayCardProps) {
  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2">
      <div
        className={`bg-[var(--color-surface)] border-2 rounded-2xl relative text-center w-full [container-type:inline-size] ${
          accent ? "border-[var(--color-accent)]" : "border-[var(--color-border)]"
        }`}
        style={{
          maxWidth: "clamp(340px, 80cqw, 560px)",
          padding: "clamp(18px, 5cqw, 32px)",
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ width: "clamp(24px, 6cqw, 36px)", height: "clamp(24px, 6cqw, 36px)" }}
            className="absolute top-3 right-3 rounded-full bg-[#0e2615] border-[1.5px] border-[var(--color-border)] text-[var(--color-text-muted)] flex items-center justify-center p-1.5"
          >
            <CloseIcon />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}