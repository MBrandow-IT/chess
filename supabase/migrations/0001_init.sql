-- =====================================================================
-- Buckeye Chess Workshops — initial schema
--
-- Naming convention:
--   • "game" / "games" is RESERVED for future chess game records.
--   • Live Kahoot-style sessions are called "quizzes" (singular: quiz).
--   • Individual prompts inside a quiz are "quiz_questions".
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ---------------------------------------------------------------------
-- lesson_plans
-- ---------------------------------------------------------------------
create table if not exists public.lesson_plans (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text not null default '',
  age_group    text,
  cover_image  text,
  order_idx    integer not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists lesson_plans_order_idx on public.lesson_plans (order_idx);

-- ---------------------------------------------------------------------
-- lessons
-- ---------------------------------------------------------------------
create table if not exists public.lessons (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references public.lesson_plans(id) on delete cascade,
  slug          text not null,
  title         text not null,
  summary       text not null default '',
  order_idx     integer not null default 0,
  content_path  text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (plan_id, slug)
);

create index if not exists lessons_plan_order_idx on public.lessons (plan_id, order_idx);

-- ---------------------------------------------------------------------
-- quizzes  (live Kahoot-style sessions)
-- ---------------------------------------------------------------------
create type public.quiz_status as enum ('lobby', 'question', 'reveal', 'ended');

create table if not exists public.quizzes (
  id                    uuid primary key default gen_random_uuid(),
  host_id               uuid references auth.users(id) on delete set null,
  lesson_id             uuid references public.lessons(id) on delete set null,
  pin                   text not null,
  status                public.quiz_status not null default 'lobby',
  current_question_idx  integer not null default -1,
  current_question_started_at timestamptz,
  created_at            timestamptz not null default now(),
  started_at            timestamptz,
  ended_at              timestamptz
);

-- A PIN is only unique across non-ended quizzes. We enforce that with a
-- partial unique index so old quizzes don't block PIN reuse.
create unique index if not exists quizzes_active_pin_idx
  on public.quizzes (pin)
  where status <> 'ended';

create index if not exists quizzes_host_idx on public.quizzes (host_id);

-- ---------------------------------------------------------------------
-- quiz_questions  (snapshotted from MDX at quiz-start)
-- ---------------------------------------------------------------------
create type public.question_type as enum ('multiple-choice', 'best-move', 'best-sequence');

create table if not exists public.quiz_questions (
  id                  uuid primary key default gen_random_uuid(),
  quiz_id             uuid not null references public.quizzes(id) on delete cascade,
  idx                 integer not null,
  type                public.question_type not null,
  payload             jsonb not null,
  time_limit_seconds  integer not null default 30,
  base_points         integer not null default 100,
  created_at          timestamptz not null default now(),
  unique (quiz_id, idx)
);

create index if not exists quiz_questions_quiz_idx on public.quiz_questions (quiz_id, idx);

-- ---------------------------------------------------------------------
-- quiz_players  (anonymous joiners)
-- ---------------------------------------------------------------------
create table if not exists public.quiz_players (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid not null references public.quizzes(id) on delete cascade,
  display_name  text not null,
  -- Secret returned to the client on join; required for answer submission.
  session_token uuid not null default gen_random_uuid(),
  total_score   integer not null default 0,
  joined_at     timestamptz not null default now(),
  unique (quiz_id, display_name)
);

create index if not exists quiz_players_quiz_idx on public.quiz_players (quiz_id);

-- ---------------------------------------------------------------------
-- quiz_answers  (one row per player per question, finalized)
-- ---------------------------------------------------------------------
create table if not exists public.quiz_answers (
  id              uuid primary key default gen_random_uuid(),
  quiz_id         uuid not null references public.quizzes(id) on delete cascade,
  question_id     uuid not null references public.quiz_questions(id) on delete cascade,
  player_id       uuid not null references public.quiz_players(id) on delete cascade,
  payload         jsonb not null,
  time_ms         integer not null,
  wrong_attempts  integer not null default 0,
  correct         boolean not null,
  points_awarded  integer not null,
  created_at      timestamptz not null default now(),
  unique (question_id, player_id)
);

create index if not exists quiz_answers_quiz_idx on public.quiz_answers (quiz_id);
create index if not exists quiz_answers_question_idx on public.quiz_answers (question_id);

-- ---------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lesson_plans_updated_at on public.lesson_plans;
create trigger trg_lesson_plans_updated_at
  before update on public.lesson_plans
  for each row execute function public.set_updated_at();

drop trigger if exists trg_lessons_updated_at on public.lessons;
create trigger trg_lessons_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.lesson_plans   enable row level security;
alter table public.lessons        enable row level security;
alter table public.quizzes        enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_players   enable row level security;
alter table public.quiz_answers   enable row level security;

-- Public read for everything (the PIN is the gate for live quiz data).
drop policy if exists "public read lesson_plans" on public.lesson_plans;
create policy "public read lesson_plans" on public.lesson_plans
  for select using (true);

drop policy if exists "public read lessons" on public.lessons;
create policy "public read lessons" on public.lessons
  for select using (true);

drop policy if exists "public read quizzes" on public.quizzes;
create policy "public read quizzes" on public.quizzes
  for select using (true);

drop policy if exists "public read quiz_questions" on public.quiz_questions;
create policy "public read quiz_questions" on public.quiz_questions
  for select using (true);

drop policy if exists "public read quiz_players" on public.quiz_players;
create policy "public read quiz_players" on public.quiz_players
  for select using (true);

drop policy if exists "public read quiz_answers" on public.quiz_answers;
create policy "public read quiz_answers" on public.quiz_answers
  for select using (true);

-- Admins (instructor) can write content tables directly.
drop policy if exists "admin write lesson_plans" on public.lesson_plans;
create policy "admin write lesson_plans" on public.lesson_plans
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write lessons" on public.lessons;
create policy "admin write lessons" on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

-- Hosts manage their own quizzes; admins manage anyone's.
drop policy if exists "host or admin manage quizzes" on public.quizzes;
create policy "host or admin manage quizzes" on public.quizzes
  for all using (
    public.is_admin()
    or (auth.uid() is not null and auth.uid() = host_id)
  ) with check (
    public.is_admin()
    or (auth.uid() is not null and auth.uid() = host_id)
  );

drop policy if exists "host or admin manage quiz_questions" on public.quiz_questions;
create policy "host or admin manage quiz_questions" on public.quiz_questions
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.quizzes q
      where q.id = quiz_questions.quiz_id
        and q.host_id = auth.uid()
    )
  ) with check (
    public.is_admin()
    or exists (
      select 1 from public.quizzes q
      where q.id = quiz_questions.quiz_id
        and q.host_id = auth.uid()
    )
  );

-- Players + answers: only the host or admin can mutate directly; all
-- ordinary client mutations should go through SECURITY DEFINER RPCs below.
drop policy if exists "host or admin manage quiz_players" on public.quiz_players;
create policy "host or admin manage quiz_players" on public.quiz_players
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.quizzes q
      where q.id = quiz_players.quiz_id
        and q.host_id = auth.uid()
    )
  ) with check (
    public.is_admin()
    or exists (
      select 1 from public.quizzes q
      where q.id = quiz_players.quiz_id
        and q.host_id = auth.uid()
    )
  );

drop policy if exists "host or admin manage quiz_answers" on public.quiz_answers;
create policy "host or admin manage quiz_answers" on public.quiz_answers
  for all using (
    public.is_admin()
    or exists (
      select 1 from public.quizzes q
      where q.id = quiz_answers.quiz_id
        and q.host_id = auth.uid()
    )
  ) with check (
    public.is_admin()
    or exists (
      select 1 from public.quizzes q
      where q.id = quiz_answers.quiz_id
        and q.host_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- Realtime publication
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end;
$$;

alter publication supabase_realtime add table
  public.quizzes,
  public.quiz_questions,
  public.quiz_players,
  public.quiz_answers;
