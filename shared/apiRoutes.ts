// Single source of truth for every Worker route and its query-param contract.
// Neither the client nor the Worker construct a path or query key on their
// own — both import from here, so drift between them is a compile-time
// error, not a runtime bug caught in QA.

import type { LeaderboardPeriodType } from "./types";

// ---- Named query-param shapes — one per distinct query shape used by any route ----
export interface PlayerSessionQueryParams { lang: string; }
export interface AuthStartQueryParams { intent?: string; }
export interface AuthCallbackQueryParams { code: string; state: string; }
export interface AliasCheckQueryParams { alias: string; }
export interface LeaderboardQueryParams {
  period: LeaderboardPeriodType;
  country?: string;
  year?: number;
  month?: number;
}

// ---- Named path-param shapes ----
export interface AuthProviderPathParams { provider: string; }
export interface LangPathParams { lang: string; }
export type NoPathParams = Record<never, never>;
type EmptyQuery = Record<never, never>;

export type ParseResult<T> = { ok: true; value: T } | { ok: false; missingParams: string[] };

interface QueryCodec<Q> {
  build(query: Q): string;
  parse(searchParams: URLSearchParams): ParseResult<Q>;
}

const NO_QUERY: QueryCodec<EmptyQuery> = {
  build: () => "",
  parse: () => ({ ok: true, value: {} }),
};

const playerSessionQuery: QueryCodec<PlayerSessionQueryParams> = {
  build: (q) => new URLSearchParams({ lang: q.lang }).toString(),
  parse: (sp) => {
    const lang = sp.get("lang");
    return lang
      ? { ok: true, value: { lang } }
      : { ok: false, missingParams: ["lang"] };
  },
};

const authStartQuery: QueryCodec<AuthStartQueryParams> = {
  build: (q) => { const sp = new URLSearchParams(); if (q.intent) sp.set("intent", q.intent); return sp.toString(); },
  parse: (sp) => ({ ok: true, value: { intent: sp.get("intent") ?? undefined } }),
};

const authCallbackQuery: QueryCodec<AuthCallbackQueryParams> = {
  build: () => "", // never built by our own code — controlled entirely by Google's redirect
  parse(sp) {
    const code = sp.get("code");
    const state = sp.get("state");
    const missing = [!code && "code", !state && "state"].filter((x): x is string => !!x);
    return missing.length > 0
      ? { ok: false, missingParams: missing}
      : { ok: true, value: { code: code!, state: state! }};
  },
};

const aliasCheckQuery: QueryCodec<AliasCheckQueryParams> = {
  build: (q) => new URLSearchParams({ alias: q.alias }).toString(),
  parse: (sp) => {
    const alias = sp.get("alias");
    return alias
      ? { ok: true, value: { alias } }
      : { ok: false, missingParams: ["alias"] };
  },
};

const leaderboardQuery: QueryCodec<LeaderboardQueryParams> = {
  build(q) {
    const sp = new URLSearchParams({ period: q.period });
    if (q.country) sp.set("country", q.country);
    if (q.year !== undefined) sp.set("year", String(q.year));
    if (q.month !== undefined) sp.set("month", String(q.month));
    return sp.toString();
  },
  parse(sp) {
    const period = sp.get("period") as LeaderboardPeriodType | null;
    if (!period) return { ok: false, missingParams: ["period"] };

    const yearRaw = sp.get("year");
    const monthRaw = sp.get("month");
    const missing: string[] = [];
    if ((period === "month" || period === "year") && !yearRaw) missing.push("year");
    if (period === "month" && !monthRaw) missing.push("month");
    if (missing.length > 0) return { ok: false, missingParams: missing };

    return {
      ok: true,
      value: {
        period,
        country: sp.get("country") ?? undefined,
        year: yearRaw ? Number(yearRaw) : undefined,
        month: monthRaw ? Number(monthRaw) : undefined,
      },
    };
  },
};

interface RouteDefinition<PathParams, Query> {
  method: "GET" | "POST";
  matchPath(pathname: string): PathParams | null;
  parseQuery(searchParams: URLSearchParams, pathParams: PathParams): ParseResult<PathParams & Query>;
  build(context: PathParams & Query): string;
}

