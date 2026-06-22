import type { ReactNode } from "react";
import { SettingsGearIcon, BellIcon } from "./icons";

export default function PersistentHUD() {
  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <HUDIconButton ariaLabel="Settings (not available yet)" disabled>
        <SettingsGearIcon />
      </HUDIconButton>

      <HUDIconButton ariaLabel="What's new (not available yet)" disabled>
        <BellIcon />
      </HUDIconButton>
    </div>
  );
}

function HUDIconButton({
  children,
  onClick,
  ariaLabel,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}