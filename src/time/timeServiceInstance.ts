import { TimeService } from "./TimeService";
import { TimeServiceFactory } from "./TimeServiceFactory";

export const timeService: TimeService = TimeServiceFactory.create();