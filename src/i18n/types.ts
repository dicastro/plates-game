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
}