import { withSession } from "./withSession";
import { resolvePlayerStub } from "./resolvePlayerStub";
import { ALIAS_MIN_LENGTH, ALIAS_MAX_LENGTH } from "../../../shared/gameConfig";
import type { AliasCheckContext } from "../../../shared/apiRoutes";

const ALIAS_PATTERN = new RegExp(`^[A-Z0-9]{${ALIAS_MIN_LENGTH},${ALIAS_MAX_LENGTH}}$`);

export const handleAliasCheck = withSession<AliasCheckContext>(async (_request, env, _session, context) => {
  const row = await env.DB.prepare("SELECT 1 FROM aliases WHERE alias = ?").bind(context.alias).first();
  return Response.json({ available: !row });
});

export const handleAliasSetup = withSession(async (request, env, session) => {
  const body = await request.json<{ alias?: string }>();
  const alias = body.alias?.toUpperCase();
  if (!alias || !ALIAS_PATTERN.test(alias)) {
    return Response.json({ success: false, reason: "invalid" }, { status: 400 });
  }

  const stub = resolvePlayerStub(env, session);
  const playerId = await stub.getPlayerId();

  try {
    await env.DB.prepare(
      "INSERT INTO aliases (alias, player_id, auth_provider_id, external_provider_id) VALUES (?, ?, ?, ?)"
    ).bind(alias, playerId, session.authProviderId, session.externalProviderId).run();
  } catch {
    // UNIQUE constraint violation — the D1 INSERT is the authoritative check.
    return Response.json({ success: false, reason: "taken" });
  }

  const player = await stub.completeAliasSetup(alias);
  return Response.json({ success: true, player });
});