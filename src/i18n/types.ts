export interface TranslationSchema {
  app: {
    title: string;
    tagline: string;
  };
  home: {
    play: string;
    friends: string;
    leaderboard: string;
  }
  hud: {
    mute: string;
    unmute: string;
    settingsUnavailable: string;
    whatsNewUnavailable: string;
  };
  viewport: {
    rotateTitle: string;
    rotateBody: string;
    unsupportedTitle: string;
    unsupportedBody: string;
  };
  game: {
    normal: {
      bestToday: string;
      noValidWordYet: string;
      bonusBadge: string;
      tryAWord: string;
      submitAriaLabel: string;
      closeAriaLabel: string;
      backspaceAriaLabel: string;
      checkingDictionary: string;
      newBestTitle: string;
      shareResult: string;
      continueButton: string;
      validNotBestTitle: string;
      stillTodaysBestLine: string;
      shareChallenge: string;
      tryAgain: string;
      notInDictionaryTitle: string;
      attemptsLeftOne: string;
      attemptsLeftOther: string;
      submitErrorTitle: string;
      submitErrorBody: string;
      attemptsDetailTitle: string;
      attemptsDetailBody: string;
      bonusInfoTitle: string;
      rulesTitle: string;
      rulesBody: string;
      dontShowAgain: string;
      gotIt: string;
      newPlateIn: string;
      comeBackTomorrow: string;
      watchAdForExtraAttempt: string;
      helpAriaLabel: string;
      points: string;
      pointsSuffix: string;
      exitAriaLabel: string;
      noAttemptsYetBody: string;
      noAttemptsLeftBody: string;
      scrollToStart: string;
      scrollToEnd: string;
    };
  };
}