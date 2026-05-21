/**
 * Hand-rolled Database types for our app. (We're not running supabase-gen-types
 * here; this stays in sync manually with supabase/migrations/0001_init.sql.)
 */

export type QuizStatus = "lobby" | "question" | "reveal" | "ended";
export type QuestionType = "multiple-choice" | "best-move" | "best-sequence";
export type ContactCategory =
  | "advice"
  | "tutoring"
  | "admin_access"
  | "bug_report";

export type LessonPlanRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  age_group: string | null;
  cover_image: string | null;
  order_idx: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type LessonRow = {
  id: string;
  plan_id: string;
  slug: string;
  title: string;
  summary: string;
  order_idx: number;
  content_path: string;
  created_at: string;
  updated_at: string;
};

export type QuizRow = {
  id: string;
  host_id: string | null;
  lesson_id: string | null;
  pin: string;
  status: QuizStatus;
  current_question_idx: number;
  current_question_started_at: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
};

export type QuizQuestionRow = {
  id: string;
  quiz_id: string;
  idx: number;
  type: QuestionType;
  payload: Record<string, unknown>;
  time_limit_seconds: number;
  base_points: number;
  created_at: string;
};

export type QuizPlayerRow = {
  id: string;
  quiz_id: string;
  display_name: string;
  session_token: string;
  total_score: number;
  joined_at: string;
};

export type QuizAnswerRow = {
  id: string;
  quiz_id: string;
  question_id: string;
  player_id: string;
  payload: Record<string, unknown>;
  time_ms: number;
  wrong_attempts: number;
  correct: boolean;
  points_awarded: number;
  created_at: string;
};

export type LessonPuzzleRow = {
  id: string;
  lesson_id: string;
  slug: string;
  title: string;
  fen: string;
  solution: string[];
  hint: string | null;
  themes: string[];
  difficulty: string | null;
  order_idx: number;
  published: boolean;
  created_at: string;
};

export type LessonQuizQuestionRow = {
  id: string;
  lesson_id: string;
  slug: string;
  type: QuestionType;
  prompt: string;
  payload: Record<string, unknown>;
  time_limit_seconds: number;
  base_points: number;
  order_idx: number;
  published: boolean;
  created_at: string;
};

export type ContactSubmissionRow = {
  id: string;
  category: ContactCategory;
  name: string;
  email: string;
  message: string;
  page_url: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      lesson_plans: {
        Row: LessonPlanRow;
        Insert: Partial<LessonPlanRow> & Pick<LessonPlanRow, "slug" | "title">;
        Update: Partial<LessonPlanRow>;
        Relationships: [];
      };
      lessons: {
        Row: LessonRow;
        Insert: Partial<LessonRow> &
          Pick<LessonRow, "plan_id" | "slug" | "title" | "content_path">;
        Update: Partial<LessonRow>;
        Relationships: [];
      };
      quizzes: {
        Row: QuizRow;
        Insert: Partial<QuizRow> & Pick<QuizRow, "pin">;
        Update: Partial<QuizRow>;
        Relationships: [];
      };
      quiz_questions: {
        Row: QuizQuestionRow;
        Insert: Partial<QuizQuestionRow> &
          Pick<QuizQuestionRow, "quiz_id" | "idx" | "type" | "payload">;
        Update: Partial<QuizQuestionRow>;
        Relationships: [];
      };
      quiz_players: {
        Row: QuizPlayerRow;
        Insert: Partial<QuizPlayerRow> &
          Pick<QuizPlayerRow, "quiz_id" | "display_name">;
        Update: Partial<QuizPlayerRow>;
        Relationships: [];
      };
      quiz_answers: {
        Row: QuizAnswerRow;
        Insert: Partial<QuizAnswerRow> &
          Pick<
            QuizAnswerRow,
            | "quiz_id"
            | "question_id"
            | "player_id"
            | "payload"
            | "time_ms"
            | "correct"
            | "points_awarded"
          >;
        Update: Partial<QuizAnswerRow>;
        Relationships: [];
      };
      lesson_puzzles: {
        Row: LessonPuzzleRow;
        Insert: Partial<LessonPuzzleRow> &
          Pick<
            LessonPuzzleRow,
            "lesson_id" | "slug" | "fen" | "solution"
          >;
        Update: Partial<LessonPuzzleRow>;
        Relationships: [];
      };
      lesson_quiz_questions: {
        Row: LessonQuizQuestionRow;
        Insert: Partial<LessonQuizQuestionRow> &
          Pick<
            LessonQuizQuestionRow,
            "lesson_id" | "slug" | "type" | "prompt" | "payload"
          >;
        Update: Partial<LessonQuizQuestionRow>;
        Relationships: [];
      };
      contact_submissions: {
        Row: ContactSubmissionRow;
        Insert: Partial<ContactSubmissionRow> &
          Pick<
            ContactSubmissionRow,
            "category" | "name" | "email" | "message"
          >;
        Update: Partial<ContactSubmissionRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_quiz: {
        Args: { p_pin: string; p_display_name: string };
        Returns: { quiz_id: string; player_id: string; session_token: string }[];
      };
      submit_answer: {
        Args: {
          p_player_id: string;
          p_session_token: string;
          p_question_id: string;
          p_payload: Record<string, unknown>;
          p_client_elapsed_ms: number;
        };
        Returns: {
          correct: boolean;
          points_awarded: number;
          total_score: number;
        }[];
      };
      advance_quiz: { Args: { p_quiz_id: string }; Returns: QuizRow[] };
      reveal_quiz: { Args: { p_quiz_id: string }; Returns: QuizRow[] };
      end_quiz: { Args: { p_quiz_id: string }; Returns: QuizRow[] };
    };
    Enums: {
      quiz_status: QuizStatus;
      question_type: QuestionType;
      contact_category: ContactCategory;
    };
  };
};
