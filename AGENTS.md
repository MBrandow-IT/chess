# AGENTS.md — Buckeye Chess Workshops

Quick-reference cheat sheet for AI agents (and humans) working on this repo.
Read this **before** making nontrivial changes — most of the entries below
exist because someone got bitten by them.

---

## 1. Project at a glance

- **What:** A Next.js 15 (App Router, React 19) app for the Buckeye Public
  Library. Two surfaces:
  1. **Lessons** — authored in MDX, rendered by a custom `<SlideDeck>` with
     puzzle / chess-board / quiz-preview blocks.
  2. **Live quizzes** — Kahoot-style classroom rounds. Host runs the lobby,
     students join via a 6-digit PIN.
- **Tech stack:** Next.js 15 (Webpack, not Turbopack), React 19, TypeScript,
  Tailwind v3, MDX via `next-mdx-remote@6`, Supabase (Postgres + Auth) on the
  backend, `chess.js@1.0.0-beta.8` + `react-chessboard@4.7.3` for the board.
- **Hosting:** Vercel. Production URL is `https://buckeyechess.org`.

---

## 2. House rules

### 2.1 Language — American English everywhere

All user-facing copy, comments, commit messages, doc strings, and variable
names use **American spellings**. Examples:

| ❌ British | ✅ American |
|---|---|
| colour, colours | color, colors |
| favourite | favorite |
| behaviour | behavior |
| defence | defense |
| centre | center |
| cancelled | canceled |
| backwards (as adverb) | backward |
| organisation | organization |
| optimise / recognise / customise | optimize / recognize / customize |

When in doubt, default to AP Stylebook spellings.
Run this grep before you commit content / docs changes:

```powershell
rg -i "\b(colour|behaviour|favourite|defence|centre|cancelled|optimise|recognise|customise|maximise|minimise|grey|whilst|amongst|labelled|focussed)\b" --glob "!package-lock.json"
```

