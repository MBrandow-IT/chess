/**
 * Pure scoring function — mirrored on the server via SQL so the client preview
 * always matches the server-authoritative result.
 *
 * Rules (from the spec):
 *   - base points = 100 (per question, configurable)
 *   - elapsed seconds subtract 1% of base per second
 *   - each wrong attempt halves the remaining potential
 *   - floored at 0
 *
 * Final formula:
 *   points = floor(max(0, base * (1 - elapsedSeconds / 100)) * 0.5^wrongAttempts)
 */
export type ScoreInput = {
  basePoints: number;
  elapsedMs: number;
  wrongAttempts: number;
  /** If false, the answer is incorrect and score is 0 regardless of time. */
  correct: boolean;
  /** Optional time limit in seconds; if elapsed exceeds it, score is 0. */
  timeLimitSeconds?: number;
};

export function scoreAnswer({
  basePoints,
  elapsedMs,
  wrongAttempts,
  correct,
  timeLimitSeconds,
}: ScoreInput): number {
  if (!correct) return 0;
  const elapsedSec = Math.max(0, elapsedMs / 1000);
  if (timeLimitSeconds !== undefined && elapsedSec > timeLimitSeconds) return 0;
  const timeFactor = Math.max(0, 1 - elapsedSec / 100);
  const wrongFactor = Math.pow(0.5, Math.max(0, wrongAttempts));
  return Math.max(0, Math.floor(basePoints * timeFactor * wrongFactor));
}
