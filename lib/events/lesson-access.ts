import { getCurrentUser } from "@/lib/supabase/auth";
import {
  fetchLessonScheduleMap,
  type LessonScheduleState,
} from "@/lib/events/queries";

export function isLessonLiveForStudents(
  state: LessonScheduleState | undefined,
): boolean {
  return state?.status === "live";
}

export function isLessonListedForStudents(
  state: LessonScheduleState | undefined,
): boolean {
  return state?.status === "live" || state?.status === "scheduled";
}

export async function getLessonAccess(planSlug: string, lessonSlug: string) {
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin ?? false;
  const scheduleMap = await fetchLessonScheduleMap(planSlug);
  const state = scheduleMap.get(lessonSlug);

  if (isAdmin) {
    return {
      isAdmin,
      schedule:
        state?.status === "scheduled"
          ? {
              unlockAt: state.unlockAt,
              eventTitle: state.eventTitle,
              eventId: state.eventId,
            }
          : null,
      blocked: false,
    };
  }

  const schedule =
    state?.status === "scheduled"
      ? {
          unlockAt: state.unlockAt,
          eventTitle: state.eventTitle,
          eventId: state.eventId,
        }
      : null;

  return {
    isAdmin,
    schedule,
    blocked: !isLessonLiveForStudents(state),
  };
}
