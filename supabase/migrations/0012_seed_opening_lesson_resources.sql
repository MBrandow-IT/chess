-- ---------------------------------------------------------------------
-- Seed robust week-2 resources (opening principles + traps)
-- ---------------------------------------------------------------------
-- This migration assumes the condensed 8-lesson workshop structure where
-- lesson slug = opening-principles-fast-development.
--
-- It seeds:
--   • 22 practice puzzles for lesson_puzzles
--   • 11 live quiz questions for lesson_quiz_questions
-- All inserts are idempotent via (lesson_id, slug) upserts.

update public.lesson_plans
set description = 'An 8-week beginner chess workshop with one focused lesson each week, moving from rules to practical game play.',
    updated_at = now()
where slug = 'beginners-workshop';

update public.lessons l
set
  title = 'Opening Principles, Development, and Trap Awareness',
  summary = 'Build a reliable opening process with center control, fast development, king safety, and practical trap prevention.',
  order_idx = 2,
  content_path = 'content/plans/beginners-workshop/03-opening-principles-fast-development/lesson.mdx',
  updated_at = now()
from public.lesson_plans p
where l.plan_id = p.id
  and p.slug = 'beginners-workshop'
  and l.slug = 'opening-principles-fast-development';

with lesson_target as (
  select l.id as lesson_id
  from public.lessons l
  join public.lesson_plans p on p.id = l.plan_id
  where p.slug = 'beginners-workshop'
    and l.slug = 'opening-principles-fast-development'
)
insert into public.lesson_puzzles (
  lesson_id,
  slug,
  title,
  fen,
  solution,
  hint,
  themes,
  difficulty,
  order_idx,
  published
)
select
  t.lesson_id,
  v.slug,
  v.title,
  v.fen,
  v.solution::jsonb,
  v.hint,
  v.themes,
  v.difficulty,
  v.order_idx,
  v.published
