import type { PlateBonusType } from "../../shared/scoring";
import type { AttemptRecord } from "../platform/PlatformService";

export type GameMode = "NORMAL" | "TRAVEL" | "REMOTE";

export interface GameConfig {
  mode: GameMode;
  lang: string;
  attemptsLimit: number;
  countdownSeconds: number | null;
  consonants: string[];
  plateDigits: string;
  bonusType: PlateBonusType;
  initialAttemptsUsed: number;
  initialBestScore: number;
  initialAttemptsHistory: AttemptRecord[];
  onExit: () => void;
}

export type { AttemptRecord };