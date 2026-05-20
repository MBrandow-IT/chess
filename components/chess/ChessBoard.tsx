"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CHESS_THEME } from "./themes";
import type {
  Arrow,
  CustomSquareStyles,
  Square,
} from "react-chessboard/dist/chessboard/types";

const Chessboard = dynamic(
  () => import("react-chessboard").then((m) => m.Chessboard),
  { ssr: false },
);

export type ChessBoardProps = {
  fen?: string;
  /** Allow user to drag pieces. */
  interactive?: boolean;
  /** Bottom orientation. */
  flipped?: boolean;
  /** Show file/rank notation around the board. */
  showCoordinates?: boolean;
  /** Squares to softly highlight (e.g. legal moves). */
  highlights?: Square[];
  /** Squares to mark as last-move source/target. */
  lastMove?: { from: Square; to: Square } | null;
  /** Optional arrows ([from, to, color?]). */
  arrows?: Arrow[];
  /** Pixel width; if omitted the board is fluid up to maxWidth. */
  width?: number;
  /** Max width when fluid. */
  maxWidth?: number;
  /** Called when a piece is dropped. Return true to keep the move. */
  onMove?: (from: Square, to: Square, piece: string) => boolean;
  /** Called when a square is clicked (for click-to-move). */
  onSquareClick?: (square: Square) => void;
  /** Disable animation (useful for puzzles where you want instant resets). */
  animationDuration?: number;
};

export function ChessBoard({
  fen = "start",
  interactive = false,
  flipped = false,
  showCoordinates = true,
  highlights = [],
  lastMove = null,
  arrows = [],
  width,
  maxWidth = 480,
  onMove,
  onSquareClick,
  animationDuration = 200,
}: ChessBoardProps) {
  // react-chessboard@4.7.3 has a buggy auto-sizing path: if its inner div's
  // offsetWidth is 0 on the first effect tick (which happens reliably under
  // next/dynamic + React 19), it never attaches a ResizeObserver and stays
  // stuck on a tipped-king placeholder. We sidestep that by measuring our own
  // container and always feeding `boardWidth` an explicit pixel value.
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(width);

  useEffect(() => {
    if (width != null) {
      setMeasuredWidth(width);
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setMeasuredWidth(w);
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const squareStyles: CustomSquareStyles = useMemo(() => {
    const styles: CustomSquareStyles = {};
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: CHESS_THEME.lastMove };
      styles[lastMove.to] = { backgroundColor: CHESS_THEME.lastMove };
    }
    for (const sq of highlights) {
      styles[sq] = {
        ...(styles[sq] ?? {}),
        background: CHESS_THEME.legalMoveDot,
      };
    }
    return styles;
  }, [highlights, lastMove]);

  return (
    <div
      ref={containerRef}
      className="mx-auto w-full"
      style={{ maxWidth: width ?? maxWidth }}
      data-testid="chessboard"
    >
      {measuredWidth ? (
        <Chessboard
          position={fen}
          boardWidth={measuredWidth}
          boardOrientation={flipped ? "black" : "white"}
          showBoardNotation={showCoordinates}
          arePiecesDraggable={interactive}
          animationDuration={animationDuration}
          customLightSquareStyle={{ backgroundColor: CHESS_THEME.light }}
          customDarkSquareStyle={{ backgroundColor: CHESS_THEME.dark }}
          customBoardStyle={{
            borderRadius: 8,
            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
          }}
          customSquareStyles={squareStyles}
          customArrows={arrows}
          customArrowColor={CHESS_THEME.arrowColor}
          onPieceDrop={(from, to, piece) => {
            if (!onMove) return false;
            return onMove(from, to, piece);
          }}
          onSquareClick={(square) => onSquareClick?.(square)}
        />
      ) : (
        <div
          aria-hidden
          style={{ width: "100%", aspectRatio: "1 / 1" }}
        />
      )}
    </div>
  );
}
