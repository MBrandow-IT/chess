import { redirect } from "next/navigation";
import Link from "next/link";
import { startQuizFromLesson } from "@/lib/quiz/start";

export const dynamic = "force-dynamic";

export default async function NewQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; lesson?: string }>;
}) {
  const { plan, lesson } = await searchParams;
  if (!plan || !lesson) {
    return (
      <ErrorView
        title="Missing parameters"
        body="Need both ?plan=... and ?lesson=... to start a quiz."
      />
    );
  }

  let quizId: string;
  try {
    const result = await startQuizFromLesson({
      planSlug: plan,
      lessonSlug: lesson,
    });
    quizId = result.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not start quiz.";
    return <ErrorView title="Couldn't start the quiz" body={msg} />;
  }
  redirect(`/host/quizzes/${quizId}`);
}

function ErrorView({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h1 className="font-display text-xl font-semibold text-red-800">
        {title}
      </h1>
      <p className="mt-1 text-sm text-red-700">{body}</p>
      <Link
        href="/host"
        className="mt-4 inline-block text-sm font-medium text-buckeye-scarlet hover:underline"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
