import type { AuthProvider, OAuthCallbackResult } from "./AuthProvider";
import type { Env } from "../env";
import { verifyGoogleIdToken } from "./verifyGoogleIdToken";
import { AuthProviderId } from "../../../shared/types";

export class GoogleAuthProvider implements AuthProvider {
  readonly id: AuthProviderId = "google";

  buildAuthorizationUrl(env: Env, state: string): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: `${env.OAUTH_REDIRECT_BASE_URL}/auth/google/callback`,
      response_type: "code",
      scope: "openid",
      state,
      prompt: "select_account",
    });
    return `${env.GOOGLE_AUTHORIZATION_ENDPOINT}?${params.toString()}`;
  }

  async handleCallback(env: Env, code: string): Promise<OAuthCallbackResult> {
    const tokenResponse = await fetch(env.GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${env.OAUTH_REDIRECT_BASE_URL}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
    const { id_token } = await tokenResponse.json<{ id_token: string }>();
    if (!id_token) throw new Error("Google token response did not include an id_token.");

    const { sub } = await verifyGoogleIdToken(id_token, env.GOOGLE_CLIENT_ID, env.GOOGLE_JWKS_URL, env.GOOGLE_ISSUER);
    return { externalProviderId: sub };
  }
}