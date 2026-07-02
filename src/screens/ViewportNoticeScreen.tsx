import { useTranslation } from "../i18n/useTranslation";
import { RotateIcon, AlertOctagonIcon } from "../components/icons";
import ScreenContainer from "../components/ScreenContainer";

export default function ViewportNoticeScreen({ variant }: { variant: "rotate" | "unsupported" }) {
  const { t } = useTranslation();
  const isRotate = variant === "rotate";

  return (
    <ScreenContainer orientation="always-column" className="gap-4 px-8 text-center">
      <div className="w-16 h-16 text-[var(--color-accent)]">{isRotate ? <RotateIcon /> : <AlertOctagonIcon />}</div>
      <p className="text-lg font-bold">{t(isRotate ? "viewport.rotateTitle" : "viewport.unsupportedTitle")}</p>
      <p className="text-sm text-[var(--color-text-muted)]">{t(isRotate ? "viewport.rotateBody" : "viewport.unsupportedBody")}</p>
    </ScreenContainer>
  );
}