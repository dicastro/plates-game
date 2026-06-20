export interface TimeService {
  /** Local, synchronous, zero network. Used for cosmetic concerns (Theme, Badges). */
  getCosmeticDate(): Date;
}
