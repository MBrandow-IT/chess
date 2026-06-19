-- ---------------------------------------------------------------------
-- Seed slide chess blocks for Lesson 4 — Tactics II
-- (tactics-removing-defenders-and-overloading).
--
-- Mirrors the structure of 0013's seed for the Tactics I reference lesson.
-- Slugs are referenced from content/.../07-tactics-removing-defenders-and-
-- overloading/lesson.mdx. All puzzle solution lines are verified legal /
-- forcing against chess.js before committing.
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
      'tactics2-defender-board',
      'display-board',
      'Slide 4 — Every piece has a job',
      '{"fen":"3r2k1/3n1ppp/8/8/8/8/3R1PPP/3R2K1 w - - 0 1","selectedSquare":"d7"}',
      0
    ),
    (
      'tactics2-remove-defender-demo',
      'analysis-board',
      'Slide 6 — Remove the defender demo',
      '{"fen":"3r2k1/3b1ppp/8/8/8/8/3R1PPP/3R2K1 w - - 0 1"}',
      1
    ),
    (
      'tactics2-remove-defender-puzzle',
      'puzzle',
      'Slide 7 — Remove the defender puzzle',
      '{"fen":"3q2k1/5npp/8/8/8/1B6/5PPP/3R2K1 w - - 0 1","solution":["Bxf7+","Kxf7","Rxd8"],"hint":"The knight on f7 guards the queen on d8. Capture it with check, then take the queen.","title":"Remove the defender"}',
      2
    ),
    (
      'tactics2-deflection-board',
      'display-board',
      'Slide 8 — Deflection diagram',
      '{"fen":"2r3k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1","selectedSquare":"c8"}',
      3
    ),
    (
      'tactics2-deflection-puzzle',
      'puzzle',
      'Slide 9 — Deflection puzzle',
      '{"fen":"2r3k1/5ppp/8/Q7/8/8/5PPP/3R2K1 w - - 0 1","solution":["Qd8+","Rxd8","Rxd8#"],"hint":"The rook on c8 is the only back-rank guard. Give a check it must capture, dragging it onto d8.","title":"Deflection"}',
      4
    ),
    (
      'tactics2-overload-board',
      'display-board',
      'Slide 10 — Overloading diagram',
      '{"fen":"b3r1k1/5ppp/8/8/8/8/5PPP/R3R1K1 w - - 0 1","selectedSquare":"e8"}',
      5
    ),
    (
      'tactics2-overload-puzzle',
      'puzzle',
      'Slide 11 — Overloaded defender puzzle',
      '{"fen":"3q2k1/5ppp/8/8/3n4/8/5PPP/3RR1K1 w - - 0 1","solution":["Rxd4","Qxd4","Re8#"],"hint":"The queen on d8 defends the knight on d4 and the back rank. Take the knight and make it choose.","title":"Overloaded defender"}',
      6
    ),
    (
      'tactics2-backrank-board',
      'display-board',
      'Slide 12 — Back rank diagram',
      '{"fen":"6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1","selectedSquare":"g8"}',
      7
    ),
    (
      'tactics2-backrank-puzzle',
      'puzzle',
      'Slide 13 — Back-rank mate puzzle',
      '{"fen":"6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1","solution":["Rd8#"],"hint":"No luft means no escape. Bring a rook to the back rank.","title":"Back-rank mate"}',
      8
    ),
    (
      'tactics2-final-challenge-puzzle',
      'puzzle',
      'Slide 15 — Final challenge puzzle',
      '{"fen":"3r2k1/5npp/8/7B/8/8/5PPP/3RR1K1 w - - 0 1","solution":["Rxd8+","Nxd8","Re8#"],"hint":"Remove the only defender of d8 with check, force the knight to recapture, then the bishop on h5 covers f7 for mate.","title":"Final challenge"}',
      9
    )
) as v(slug, type, slide_label, payload, order_idx)
where p.slug = 'beginners-workshop'
  and l.slug = 'tactics-removing-defenders-and-overloading'
on conflict (lesson_id, slug) do nothing;
