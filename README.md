# Buckeye Chess Workshops

Free chess workshops for the Buckeye Public Library: interactive lessons
authored in MDX, plus a Kahoot-style live quiz so students can compete on
puzzles from their phones.

Public viewers (and students) need no account. Only the instructor signs in.

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- MDX (via `next-mdx-remote/rsc`) with custom chess components
- `chess.js` + `react-chessboard` (chess.com green/white theme)
- Supabase (Postgres + Auth + Realtime)
- Vitest for unit tests

## Repo layout

```
app/                      Next.js App Router routes
  page.tsx                  landing
  plans/                    public lesson catalog
  play/                     student PIN entry + live quiz view
  host/                     instructor dashboard (auth-gated)
  admin/login/              magic-link sign-in
  api/quizzes/              quiz API routes
content/plans/            authored lesson plans (one folder per plan)
components/
  brand/                    BuckeyeHeader, BuckeyeFooter
  chess/                    ChessBoard, Puzzle, themes
  lesson/                   SlideDeck, Slide, KahootQuestion, Term, PrintButton
  host/                     HostQuiz (live host UI)
  play/                     PlayerQuiz (live student UI)
lib/
  chess/                    scoring (mirrors SQL), glossary
  mdx/                      compile, extract-questions, mdx component map
  supabase/                 client, server, middleware, auth, types, rpc helper
  sound.ts                  Web-Audio SFX + mute toggle
  content.ts                filesystem reader for /content/plans
supabase/migrations/      SQL migrations (run via Supabase Studio or CLI)
scripts/                  sync-plans.ts + make-admin.ts
```

## First-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx     # server-only
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` is needed only by the `sync` and `make-admin`
scripts, and for the live quiz server routes that mediate anonymous student
writes.

### 3. Apply the Supabase migrations

In Supabase Studio → SQL Editor, paste and run **in this order**:

1. `supabase/migrations/0001_init.sql` — schema, RLS, realtime
2. `supabase/migrations/0002_rpcs.sql` — `join_quiz`, `submit_answer`, `advance_quiz`, `reveal_quiz`, `end_quiz`

(Or `supabase db push` if you have the Supabase CLI linked.)

### 4. Sync lesson plan metadata into the DB

```bash
npm run sync
```

This reads every `content/plans/<plan>/plan.yaml` and lesson `lesson.yaml`
and upserts them into the `lesson_plans` and `lessons` tables. Run this after
adding or renaming lessons in the repo.

### 5. Make yourself an instructor admin

After your first sign-in (or before — the script will invite you), promote
your email to admin:

```bash
npm run make-admin -- you@example.com
```

You'll need to sign in (or sign out and back in) for the new JWT claim to
take effect.

### 6. Run the dev server

```bash
npm run dev
```

Then visit:

- `http://localhost:3000` — public landing
- `http://localhost:3000/plans` — lesson catalog
- `http://localhost:3000/admin/login` — instructor sign-in
- `http://localhost:3000/host` — instructor dashboard (after auth + admin)
- `http://localhost:3000/play` — student PIN entry

## Authoring lessons

Create a folder under `content/plans/<plan-slug>/<NN-lesson-folder>/` with:

- `lesson.yaml` — metadata (`slug`, `title`, `summary`, `order_idx`)
- `lesson.mdx` — content

MDX has these components available without imports:

| Component | Purpose |
|---|---|
| `<SlideDeck>` ... `</SlideDeck>` | Slide container with arrow-key navigation |
| `<Slide title="..." subtitle="...">` | One slide |
| `<ChessBoard fen="..." />` | Static or interactive board (chess.com green/white) |
| `<Puzzle fen="..." solution={["Nxe5"]} hint="..." />` | Interactive puzzle |
| `<KahootQuestion id="..." type="..." ... />` | Live-quiz question (rendered as preview here) |
| `<Term name="fork">fork</Term>` | Glossary popover from `lib/chess/glossary.ts` |

See `content/plans/beginners-workshop/01-chess-basics/lesson.mdx` for a
worked example.

`<KahootQuestion>` supports three `type`s:

- `"multiple-choice"` — pass `choices={[...]}` and `correctChoice={index}`
- `"best-move"` — pass `fen` and `solution={["SAN move"]}`
- `"best-sequence"` — pass `fen` and `solution={["e4", "e5", "Nf3", ...]}`

Optional: `prompt`, `timeLimitSeconds` (default 30), `basePoints` (default 100).

## Running a live quiz

1. As the instructor, sign in at `/admin/login`.
2. Go to `/host`, pick a lesson, click **Start quiz**.
3. The host page shows a big 6-digit PIN + QR code on the projector.
4. Students go to `/play` (or scan the QR), enter the PIN + their name.
5. Press **Start the quiz**. Questions advance with **Reveal → Next**.
6. After the quiz ends, download the per-question CSV from the host view for
   review.

### Scoring rules (server-authoritative, in SQL)

```
points = floor( max(0, base * (1 - elapsedSec/100)) * 0.5^wrongAttempts )
points = 0  if !correct  or  elapsedSec > time_limit_seconds
```

This is implemented in `supabase/migrations/0002_rpcs.sql` and mirrored in
`lib/chess/scoring.ts` so the in-browser "points if you answer now" preview
matches the server result. The mirroring is covered by Vitest tests in
`lib/chess/scoring.test.ts`.

## Naming convention

- `quiz` / `quizzes` — the live Kahoot-style session container
- `quiz_questions`, `quiz_players`, `quiz_answers` — child tables
- `game` / `games` — RESERVED for future chess game records (analysis)

## Tests

```bash
npm test            # one-shot
npm run test:watch  # watch mode
```

## Production build

```bash
npm run build && npm start
```

Deployed on Vercel: set the four env vars above as Project Environment
Variables (mark the service-role one **Server only**).

## Naming, attribution

Built by a volunteer in association with the
[Buckeye Public Library](https://www.buckeyelibrary.org). For educational and
classroom use.
