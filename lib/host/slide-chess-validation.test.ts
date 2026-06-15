import { describe, expect, it } from "vitest";
import { validateSlideChessBlockPayload } from "./slide-chess-validation";

describe("validateSlideChessBlockPayload", () => {
  it("accepts a valid puzzle block", () => {
    const err = validateSlideChessBlockPayload({
      planSlug: "beginners-workshop",
      lessonSlug: "tactics-forks-and-double-attacks",
      slug: "tactics-knight-fork-puzzle",
      type: "puzzle",
      slide_label: "Slide 6 — Knight fork",
      payload: {
        fen: "1k1q4/p7/8/4N3/8/8/8/4K3 w - - 0 1",
        solution: ["Nc6+", "Kc8", "Nxd8"],
        hint: "Jump to c6",
        title: "Knight fork",
      },
    });
    expect(err).toBeNull();
  });

  it("accepts a valid display board block", () => {
    const err = validateSlideChessBlockPayload({
      planSlug: "beginners-workshop",
      lessonSlug: "tactics-forks-and-double-attacks",
      slug: "tactics-pin-diagram",
      type: "display-board",
      slide_label: "Pins diagram",
      payload: {
        fen: "r1bqk2r/pppp1ppp/2n5/4p3/1PB5/8/PPP2PPP/RNBQK2R b KQkq - 0 1",
        highlights: ["b4", "c6"],
      },
    });
    expect(err).toBeNull();
  });

  it("rejects illegal puzzle solution moves", () => {
    const err = validateSlideChessBlockPayload({
      planSlug: "beginners-workshop",
      lessonSlug: "tactics-forks-and-double-attacks",
      slug: "bad-puzzle",
      type: "puzzle",
      slide_label: "Bad puzzle",
      payload: {
        fen: "1k1q4/p7/8/4N3/8/8/8/4K3 w - - 0 1",
        solution: ["Qh5"],
      },
    });
    expect(err).toMatch(/Illegal solution move|Invalid FEN/);
  });

  it("rejects invalid highlight squares", () => {
    const err = validateSlideChessBlockPayload({
      planSlug: "beginners-workshop",
      lessonSlug: "tactics-forks-and-double-attacks",
      slug: "bad-board",
      type: "display-board",
      slide_label: "Bad board",
      payload: {
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        highlights: ["z9"],
      },
    });
    expect(err).toMatch(/Invalid highlight square/);
  });
});
