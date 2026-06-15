-- Skewer puzzle slide 15: queen on c7 instead of rook (matches lesson.mdx edit).
update public.lesson_slide_chess_blocks b
set payload = '{"fen":"8/2q5/1k6/B7/8/8/8/4K3 b - - 0 1"}'::jsonb
from public.lessons l
join public.lesson_plans p on p.id = l.plan_id
where b.lesson_id = l.id
  and p.slug = 'beginners-workshop'
  and l.slug = 'tactics-forks-and-double-attacks'
  and b.slug = 'tactics-skewer-diagram';

update public.lesson_slide_chess_blocks b
set payload = '{"fen":"8/2q5/1k6/8/1B6/8/8/4K3 w - - 0 1","solution":["Ba5+"],"hint":"From b4, one diagonal move hits both b6 and c7.","title":"Bishop skewer"}'::jsonb
from public.lessons l
join public.lesson_plans p on p.id = l.plan_id
where b.lesson_id = l.id
  and p.slug = 'beginners-workshop'
  and l.slug = 'tactics-forks-and-double-attacks'
  and b.slug = 'tactics-skewer-puzzle';
