alter table public.safety_events
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_action_logs_created_at_idx
  on public.admin_action_logs(created_at desc);

create index if not exists admin_action_logs_target_idx
  on public.admin_action_logs(target_type, target_id);

alter table public.admin_action_logs enable row level security;

create policy "admin_action_logs_select_none"
  on public.admin_action_logs
  for select
  using (false);
