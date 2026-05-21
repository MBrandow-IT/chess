-- =====================================================================
-- Fix: ambiguous column references in public.join_quiz and
-- public.submit_answer
--
-- The previous definitions (0002_rpcs.sql) declared OUT columns via
-- RETURNS TABLE whose names collided with real columns on the queried
-- tables:
--
--   join_quiz       → OUT (quiz_id, session_token)  vs quizzes/quiz_players
--   submit_answer   → OUT (total_score)             vs quiz_players
--
-- PostgreSQL's default plpgsql behaviour is `#variable_conflict error`,
-- so any bare reference like `where quiz_id = v_quiz_id`,
-- `returning session_token into v_token`, or
-- `set total_score = total_score + v_points` raised:
--
--   ERROR: column reference "<name>" is ambiguous
--
-- These re-definitions table-qualify every column reference inside the
-- function bodies. Both use CREATE OR REPLACE so this migration is a
-- safe no-op against databases that already have the corrected version.
-- =====================================================================

create or replace function public.join_quiz(
  p_pin          text,
  p_display_name text
)
returns table (
  quiz_id        uuid,
  player_id      uuid,
  session_token  uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quiz_id   uuid;
  v_player_id uuid;
  v_token     uuid;
  v_name      text := trim(p_display_name);
begin
  if v_name is null or length(v_name) = 0 then
    raise exception 'display_name required';
  end if;
  if length(v_name) > 24 then
    raise exception 'display_name too long (max 24 chars)';
  end if;

  select q.id into v_quiz_id
  from public.quizzes q
  where q.pin = p_pin and q.status <> 'ended'
  order by q.created_at desc
  limit 1;

  if v_quiz_id is null then
    raise exception 'no active quiz with that PIN';
  end if;

  select qp.id, qp.session_token
    into v_player_id, v_token
  from public.quiz_players qp
  where qp.quiz_id = v_quiz_id and qp.display_name = v_name;

  if v_player_id is null then
    insert into public.quiz_players as qp (quiz_id, display_name)
    values (v_quiz_id, v_name)
    returning qp.id, qp.session_token
      into v_player_id, v_token;
  end if;

  return query select v_quiz_id, v_player_id, v_token;
end;
$$;

grant execute on function public.join_quiz(text, text) to anon, authenticated;


create or replace function public.submit_answer(
  p_player_id        uuid,
  p_session_token    uuid,
  p_question_id      uuid,
  p_payload          jsonb,
  p_client_elapsed_ms integer
)
returns table (
  correct        boolean,
  points_awarded integer,
  total_score    integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player        public.quiz_players%rowtype;
  v_question      public.quiz_questions%rowtype;
  v_quiz          public.quizzes%rowtype;
  v_correct       boolean := false;
  v_wrong         integer := 0;
  v_elapsed_ms    integer;
  v_elapsed_sec   numeric;
  v_time_factor   numeric;
  v_wrong_factor  numeric;
  v_points        integer := 0;
  v_q_type        text;
  v_solution      jsonb;
  v_correct_idx   integer;
  v_choice_idx    integer;
  v_submitted     text;
  v_existing      uuid;
begin
  select * into v_player
  from public.quiz_players
  where id = p_player_id;

  if v_player.id is null then
    raise exception 'player not found';
  end if;
  if v_player.session_token <> p_session_token then
    raise exception 'invalid session token';
  end if;

  select * into v_question
  from public.quiz_questions
  where id = p_question_id;

  if v_question.id is null then
    raise exception 'question not found';
  end if;
  if v_question.quiz_id <> v_player.quiz_id then
    raise exception 'question does not belong to this player''s quiz';
  end if;

  select * into v_quiz from public.quizzes where id = v_question.quiz_id;
  if v_quiz.status <> 'question' then
    raise exception 'quiz is not currently accepting answers';
  end if;
  if v_quiz.current_question_idx <> v_question.idx then
    raise exception 'this is not the current question';
  end if;

  select id into v_existing
  from public.quiz_answers
  where question_id = p_question_id and player_id = p_player_id;
  if v_existing is not null then
    raise exception 'answer already submitted for this question';
  end if;

  v_q_type    := v_question.type::text;
  v_wrong     := greatest(0, coalesce((p_payload ->> 'wrong_attempts')::integer, 0));

  if v_q_type = 'multiple-choice' then
    v_correct_idx := (v_question.payload ->> 'correctChoice')::integer;
    v_choice_idx  := (p_payload ->> 'choice')::integer;
    v_correct     := v_correct_idx is not null and v_choice_idx = v_correct_idx;
    v_wrong := case when v_correct then 0 else 1 end;

  elsif v_q_type = 'best-move' then
    v_solution := v_question.payload -> 'solution';
    v_submitted := p_payload ->> 'san';
    v_correct := v_solution is not null
              and jsonb_typeof(v_solution) = 'array'
              and jsonb_array_length(v_solution) >= 1
              and (v_solution ->> 0) = v_submitted;

  elsif v_q_type = 'best-sequence' then
    declare
      v_player_seq jsonb := p_payload -> 'moves';
      v_expected   jsonb := v_question.payload -> 'solution';
    begin
      v_correct := v_player_seq is not null
                and v_expected is not null
                and v_player_seq::text = v_expected::text;
    end;

  else
    raise exception 'unknown question type: %', v_q_type;
  end if;

  if v_quiz.current_question_started_at is not null then
    v_elapsed_ms := greatest(
      0,
      extract(epoch from (now() - v_quiz.current_question_started_at))::integer * 1000
    );
  else
    v_elapsed_ms := greatest(0, coalesce(p_client_elapsed_ms, 0));
  end if;
  v_elapsed_sec := v_elapsed_ms / 1000.0;

  if v_correct
     and v_elapsed_sec <= v_question.time_limit_seconds
  then
    v_time_factor  := greatest(0, 1 - v_elapsed_sec / 100.0);
    v_wrong_factor := power(0.5, v_wrong);
    v_points       := floor(v_question.base_points * v_time_factor * v_wrong_factor)::integer;
    if v_points < 0 then v_points := 0; end if;
  else
    v_points := 0;
  end if;

  insert into public.quiz_answers (
    quiz_id, question_id, player_id, payload,
    time_ms, wrong_attempts, correct, points_awarded
  ) values (
    v_player.quiz_id, p_question_id, p_player_id, p_payload,
    v_elapsed_ms, v_wrong, v_correct, v_points
  );

  update public.quiz_players as qp
  set total_score = qp.total_score + v_points
  where qp.id = p_player_id;

  return query
    select v_correct, v_points, qp.total_score
    from public.quiz_players qp
    where qp.id = p_player_id;
end;
$$;

grant execute on function public.submit_answer(uuid, uuid, uuid, jsonb, integer) to anon, authenticated;
