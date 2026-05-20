/**
 * Tiny synth for chess-related sound effects. Uses the Web Audio API so we
 * don't ship any audio files. Respects a localStorage `bcw:sound` flag.
 */

const KEY = "bcw:sound";
let ctx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) !== "off";
}

export function setSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, on ? "on" : "off");
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.AudioContext || (window as any).webkitAudioContext) as
        | typeof AudioContext
        | undefined;
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

function beep(freq: number, durationMs: number, gain = 0.05) {
  if (!isSoundEnabled()) return;
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + durationMs / 1000);
  osc.connect(g).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + durationMs / 1000);
}

export const sfx = {
  move: () => beep(440, 80),
  capture: () => beep(220, 140, 0.07),
  correct: () => {
    beep(660, 80);
    setTimeout(() => beep(880, 120), 90);
  },
  wrong: () => beep(180, 200, 0.06),
  tick: () => beep(700, 30, 0.03),
};
