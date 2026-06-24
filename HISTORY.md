# HISTORY.md — Project Evolution

This file is a narrative log of the major pivots this project went through and why. It is
**not** an architectural source of truth — current architecture lives in `AI_CONTEXT.md` and
`/doc`. This file exists so the reasoning behind past decisions isn't lost, and as raw
material for a future write-up.

---

## Phase 1 — No-backend Normal Mode, hashed dictionary in the client

The original design avoided any backend for Normal Mode entirely. The dictionary was shipped
to the client as a precompiled array of salted SHA-256 hashes; the client validated words
locally and computed scores itself. The only server-side dependency was a Cloudflare Worker
fetched once for a canonical UTC timestamp, to prevent clock manipulation.

## Phase 2 — Cloudflare Workers as the anti-cheat authority, YouTube Playables as the target

As Travel/Remote multiplayer modes were designed, Cloudflare Workers and KV became necessary
for room synchronization regardless. This made it natural to also move Normal Mode's
anti-cheat authority server-side: the dictionary moved entirely into the Worker, word
validation and scoring became server-authoritative, and a two-layer signing scheme (a
symmetric envelope plus a Worker-issued asymmetric signature) was designed to let the client
safely cache a Worker-issued state snapshot without being able to forge it — necessary
because, without real user accounts, player identity was a self-assigned client UUID with no
way to prevent a malicious client from simply discarding it and starting over.

YouTube Playables was the intended primary distribution platform throughout this phase.

## Phase 3 — Discovery: YouTube Playables makes this whole approach impossible

A close reading of Playables' official certification requirements (Privacy & Data
requirements specifically) revealed three structural blockers that no amount of clever design
could work around:

1. **No external calls allowed**, except to Google/YouTube-owned APIs — ruling out any call
   to a self-hosted Cloudflare Worker from a Playables build.
2. **No durable player identity exposed** by the public SDK — making any client-asserted
   identifier trivially resettable.
3. **No code obfuscation allowed**, beyond minification — weakening any remaining
   client-side-only protection.

Combined, these made server-authoritative anti-cheat and real-time multiplayer (Travel/Remote)
categorically impossible inside a Playables build — not a matter of better engineering, but
a hard platform policy wall.

## Phase 4 — Pivot: Cloudflare becomes the real production platform

YouTube Playables was dropped entirely as a distribution target. Cloudflare — previously
planned as a secondary review/demo target — became the actual production platform. This
unlocked several simplifications that had only existed to work around Playables constraints:

- Real OAuth-based player accounts replaced self-assigned client identifiers, which in turn
  made the entire client-side signing scheme (the two-layer seal/signature design from Phase
  2) unnecessary — the Worker never needs to trust client-asserted state in the first place.
- Cloudflare KV was dropped in favor of Durable Objects (strong consistency per player/room)
  and D1 (queryable leaderboard projection) — better fits for the actual access patterns than
  the eventually-consistent KV model.
- Restrictions that existed solely because of Playables design requirements (no mute button,
  no Page Visibility API) were lifted — these are now ordinary product decisions.
- The product itself gained capabilities Playables never would have allowed: account-based
  cross-device play, monetization via an ad engine, and shareable result links with dynamic
  Open Graph previews for organic/social growth — none of which fit the Playables sandbox
  model.

This is the architecture documented as current in `AI_CONTEXT.md` and `/doc` going forward.