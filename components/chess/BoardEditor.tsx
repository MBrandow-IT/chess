"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CHESS_THEME } from "./themes";
import {
  boardSetupToFen,
  canPlaceSparePiece,
  emptyBoardSetup,
  movePieceOnBoard,
  removeSquare,
  type BoardSetup,
} from "@/lib/chess/board-editor";
import type {
  BoardPosition,
  Piece,
  Square,
} from "react-chessboard/dist/chessboard/types";

const Chessboard = dynamic(
  () => import("react-chessboard").then((m) => m.Chessboard),
  { ssr: false },
);

const SparePiece = dynamic(
  () => import("react-chessboard").then((m) => m.SparePiece),
  { ssr: false },
);

const WHITE_PIECES: Piece[] = ["wK", "wQ", "wR", "wB", "wN", "wP"];
const BLACK_PIECES: Piece[] = ["bK", "bQ", "bR", "bB", "bN", "bP"];

export type BoardEditorProps = {
  value: BoardSetup;
  onChange: (setup: BoardSetup) => void;
  maxWidth?: number;
};

export function BoardEditor({
  value,
  onChange,
  maxWidth = 480,
}: BoardEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState<number | undefined>(undefined);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setBoardWidth(Math.min(w, maxWidth));
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);

  const fen = boardSetupToFen(value);
  const spareWidth = boardWidth ? Math.floor(boardWidth / 6) : 40;

  function updatePosition(position: BoardPosition) {
    onChange({ ...value, position });
  }

  function handleSparePieceDrop(piece: Piece, targetSquare: Square): boolean {
    if (!canPlaceSparePiece(value.position, piece, targetSquare)) return false;
    updatePosition({ ...value.position, [targetSquare]: piece });
    return true;
  }

  function handlePieceDrop(
    sourceSquare: Square,
    targetSquare: Square,
    piece: Piece,
  ): boolean {
    const next = movePieceOnBoard(
      value.position,
      sourceSquare,
      targetSquare,
      piece,
    );
    if (!next) return false;
    updatePosition(next);
    return true;
  }

  function handlePieceDropOffBoard(sourceSquare: Square) {
    if (!value.position[sourceSquare]) return;
    updatePosition(removeSquare(value.position, sourceSquare));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-buckeye-ink">Side to move</span>
        <button
          type="button"
          onClick={() => onChange({ ...value, turn: "w" })}
          className={`focus-ring rounded-md px-3 py-1.5 text-sm font-medium ${
            value.turn === "w"
              ? "bg-buckeye-scarlet text-white"
              : "border border-black/10 bg-white hover:bg-black/5"
          }`}
        >
          White
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...value, turn: "b" })}
          className={`focus-ring rounded-md px-3 py-1.5 text-sm font-medium ${
            value.turn === "b"
              ? "bg-buckeye-ink text-white"
              : "border border-black/10 bg-white hover:bg-black/5"
          }`}
        >
          Black
        </button>
        <button
          type="button"
          onClick={() => onChange(emptyBoardSetup())}
          className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium hover:bg-black/5"
        >
          Clear board
        </button>
        <button
          type="button"
          onClick={() => setFlipped((v) => !v)}
          className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium hover:bg-black/5"
        >
          Flip board
        </button>
      </div>

      <div ref={containerRef} className="mx-auto w-full" style={{ maxWidth }}>
        {boardWidth ? (
          <>
            <Chessboard
              id="puzzle-board-editor"
              position={fen}
              boardWidth={boardWidth}
              boardOrientation={flipped ? "black" : "white"}
              arePiecesDraggable
              dropOffBoardAction="trash"
              onSparePieceDrop={handleSparePieceDrop}
              onPieceDrop={handlePieceDrop}
              onPieceDropOffBoard={handlePieceDropOffBoard}
              customLightSquareStyle={{ backgroundColor: CHESS_THEME.light }}
              customDarkSquareStyle={{ backgroundColor: CHESS_THEME.dark }}
              customBoardStyle={{
                borderRadius: 8,
                boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
              }}
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SparePieceRow
                label="White pieces"
                pieces={WHITE_PIECES}
                width={spareWidth}
              />
              <SparePieceRow
                label="Black pieces"
                pieces={BLACK_PIECES}
                width={spareWidth}
              />
            </div>
          </>
        ) : (
          <div aria-hidden style={{ width: "100%", aspectRatio: "1 / 1" }} />
        )}
      </div>

      <p className="text-xs text-buckeye-gray">
        Drag pieces from the tray onto empty squares. Drag off the board to
        remove. At most one king per color.
      </p>
      <p className="font-mono text-xs text-buckeye-gray/80 break-all">{fen}</p>
    </div>
  );
}

function SparePieceRow({
  label,
  pieces,
  width,
}: {
  label: string;
  pieces: Piece[];
  width: number;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-buckeye-gray">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {pieces.map((piece) => (
          <SparePiece
            key={piece}
            piece={piece}
            width={width}
            dndId={`spare-${piece}`}
          />
        ))}
      </div>
    </div>
  );
}
