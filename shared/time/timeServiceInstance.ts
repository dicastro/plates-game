// Only meaningful when the resolved instance is a FastForwardTimeService —

import { FastForwardTimeService } from "./strategies/FastForwardTimeService";
import { TimeService } from "./TimeService";

// callers guard with isFastForward() first (see advanceTimeRoutes.ts).
export function isFastForwardTimeService(service: TimeService): service is FastForwardTimeService {
  return service instanceof FastForwardTimeService;
}