-- ---------------------------------------------------------------------
-- Seed beginners-workshop lessons 2-16 (lesson 1 is synced separately).
-- Mirrors content/plans/beginners-workshop/*/lesson.yaml + npm run sync.
-- ---------------------------------------------------------------------

insert into public.lesson_plans (
  slug, title, description, age_group, order_idx, published
)
values (
  'beginners-workshop',
  'Beginners Workshop',
  'A complete 8-week, 16-lesson beginner chess workshop that moves from rules to practical game play.',
  'Ages 7+',
  1,
  true
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  age_group = excluded.age_group,
  order_idx = excluded.order_idx,
  published = excluded.published,
  updated_at = now();

insert into public.lessons (
  plan_id, slug, title, summary, order_idx, content_path
)
select
  p.id,
  v.slug,
  v.title,
  v.summary,
  v.order_idx,
  v.content_path
from public.lesson_plans p
cross join (
  values
    (
      'check-checkmate-and-special-rules',
      'Check, Checkmate, and Special Rules',
      'Learn check and checkmate, then master castling, en passant, and pawn promotion.',
      2,
      'content/plans/beginners-workshop/02-check-checkmate-and-special-rules/lesson.mdx'
    ),
    (
      'opening-principles-fast-development',
      'Opening Principles and Fast Development',
      'Build good openings with center control, quick development, and king safety.',
      3,
      'content/plans/beginners-workshop/03-opening-principles-fast-development/lesson.mdx'
    ),
    (
      'opening-traps-to-avoid',
      'Opening Traps to Avoid',
      'Learn practical trap awareness so beginners stop losing early games quickly.',
      4,
      'content/plans/beginners-workshop/04-opening-traps-to-avoid/lesson.mdx'
    ),
    (
      'tactics-forks-and-double-attacks',
      'Tactics: Forks and Double Attacks',
      'Win material with forks and double attacks using all piece types.',
      5,
      'content/plans/beginners-workshop/05-tactics-forks-and-double-attacks/lesson.mdx'
    ),
    (
      'tactics-pins-skewers-and-discovered-attacks',
      'Tactics: Pins, Skewers, and Discovered Attacks',
      'Apply line tactics to win material and create forcing threats.',
      6,
      'content/plans/beginners-workshop/06-tactics-pins-skewers-and-discovered-attacks/lesson.mdx'
    ),
    (
      'tactics-removing-defenders-and-overloading',
      'Tactics: Removing Defenders and Overloading',
      'Learn to break defensive structures by attacking key defenders.',
      7,
      'content/plans/beginners-workshop/07-tactics-removing-defenders-and-overloading/lesson.mdx'
    ),
    (
      'basic-mating-patterns',
      'Basic Mating Patterns',
      'Practice the most common beginner checkmating patterns and finishing techniques.',
      8,
      'content/plans/beginners-workshop/08-basic-mating-patterns/lesson.mdx'
    ),
    (
      'endgame-king-and-pawn-fundamentals',
      'Endgame Fundamentals: King and Pawn',
      'Build core king-and-pawn endgame technique with promotion races and planning.',
      9,
      'content/plans/beginners-workshop/09-endgame-king-and-pawn-fundamentals/lesson.mdx'
    ),
    (
      'endgame-opposition-and-pawn-races',
      'Endgame Technique: Opposition and Pawn Races',
      'Use opposition and tempo to outplay opponents in king-and-pawn endings.',
      10,
      'content/plans/beginners-workshop/10-endgame-opposition-and-pawn-races/lesson.mdx'
    ),
    (
      'endgame-rook-endings-and-conversion',
      'Endgame Technique: Rook Endings and Conversion',
      'Convert winning positions and defend tougher positions in basic rook endings.',
      11,
      'content/plans/beginners-workshop/11-endgame-rook-endings-and-conversion/lesson.mdx'
    ),
    (
      'piece-activity-and-planning',
      'Piece Activity and Planning',
      'Build practical plans by improving worst pieces and targeting weaknesses.',
      12,
      'content/plans/beginners-workshop/12-piece-activity-and-planning/lesson.mdx'
    ),
    (
      'pawn-structure-and-smart-trades',
      'Pawn Structure and Smart Trades',
      'Use pawn-structure ideas to choose better trades and long-term plans.',
      13,
      'content/plans/beginners-workshop/13-pawn-structure-and-smart-trades/lesson.mdx'
    ),
    (
      'how-to-analyze-your-games',
      'How to Analyze Your Games',
      'Build a post-game review routine to learn faster from wins and losses.',
      14,
      'content/plans/beginners-workshop/14-how-to-analyze-your-games/lesson.mdx'
    ),
    (
      'time-management-and-tournament-readiness',
      'Time Management and Tournament Readiness',
      'Prepare students for real games with clocks, routines, and practical decisions.',
      15,
      'content/plans/beginners-workshop/15-time-management-and-tournament-readiness/lesson.mdx'
    ),
    (
      'capstone-review-and-mini-tournament',
      'Capstone Review and Mini Tournament',
      'Finish the workshop with structured review and practical games.',
      16,
      'content/plans/beginners-workshop/16-capstone-review-and-mini-tournament/lesson.mdx'
    )
) as v(slug, title, summary, order_idx, content_path)
where p.slug = 'beginners-workshop'
on conflict (plan_id, slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  order_idx = excluded.order_idx,
  content_path = excluded.content_path,
  updated_at = now();
