import { TimeService } from "../../shared/time/TimeService";
import { TimeServiceFactory } from "./TimeServiceFactory";

export const timeService: TimeService = TimeServiceFactory.create();