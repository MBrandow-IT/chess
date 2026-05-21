import { ChessBoard } from "@/components/chess/ChessBoard";
import { Puzzle } from "@/components/chess/Puzzle";
import { SlideDeck } from "@/components/lesson/SlideDeck";
import { Slide } from "@/components/lesson/Slide";
import { KahootQuestion } from "@/components/lesson/KahootQuestion";
import { Term } from "@/components/lesson/Term";
import { Collapsible } from "@/components/lesson/Collapsible";
import { PieceValue } from "@/components/lesson/PieceValue";

/**
 * Components made available to every MDX lesson without imports.
 *
 * Note: tables are wrapped in a scroll container by the rehype plugin in
 * `lib/mdx/compile.ts` (`rehypeWrapTables`). That happens at the HAST layer
 * so it doesn't depend on the runtime correctly resolving lowercase
 * element-name keys here.
 */
export const mdxComponents = {
  ChessBoard,
  Puzzle,
  SlideDeck,
  Slide,
  KahootQuestion,
  Term,
  Collapsible,
  PieceValue,
} as const;
