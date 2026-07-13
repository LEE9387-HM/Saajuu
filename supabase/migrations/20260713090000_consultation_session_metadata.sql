alter table public.consultation_sessions
add column if not exists metadata jsonb not null default '{}'::jsonb;
