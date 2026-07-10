export interface TimeService {
  now(): number; // epoch ms — única fuente de "qué hora es" para todo el Worker
}