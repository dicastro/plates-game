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
│   └── useNavigation.ts
├── screens/
│   ├── SplashScreen.tsx
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

```typescript
// src/hooks/useOrientation.ts
// Returns "portrait" | "landscape" based on window.screen.orientation
// or matchMedia("(orientation: landscape)") as fallback.
// Triggers re-render on change.
```

Consumed by `GameEngine` and `PersistentHUD` to switch layout axis.
All other screens use Tailwind `landscape:` responsive prefix for static layout variants.