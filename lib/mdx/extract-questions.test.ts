import { describe, expect, it } from "vitest";
import { extractKahootQuestions } from "./extract-questions";

describe("extractKahootQuestions", () => {
  it("returns an empty array when no questions are present", () => {
    expect(extractKahootQuestions("# Hello\nJust some text.")).toEqual([]);
  });

  it("extracts a self-closing question with string props", () => {
    const src = `<KahootQuestion id="q1" type="multiple-choice" prompt="Who moves first?" />`;
    expect(extractKahootQuestions(src)).toEqual([
      { id: "q1", type: "multiple-choice", prompt: "Who moves first?" },
    ]);
  });

  it("extracts JS-expression props (arrays, numbers, booleans)", () => {
    const src = `<KahootQuestion id="q2" type="best-move" fen="r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3" solution={["Nxe5"]} timeLimitSeconds={20} basePoints={100} />`;
    const [q] = extractKahootQuestions(src);
    expect(q).toMatchObject({
      id: "q2",
      type: "best-move",
      solution: ["Nxe5"],
      timeLimitSeconds: 20,
      basePoints: 100,
    });
  });

  it("extracts multiple questions across a document", () => {
    const src = `
      Intro text.

      <KahootQuestion id="q1" type="multiple-choice" choices={["a", "b", "c"]} correctChoice={1} />

      Some more lesson...

      <KahootQuestion id="q2" type="best-move" solution={["Qh5"]} />
    `;
    const out = extractKahootQuestions(src);
    expect(out).toHaveLength(2);
    expect(out[0]?.id).toBe("q1");
    expect(out[0]?.choices).toEqual(["a", "b", "c"]);
    expect(out[0]?.correctChoice).toBe(1);
    expect(out[1]?.id).toBe("q2");
  });

  it("handles an open/close (non-self-closing) form", () => {
    const src = `<KahootQuestion id="q3" type="multiple-choice">notes</KahootQuestion>`;
    expect(extractKahootQuestions(src)).toEqual([
      { id: "q3", type: "multiple-choice" },
    ]);
  });

  it("handles single-quoted strings in expression props", () => {
    const src = `<KahootQuestion id="q4" type="best-move" solution={['Nxe5']} />`;
    const [q] = extractKahootQuestions(src);
    expect(q?.solution).toEqual(["Nxe5"]);
  });
});
