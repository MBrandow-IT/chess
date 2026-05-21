import { ChessBoard } from "@/components/chess/ChessBoard";
import { Puzzle } from "@/components/chess/Puzzle";
import { SlideDeck } from "@/components/lesson/SlideDeck";
import { Slide } from "@/components/lesson/Slide";
import { KahootQuestion } from "@/components/lesson/KahootQuestion";
import { Term } from "@/components/lesson/Term";
import { Collapsible } from "@/components/lesson/Collapsible";

/** Components made available to every MDX lesson without imports. */
export const mdxComponents = {
  ChessBoard,
  Puzzle,
  SlideDeck,
  Slide,
  KahootQuestion,
  Term,
  Collapsible,
} as const;
