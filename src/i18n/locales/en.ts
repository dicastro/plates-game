import type { TranslationSchema } from "../types";

const en: TranslationSchema = {
  app: {
    title: "PLATES",
    tagline: "The licence plate word game",
  },
  home: {
    play: "Play",
    friends: "Friends",
    leaderboard: "Leaderboard"
  },
  hud: {
    mute: "Mute",
    unmute: "Unmute",
    settingsUnavailable: "Settings (not available yet)",
    whatsNewUnavailable: "What's new (not available yet)",
  },
  viewport: {
    rotateTitle: "Please rotate your device",
    rotateBody: "Your screen needs more vertical space to play comfortably. Try rotating to portrait.",
    unsupportedTitle: "Screen too small",
    unsupportedBody: "Your device's screen doesn't have enough room for a good experience right now. We've made a note of it.",
  },
  game: {
    normal: {
      bestToday: "Best today",
      noValidWordYet: "No valid word yet",
      bonusBadge: "x2 bonus",
      tryAWord: "Try a word",
      submitAriaLabel: "Submit word",
      closeAriaLabel: "Close keyboard",
      backspaceAriaLabel: "Backspace",
      checkingDictionary: "Checking the dictionary…",
      newBestTitle: "New best today!",
      shareResult: "Share this result",
      continueButton: "Continue",
      validNotBestTitle: "Valid word",
      stillTodaysBestLine: "(today's best is still {{score}} points)",
      shareChallenge: "Share your best · challenge a friend",
      tryAgain: "Try again",
      notInDictionaryTitle: "Not in the dictionary",
      attemptsLeftOne: "{{count}} attempt left today — keep trying!",
      attemptsLeftOther: "{{count}} attempts left today — keep trying!",
      submitErrorTitle: "Something went wrong",
      submitErrorBody: "We couldn't check your word right now. Please try again in a moment.",
      attemptsDetailTitle: "Today's attempts",
      attemptsDetailBody: "Each row is one submitted word and its result. Only the highest-scoring valid word counts toward today's best score.",
      bonusInfoTitle: "Plate bonus & difficulty",
      rulesTitle: "How to play",
      rulesBody: "Find the shortest word that contains the plate's 3 consonants, in order. Shorter words score higher. You get {{limit}} attempts a day; only your best valid word counts. Wrong guesses never subtract points.",
      dontShowAgain: "Don't show this again",
      gotIt: "Got it",
      newPlateIn: "New plate in {{time}}",
      comeBackTomorrow: "Come back tomorrow for a new plate",
      watchAdForExtraAttempt: "Watch an ad for 1 extra attempt",
      helpAriaLabel: "How to play",
      points: "points",
      pointsSuffix: "pts",
      exitAriaLabel: "Exit to home",
      noAttemptsYetBody: "You haven't submitted any word today yet.",
      noAttemptsLeftBody: "No attempts left today — come back tomorrow for a new plate.",
      scrollToStart: "Go to start",
      scrollToEnd: "Scroll to end",
    },
  },
};

export default en;