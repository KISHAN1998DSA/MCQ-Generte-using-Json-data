-- Seed Data for Supabase MCQ Exam System

-- Insert default user profile
insert into public.profiles (id, email, name)
values ('default_user', 'personal@local', 'Personal Exam User')
on conflict (id) do nothing;

-- Insert sample quiz session
insert into public.quiz_sessions (
  id, user_id, quiz_type, quiz_title, source_id, mode, 
  total_questions, attempted_questions, correct_answers, wrong_answers, score, accuracy, time_taken
)
values (
  'sample-session-01', 'default_user', 'topic_wise', 'Digital Logic Baseline Test', 'digital-logic', 'practice',
  3, 3, 2, 1, 67, 67, 45
)
on conflict (id) do nothing;

-- Insert sample wrong question entry with personal learning note
insert into public.wrong_questions (
  user_id, question_id, wrong_count, correct_count_after_wrong, is_learned, priority, personal_note
)
values (
  'default_user', 'digital-logic-q3-001', 2, 0, false, 'High',
  'I confused JK flip flop toggle condition when J=1, K=1 with SR flip flop invalid state.'
)
on conflict (user_id, question_id) do update set
  wrong_count = excluded.wrong_count,
  personal_note = excluded.personal_note;

-- Insert sample standalone note
insert into public.question_notes (user_id, question_id, note)
values (
  'default_user', 'digital-logic-q3-001',
  'Remember: JK flip flop toggles when J=K=1. SR flip flop is invalid/forbidden when S=R=1.'
)
on conflict (user_id, question_id) do update set note = excluded.note;
