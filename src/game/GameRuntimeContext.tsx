import { createContext, useContext, useReducer, useRef, useCallback, type ReactNode } from "react";
import { platformService } from "../platform/platformServiceInstance";
import { usePlayerSession } from "../player/PlayerSessionContext";
import type { AttemptResult } from "../platform/PlatformService";
import type { GameConfig, AttemptRecord } from "./types";
import { isStructurallyValid } from "../../shared/wordValidation";

type SubmitOutcome = "NEW_BEST" | "VALID_NOT_BEST" | "INVALID";

type ActiveOverlay =
  | { type: "RESULT"; outcome: SubmitOutcome; record: AttemptRecord }
  | { type: "SUBMIT_ERROR" }
  | { type: "RULES" }
  | { type: "BONUS_INFO" }
  | { type: "ATTEMPTS_DETAIL" }
  | null;

interface GameRuntimeState {
  typedWord: string;
  isKeyboardExpanded: boolean;
  submissionStatus: "idle" | "loading";
  activeOverlay: ActiveOverlay;
  attemptsUsed: number;
  bestScore: number;
  attemptsHistory: AttemptRecord[];
}

type GameRuntimeAction =
  | { type: "TYPE_LETTER"; letter: string }
  | { type: "BACKSPACE" }
  | { type: "EXPAND_KEYBOARD" }
  | { type: "COLLAPSE_KEYBOARD" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS"; result: AttemptResult; outcome: SubmitOutcome }
  | { type: "SUBMIT_FAILURE" }
  | { type: "OPEN_OVERLAY"; overlay: Exclude<ActiveOverlay, null> }
  | { type: "CLOSE_OVERLAY" };

function reducer(state: GameRuntimeState, action: GameRuntimeAction): GameRuntimeState {
  switch (action.type) {
    case "TYPE_LETTER":
      return { ...state, typedWord: state.typedWord + action.letter };

    case "BACKSPACE":
      return { ...state, typedWord: state.typedWord.slice(0, -1) };

    case "EXPAND_KEYBOARD":
      return { ...state, isKeyboardExpanded: true };

    case "COLLAPSE_KEYBOARD":
      return { ...state, isKeyboardExpanded: false, typedWord: "" };

    case "SUBMIT_START":
      return { ...state, submissionStatus: "loading", isKeyboardExpanded: false };

    case "SUBMIT_SUCCESS": {
      const record: AttemptRecord = {
        word: state.typedWord,
        valid: action.result.valid,
        score: action.result.scoreThisAttempt,
      };
      return {
        ...state,
        submissionStatus: "idle",
        isKeyboardExpanded: false,
        typedWord: "",
        attemptsUsed: action.result.attemptsUsedToday,
        bestScore: action.result.bestScoreToday,
        attemptsHistory: [...state.attemptsHistory, record],
        activeOverlay: { type: "RESULT", outcome: action.outcome, record },
      };
    }

    case "SUBMIT_FAILURE":
      return {
        ...state,
        submissionStatus: "idle",
        isKeyboardExpanded: false,
        activeOverlay: { type: "SUBMIT_ERROR" },
      };

    case "OPEN_OVERLAY":
      return { ...state, activeOverlay: action.overlay };

    case "CLOSE_OVERLAY":
      return { ...state, activeOverlay: null };

    default:
      return state;
  }
}

interface GameRuntimeContextValue extends GameRuntimeState {
  typeLetter: (letter: string) => void;
  backspace: () => void;
  expandKeyboard: () => void;
  collapseKeyboard: () => void;
  submit: () => Promise<void>;
  openOverlay: (overlay: Exclude<ActiveOverlay, null>) => void;
  closeOverlay: () => void;
  isSubmitEnabled: boolean;
}

const GameRuntimeContext = createContext<GameRuntimeContextValue | null>(null);

export function GameRuntimeProvider({
  config,
  children,
}: {
  config: GameConfig;
  children: ReactNode;
}) {
  const { updatePlayer } = usePlayerSession();
  const isSubmittingRef = useRef(false);

  const [state, dispatch] = useReducer(reducer, {
    typedWord: "",
    isKeyboardExpanded: false,
    submissionStatus: "idle",
    activeOverlay: null,
    attemptsUsed: config.initialAttemptsUsed,
    bestScore: config.initialBestScore,
    attemptsHistory: config.initialAttemptsHistory,
  });

  // Mirrors `state` so `submit` can read current values without needing
  // `state` in its dependency array — same ref-mirror technique as
  // PlayerSessionContext/NavigationContext.
  const stateRef = useRef(state);
  stateRef.current = state;

  // `dispatch` is already stable (React guarantee for useReducer) — these
  // wrappers just need their OWN identity to be stable too.
  const typeLetter = useCallback((letter: string) => dispatch({ type: "TYPE_LETTER", letter }), []);
  const backspace = useCallback(() => dispatch({ type: "BACKSPACE" }), []);
  const expandKeyboard = useCallback(() => dispatch({ type: "EXPAND_KEYBOARD" }), []);
  const collapseKeyboard = useCallback(() => dispatch({ type: "COLLAPSE_KEYBOARD" }), []);
  const openOverlay = useCallback((overlay: Exclude<ActiveOverlay, null>) => dispatch({ type: "OPEN_OVERLAY", overlay }), []);
  const closeOverlay = useCallback(() => dispatch({ type: "CLOSE_OVERLAY" }), []);

  const submit = useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    dispatch({ type: "SUBMIT_START" });
    const bestScoreBeforeThisCall = stateRef.current.bestScore;
    const wordToSubmit = stateRef.current.typedWord;

    try {
      const result = await platformService.submitAttempt(config.lang, wordToSubmit);
      const outcome: SubmitOutcome = !result.valid
        ? "INVALID"
        : result.scoreThisAttempt > bestScoreBeforeThisCall ? "NEW_BEST" : "VALID_NOT_BEST";

      updatePlayer(result.player);
      dispatch({ type: "SUBMIT_SUCCESS", result, outcome });
    } catch {
      dispatch({ type: "SUBMIT_FAILURE" });
    } finally {
      isSubmittingRef.current = false;
    }
  }, [config.lang, updatePlayer]);

  const isSubmitEnabled = isStructurallyValid(state.typedWord, config.consonants);

  return (
    <GameRuntimeContext.Provider
      value={{
        ...state,
        typeLetter,
        backspace,
        expandKeyboard,
        collapseKeyboard,
        submit,
        openOverlay,
        closeOverlay,
        isSubmitEnabled,
      }}
    >
      {children}
    </GameRuntimeContext.Provider>
  );
}

export function useGameRuntime(): GameRuntimeContextValue {
  const ctx = useContext(GameRuntimeContext);
  if (!ctx) throw new Error("useGameRuntime must be used within a GameRuntimeProvider");
  return ctx;
}