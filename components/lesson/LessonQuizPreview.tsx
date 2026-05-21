import { Collapsible } from "@/components/lesson/Collapsible";
import type { LessonQuizQuestionRow } from "@/lib/supabase/types";

function typeLabel(type: string): string {
  if (type === "multiple-choice") return "Multiple choice";
  if (type === "best-move") return "Chess puzzle";
  return type;
}

export function LessonQuizPreview({
  questions,
}: {
  questions: LessonQuizQuestionRow[];
}) {
  if (questions.length === 0) {
    return (
      <Collapsible
        title="Quiz preview"
        subtitle="Live quiz questions for this lesson are configured in the host editor."
      >
        <p className="text-sm text-buckeye-gray">
          No published quiz questions yet. Instructors can add them from the
          host dashboard under <strong>Edit quiz</strong>.
        </p>
      </Collapsible>
    );
  }

  return (
    <Collapsible
      title="Quiz preview"
      subtitle="These are the kinds of questions you'll see when we play the live quiz for this lesson."
    >
      <ul className="space-y-3">
        {questions.map((question) => {
          const payload = question.payload as {
            choices?: string[];
            solution?: string[];
          };
          return (
            <li
              key={question.id}
              className="rounded-lg border-l-4 border-buckeye-scarlet bg-buckeye-cream/40 p-4 text-sm"
            >
              <p className="font-semibold uppercase tracking-wider text-buckeye-scarlet">
                {typeLabel(question.type)}
              </p>
              <p className="mt-1 font-medium text-buckeye-ink">{question.prompt}</p>
              <p className="mt-1 text-xs text-buckeye-gray">
                {question.time_limit_seconds}s · up to {question.base_points} points
              </p>
              {question.type === "multiple-choice" && payload.choices ? (
                <ul className="mt-2 list-inside list-disc text-buckeye-gray">
                  {payload.choices.map((choice) => (
                    <li key={choice}>{choice}</li>
                  ))}
                </ul>
              ) : null}
              {question.type === "best-move" && payload.solution?.length ? (
                <p className="mt-2 text-xs text-buckeye-gray">
                  {payload.solution.length} move line
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Collapsible>
  );
}
