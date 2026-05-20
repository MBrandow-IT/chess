import { ChessBoard } from "@/components/chess/ChessBoard";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function TestPage() {
  return (
    <div className="container-page py-12">
      <h1 className="mb-2 font-display text-2xl font-semibold">
        Chess board test
      </h1>
      <p className="mb-6 text-sm text-buckeye-gray">
        Starting position, rendered with the shared{" "}
        <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
          ChessBoard
        </code>{" "}
        component.
      </p>

      <ChessBoard fen={STARTING_FEN} />
    </div>
  );
}
