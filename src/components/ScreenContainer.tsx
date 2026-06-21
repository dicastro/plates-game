import type { ReactNode } from "react";

type OrientationLayout = "row-on-landscape" | "always-column";

interface ScreenContainerProps {
  children: ReactNode;
  orientation?: OrientationLayout;
  className?: string;
}

const ORIENTATION_CLASSES: Record<OrientationLayout, string> = {
  "row-on-landscape": "flex-col landscape:flex-row",
  "always-column": "flex-col",
};

export default function ScreenContainer({
  children,
  orientation = "row-on-landscape",
  className = "",
}: ScreenContainerProps) {
  return (
    <main
      className={`w-screen h-[100dvh] flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] ${ORIENTATION_CLASSES[orientation]} ${className}`}
    >
      {children}
    </main>
  );
}