// Type-erased alias — used ONLY where index.ts needs to iterate every route
// generically (see note there). Never used anywhere else.
export type AnyRouteDefinition = RouteDefinition<any, any>;

function defineRoute<PathParams, Query>(
  method: "GET" | "POST",
  pattern: RegExp,
  extractPath: (match: RegExpMatchArray) => PathParams,
  buildPath: (params: PathParams) => string,
  query: QueryCodec<Query>
): RouteDefinition<PathParams, Query> {
  return {
    method,
    matchPath(pathname) {
      const match = pathname.match(pattern);
      return match ? extractPath(match) : null;
    },
    parseQuery(searchParams, pathParams) {
      const result = query.parse(searchParams);
      return result.ok
        ? { ok: true, value: { ...pathParams, ...result.value } }
        : result;
    },
    build(context) {
      const qs = query.build(context);
      const path = buildPath(context);
      return qs ? `${path}?${qs}` : path;
    },
  };
}

export const API_ROUTES = {
  playerSession: defineRoute<NoPathParams, PlayerSessionQueryParams>(
    "GET", /^\/player\/session$/, () => ({}), () => "/player/session", playerSessionQuery
  ),
  normalEnter: defineRoute<NoPathParams, EmptyQuery>(
    "POST", /^\/normal\/enter$/, () => ({}), () => "/normal/enter", NO_QUERY
  ),
  normalAttempt: defineRoute<NoPathParams, EmptyQuery>(
    "POST", /^\/normal\/attempt$/, () => ({}), () => "/normal/attempt", NO_QUERY
  ),
  playerPrefs: defineRoute<NoPathParams, EmptyQuery>(
    "POST", /^\/player\/prefs$/, () => ({}), () => "/player/prefs", NO_QUERY
  ),
  authLogout: defineRoute<NoPathParams, EmptyQuery>(
    "POST", /^\/auth\/logout$/, () => ({}), () => "/auth/logout", NO_QUERY
  ),
  authStart: defineRoute<AuthProviderPathParams, AuthStartQueryParams>(
    "GET", /^\/auth\/([a-z]+)\/start$/, (m) => ({ provider: m[1] }), (p) => `/auth/${p.provider}/start`, authStartQuery
  ),
  authCallback: defineRoute<AuthProviderPathParams, AuthCallbackQueryParams>(
    "GET", /^\/auth\/([a-z]+)\/callback$/, (m) => ({ provider: m[1] }), (p) => `/auth/${p.provider}/callback`, authCallbackQuery
  ),
  aliasCheck: defineRoute<NoPathParams, AliasCheckQueryParams>(
    "GET", /^\/alias\/check$/, () => ({}), () => "/alias/check", aliasCheckQuery
  ),
  aliasSetup: defineRoute<NoPathParams, EmptyQuery>(
    "POST", /^\/alias\/setup$/, () => ({}), () => "/alias/setup", NO_QUERY
  ),
  leaderboardAvailable: defineRoute<LangPathParams, EmptyQuery>(
    "GET", /^\/leaderboard\/([a-z]+)\/available$/, (m) => ({ lang: m[1] }), (p) => `/leaderboard/${p.lang}/available`, NO_QUERY
  ),
  leaderboard: defineRoute<LangPathParams, LeaderboardQueryParams>(
    "GET", /^\/leaderboard\/([a-z]+)$/, (m) => ({ lang: m[1] }), (p) => `/leaderboard/${p.lang}`, leaderboardQuery
  ),
} as const;

export type RouteContext<R> = R extends RouteDefinition<infer P, infer Q> ? P & Q : never;
export type PlayerSessionContext = RouteContext<typeof API_ROUTES.playerSession>;
export type AuthStartContext = RouteContext<typeof API_ROUTES.authStart>;
export type AuthCallbackContext = RouteContext<typeof API_ROUTES.authCallback>;
export type AliasCheckContext = RouteContext<typeof API_ROUTES.aliasCheck>;
export type LeaderboardContext = RouteContext<typeof API_ROUTES.leaderboard>;
export type LeaderboardAvailableContext = RouteContext<typeof API_ROUTES.leaderboardAvailable>;