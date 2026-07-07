import { withSession } from "./withSession";
import { resolvePlayerStub } from "./resolvePlayerStub";

export const handlePlayerPrefs = withSession(async (request, env, session) => {
  const body = await request.json<{ lang?: string; hasSeenRulesIntro?: boolean }>();
  if (!body.lang || body.hasSeenRulesIntro !== true) {
    return new Response("Missing lang or unsupported preference update.", { status: 400 });
  }

  const stub = resolvePlayerStub(env, session);
  await stub.setRulesIntroSeen(body.lang);
  return new Response(null, { status: 204 });
});