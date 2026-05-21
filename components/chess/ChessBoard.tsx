"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CHESS_THEME } from "./themes";
import {
  legalMovesFromFen,
  loadChess,
  type LegalMoves,
} from "@/lib/chess/moves";
import type {
  Arrow,
  CustomSquareStyles,
  Piece,
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
  /**
   * When true, clicking a piece (or starting a drag) highlights its legal
   * destination squares: gray dots on empty squares, gray rings on captures
   * — same as chess.com / lichess. Click-to-move is also enabled while a
   * piece is selected. Requires `interactive`.
   */
  showLegalMoves?: boolean;
  /**
   * Pre-select a square and visually show its legal-move dots/rings without
   * requiring a user click. Works on non-interactive boards too — useful for
   * teaching slides like "this is how a knight moves". If the user later
   * clicks another piece (on an interactive board), the click takes over.
   */
  selectedSquare?: Square;
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
  /** Called when a piece is dropped (drag) or click-to-moved. Return true to keep the move. */
  onMove?: (from: Square, to: Square, piece: string) => boolean;
  /** Called when a square is clicked (for advanced custom flows). */
  onSquareClick?: (square: Square) => void;
  /** Disable animation (useful for puzzles where you want instant resets). */
  animationDuration?: number;
};

type Selection = { square: Square; piece: string } | null;

export function ChessBoard({
  fen = "start",
  interactive = false,
  flipped = false,
  showCoordinates = true,
  showLegalMoves = false,
  selectedSquare,
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

  // Track which square the user has selected for click-to-move / drag-preview.
  const [selection, setSelection] = useState<Selection>(null);
  const [legal, setLegal] = useState<LegalMoves>({ targets: [], captures: [] });

  // Whenever the position changes externally, any in-flight selection is
  // stale. Clear it so the new state of the world drives the next click.
  useEffect(() => {
    setSelection(null);
    setLegal({ targets: [], captures: [] });
  }, [fen]);

  const legalEnabled = interactive && showLegalMoves;

  function selectSquare(square: Square, piece?: string) {
    if (!legalEnabled || !piece) return;
    const moves = legalMovesFromFen(fen, square);
    if (moves.targets.length === 0 && moves.captures.length === 0) {
      setSelection(null);
      setLegal({ targets: [], captures: [] });
      return;
    }
    setSelection({ square, piece });
    setLegal(moves);
  }

  function clearSelection() {
    setSelection(null);
    setLegal({ targets: [], captures: [] });
  }

  function handleSquareClick(square: Square, piece?: Piece) {
    // Always forward to the external handler if provided.
    onSquareClick?.(square);
    if (!legalEnabled) return;

    // No selection yet — try to select this square.
    if (!selection) {
      selectSquare(square, piece);
      return;
    }

    // Have a selection — did they click one of its legal targets?
    const isLegal =
      legal.targets.includes(square) || legal.captures.includes(square);
    if (isLegal) {
      onMove?.(selection.square, square, selection.piece);
      clearSelection();
      return;
    }

    // Clicked the same selected square or another own piece — re-select.
    if (piece) {
      selectSquare(square, piece);
      return;
    }

    // Clicked an empty / illegal square — drop the selection.
    clearSelection();
  }

  function handlePieceDragBegin(piece: Piece, sourceSquare: Square) {
    if (!legalEnabled) return;
    selectSquare(sourceSquare, piece);
  }

  // Combine "what the user just clicked" (internal `selection`) with "what
  // the caller statically pre-selected" (`selectedSquare`). Internal wins so
  // a click on an interactive board feels responsive even if the slide
  // author pre-selected a different piece.
  const displayed = useMemo<{
    selection: Selection;
    legal: LegalMoves;
  }>(() => {
    if (selection) return { selection, legal };
    if (selectedSquare) {
      try {
        const piece = loadChess(fen).get(selectedSquare);
        if (!piece) return { selection: null, legal: { targets: [], captures: [] } };
        return {
          selection: {
            square: selectedSquare,
            piece: `${piece.color}${piece.type.toUpperCase()}`,
          },
          legal: legalMovesFromFen(fen, selectedSquare),
        };
      } catch {
        return { selection: null, legal: { targets: [], captures: [] } };
      }
    }
    return { selection: null, legal: { targets: [], captures: [] } };
  }, [selection, legal, selectedSquare, fen]);

  const squareStyles: CustomSquareStyles = useMemo(() => {
    const styles: CustomSquareStyles = {};

    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: CHESS_THEME.lastMove };
      styles[lastMove.to] = { backgroundColor: CHESS_THEME.lastMove };
    }

    if (displayed.selection) {
      styles[displayed.selection.square] = {
        ...(styles[displayed.selection.square] ?? {}),
        backgroundColor: CHESS_THEME.highlight,
      };
    }

    for (const sq of displayed.legal.targets) {
      styles[sq] = {
        ...(styles[sq] ?? {}),
        background: CHESS_THEME.legalMoveDot,
      };
    }
    for (const sq of displayed.legal.captures) {
      styles[sq] = {
        ...(styles[sq] ?? {}),
        background: CHESS_THEME.legalCaptureRing,
      };
    }

    // Caller-supplied highlights still merge in (useful for teaching).
    for (const sq of highlights) {
      styles[sq] = {
        ...(styles[sq] ?? {}),
        background: CHESS_THEME.legalMoveDot,
      };
    }

    return styles;
  }, [highlights, lastMove, displayed]);

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
            // The drop ends a drag — clear any selection we previewed during
            // the drag. We do this before calling onMove so the parent can
            // safely re-render with a fresh FEN.
            clearSelection();
            if (!onMove) return false;
            return onMove(from, to, piece);
          }}
          onPieceDragBegin={handlePieceDragBegin}
          onPieceDragEnd={clearSelection}
          onSquareClick={handleSquareClick}
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
