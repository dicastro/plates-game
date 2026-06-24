# Navigation Architecture

## 1. No Router

PLATES uses **no URL router** (`react-router`, `wouter`, etc. are prohibited per AGENT.md §11).

Navigation is a pure React state machine. A single `useNavigation` hook owns the
`NavigationState` and exposes a typed `navigate()` function. All screen transitions
are in-memory. A hard refresh always resets to `SPLASH` — this is the correct behavior
for the YouTube Playables iframe lifecycle.

---

## 2. Types

```typescript
// src/navigation/types.ts

export type AppScreen =
  | "SPLASH"
  | "LOGIN"
  | "HOME"
  | "NORMAL_GAME"
  | "NORMAL_RESULT"
  | "FRIENDS_HUB"
  | "TRAVEL_LOBBY"
  | "TRAVEL_CONFIG"
  | "TRAVEL_WAITING"
  | "TRAVEL_GAME"
  | "TRAVEL_RESULT"
  | "TRAVEL_FINAL"
  | "REMOTE_LOBBY"
  | "REMOTE_CONFIG"
  | "REMOTE_WAITING"
  | "REMOTE_GAME"
  | "REMOTE_RESULT"
  | "REMOTE_FINAL"
  | "LEADERBOARD";

export type AppOverlay = "SETTINGS" | "WHATS_NEW" | null;

export interface SessionContext {
  mode: "TRAVEL" | "REMOTE";
  roomCode: string;
  roomId: string;        // Cloudflare KV key
  currentRound: number;  // 1-indexed
  totalRounds: number;
  utcEpoch: number;      // server-provided on room creation/join
}

export interface NavigationState {
  screen: AppScreen;
  overlay: AppOverlay;
  sessionContext: SessionContext | null;
}
```

---

## 3. Navigation Context

```typescript
// src/navigation/NavigationContext.tsx

interface NavigationContextValue {
  state: NavigationState;
  navigate: (screen: AppScreen, sessionContext?: SessionContext | null) => void;
  openOverlay: (overlay: Exclude<AppOverlay, null>) => void;
  closeOverlay: () => void;
}
```

- `navigate()` sets `screen`, optionally updates `sessionContext`, and always clears `overlay`.
- `openOverlay()` sets `overlay` without touching `screen` or `sessionContext`.
- `closeOverlay()` sets `overlay` to `null`.

The provider wraps the entire app in `App.tsx`. All screens consume `useNavigation()`.

### `sessionContext` Stickiness

`navigate(screen, sessionContext?)` treats `sessionContext` as **sticky unless explicitly
passed**:
- Omitting the argument preserves the current `sessionContext`.
- Passing `null` explicitly clears it.

This avoids forcing every `navigate()` call within an active room (e.g. `TRAVEL_RESULT` →
`TRAVEL_GAME` on the next-round loop) to re-pass an unchanged `sessionContext`.

---

## 4. App Shell Render Logic

```typescript
// src/App.tsx — render switch (simplified)

function renderScreen(screen: AppScreen): React.ReactNode {
  switch (screen) {
    case "SPLASH":        return <SplashScreen />;
    case "HOME":          return <HomeScreen />;
    case "NORMAL_GAME":   return <GameEngine config={normalConfig} />;
    case "NORMAL_RESULT": return <NormalResultScreen />;
    case "FRIENDS_HUB":   return <FriendsHubScreen />;
    // ... travel and remote screens
    case "LEADERBOARD":   return <LeaderboardScreen />;
  }
}

// In JSX:
// <PersistentHUD />               ← always rendered (except SPLASH)
// {renderScreen(state.screen)}
// {state.overlay === "SETTINGS"  && <SettingsOverlay />}
// {state.overlay === "WHATS_NEW" && <WhatsNewOverlay />}
```

`PersistentHUD` is rendered by `App.tsx` directly — it is never a child of any screen
component and therefore is never unmounted during screen transitions.

---

## 5. SDK Lifecycle Safety

The YouTube Playables SDK expects `firstFrameReady()` and `gameReady()` to be called
exactly once per session, during `SPLASH`. If the user hard-refreshes the iframe,
the `SPLASH` → `HOME` sequence re-runs and re-calls the SDK in the correct order.

No screen component ever calls `PlatformService.initialize()` — that responsibility
belongs exclusively to `SplashScreen`. This prevents double-initialization on
internal navigation.

The `PlatformService` singleton is created once at module level in `App.tsx` and passed
down via Context alongside navigation, preventing re-instantiation across screen transitions.

---

## 6. File Structure (Target)

```
src/
├── navigation/
│   ├── types.ts
│   ├── NavigationContext.tsx
├── screens/
│   ├── SplashScreen.tsx
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   ├── NormalGameScreen.tsx      ← thin wrapper: builds GameConfig, renders GameEngine
│   ├── NormalResultScreen.tsx
│   ├── FriendsHubScreen.tsx
│   ├── travel/
│   │   ├── TravelLobbyScreen.tsx
│   │   ├── TravelConfigScreen.tsx
│   │   ├── TravelWaitingScreen.tsx
│   │   ├── TravelResultScreen.tsx
│   │   └── TravelFinalScreen.tsx
│   └── remote/
│       ├── RemoteLobbyScreen.tsx
│       ├── RemoteConfigScreen.tsx
│       ├── RemoteWaitingScreen.tsx
│       ├── RemoteResultScreen.tsx
│       └── RemoteFinalScreen.tsx
├── components/
│   ├── ScreenContainer.tsx       ← shared viewport/orientation base for all screens
│   ├── Button.tsx                ← variants: primary/secondary/danger/ghost, built-in click throttle
│   ├── PlatesLogo.tsx            ← static plate mark, reusable (HUD, future screens)
│   └── SplashAnimation.tsx       ← Splash-only: animated reels + tagline + loading dots
├── overlays/
│   ├── SettingsOverlay.tsx
│   └── WhatsNewOverlay.tsx
├── hud/
│   └── PersistentHUD.tsx
└── game/
    ├── GameEngine.tsx            ← shared puzzle engine, mode-agnostic
    └── types.ts                  ← GameConfig, RoundResult
```

---

## 7. Orientation Handling

Screen-level orientation adaptation is centralized in `ScreenContainer`, not per-screen logic.

```typescript
// src/components/ScreenContainer.tsx
type OrientationLayout = "row-on-landscape" | "always-column";
```

- `row-on-landscape` (default): `flex-col landscape:flex-row` — portrait stacks content vertically,
  landscape arranges it horizontally. Used by `SplashScreen` and `HomeScreen`.
- `always-column`: forces column layout regardless of orientation — for screens where a
  horizontal split adds no value (lists, configuration forms).

All common viewport constraints (`w-screen`, `h-[100dvh]`, base background/text color,
centering) live in `ScreenContainer` exclusively. No screen component repeats them.

`GameEngine`'s virtual keyboard (bottom in portrait, side panel in landscape) has finer-grained
requirements than a simple two-variant container. When implemented, it will be decided whether
it extends `ScreenContainer` with a third variant or composes its own layout inside it.

`PersistentHUD` is unaffected — it is rendered by `App.tsx` outside any `ScreenContainer`,
anchored top-right regardless of orientation (per §9 of `screen-map.md`).