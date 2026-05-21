export type PieceValueProps = {
  /** Which piece this snippet describes. */
  piece: "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
};

type PieceInfo = {
  label: string;
  glyph: string;
  /** Standard "Reinfeld" value used by virtually every beginner book. */
  value: number | null;
  /** A short, kid-friendly note rendered to the right of the value. */
  hint: string;
};

const PIECES: Record<PieceValueProps["piece"], PieceInfo> = {
  pawn: { label: "Pawn", glyph: "♟", value: 1, hint: "the foot soldier" },
  knight: { label: "Knight", glyph: "♞", value: 3, hint: "tricky jumper" },
  bishop: { label: "Bishop", glyph: "♝", value: 3, hint: "long-range diagonals" },
  rook: { label: "Rook", glyph: "♜", value: 5, hint: "heavy artillery" },
  queen: { label: "Queen", glyph: "♛", value: 9, hint: "the strongest piece" },
  king: { label: "King", glyph: "♚", value: null, hint: "if it's lost, the game's over" },
};

/**
 * A small pill that mentions a piece's point value. Intentionally low-key:
 * the goal in lesson 1 is just to plant the idea that pieces have different
 * strengths so kids feel rewarded when they capture something big. Trades
 * and material balance get the full treatment in a later lesson.
 */
export function PieceValue({ piece }: PieceValueProps) {
  const info = PIECES[piece];
  const valueText = info.value !== null ? `${info.value} pt${info.value === 1 ? "" : "s"}` : "Priceless";

  return (
    <aside
      className="my-3 flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-sm shadow-sm"
      aria-label={`${info.label} is worth ${valueText}`}
    >
      <span aria-hidden className="text-lg leading-none text-buckeye-ink">
        {info.glyph}
      </span>
      <span className="text-buckeye-ink">Worth</span>
      <strong className="text-buckeye-scarlet">{valueText}</strong>
      <span className="text-xs text-buckeye-gray">· {info.hint} · more next lesson</span>
    </aside>
  );
}
