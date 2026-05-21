-- ---------------------------------------------------------------------
-- lesson_puzzles  (practice catalog per lesson; synced from puzzles.yaml)
-- ---------------------------------------------------------------------
create table if not exists public.lesson_puzzles (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  slug         text not null,
  title        text not null default '',
  fen          text not null,
  solution     jsonb not null,
  hint         text,
  themes       text[] not null default '{}',
  difficulty   text,
  order_idx    integer not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (lesson_id, slug)
);

create index if not exists lesson_puzzles_lesson_idx
  on public.lesson_puzzles (lesson_id, order_idx);

alter table public.lesson_puzzles enable row level security;

drop policy if exists "public read published lesson_puzzles" on public.lesson_puzzles;
create policy "public read published lesson_puzzles" on public.lesson_puzzles
  for select using (published = true);

drop policy if exists "admin write lesson_puzzles" on public.lesson_puzzles;
create policy "admin write lesson_puzzles" on public.lesson_puzzles
  for all using (public.is_admin()) with check (public.is_admin());
