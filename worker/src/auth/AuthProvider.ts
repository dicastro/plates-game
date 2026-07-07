import type { Env } from "../env";
import type { AuthProviderId } from "../../../shared/types";

export interface OAuthCallbackResult {
  externalProviderId: string; // the provider's opaque subject id (e.g. Google's `sub`)
}

export interface AuthProvider {
  readonly id: AuthProviderId;
  buildAuthorizationUrl(env: Env, state: string): string;
  handleCallback(env: Env, code: string): Promise<OAuthCallbackResult>;
}
