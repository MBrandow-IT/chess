-- ---------------------------------------------------------------------
-- lesson_slide_chess_blocks  (in-lesson chess widgets; host editor)
-- ---------------------------------------------------------------------
create table if not exists public.lesson_slide_chess_blocks (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  slug         text not null,
  type         text not null check (type in ('puzzle', 'display-board', 'analysis-board')),
  slide_label  text not null default '',
  payload      jsonb not null,
  order_idx    integer not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (lesson_id, slug)
);

create index if not exists lesson_slide_chess_blocks_lesson_idx
  on public.lesson_slide_chess_blocks (lesson_id, order_idx);

alter table public.lesson_slide_chess_blocks enable row level security;

drop policy if exists "public read published lesson_slide_chess_blocks" on public.lesson_slide_chess_blocks;
create policy "public read published lesson_slide_chess_blocks" on public.lesson_slide_chess_blocks
  for select using (published = true);

drop policy if exists "admin write lesson_slide_chess_blocks" on public.lesson_slide_chess_blocks;
create policy "admin write lesson_slide_chess_blocks" on public.lesson_slide_chess_blocks
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed slide chess blocks for tactics-forks-and-double-attacks (reference lesson).
insert into public.lesson_slide_chess_blocks (
  lesson_id, slug, type, slide_label, payload, order_idx, published
)
select
  l.id,
  v.slug,
  v.type,
  v.slide_label,
  v.payload::jsonb,
  v.order_idx,
  true
from public.lessons l
join public.lesson_plans p on p.id = l.plan_id
cross join (
  values
    (
      'tactics-why-matter-board',
      'display-board',
      'Slide 3 — Why tactics matter',
      '{"fen":"r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4"}',
      0
    ),
    (
      'tactics-knight-fork-demo',
      'analysis-board',
      'Slide 5 — Knight forks demo',
      '{"fen":"1k1q4/p7/8/4N3/8/8/8/4K3 w - - 0 1"}',
      1
    ),
    (
      'tactics-knight-fork-puzzle',
      'puzzle',
      'Slide 6 — Knight fork puzzle',
      '{"fen":"1k1q4/p7/8/4N3/8/8/8/4K3 w - - 0 1","solution":["Nc6+","Kc8","Nxd8"],"hint":"From e5, which L-shape jump checks the king and attacks the queen on d8?","title":"Knight fork"}',
      2
    ),
    (
      'tactics-queen-fork-puzzle',
      'puzzle',
      'Slide 8 — Queen fork puzzle',
      '{"fen":"4k3/8/8/8/3b4/8/8/4Q1K2 w - - 0 1","solution":["Qe5+"],"hint":"The queen on e1 can reach e5 in one move — a square that hits e8 and d4.","title":"Queen fork"}',
      3
    ),
    (
      'tactics-pawn-fork-puzzle',
      'puzzle',
      'Slide 9 — Pawn fork puzzle',
      '{"fen":"8/8/2k1n3/4K3/3P4/8/8/8 w - - 0 1","solution":["d5+"],"hint":"Push the d-pawn one square — which two enemy pieces does it hit?","title":"Pawn fork"}',
      4
    ),
    (
      'tactics-pin-diagram',
      'display-board',
      'Slide 10 — Pins diagram',
      '{"fen":"r1bqk2r/pppp1ppp/2n5/4p3/1PB5/8/PPP2PPP/RNBQK2R b KQkq - 0 1"}',
      5
    ),
    (
      'tactics-set-pin-puzzle',
      'puzzle',
      'Slide 12 — Set the pin puzzle',
      '{"fen":"r1bqk2r/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1R w KQkq - 2 4","solution":["Bb5"],"hint":"A bishop on b5 looks through the knight on c6 toward the king.","title":"Pin the knight"}',
      6
    ),
    (
      'tactics-skewer-diagram',
      'display-board',
      'Slide 13 — Skewers diagram',
      '{"fen":"8/2r5/1k6/B7/8/8/8/4K3 b - - 0 1"}',
      7
    ),
    (
      'tactics-skewer-puzzle',
      'puzzle',
      'Slide 15 — Skewer puzzle',
      '{"fen":"8/2r5/1k6/8/1B6/8/8/4K3 w - - 0 1","solution":["Ba5+"],"hint":"From b4, one diagonal move hits both b6 and c7.","title":"Bishop skewer"}',
      8
    ),
    (
      'tactics-exploit-pin-puzzle',
      'puzzle',
      'Slide 18 — Exploit the pin puzzle',
      '{"fen":"r1bqk2r/pppp1ppp/2n5/4N3/1PB5/8/PPP2PPP/RNBQK2R w KQkq - 0 1","solution":["Nxc6"],"hint":"The knight cannot move away — what can you capture?","title":"Exploit the pin"}',
      9
    )
) as v(slug, type, slide_label, payload, order_idx)
where p.slug = 'beginners-workshop'
  and l.slug = 'tactics-forks-and-double-attacks'
on conflict (lesson_id, slug) do nothing;
