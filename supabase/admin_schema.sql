-- SpeakNow admin backend schema
-- Run this in the Supabase SQL Editor.

create table if not exists public.admin_users (
  id text primary key,
  full_name text not null default '',
  email text not null default '',
  role text not null default 'learner',
  avatar_url text not null default '',
  created_date timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists admin_users_email_idx
  on public.admin_users (email);

create index if not exists admin_users_last_seen_at_idx
  on public.admin_users (last_seen_at desc);

create table if not exists public.admin_events (
  id text primary key,
  type text not null,
  timestamp timestamptz not null default timezone('utc', now()),
  user_id text not null default '',
  user_email text not null default '',
  payload jsonb not null default '{}'::jsonb
);

create index if not exists admin_events_timestamp_idx
  on public.admin_events (timestamp desc);

create index if not exists admin_events_type_idx
  on public.admin_events (type);

create index if not exists admin_events_user_id_idx
  on public.admin_events (user_id);

create index if not exists admin_events_payload_gin_idx
  on public.admin_events using gin (payload);

create table if not exists public.admin_voice_sessions (
  id text primary key,
  created_date timestamptz not null default timezone('utc', now()),
  user_id text not null default '',
  scenario text not null default '',
  mode text not null default '',
  dialog_mode text not null default '',
  scoring_standard text not null default '',
  messages jsonb not null default '[]'::jsonb,
  report jsonb not null default '{}'::jsonb,
  duration_seconds integer not null default 0,
  words_spoken integer not null default 0,
  total_exchanges integer not null default 0
);

create index if not exists admin_voice_sessions_created_date_idx
  on public.admin_voice_sessions (created_date desc);

create index if not exists admin_voice_sessions_user_id_idx
  on public.admin_voice_sessions (user_id);

create index if not exists admin_voice_sessions_scenario_idx
  on public.admin_voice_sessions (scenario);

create index if not exists admin_voice_sessions_report_gin_idx
  on public.admin_voice_sessions using gin (report);

create table if not exists public.admin_presentation_sessions (
  id text primary key,
  created_date timestamptz not null default timezone('utc', now()),
  user_id text not null default '',
  file_name text not null default '',
  duration_seconds integer not null default 0,
  total_pages integer not null default 0,
  page_timings jsonb not null default '[]'::jsonb,
  report jsonb not null default '{}'::jsonb
);

create index if not exists admin_presentation_sessions_created_date_idx
  on public.admin_presentation_sessions (created_date desc);

create index if not exists admin_presentation_sessions_user_id_idx
  on public.admin_presentation_sessions (user_id);

create index if not exists admin_presentation_sessions_report_gin_idx
  on public.admin_presentation_sessions using gin (report);

-- Optional: if you want to inspect data from the Supabase table editor without
-- using RLS yet, keep RLS disabled for these admin-only tables.
-- If you later expose them to client-side reads, enable RLS and add policies.
