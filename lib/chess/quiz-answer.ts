/**
 * Shared best-move answer validation for live quiz (client preview + server RPC).
 * Multi-move puzzles use alternating lines: even indices are student moves.
 */

export function studentMovesFromSolution(solution: string[]): string[] {
  return solution.filter((_, index) => index % 2 === 0);
}

export type BestMoveAnswerPayload = {
  san?: string;
  student_moves?: string[];
};

export function validateBestMoveAnswer(
  solution: string[],
  payload: BestMoveAnswerPayload,
): boolean {
  if (!solution.length) return false;

  if (solution.length === 1) {
    const submitted = payload.san ?? payload.student_moves?.[0];
    return submitted === solution[0];
  }

  const expected = studentMovesFromSolution(solution);
  const submitted = payload.student_moves;
  if (!submitted || submitted.length !== expected.length) return false;
  return expected.every((san, index) => san === submitted[index]);
}
