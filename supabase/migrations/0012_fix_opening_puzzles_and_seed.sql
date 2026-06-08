-- Fix: seed lesson_puzzles for opening-principles-fast-development.
-- Also corrects the queen-raid FEN (queen on h4 not g4) if it was
-- previously inserted incorrectly.

-- Delete any stale/incorrect puzzles for this lesson first.
delete from public.lesson_puzzles lp
using public.lessons l
join public.lesson_plans p on p.id = l.plan_id
where lp.lesson_id = l.id
  and p.slug = 'beginners-workshop'
  and l.slug = 'opening-principles-fast-development';

-- Insert corrected puzzles.
insert into public.lesson_puzzles (
  lesson_id, slug, title, fen, solution, hint, themes, difficulty, order_idx, published
)
select
  l.id,
  v.slug,
  v.title,
  v.fen,
  v.solution::jsonb,
  v.hint,
  v.themes::text[],
  v.difficulty,
  v.order_idx,
  true
from public.lessons l
join public.lesson_plans p on p.id = l.plan_id
cross join (
  values
    (
      'opening-punish-queen-raid',
      'Punish early queen moves',
      'rnb1kbnr/pppp1ppp/8/4p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      '["Nxe5"]',
      'The e5 pawn is undefended since the queen left.',
      '{development,free-pawn}',
      'easy',
      0
    ),
    (
      'opening-exploit-uncastled',
      'Exploit weak center',
      'rn1qkbnr/ppp2p1p/3p2p1/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5',
      '["Nxe5"]',
      'The e5 pawn is barely defended. Take it!',
      '{development,center-control}',
      'medium',
      1
    ),
    (
      'opening-attack-f7',
      'Attack f7',
      'r1bqk1nr/ppp2ppp/2np4/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5',
      '["Ng5"]',
      'A knight on g5 teams up with the bishop to hit f7.',
      '{development,king-attack}',
      'medium',
      2
    ),
    (
      'opening-punish-knight-jump',
      'Punish the knight jump',
      'r1bqkbnr/pppp1ppp/8/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      '["Nxe5"]',
      'The defender left — grab what it was protecting.',
      '{development,free-pawn}',
      'medium',
      3
    ),
    (
      'opening-castle-and-develop',
      'Castle for safety',
      'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5',
      '["O-O"]',
      'Your king is in the center and the path is clear.',
      '{castling,king-safety}',
      'easy',
      4
    ),
    (
      'opening-develop-not-pawn-push',
      'Develop, don''t push pawns',
      'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2',
      '["Nc3"]',
      'Develop a piece toward the center rather than pushing another pawn.',
      '{development,center-control}',
      'easy',
      5
    )
) as v(slug, title, fen, solution, hint, themes, difficulty, order_idx)
where p.slug = 'beginners-workshop'
  and l.slug = 'opening-principles-fast-development'
on conflict (lesson_id, slug) do update set
  title = excluded.title,
  fen = excluded.fen,
  solution = excluded.solution,
  hint = excluded.hint,
  themes = excluded.themes,
  difficulty = excluded.difficulty,
  order_idx = excluded.order_idx;
