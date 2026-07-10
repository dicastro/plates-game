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
  login: {
    providers: {
      google: string;
    }
  }
  alias: {
    title: string;
    subtitle: string;
    placeholder: string;
    helperRules: string; // {{min}}, {{max}}
    checking: string;
    available: string;
    taken: string;
    takenServerBanner: string;
    confirmButton: string;
    successTitle: string; // {{alias}}
    successBody: string;
    continueButton: string;
  };
  leaderboard: {
    tabWeek: string;
    tabMonth: string;
    tabYear: string;
    tabTotal: string;
    helpAriaLabel: string;
    helpTitle: string;
    helpBodyWeek: string;
    helpBodyMonth: string;
    helpBodyYear: string;
    helpBodyTotal: string;
    intervalWeek: string;  // {{start}}, {{end}}
    intervalMonth: string; // {{month}}, {{year}}
    intervalYear: string;  // {{year}}
    intervalTotal: string; // {{date}}
    yourScoreWeek: string;  // {{score}}
    yourScoreMonth: string; // {{score}}
    yourScoreYear: string;  // {{score}}
    allCountries: string;
    emptyNoPlayersTitle: string;
    emptyNoPlayersBody: string;
    notPlayedYetBody: string;
    ctaPlayNow: string;
    loading: string;
    rankAriaCountry: string; // {{country}}
    exitAriaLabel: string;
    monthSelectorLabel: string;
    yearSelectorLabel: string;
    yourScoreNotYetIncluded: string; // {{score}} — Total tab: current week, not yet folded in
    prevAriaLabel: string;
    nextAriaLabel: string;
    latestAriaLabel: string;
    accumHelpAriaLabel: string;
    accumHelpTitle: string;
    accumHelpBodyWeek: string;
    accumHelpBodyMonth: string;
    accumHelpBodyYear: string;
    accumHelpBodyTotal: string;
    totalPlayers: string;   // {{count}}, {{total}}
    allCountriesWithCount: string; // {{count}}
  };
}