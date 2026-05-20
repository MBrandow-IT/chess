/**
 * <KahootQuestion /> is purely a marker / data carrier authored inside MDX.
 *
 * In a lesson view, it renders as a small "Quiz question" preview card so
 * students/instructors can see what's coming. The actual live quiz pulls this
 * data via the MDX question extractor at quiz-start time.
 */
export type KahootQuestionProps = {
  id: string;
  type: "multiple-choice" | "best-move" | "best-sequence";
  prompt?: string;
  fen?: string;
  /** For multiple-choice: array of answer labels. */
  choices?: string[];
  /** For multiple-choice: index of the correct choice. */
  correctChoice?: number;
  /** For best-move / best-sequence: solution SAN moves. */
  solution?: string[];
  timeLimitSeconds?: number;
  basePoints?: number;
};

export function KahootQuestion(props: KahootQuestionProps) {
  const time = props.timeLimitSeconds ?? 30;
  const points = props.basePoints ?? 100;
  return (
    <aside
      data-kahoot-question
      data-id={props.id}
      data-type={props.type}
      className="my-4 rounded-lg border-l-4 border-buckeye-scarlet bg-buckeye-cream/40 p-4 text-sm"
    >
      <p className="font-semibold uppercase tracking-wider text-buckeye-scarlet">
        Quiz question
      </p>
      <p className="mt-1 font-medium text-buckeye-ink">
        {props.prompt ?? (
          <>
            {props.type === "multiple-choice"
              ? "Multiple choice"
              : props.type === "best-move"
                ? "Find the best move"
                : "Find the best sequence"}
          </>
        )}
      </p>
      <p className="mt-1 text-xs text-buckeye-gray">
        {time}s · up to {points} points
      </p>
    </aside>
  );
}
