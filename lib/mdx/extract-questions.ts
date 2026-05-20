/**
 * Lightweight extractor for `<KahootQuestion ... />` JSX nodes inside an MDX
 * source string. We deliberately do NOT execute MDX — at quiz-start time we
 * just need the prop bag to snapshot into the database.
 *
 * Supported prop formats:
 *   - string literal: prop="value" or prop='value'
 *   - JS expression containing a JSON-like array, number, string, or boolean:
 *       prop={["a", "b"]}  prop={42}  prop={true}  prop={"value"}
 *
 * For anything more exotic, author the question with literal-friendly syntax.
 */
import type { KahootQuestionProps } from "@/components/lesson/KahootQuestion";

export type ExtractedQuestion = KahootQuestionProps;

const SELF_CLOSING = /<KahootQuestion\b([\s\S]*?)\/>/g;
const OPEN_CLOSE = /<KahootQuestion\b([\s\S]*?)>[\s\S]*?<\/KahootQuestion>/g;

export function extractKahootQuestions(source: string): ExtractedQuestion[] {
  const results: ExtractedQuestion[] = [];

  function harvest(re: RegExp) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      const attrs = m[1] ?? "";
      const props = parseAttrs(attrs);
      results.push(props as ExtractedQuestion);
    }
  }

  harvest(SELF_CLOSING);
  harvest(OPEN_CLOSE);

  return results;
}

function parseAttrs(input: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const tokens = tokenizeAttrs(input);
  for (const { key, value } of tokens) {
    out[key] = value;
  }
  return out;
}

type AttrToken = { key: string; value: unknown };

function tokenizeAttrs(input: string): AttrToken[] {
  const tokens: AttrToken[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    while (i < len && /\s/.test(input[i]!)) i++;
    if (i >= len) break;

    const keyStart = i;
    while (i < len && /[A-Za-z0-9_-]/.test(input[i]!)) i++;
    const key = input.slice(keyStart, i);
    if (!key) break;

    while (i < len && /\s/.test(input[i]!)) i++;

    if (input[i] !== "=") {
      tokens.push({ key, value: true });
      continue;
    }
    i++;
    while (i < len && /\s/.test(input[i]!)) i++;

    const ch = input[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      const start = i;
      while (i < len && input[i] !== quote) {
        if (input[i] === "\\") i++;
        i++;
      }
      const raw = input.slice(start, i);
      i++;
      tokens.push({ key, value: raw });
    } else if (ch === "{") {
      i++;
      let depth = 1;
      const start = i;
      while (i < len && depth > 0) {
        const c = input[i]!;
        if (c === "{") depth++;
        else if (c === "}") {
          depth--;
          if (depth === 0) break;
        }
        i++;
      }
      const expr = input.slice(start, i).trim();
      i++;
      tokens.push({ key, value: evalLiteral(expr) });
    } else {
      const start = i;
      while (i < len && !/\s/.test(input[i]!)) i++;
      tokens.push({ key, value: input.slice(start, i) });
    }
  }
  return tokens;
}

/**
 * Parse a small subset of JS expressions: JSON-compatible values plus single
 * quoted strings and trailing commas. Returns the original string on failure.
 */
function evalLiteral(expr: string): unknown {
  if (expr === "true") return true;
  if (expr === "false") return false;
  if (expr === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);

  let normalized = expr
    .replace(/'((?:[^'\\]|\\.)*)'/g, (_m, inner) => {
      return JSON.stringify(inner.replace(/\\'/g, "'"));
    })
    .replace(/,(\s*[\]}])/g, "$1");

  try {
    return JSON.parse(normalized);
  } catch {
    return expr;
  }
}
