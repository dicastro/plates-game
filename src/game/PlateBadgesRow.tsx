import type { ReactNode } from "react";

export default function PlateBadgesRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">{children}</div>;
}