from lesson_target t
cross join (
  values
    (
      'week2-center-strike-exd4',
      'Challenge White''s center',
      'rnbqkbnr/pppp1ppp/8/4p3/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2',
      '["exd4"]',
      'Strike the center before White gets too much space.',
      array['opening', 'center-control', 'pawn-break'],
      'easy',
      0,
      true
    ),
    (
      'week2-develop-knight-f3',
      'Develop with purpose',
      'r1bqkbnr/pppp1ppp/2n5/4p3/8/2N5/PPPPPPPP/R1BQKBNR w KQkq - 2 2',
      '["Nf3"]',
      'Choose the move that develops and supports castling.',
      array['opening', 'development', 'king-safety'],
      'easy',
      1,
      true
    ),
    (
      'week2-castle-now',
      'Castle at the right moment',
      'r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5',
      '["O-O"]',
      'Your pieces are ready, so protect your king now.',
      array['opening', 'castling', 'king-safety'],
      'easy',
      2,
      true
    ),
    (
      'week2-punish-early-queen',
      'Punish early queen moves',
      'rnb1kbnr/pppp1ppp/8/4p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      '["Nxe5"]',
      'The e5 pawn is undefended since the queen left.',
      array['opening', 'trap-awareness', 'tempo'],
      'easy',
      3,
      true
    ),
    (
      'week2-defend-f7',
      'Defend against Scholar''s Mate',
      'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3',
      '["g6"]',
      'Kick the queen and reinforce king safety.',
      array['opening', 'defense', 'trap-awareness'],
      'easy',
      4,
      true
    ),
    (
      'week2-trap-wandering-queen',
      'Win the wandering queen',
      'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 5 4',
      '["Nxh5"]',
      'Develop while punishing overextension.',
      array['opening', 'tempo', 'punishment'],
      'easy',
      5,
      true
    ),
    (
      'week2-open-center-sequence',
      'Build then break in the center',
      'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R w KQkq - 0 5',
      '["d4","exd4","cxd4"]',
      'Open with a supported center break.',
      array['opening', 'center-control', 'calculation'],
      'medium',
      6,
      true
    ),
    (
      'week2-bishop-development-bc4',
      'Develop the bishop actively',
      'rnbqk1nr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 1 2',
      '["Bc4"]',
      'Place your bishop on an active diagonal.',
      array['opening', 'development', 'piece-activity'],
      'easy',
      7,
      true
    ),
    (
      'week2-ruy-lopez-bb5',
      'Use pressure on c6',
      'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      '["Bb5"]',
      'Choose a principled move that develops and creates pressure.',
      array['opening', 'development', 'pressure'],
      'easy',
      8,
      true
    ),
    (
      'week2-chase-bishop-c6',
      'Challenge an active bishop',
      'r1bqkbnr/pppp1ppp/5n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 3',
      '["c6"]',
      'Gain space and ask the bishop a question.',
      array['opening', 'space', 'counterplay'],
      'easy',
      9,
      true
    ),
    (
      'week2-central-exchange-exd5',
      'Take in the center',
      'rnbqkbnr/ppp2ppp/8/3pp3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 3',
      '["exd5"]',
      'Simplify center tension when you can win a pawn.',
      array['opening', 'center-control', 'pawn-structure'],
      'easy',
      10,
      true
    ),
    (
      'week2-win-center-queen',
      'Punish a queen in the center',
      'rnb1kbnr/pppp1ppp/8/4p3/3qP3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3',
      '["Nxd4"]',
      'Develop and win material at the same time.',
      array['opening', 'tactics', 'tempo'],
      'easy',
      11,
      true
    ),
    (
      'week2-black-castle-now',
      'Black castles on time',
      'r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R b KQkq - 2 4',
      '["O-O"]',
      'Complete development by protecting your king.',
      array['opening', 'castling', 'king-safety'],
      'easy',
      12,
      true
    ),
    (
      'week2-develop-bishop-c5',
      'Develop before attacking',
      'rnbqk1nr/pppp1ppp/8/4p3/4P3/3P4/PPP2PPP/RNBQKBNR b KQkq - 0 2',
      '["Bc5"]',
      'Activate a minor piece toward the center.',
      array['opening', 'development', 'piece-activity'],
      'easy',
      13,
      true
    ),
    (
      'week2-develop-knight-c6',
      'Simple and strong development',
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      '["Nc6"]',
      'Develop a knight toward the center.',
      array['opening', 'development'],
      'easy',
      14,
      true
    ),
    (
      'week2-support-center-c3',
      'Support the center first',
      'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3',
      '["c3"]',
      'Prepare d4 with pawn support.',
      array['opening', 'center-control', 'planning'],
      'easy',
      15,
      true
    ),
    (
      'week2-break-pin-h6',
      'Ask the pinning bishop',
      'rnbqkb1r/pppp1ppp/5n2/4p1B1/4P3/5N2/PPPP1PPP/RN1QKB1R b KQkq - 4 3',
      '["h6"]',
      'Challenge the bishop that is pinning your knight.',
      array['opening', 'defense', 'prophylaxis'],
      'easy',
      16,
      true
    ),
    (
      'week2-preserve-bishop-bh4',
      'Keep pressure after being questioned',
      'rnbqkb1r/pppp1pp1/5n1p/4p1B1/4P3/5N2/PPPP1PPP/RN1QKB1R w KQkq - 0 4',
      '["Bh4"]',
      'Retreat to maintain the pin and avoid a trade.',
      array['opening', 'piece-activity', 'planning'],
      'easy',
      17,
      true
    ),
    (
      'week2-connect-rooks-re1',
      'Improve your last undeveloped piece',
      'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQ1RK1 w kq - 4 6',
      '["Re1"]',
      'Improve the rook behind your central pawn.',
      array['opening', 'piece-activity', 'improvement'],
      'medium',
      18,
      true
    ),
    (
      'week2-ask-bishop-a6',
      'Question the bishop immediately',
      'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/8/PPPP1PPP/RNBQK1NR b KQkq - 2 2',
      '["a6"]',
      'Gain tempo by forcing the bishop to decide.',
      array['opening', 'space', 'tempo'],
      'easy',
      19,
      true
    ),
    (
      'week2-center-break-d4',
      'Claim central space',
      'rnbqkbnr/ppp2ppp/3p4/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 3',
      '["d4"]',
      'Use your d-pawn to challenge the center.',
      array['opening', 'center-control'],
      'easy',
      20,
      true
    ),
    (
      'week2-counter-center-dxe4',
      'Counter White''s center',
      'rnbqkbnr/ppp2ppp/8/3pp3/4P3/3P4/PPP2PPP/RNBQKBNR b KQkq - 0 2',
      '["dxe4"]',
      'Do not let your opponent keep an uncontested center.',
      array['opening', 'counterplay', 'pawn-break'],
      'easy',
      21,
      true
    )
) as v(slug, title, fen, solution, hint, themes, difficulty, order_idx, published)
on conflict (lesson_id, slug) do update set
  title = excluded.title,
  fen = excluded.fen,
  solution = excluded.solution,
  hint = excluded.hint,
  themes = excluded.themes,
  difficulty = excluded.difficulty,
  order_idx = excluded.order_idx,
  published = excluded.published;