(`package-lock.json` has a third-party package literally named `@img/colour`
— that's the one allowed exception.)

### 2.2 Type-check / lint / build before declaring done

```powershell
npm run typecheck     # tsc --noEmit
npm run lint          # next lint
npm test              # vitest run (small, fast)
npm run build         # full production build, mirrors Vercel
```

The dev server (`npm run dev`) and `npm run build` both write to `.next/` —
you **must stop dev** before running build or they collide.

### 2.3 Comments

Only write comments that explain *why* (intent, trade-off, gotcha). Never
write comments that paraphrase the code. The codebase has lots of "this is
the workaround for X because of Y" comments — those are pulling their weight.
"// Increment counter" comments are not.

---

## 3. Repo map

```
app/
  layout.tsx               Root layout, mounts BuckeyeHeader/Footer.
  globals.css              All bespoke CSS (no @tailwindcss/typography!).
  page.tsx                 Marketing home.
  plans/[plan]/[lesson]    SSG lesson renderer; uses lib/mdx/compile.ts.
  host/                    Instructor dashboard (gated to admin role).
  play/                    Anonymous student quiz join + play.
  api/quizzes/             Quiz lifecycle route handlers.
  test/page.tsx            Debug page — bare board at the starting position.

components/
  chess/ChessBoard.tsx     The wrapper around react-chessboard. Read §6.
  chess/Puzzle.tsx         Solve-a-line widget used in lessons.
  chess/themes.ts          Board colors + radial-gradient move dots.
  lesson/SlideDeck.tsx     Fullscreen-capable slide deck with URL sync.
  lesson/Slide.tsx         Individual slide chrome.
  lesson/Collapsible.tsx   Generic collapsing card (used for "Quiz preview").
  lesson/PieceValue.tsx    "Worth N pts" chip used on piece-intro slides.
  lesson/Term.tsx          Tooltip term used inline in MDX.
  lesson/KahootQuestion.tsx Quiz-preview block parsed from MDX at sync time.
  play/PlayerQuiz.tsx      The whole student-side quiz UI.
  brand/BuckeyeHeader.tsx  Global header (hidden on /play and /host).
  brand/BuckeyeFooter.tsx  Global footer (also hidden on /play and /host).

lib/
  chess/moves.ts           loadChess() + legalMovesFromFen() helpers.
  chess/scoring.ts         Mirrors submit_answer RPC's scoring formula.
  mdx/compile.ts           renderLessonMDX() — see §5.
  mdx/components.tsx       MDX component registry — see §5.
  mdx/extract-questions.ts Parses <KahootQuestion> from MDX for db sync.
  quiz/start.ts            Creates a quiz row + snapshots questions.
  quiz/pin.ts              6-digit PIN generator.
  supabase/                Browser/server clients, types, RPC helper.
  sound.ts                 Tiny SFX player for moves/captures.

content/plans/<plan>/<lesson>/   Authored MDX + plan.yaml/lesson.yaml.
supabase/migrations/             Versioned SQL (see §8).
scripts/sync-plans.ts            Upserts plan/lesson metadata into Supabase.
scripts/make-admin.ts            Promotes a user to admin role.
```

---

## 4. Environment

`.env.local` (never committed) must contain:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...            # server-only
NEXT_PUBLIC_SITE_URL=http://localhost:3000         # used for QR codes, OG
```

**In Vercel** the same names must be set, with `NEXT_PUBLIC_SITE_URL=https://buckeyechess.org`.

**Supabase Dashboard → Auth → URL Configuration** must allow:

- `https://buckeyechess.org/auth/callback`
- `https://*.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback`

---

## 5. MDX authoring

Lessons live in `content/plans/<plan>/<lesson>/lesson.mdx`. They're rendered
on the server by `renderLessonMDX(source)` in `lib/mdx/compile.ts`.

### 5.1 Compiler options that matter

We pass two non-default options to `compileMDX`:

| Option | Value | Why |
|---|---|---|
| `blockJS` | `false` | We author the MDX in-repo, so JS expressions like `solution={["exd5"]}` need to survive. `next-mdx-remote@6` blocks them by default. |
| `remarkPlugins` | `[remarkGfm]` | Enables GFM tables, strikethrough, task lists, autolinks. |

`blockDangerousJS` stays at its default (`true`) so `eval`, `Function`,
`process`, and `require` are still stripped even with JS allowed.

### 5.2 Components available without import

The MDX registry in `lib/mdx/components.tsx` exposes these globally:

| Component | Quick use |
|---|---|
| `<SlideDeck>` | Wrap your `<Slide>`s; gives keyboard nav + fullscreen + URL sync. |
| `<Slide title="..." subtitle="...">` | One slide. |
| `<ChessBoard fen="..." selectedSquare="e4" showLegalMoves />` | The board. See §6. |
| `<Puzzle fen="..." solution={["exd5"]} hint="..." title="..." />` | Solve-a-line. |
| `<KahootQuestion type="multiple-choice" ... />` | Quiz preview / live-quiz question source. |
| `<Term name="check">check</Term>` | Inline tooltip for chess vocabulary. |
| `<Collapsible title="..." subtitle="..." defaultOpen={false}>` | Section that collapses; default closed. |
| `<PieceValue piece="knight" />` | Inline "Worth 3 pts" chip; valid values: `pawn / knight / bishop / rook / queen / king`. |

### 5.3 Tables in MDX

GFM tables are supported. They render styled via custom CSS in
`app/globals.css` (because we do **not** use `@tailwindcss/typography`).
If a table looks unstyled, the slide's wrapper has lost its `prose` class
— check `Slide.tsx`.

### 5.4 Adding a new lesson

1. Create `content/plans/<plan>/<lesson-folder>/lesson.mdx` + `lesson.yaml`.
2. Update the parent `plan.yaml`'s `order:` array.
3. Run `npm run sync` to upsert metadata into Supabase.

---

## 6. Chess board (react-chessboard) gotchas

The library is `react-chessboard@4.7.3`. It has **two** known bugs we work
around in `components/chess/ChessBoard.tsx`:

### 6.1 Broken auto-sizing → "tipped-over king" placeholder

Symptom: a single rotated white-king SVG appears instead of the board.
Cause: the library's auto-`ResizeObserver` only attaches if `offsetWidth > 0`
on the first effect tick, which fails under `next/dynamic({ ssr: false }) +
React 19`.

Fix already in place: our `ChessBoard` wrapper measures its own container
with a `ResizeObserver` and always passes an explicit `boardWidth` prop.
**Do not "simplify" this away.**

### 6.2 FEN validation rejects kingless positions

Symptom: `Invalid FEN: missing white king` thrown from `new Chess(fen)`.
Cause: many teaching FENs in this repo (e.g. `8/8/8/8/4N3/8/8/8 w - - 0 1`)
deliberately have no kings.

Fix: **always** load FENs via `loadChess(fen)` from `lib/chess/moves.ts`,
which passes `{ skipValidation: true }`. Never call `new Chess(fen)` directly.

### 6.3 Useful `ChessBoard` props we added

| Prop | What it does |
|---|---|
| `interactive` | Maps to `arePiecesDraggable`. False on display-only boards. |
| `showLegalMoves` | Click-to-select + chess.com-style dots/rings. Requires `interactive`. |
| `selectedSquare` | Statically pre-select a square (works on non-interactive boards too — useful for teaching slides). |
| `flipped` | Renders from Black's POV. |
| `lastMove={{ from, to }}` | Yellow trail on the previous move's squares. |
| `highlights={[...squares]}` | Manual list of squares to dot. |
| `onMove(from, to, piece) => boolean` | Drag- and click-driven move callback. Return false to reject. |

If you need a feature beyond these (premoves, arrows, custom pieces, etc.),
see the prop reference at `node_modules/react-chessboard/dist/chessboard/types/index.d.ts`.

---

## 7. Slide deck features

Implemented in `components/lesson/SlideDeck.tsx`. Reuse this rather than
hand-rolling a slide viewer per lesson.

- **Keyboard:** `←` / `→` / `Space` to navigate; `F` to toggle fullscreen.
  Listeners early-return if focus is in an `input` / `textarea` / contenteditable.
- **Fullscreen:** uses the native Fullscreen API (`requestFullscreen()`).
  In fullscreen, the wrapper gets `data-slidedeck-fullscreen`, and
  `app/globals.css` bumps slide typography + chess-board max-width so the
  deck reads like a presentation. Mobile Safari only supports fullscreen for
  `<video>` — button silently no-ops there.
- **URL deep-linking:** `?page=N` (1-indexed). Driven by
  `window.history.replaceState` so each click doesn't pile up a history entry.
  The state ↔ URL sync uses a `skipNextUrlWrite` ref to avoid race rewrites
  on mount.
- **Mobile-friendly dots:** for decks with >7 slides, the slide-progress dots
  collapse to first / window-around-current / last with `…` separators. See
  `visibleDots()` near the top of the file.

---

## 8. Supabase

### 8.1 Layout

- Tables defined in `supabase/migrations/0001_init.sql`.
- RPCs (security-definer functions) in `0002_rpcs.sql` and any later patches.
- Project is linked via `npx supabase link --project-ref <ref>`.

### 8.2 Applying changes

```powershell
npx supabase db push       # applies any unrecorded migrations
```

**Never edit a migration that's been applied to a remote DB.** Add a new
numbered file instead. (For local dev you can iterate freely — see the
Supabase skill: `execute_sql` for iteration, `apply_migration` only when
you're committing.)

### 8.3 Known pitfalls

**a) PostgrestError isn't an `Error` instance.**
A bare `throw error` from a Supabase query call will lose its `.message`
once a React error boundary or `instanceof Error` catch runs. Wrap with a
helper that promotes it to a real `Error`. Example pattern lives in
`lib/quiz/start.ts` (`postgrestError(stage, e)`).

**b) `RETURNS TABLE` column names shadow real columns.**
plpgsql's default `#variable_conflict` is `error`. If your function has
`RETURNS TABLE (session_token uuid, ...)` and you write
`select session_token from quiz_players`, you get:

