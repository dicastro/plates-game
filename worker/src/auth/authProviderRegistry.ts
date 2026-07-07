import type { AuthProviderId } from "../../../shared/types";
import type { AuthProvider } from "./AuthProvider";
import { GoogleAuthProvider } from "./GoogleAuthProvider";

const REGISTRY: Record<AuthProviderId, AuthProvider> = { google: new GoogleAuthProvider() };

export function isSupportedAuthProviderId(id: string): id is AuthProviderId {
  return id in REGISTRY;
}

export function resolveAuthProvider(id: AuthProviderId): AuthProvider | null {
  return REGISTRY[id] ?? null;
}