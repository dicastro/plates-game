import type { TimeService } from "../time/TimeService";
import type { ResolvedThemeContext } from "./types";
import { cantabriaGreenTheme } from "./themes/cantabriaGreen";

export class ThemeScheduler {
  constructor(private readonly timeService: TimeService) {}

  resolve(): ResolvedThemeContext {
    // Cosmetic date read here for future season/badge conditions.
    // Currently unused — only one theme exists and no badges are implemented yet.
    void this.timeService.getCosmeticDate();

    return {
      theme: cantabriaGreenTheme,
      badges: [],
    };
  }
}