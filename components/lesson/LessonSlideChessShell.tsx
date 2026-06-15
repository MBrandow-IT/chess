"use client";

import type { ReactNode } from "react";
import { SlideChessProvider } from "@/components/lesson/SlideChessBlocks";
import type { LessonSlideChessBlockRow } from "@/lib/supabase/types";

export function LessonSlideChessShell({
  children,
  blocks,
  planSlug,
  lessonSlug,
  isAdmin,
}: {
  children: ReactNode;
  blocks: LessonSlideChessBlockRow[];
  planSlug: string;
  lessonSlug: string;
  isAdmin: boolean;
}) {
  return (
    <SlideChessProvider
      blocks={blocks}
      planSlug={planSlug}
      lessonSlug={lessonSlug}
      isAdmin={isAdmin}
    >
      {children}
    </SlideChessProvider>
  );
}