with lesson_target as (
  select l.id as lesson_id
  from public.lessons l
  join public.lesson_plans p on p.id = l.plan_id
  where p.slug = 'beginners-workshop'
    and l.slug = 'opening-principles-fast-development'
)
insert into public.lesson_quiz_questions (
  lesson_id,
  slug,
  type,
  prompt,
  payload,
  time_limit_seconds,
  base_points,
  order_idx,
  published
)
select
  t.lesson_id,
  v.slug,
  v.type::public.question_type,
  v.prompt,
  v.payload::jsonb,
  v.time_limit_seconds,
  v.base_points,
  v.order_idx,
  v.published
from lesson_target t
cross join (
  values
    (
      'opening-q1-core-center',
      'multiple-choice',
      'Which four squares are the core center in opening play?',
      '{"choices":["a4, a5, h4, h5","c3, c6, f3, f6","d4, e4, d5, e5","b2, g2, b7, g7"],"correctChoice":2}',
      20,
      100,
      0,
      true
    ),
    (
      'opening-q2-first-priority',
      'multiple-choice',
      'In the first 8-10 moves, what should usually come first?',
      '{"choices":["Launch a kingside pawn storm","Develop pieces and fight for the center","Move the queen three times","Trade queens immediately"],"correctChoice":1}',
      20,
      100,
      1,
      true
    ),
    (
      'opening-q3-castling-timing',
      'multiple-choice',
      'Why is castling early usually a good idea for beginners?',
      '{"choices":["It always wins material","It hides your king and activates a rook","It prevents all tactics","It forces a queen trade"],"correctChoice":1}',
      20,
      100,
      2,
      true
    ),
    (
      'opening-q4-scholar-target',
      'multiple-choice',
      'In Scholar''s Mate ideas, which pawn is usually targeted first?',
      '{"choices":["f7","a7","h7","d7"],"correctChoice":0}',
      15,
      100,
      3,
      true
    ),
    (
      'opening-q5-queen-adventure',
      'multiple-choice',
      'What is the main risk of moving your queen too early?',
      '{"choices":["You lose castling rights immediately","You often lose tempo when opponents attack the queen while developing","You cannot move pawns anymore","Your king is automatically in check"],"correctChoice":1}',
      20,
      100,
      4,
      true
    ),
    (
      'opening-q6-break-pin',
      'multiple-choice',
      'A bishop pins your knight on f6. What is a common way to question that bishop?',
      '{"choices":["h6","a5","g5","Qe7"],"correctChoice":0}',
      20,
      100,
      5,
      true
    ),
    (
      'opening-q7-defend-f7-best-move',
      'best-move',
      'Black to move: White threatens Qxf7#. Find the best defensive move.',
      '{"fen":"r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3","solution":["g6"]}',
      25,
      125,
      6,
      true
    ),
    (
      'opening-q8-punish-queen-best-move',
      'best-move',
      'White to move: punish the early queen move and win material.',
      '{"fen":"rnb1kbnr/pppp1ppp/8/4p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3","solution":["Nxe5"]}',
      25,
      125,
      7,
      true
    ),
    (
      'opening-q9-castle-best-move',
      'best-move',
      'White to move: your development is ready. Choose the best king-safety move.',
      '{"fen":"r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 4 5","solution":["O-O"]}',
      25,
      125,
      8,
      true
    ),
    (
      'opening-q10-center-strike-best-move',
      'best-move',
      'Black to move: White has a broad pawn center. Find the direct challenge.',
      '{"fen":"rnbqkbnr/pppp1ppp/8/4p3/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2","solution":["exd4"]}',
      25,
      125,
      9,
      true
    ),
    (
      'opening-q11-build-then-break',
      'best-move',
      'White to move: build then break in the center. Play the full student line.',
      '{"fen":"r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R w KQkq - 0 5","solution":["d4","exd4","cxd4"]}',
      40,
      150,
      10,
      true
    )
) as v(slug, type, prompt, payload, time_limit_seconds, base_points, order_idx, published)
on conflict (lesson_id, slug) do update set
  type = excluded.type,
  prompt = excluded.prompt,
  payload = excluded.payload,
  time_limit_seconds = excluded.time_limit_seconds,
  base_points = excluded.base_points,
  order_idx = excluded.order_idx,
  published = excluded.published;
