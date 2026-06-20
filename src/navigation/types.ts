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
  roomId: string;
  currentRound: number;
  totalRounds: number;
  utcEpoch: number;
}

export interface NavigationState {
  screen: AppScreen;
  overlay: AppOverlay;
  sessionContext: SessionContext | null;
}