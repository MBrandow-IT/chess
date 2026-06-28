"use client";

import { createContext, useContext, type ReactNode } from "react";
import Link from "next/link";
import { AnalysisBoard } from "@/components/chess/AnalysisBoard";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { Puzzle } from "@/components/chess/Puzzle";
import type { LessonSlideChessBlockRow } from "@/lib/supabase/types";
import type {
  SlideAnalysisBoardPayload,
  SlideDisplayBoardPayload,
  SlidePuzzlePayload,
} from "@/lib/slide-chess/types";
import type { Square } from "react-chessboard/dist/chessboard/types";

export type SlideChessContextValue = {
  blocksBySlug: Record<string, LessonSlideChessBlockRow>;
  planSlug: string;
  lessonSlug: string;
  isAdmin: boolean;
};

const SlideChessContext = createContext<SlideChessContextValue | null>(null);

export function SlideChessProvider({
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
  const blocksBySlug = Object.fromEntries(blocks.map((block) => [block.slug, block]));

  return (
    <SlideChessContext.Provider
      value={{ blocksBySlug, planSlug, lessonSlug, isAdmin }}
    >
      {children}
    </SlideChessContext.Provider>
  );
}

function useSlideChessContext() {
  return useContext(SlideChessContext);
}

function MissingSlideChessBlock({ slug }: { slug: string }) {
  const ctx = useSlideChessContext();

  if (!ctx?.isAdmin) {
    return null;
  }

  return (
    <div className="my-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p>
        Missing or unpublished slide chess block{" "}
        <code className="rounded bg-black/5 px-1">{slug}</code>.
      </p>
      <Link
        href={`/host/lessons/${ctx.planSlug}/${ctx.lessonSlug}/slide-chess`}
        className="mt-2 inline-block font-medium underline"
      >
        Edit slide chess blocks
      </Link>
    </div>
  );
}

function MdxTypeMismatchNote({
  slug,
  mdxType,
  blockType,
}: {
  slug: string;
  mdxType: string;
  blockType: LessonSlideChessBlockRow["type"];
}) {
  const ctx = useSlideChessContext();
  if (!ctx?.isAdmin) return null;

  return (
    <p className="my-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
      Admin note: MDX uses <code className="rounded bg-black/5 px-1">{mdxType}</code>{" "}
      but block <code className="rounded bg-black/5 px-1">{slug}</code> is a{" "}
      <strong>{blockType}</strong> in the editor. Rendering from the editor type —
      no MDX change required.
    </p>
  );
}

function getBlockBySlug(slug: string): LessonSlideChessBlockRow | null {
  const ctx = useSlideChessContext();
  if (!ctx) return null;
  return ctx.blocksBySlug[slug] ?? null;
}

function renderSlideChessBlock(block: LessonSlideChessBlockRow) {
  switch (block.type) {
    case "puzzle": {
      const payload = block.payload as SlidePuzzlePayload;
      return (
        <Puzzle
          fen={payload.fen}
          solution={payload.solution}
          hint={payload.hint}
          title={payload.title}
          allowReveal={payload.allowReveal}
        />
      );
    }
    case "display-board": {
      const payload = block.payload as SlideDisplayBoardPayload;
      return (
        <ChessBoard
          fen={payload.fen}
          highlights={payload.highlights as Square[] | undefined}
          selectedSquare={payload.selectedSquare as Square | undefined}
          flipped={payload.flipped}
          lastMove={payload.lastMove as { from: Square; to: Square } | undefined}
          interactive={payload.interactive}
        />
      );
    }
    case "analysis-board": {
      const payload = block.payload as SlideAnalysisBoardPayload;
      return <AnalysisBoard fen={payload.fen} flipped={payload.flipped} />;
    }
    default:
      return null;
  }
}

function SlideChessBySlug({
  slug,
  mdxType,
}: {
  slug: string;
  mdxType: "SlidePuzzle" | "SlideBoard" | "SlideAnalysis";
}) {
  const block = getBlockBySlug(slug);
  if (!block) {
    return <MissingSlideChessBlock slug={slug} />;
  }

  const expectedMdxType =
    block.type === "puzzle"
      ? "SlidePuzzle"
      : block.type === "display-board"
        ? "SlideBoard"
        : "SlideAnalysis";

  return (
    <>
      {mdxType !== expectedMdxType ? (
        <MdxTypeMismatchNote
          slug={slug}
          mdxType={mdxType}
          blockType={block.type}
        />
      ) : null}
      {renderSlideChessBlock(block)}
    </>
  );
}

export function SlidePuzzle({ slug }: { slug: string }) {
  return <SlideChessBySlug slug={slug} mdxType="SlidePuzzle" />;
}

export function SlideBoard({ slug }: { slug: string }) {
  return <SlideChessBySlug slug={slug} mdxType="SlideBoard" />;
}

export function SlideAnalysis({ slug }: { slug: string }) {
  return <SlideChessBySlug slug={slug} mdxType="SlideAnalysis" />;
}
