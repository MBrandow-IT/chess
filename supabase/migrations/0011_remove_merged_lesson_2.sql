-- Remove lesson 2 after merging into lesson 1 (chess-basics).
delete from public.lessons l
using public.lesson_plans p
where l.plan_id = p.id
  and p.slug = 'beginners-workshop'
  and l.slug = 'check-checkmate-and-special-rules';
