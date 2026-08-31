-- Supabase Schema & Table Auto-Creation for MCQ Exam System

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id text primary key,
  email text default 'personal@local',
  name text default 'Personal User',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Quiz Sessions Table
create table if not exists public.quiz_sessions (
  id text primary key,
  user_id text default 'default_user',
  quiz_type text default 'topic_wise',
  quiz_title text not null,
  source_id text,
  mode text default 'practice',
  started_at timestamptz default now(),
  completed_at timestamptz,
  total_questions integer default 0,
  attempted_questions integer default 0,
  correct_answers integer default 0,
  wrong_answers integer default 0,
  skipped_questions integer default 0,
  score numeric default 0,
  accuracy numeric default 0,
  time_taken integer default 0,
  created_at timestamptz default now()
);

-- 3. Question Attempts Table
create table if not exists public.question_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id text default 'default_user',
  session_id text references public.quiz_sessions(id) on delete cascade,
  question_id text not null,
  selected_answer integer,
  correct_answer integer,
  is_correct boolean default false,
  is_skipped boolean default false,
  time_spent integer default 0,
  attempted_at timestamptz default now()
);

-- 4. Wrong Questions Table (Learning Loop & Personal Notes)
create table if not exists public.wrong_questions (
  id uuid default gen_random_uuid() primary key,
  user_id text default 'default_user',
  question_id text not null,
  first_wrong_at timestamptz default now(),
  last_wrong_at timestamptz default now(),
  wrong_count integer default 1,
  correct_count_after_wrong integer default 0,
  is_learned boolean default false,
  learned_at timestamptz,
  priority text default 'Medium',
  personal_note text default '',
  last_attempt_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_question unique (user_id, question_id)
);

-- 5. Question Notes Table
create table if not exists public.question_notes (
  id uuid default gen_random_uuid() primary key,
  user_id text default 'default_user',
  question_id text not null,
  note text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint unique_user_question_note unique (user_id, question_id)
);

-- 6. Bookmarks Table
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id text default 'default_user',
  question_id text not null,
  subject_id text,
  question_data jsonb,
  created_at timestamptz default now(),
  constraint unique_user_bookmark unique (user_id, question_id)
);

-- Enable RLS and create permissive policies for personal use
alter table public.profiles enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.question_attempts enable row level security;
alter table public.wrong_questions enable row level security;
alter table public.question_notes enable row level security;
alter table public.bookmarks enable row level security;

-- Drop previous strict auth policies if existing to allow zero sign-up friction
drop policy if exists "Allow all for profiles" on public.profiles;
drop policy if exists "Allow all for quiz_sessions" on public.quiz_sessions;
drop policy if exists "Allow all for question_attempts" on public.question_attempts;
drop policy if exists "Allow all for wrong_questions" on public.wrong_questions;
drop policy if exists "Allow all for question_notes" on public.question_notes;
drop policy if exists "Allow all for bookmarks" on public.bookmarks;

create policy "Allow all for profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all for quiz_sessions" on public.quiz_sessions for all using (true) with check (true);
create policy "Allow all for question_attempts" on public.question_attempts for all using (true) with check (true);
create policy "Allow all for wrong_questions" on public.wrong_questions for all using (true) with check (true);
create policy "Allow all for question_notes" on public.question_notes for all using (true) with check (true);
create policy "Allow all for bookmarks" on public.bookmarks for all using (true) with check (true);
