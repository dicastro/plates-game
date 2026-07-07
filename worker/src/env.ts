import type { PlayerDO } from "./durable-objects/PlayerDO";

export interface Env {
  PLAYER_DO: DurableObjectNamespace<PlayerDO>;
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SIGNING_SECRET: string;
  OAUTH_REDIRECT_BASE_URL: string;
  GOOGLE_AUTHORIZATION_ENDPOINT: string;
  GOOGLE_TOKEN_ENDPOINT: string;
  GOOGLE_JWKS_URL: string;
  GOOGLE_ISSUER: string;
  ALLOWED_ORIGINS: string;
  FRONTEND_BASE_URL: string;
}