```
column reference "session_token" is ambiguous
```

Fix: alias the table and qualify every column ref (`qp.session_token`).
This bit us in `join_quiz` and `submit_answer` — see
`0003_fix_rpc_ambiguity.sql` for the resolution.

**c) Service-role key.**
`createSupabaseAdminClient()` bypasses RLS. Use it only in server-only
code (route handlers, scripts). Never import it in a `"use client"` file.

**d) JWT role refresh.**
After `npm run make-admin -- user@example.com`, the user must sign out
and back in for the role claim to appear in `app_metadata`.

### 8.4 RLS

Every table in the `public` schema has RLS enabled. Default deny; policies
match the actual access pattern (admins via `public.is_admin()`, players via
their session token, etc.). If you add a table, add RLS + policies in the
same migration.

---

## 9. Routes & auth

| Route | Notes |
|---|---|
| `/` | Marketing home. Static. |
| `/plans` | Lesson-plan list. Static. |
| `/plans/[plan]/[lesson]` | SSG lesson page. |
| `/play` and `/play/[pin]` | Student-facing quiz. **Global header & footer hidden here** (see `BuckeyeHeader.tsx` / `BuckeyeFooter.tsx` hide list). |
| `/host` and below | Instructor dashboard. Gated by `getCurrentUser()` returning `isAdmin === true`. **Global header & footer hidden here** too — host layout has its own thin toolbar. |
| `/admin/login` | Magic-link signin via Supabase. |
| `/test` | Dev-only debug page showing the starting position. Safe to leave deployed. |
| `/api/quizzes/...` | Route handlers wrapping the SQL RPCs. |

