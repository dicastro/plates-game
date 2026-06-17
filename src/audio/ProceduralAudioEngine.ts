// Linear Congruential Generator — deterministic PRNG from seed
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const NOTES_HZ = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88]; // C4–B4
const BPM_BASE = 90;
const BEAT_SEC = 60 / BPM_BASE;

export class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private schedulerHandle: ReturnType<typeof setTimeout> | null = null;
  private nextNoteTime = 0;
  private rand: (() => number) | null = null;

  start(seed: number): void {
    if (this.ctx) return; // already running

    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.15, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    this.rand = lcg(seed);
    this.nextNoteTime = this.ctx.currentTime;
    this.scheduleLoop();
  }

  stop(): void {
    if (this.schedulerHandle !== null) {
      clearTimeout(this.schedulerHandle);
      this.schedulerHandle = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.gainNode = null;
    }
  }

  setMute(isMuted: boolean): void {
    if (!this.gainNode || !this.ctx) return;
    const target = isMuted ? 0 : 0.15;
    this.gainNode.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.1);
  }

  private scheduleLoop(): void {
    if (!this.ctx || !this.gainNode || !this.rand) return;

    // Look-ahead: schedule notes within the next 200ms window
    while (this.nextNoteTime < this.ctx.currentTime + 0.2) {
      this.playNote(this.nextNoteTime);
      this.nextNoteTime += BEAT_SEC * 0.5;
    }

    this.schedulerHandle = setTimeout(() => this.scheduleLoop(), 100);
  }

  private playNote(time: number): void {
    if (!this.ctx || !this.gainNode || !this.rand) return;

    const freq = NOTES_HZ[Math.floor(this.rand() * NOTES_HZ.length)];
    const duration = BEAT_SEC * (this.rand() > 0.7 ? 1 : 0.5);

    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = this.rand() > 0.5 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(freq, time);

    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.8, time + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(env);
    env.connect(this.gainNode!);

    osc.start(time);
    osc.stop(time + duration);
    osc.onended = () => { osc.disconnect(); env.disconnect(); };
  }
}