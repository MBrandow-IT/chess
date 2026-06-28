-- ---------------------------------------------------------------------
-- Seed slide chess blocks for Lesson 5 — Endgame I
-- (endgame-king-and-pawn-fundamentals).
--
-- Slugs are referenced from content/.../09-endgame-king-and-pawn-
-- fundamentals/lesson.mdx. All puzzle solution lines are verified legal
-- against chess.js before committing.
-- ---------------------------------------------------------------------
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
      'endgame1-king-pawn-intro-board',
      'display-board',
      'Slide 3 — What changes in the endgame?',
      '{"fen":"8/8/4k3/3p4/3P4/4K3/8/8 w - - 0 1"}',
      0
    ),
    (
      'endgame1-queen-finish-board',
      'display-board',
      'Slide 5 — When you are up a queen',
      '{"fen":"8/8/8/8/8/5k2/8/QK6 w - - 0 1"}',
      1
    ),
    (
      'endgame1-stalemate-trap-board',
      'display-board',
      'Slide 8 — Stalemate trap',
      '{"fen":"7k/6Q1/6K1/8/8/8/8/8 b - - 0 1"}',
      2
    ),
    (
      'endgame1-mate-on-edge-board',
      'display-board',
      'Slide 9 — Correct checkmate on the edge',
      '{"fen":"7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"}',
      3
    ),
    (
      'endgame1-queen-shrink-box-board',
      'display-board',
      'Slide 10 — Shrink the box with your queen',
      '{"fen":"8/8/8/8/4k3/8/8/QK6 w - - 0 1","highlights":["e4","d4","e5","d5","c4","c5"]}',
      4
    ),
    (
      'endgame1-queen-cutoff-demo-board',
      'display-board',
      'Slide 11 — Cut the king off',
      '{"fen":"8/8/8/8/4k3/8/8/QK6 w - - 0 1","selectedSquare":"a1"}',
      5
    ),
    (
      'endgame1-queen-king-walk-board',
      'display-board',
      'Slide 12 — Walk your king forward',
      '{"fen":"2k5/8/8/2Q5/8/2K5/8/8 w - - 0 1"}',
      6
    ),
    (
      'endgame1-queen-push-edge-board',
      'display-board',
      'Slide 13 — Push the king to the edge',
      '{"fen":"k7/8/8/8/8/1K6/1Q6/8 w - - 0 1"}',
      7
    ),
    (
      'endgame1-queen-example-start-board',
      'display-board',
      'Slide 14 — Queen mate example start',
      '{"fen":"8/8/8/8/8/5k2/8/QK6 w - - 0 1"}',
      8
    ),
    (
      'endgame1-queen-example-middle-board',
      'display-board',
      'Slide 15 — Queen mate example middle',
      '{"fen":"8/8/5k2/8/8/2K5/2Q4/8 w - - 0 1"}',
      9
    ),
    (
      'endgame1-queen-example-mate-board',
      'display-board',
      'Slide 16 — Queen mate example finish',
      '{"fen":"6k1/6Q1/6K1/8/8/8/8/8 b - - 0 1"}',
      10
    ),
    (
      'endgame1-queen-cutoff-puzzle',
      'puzzle',
      'Slide 17 — Cut off the king puzzle',
      '{"fen":"8/8/8/8/4k3/8/8/QK6 w - - 0 1","solution":["Qe5"],"hint":"Place the queen on the same file or rank as the enemy king, one step closer to the center.","title":"Shrink the box"}',
      11
    ),
    (
      'endgame1-queen-king-walk-puzzle',
      'puzzle',
      'Slide 18 — Step your king closer puzzle',
      '{"fen":"2k5/8/8/2Q5/8/1K6/8/8 w - - 0 1","solution":["Kc3"],"hint":"Walk toward the enemy king. You do not need to rush — one safe step is enough.","title":"King marches forward"}',
      12
    ),
    (
      'endgame1-queen-deliver-mate-puzzle',
      'puzzle',
      'Slide 19 — Deliver checkmate puzzle',
      '{"fen":"7k/8/6K1/8/8/5Q2/8 w - - 0 1","solution":["Qf7"],"hint":"Give check on the f-file. Landing on g7 with the queen would be stalemate.","title":"Finish on the edge"}',
      13
    ),
    (
      'endgame1-queen-push-check-puzzle',
      'puzzle',
      'Slide 20 — Check and push the king puzzle',
      '{"fen":"8/8/8/8/8/2k5/8/1Q6 w - - 0 1","solution":["Qc2+"],"hint":"Slide the queen one square to attack the king on c3.","title":"Push with check"}',
      14
    ),
    (
      'endgame1-queen-practice-board',
      'analysis-board',
      'Slide 21 — Queen vs king practice',
      '{"fen":"8/8/8/8/8/5k2/8/QK6 w - - 0 1"}',
      15
    ),
    (
      'endgame1-rook-cutoff-board',
      'display-board',
      'Slide 25 — Rook cut off the king',
      '{"fen":"8/8/8/R7/4k3/8/8/1R6 w - - 0 1"}',
      16
    ),
    (
      'endgame1-rook-ladder-build-board',
      'display-board',
      'Slide 26 — Build the ladder',
      '{"fen":"8/4k3/8/RR6/8/8/8/8 w - - 0 1"}',
      17
    ),
    (
      'endgame1-rook-ladder-check-board',
      'display-board',
      'Slide 27 — Alternate checks up the ladder',
      '{"fen":"8/8/5k2/8/8/8/8/RR6 w - - 0 1","selectedSquare":"a1"}',
      18
    ),
    (
      'endgame1-rook-ladder-mate-demo-board',
      'display-board',
      'Slide 28 — Ladder mate on the back rank',
      '{"fen":"7k/8/6R1/6R1/8/8/8/8 w - - 0 1"}',
      19
    ),
    (
      'endgame1-rook-example-start-board',
      'display-board',
      'Slide 29 — Two-rook example start',
      '{"fen":"8/8/8/8/8/4k3/8/RR6 w - - 0 1"}',
      20
    ),
    (
      'endgame1-rook-example-middle-board',
      'display-board',
      'Slide 30 — Two-rook example middle',
      '{"fen":"8/6k1/8/8/8/6R1/6R1/8 w - - 0 1"}',
      21
    ),
    (
      'endgame1-rook-example-finished-board',
      'display-board',
      'Slide 31 — Two-rook example finish',
      '{"fen":"7k/8/7R/6R1/8/8/8/8 b - - 0 1"}',
      22
    ),
    (
      'endgame1-rook-cutoff-puzzle',
      'puzzle',
      'Slide 32 — Cut off with a rook puzzle',
      '{"fen":"8/8/8/8/4k3/8/8/RR6 w - - 0 1","solution":["Ra5"],"hint":"Same idea as Qe5 — control a whole rank with one rook move.","title":"Rook builds the wall"}',
      23
    ),
    (
      'endgame1-rook-ladder-check-puzzle',
      'puzzle',
      'Slide 33 — Climb one rung puzzle',
      '{"fen":"8/8/5k2/8/8/8/8/RR6 w - - 0 1","solution":["Ra6+"],"hint":"Slide the a-rook up the a-file to attack the king on h6.","title":"Ladder check"}',
      24
    ),
    (
      'endgame1-rook-ladder-mate-puzzle',
      'puzzle',
      'Slide 34 — Deliver ladder mate puzzle',
      '{"fen":"7k/8/6R1/6R1/8/8/8/8 w - - 0 1","solution":["Rh6#"],"hint":"Move the f-rook to the h-file to give check on the back rank.","title":"Finish the ladder"}',
      25
    ),
    (
      'endgame1-rook-practice-board',
      'analysis-board',
      'Slide 35 — Two rooks vs king practice',
      '{"fen":"8/8/8/8/8/4k3/8/RR6 w - - 0 1"}',
      26
    ),
    (
      'endgame1-king-activity-board',
      'display-board',
      'Slide 37 — King activity in pawn endgames',
      '{"fen":"8/8/4k3/3p4/3P4/4K3/8/8 w - - 0 1"}',
      27
    ),
    (
      'endgame1-passed-pawn-board',
      'display-board',
      'Slide 38 — Passed pawns',
      '{"fen":"8/8/4k3/3p4/3P4/4K3/8/8 w - - 0 1","highlights":["d4","d5","d6","d7","d8"]}',
      28
    ),
    (
      'endgame1-opposition-board',
      'display-board',
      'Slide 39 — Opposition',
      '{"fen":"8/8/8/3k4/3K4/8/8/8 b - - 0 1"}',
      29
    ),
    (
      'endgame1-square-rule-win-board',
      'display-board',
      'Slide 41 — Square rule winning race',
      '{"fen":"8/8/8/8/8/3P4/4k4/8 w - - 0 1"}',
      30
    ),
    (
      'endgame1-square-rule-lose-board',
      'display-board',
      'Slide 42 — Square rule king catches pawn',
      '{"fen":"8/8/8/8/1k6/3P4/8/8 w - - 0 1"}',
      31
    ),
    (
      'endgame1-opposition-puzzle',
      'puzzle',
      'Slide 43 — Use opposition puzzle',
      '{"fen":"8/8/8/3k4/3P4/3K4/8/8 w - - 0 1","solution":["Ke3"],"hint":"Mirror the enemy king on the next rank. Take the e4 square in front of Black''s king.","title":"Take the opposition"}',
      32
    ),
    (
      'endgame1-push-pawn-puzzle',
      'puzzle',
      'Slide 44 — Push the passed pawn puzzle',
      '{"fen":"8/8/8/8/8/3P4/4k4/8 w - - 0 1","solution":["d4"],"hint":"If the enemy king cannot enter the promotion square, advance the pawn.","title":"Win the pawn race"}',
      33
    )
) as v(slug, type, slide_label, payload, order_idx)
where p.slug = 'beginners-workshop'
  and l.slug = 'endgame-king-and-pawn-fundamentals'
on conflict (lesson_id, slug) do nothing;
