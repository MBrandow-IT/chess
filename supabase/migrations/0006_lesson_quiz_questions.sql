-- ---------------------------------------------------------------------
-- lesson_quiz_questions  (live quiz catalog per lesson; host editor)
-- ---------------------------------------------------------------------
create table if not exists public.lesson_quiz_questions (
  id                  uuid primary key default gen_random_uuid(),
  lesson_id           uuid not null references public.lessons(id) on delete cascade,
  slug                text not null,
  type                public.question_type not null,
  prompt              text not null default '',
  payload             jsonb not null,
  time_limit_seconds  integer not null default 30,
  base_points         integer not null default 100,
  order_idx           integer not null default 0,
  published           boolean not null default true,
  created_at          timestamptz not null default now(),
  unique (lesson_id, slug)
);

create index if not exists lesson_quiz_questions_lesson_idx
  on public.lesson_quiz_questions (lesson_id, order_idx);

alter table public.lesson_quiz_questions enable row level security;

drop policy if exists "public read published lesson_quiz_questions" on public.lesson_quiz_questions;
create policy "public read published lesson_quiz_questions" on public.lesson_quiz_questions
  for select using (published = true);

drop policy if exists "admin write lesson_quiz_questions" on public.lesson_quiz_questions;
create policy "admin write lesson_quiz_questions" on public.lesson_quiz_questions
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed chess-basics quiz from former MDX KahootQuestion blocks (when lesson exists).
insert into public.lesson_quiz_questions (
  lesson_id, slug, type, prompt, payload, time_limit_seconds, base_points, order_idx
)
select
  l.id,
  v.slug,
  v.type::public.question_type,
  v.prompt,
  v.payload::jsonb,
  v.time_limit_seconds,
  v.base_points,
  v.order_idx
from public.lessons l
join public.lesson_plans p on p.id = l.plan_id
cross join (
  values
    ('basics-q1', 'multiple-choice', 'How many squares are on a chess board?',
     '{"choices":["32","48","64","100"],"correctChoice":2}', 15, 100, 0),
    ('basics-q2', 'multiple-choice', 'The white king starts on which square?',
     '{"choices":["d1","e1","d8","e8"],"correctChoice":1}', 20, 100, 1),
    ('basics-q3', 'multiple-choice', 'Which piece is the only one that can jump over other pieces?',
     '{"choices":["Bishop","Rook","Knight","Queen"],"correctChoice":2}', 20, 100, 2),
    ('basics-q4', 'best-move', 'White to move — capture the knight.',
     '{"fen":"8/8/8/3n4/4P3/8/8/8 w - - 0 1","solution":["exd5"]}', 20, 100, 3),
    ('basics-q5', 'best-move', 'White to move — capture the bishop with the rook.',
     '{"fen":"8/8/8/8/b7/8/8/R7 w - - 0 1","solution":["Rxa4"]}', 25, 100, 4),
    ('basics-q6', 'best-move', 'White to move — knight takes pawn.',
     '{"fen":"8/8/8/4p3/8/5N2/8/8 w - - 0 1","solution":["Nxe5"]}', 25, 100, 5)
) as v(slug, type, prompt, payload, time_limit_seconds, base_points, order_idx)
where p.slug = 'beginners-workshop' and l.slug = 'chess-basics'
on conflict (lesson_id, slug) do nothing;
