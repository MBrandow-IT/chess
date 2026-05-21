-- ---------------------------------------------------------------------
-- events + event-driven lesson scheduling
-- ---------------------------------------------------------------------

create type public.event_kind as enum ('workshop', 'tournament', 'other');
create type public.event_status as enum ('scheduled', 'canceled');

create table if not exists public.event_series (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  description          text not null default '',
  location             text not null default 'Buckeye Public Library',
  recurrence_weekdays  smallint[] not null,
  start_time           time not null,
  end_time             time not null,
  timezone             text not null default 'America/Phoenix',
  active               boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  series_id    uuid references public.event_series(id) on delete set null,
  title        text not null,
  description  text not null default '',
  location     text not null default '',
  kind         public.event_kind not null default 'workshop',
  featured     boolean not null default false,
  signup_url   text,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  status       public.event_status not null default 'scheduled',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists events_series_starts_at_idx
  on public.events (series_id, starts_at)
  where series_id is not null;

create index if not exists events_starts_at_idx
  on public.events (starts_at);

create index if not exists events_featured_starts_at_idx
  on public.events (featured, starts_at)
  where featured = true;

create table if not exists public.event_lessons (
  event_id   uuid not null references public.events(id) on delete cascade,
  lesson_id  uuid not null references public.lessons(id) on delete cascade,
  primary key (event_id, lesson_id)
);

create index if not exists event_lessons_lesson_idx
  on public.event_lessons (lesson_id);

alter table public.event_series enable row level security;
alter table public.events enable row level security;
alter table public.event_lessons enable row level security;

drop policy if exists "admin read event_series" on public.event_series;
create policy "admin read event_series" on public.event_series
  for select using (public.is_admin());

drop policy if exists "admin read events" on public.events;
create policy "admin read events" on public.events
  for select using (public.is_admin());

drop policy if exists "admin read event_lessons" on public.event_lessons;
create policy "admin read event_lessons" on public.event_lessons
  for select using (public.is_admin());
