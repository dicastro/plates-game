import { withSession } from "./withSession";
import { resolvePlayerStub } from "./resolvePlayerStub";

export const handleNormalAttempt = withSession(async (request, env, session) => {
  const body = await request.json<{ lang?: string; word?: string }>();
  if (!body.lang || !body.word) return new Response("Missing lang or word.", { status: 400 });

  const stub = resolvePlayerStub(env, session);
  try {
    return Response.json(await stub.submitAttempt(body.lang, body.word));
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Attempt rejected.", { status: 400 });
  }
});