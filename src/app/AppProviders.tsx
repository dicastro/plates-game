import type { ReactNode } from "react";
import { ThemeProvider } from "../theme/ThemeProvider";
import { PlayerSessionProvider } from "../player/PlayerSessionContext";
import { AudioRuntimeProvider } from "../audio/AudioRuntimeContext";
import { NavigationProvider } from "../navigation/NavigationContext";

/**
 * Composes all app-wide providers. None of them depends on another at the
 * provider-definition level — order here is for readability only. Hooks that
 * combine multiple contexts (e.g. useAudio) do so at the consuming-component
 * level, where every provider is already available regardless of nesting order.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PlayerSessionProvider>
        <AudioRuntimeProvider>
          <NavigationProvider>{children}</NavigationProvider>
        </AudioRuntimeProvider>
      </PlayerSessionProvider>
    </ThemeProvider>
  );
}