import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import {
  boardSetupToFen,
  castlingRightsFromPosition,
  fenToBoardSetup,
} from "@/lib/chess/board-editor";
import { loadChess } from "@/lib/chess/moves";

describe("castlingRightsFromPosition", () => {
  it("grants white kingside when king and h-rook are home", () => {
    const { position } = fenToBoardSetup(
      "r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5",
    );
    expect(castlingRightsFromPosition(position)).toBe("KQkq");
  });

  it("drops kingside when the h-rook left home", () => {
    const { position } = fenToBoardSetup(
      "r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w kq - 4 5",
    );
    expect(castlingRightsFromPosition(position)).toBe("kq");
  });
});

describe("boardSetupToFen", () => {
  it("preserves castling rights for a castle-ready Italian Game", () => {
    const setup = fenToBoardSetup(
      "r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5",
    );
    const fen = boardSetupToFen(setup);
    expect(fen).toContain(" KQkq ");

    const game = loadChess(fen);
    expect(game.moves({ square: "e1" })).toContain("O-O");
  });

  it("allows recording and playing O-O in the solution line", () => {
    const setup = fenToBoardSetup(
      "r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5",
    );
    const fen = boardSetupToFen(setup);
    const game = new Chess(fen, { skipValidation: true });
    const move = game.move("O-O");
    expect(move?.san).toBe("O-O");
  });
});
