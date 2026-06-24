import type { ReactNode } from "react";
import { useAudio } from "../audio/useAudio";
import { useTranslation } from "../i18n/useTranslation";
import { SettingsGearIcon, BellIcon, SpeakerOnIcon, SpeakerMutedIcon } from "./icons";

export default function PersistentHUD() {
  const { isMuted, toggleMute } = useAudio();
  const { t } = useTranslation();

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <HUDIconButton
        ariaLabel={isMuted ? t("hud.unmute") : t("hud.mute")}
        onClick={toggleMute}
      >
        {isMuted ? <SpeakerMutedIcon /> : <SpeakerOnIcon />}
      </HUDIconButton>

      <HUDIconButton ariaLabel={t("hud.settingsUnavailable")} disabled>
        <SettingsGearIcon />
      </HUDIconButton>

      <HUDIconButton ariaLabel={t("hud.whatsNewUnavailable")} disabled>
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