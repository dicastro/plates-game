import { withSession } from "./withSession";
import { resolvePlayerStub } from "./resolvePlayerStub";

export const handleNormalEnter = withSession(async (request, env, session) => {
  const body = await request.json<{ lang?: string }>();
  if (!body.lang) return new Response("Missing lang.", { status: 400 });

  const stub = resolvePlayerStub(env, session);
  return Response.json(await stub.enterNormalMode(body.lang));
});