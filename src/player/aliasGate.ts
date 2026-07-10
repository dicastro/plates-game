import type { PlayerProfile } from "../platform/PlatformService";

export function needsAliasSetup(profile: PlayerProfile | null): boolean {
  return !!profile && !profile.hasCompletedAliasSetup;
}