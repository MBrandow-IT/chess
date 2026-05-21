import { getCurrentUser } from "@/lib/supabase/auth";
import { fetchLessonScheduleMap } from "@/lib/events/queries";

export async function getLessonAccess(planSlug: string, lessonSlug: string) {
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin ?? false;
  const scheduleMap = await fetchLessonScheduleMap(planSlug);
  const schedule = scheduleMap.get(lessonSlug) ?? null;
  return {
    isAdmin,
    schedule,
    blocked: !isAdmin && schedule !== null,
  };
}