The hide-list for header/footer lives in two places (`BuckeyeHeader.tsx` and
`BuckeyeFooter.tsx`) — if you add a third chrome-free route, update both.
If a third file ever needs the same list, lift `HIDDEN_PREFIXES` to
`lib/site-chrome.ts`.

---

## 10. Deployment

- **Vercel** auto-deploys from `main`. Preview deploys per PR.
- Build = `npm run build`. No `vercel.json` (we let Next.js auto-detect).
- After dependency changes, run `npm audit --omit=dev`. The only acceptable
  remaining moderate is the transitive `postcss` advisory inside Next.js
  itself — that requires the Next.js team to bump their internal copy.
- `npm audit fix --force` would downgrade Next.js — **never run it**.

---

## 11. Common tasks — copy-paste recipes

**Add a new lesson:**

```powershell
mkdir content\plans\beginners-workshop\02-checkmate
# create lesson.yaml and lesson.mdx (copy from 01-chess-basics for shape)
npm run sync
```

**Promote a user to admin:**

```powershell
npm run make-admin -- user@example.com
# user must sign out / in for the JWT to refresh
```

**Apply schema changes:**

```powershell
# edit/add files in supabase/migrations/, then:
npx supabase db push
```

**Run a one-off DB query (read-only check):**

Use the Supabase MCP `execute_sql` tool, or the SQL editor in the dashboard.

**Mirror the production build locally:**

```powershell
# stop the dev server first!
npm run typecheck
npm test
npm run build
```

---

## 12. Things that look broken but aren't

- The huge inline SVG of a `WhiteKing` in `node_modules/react-chessboard` —
  that's the library's "no width detected" placeholder. If you see it on
  screen, see §6.1.
- `prose` and `prose-buckeye` classes — we don't load
  `@tailwindcss/typography`, so these classes are no-ops *except* where
  `app/globals.css` adds explicit rules (`.prose table`, the fullscreen
  typography bumps). Don't be tempted to add the plugin — it'll restyle
  everything that has `prose` in scope.
- `chess.js` returning empty arrays from `moves()` on a teaching FEN — it's
  because there's no king for the side-to-move, so move generation aborts
  early. Pass a non-empty position with the right side to move, or accept
  the empty result.

---

## 13. When in doubt

- For **Supabase** questions, load the `supabase` and
  `supabase-postgres-best-practices` skills from `.cursor` before acting.
- For **product/UX** questions, mirror the Buckeye theme defined in
  `tailwind.config.ts` and `components/chess/themes.ts` — scarlet, cream,
  ink, gray.
- For **chess rules** questions, consult `lib/chess/scoring.ts` and the SQL
  RPC `submit_answer` — they are the authoritative scoring/answer-validation
  logic.
- For **anything else**, search the prior conversations in
  `agent-transcripts/`; a lot of nontrivial decisions have history there.

---

_Last refreshed alongside the American-English / mobile-controls /
piece-value cleanups. If you make a change that future agents would benefit
from knowing about, add it here in the same compact style._
