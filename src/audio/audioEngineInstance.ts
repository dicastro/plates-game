import { ProceduralAudioEngine } from "./ProceduralAudioEngine";

// Singleton — consistent with timeServiceInstance.ts / platformServiceInstance.ts.
export const audioEngine = new ProceduralAudioEngine();