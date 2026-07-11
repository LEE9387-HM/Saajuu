-- Saajuu monetization MVP schema.
-- This migration is prepared for review first. Do not push it to production
-- until privacy policy, consent text, and server functions are ready.

create extension if not exists pgcrypto;

create type public.calendar_type as enum ('solar', 'lunar');
create type public.relationship_type as enum ('crush', 'lover', 'spouse', 'reunion', 'family', 'work');
create type public.consultation_mode as enum ('trial', 'basic', 'pro');
create type public.order_status as enum ('pending', 'paid', 'failed', 'canceled', 'refunded');
create type public.entitlement_status as enum ('active', 'expired', 'consumed', 'revoked');
create type public.consultation_status as enum ('draft', 'active', 'completed', 'expired', 'canceled');
create type public.link_status as enum ('pending', 'active', 'unlinked', 'revoked');
create type public.message_role as enum ('user', 'assistant', 'system');
create type public.safety_level as enum ('none', 'caution', 'blocked', 'crisis');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  consent_version text not null,
  accepted boolean not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint consent_type_allowed check (
    consent_type in ('terms', 'privacy', 'ai_notice', 'marketing', 'sensitive_consultation')
  )
);

create table public.birth_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default '내 사주',
  calendar public.calendar_type not null,
  birth_date date not null,
  birth_hour smallint not null check (birth_hour between 0 and 23),
  birth_minute smallint not null check (birth_minute between 0 and 59),
  is_leap_month boolean not null default false,
  gender text,
  is_default boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gender_allowed check (gender is null or gender in ('female', 'male', 'other', 'prefer_not_to_say'))
);

create table public.relationship_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  invite_token_hash text not null unique,
  relationship public.relationship_type not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.relationship_links (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  relationship public.relationship_type not null,
  status public.link_status not null default 'active',
  requested_by uuid not null references auth.users(id) on delete restrict,
  accepted_at timestamptz,
  unlinked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationship_links_distinct_users check (user_a_id <> user_b_id)
);

create table public.persona_catalog (
  id text primary key,
  display_name text not null,
  role text not null,
  tone text not null,
  specialties text[] not null default '{}',
  sample_message text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id text primary key,
  name text not null,
  mode public.consultation_mode not null,
  price_krw integer not null check (price_krw >= 0),
  turn_limit integer not null check (turn_limit > 0),
  valid_for interval not null,
  description text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id),
  provider text not null default 'portone',
  provider_order_id text unique,
  provider_payment_id text,
  amount_krw integer not null check (amount_krw >= 0),
  status public.order_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id),
  order_id uuid references public.orders(id) on delete set null,
  status public.entitlement_status not null default 'active',
  total_turns integer not null check (total_turns > 0),
  used_turns integer not null default 0 check (used_turns >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint used_turns_not_over_total check (used_turns <= total_turns)
);

create table public.concerns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  concern_summary text,
  source text not null default 'consultation',
  created_at timestamptz not null default now(),
  constraint topic_allowed check (topic in ('relationship', 'marriage', 'business', 'career', 'family', 'yearly')),
  constraint source_allowed check (source in ('daily', 'compatibility', 'consultation', 'manual'))
);

create table public.consultation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_id text not null references public.persona_catalog(id),
  product_id text references public.products(id),
  entitlement_id uuid references public.entitlements(id) on delete set null,
  concern_id uuid references public.concerns(id) on delete set null,
  mode public.consultation_mode not null,
  topic text not null,
  status public.consultation_status not null default 'draft',
  turn_limit integer not null check (turn_limit > 0),
  used_turns integer not null default 0 check (used_turns >= 0),
  safety_level public.safety_level not null default 'none',
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consultation_topic_allowed check (topic in ('relationship', 'marriage', 'business', 'career', 'family', 'yearly')),
  constraint consultation_turns_not_over_limit check (used_turns <= turn_limit)
);

create table public.consultation_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.consultation_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.message_role not null,
  content text not null,
  safety_level public.safety_level not null default 'none',
  model text,
  prompt_version text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.session_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.consultation_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  options jsonb not null default '[]'::jsonb,
  action_plan jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id)
);

create table public.safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid references public.consultation_sessions(id) on delete set null,
  level public.safety_level not null,
  category text not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ad_reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  reward_turns integer not null default 1 check (reward_turns > 0 and reward_turns <= 2),
  event_date date not null default current_date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  event_name text not null,
  event_properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint analytics_no_raw_sensitive check (
    not (event_properties ? 'birth_date')
    and not (event_properties ? 'name')
    and not (event_properties ? 'concern')
    and not (event_properties ? 'message')
  )
);

create index birth_profiles_user_id_idx on public.birth_profiles(user_id) where deleted_at is null;
create index relationship_invites_inviter_user_id_idx on public.relationship_invites(inviter_user_id);
create index relationship_links_user_a_id_idx on public.relationship_links(user_a_id);
create index relationship_links_user_b_id_idx on public.relationship_links(user_b_id);
create unique index relationship_links_active_pair_idx
  on public.relationship_links (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id), relationship)
  where status = 'active';
create index orders_user_id_created_at_idx on public.orders(user_id, created_at desc);
create index entitlements_user_id_status_idx on public.entitlements(user_id, status, expires_at);
create index concerns_user_id_created_at_idx on public.concerns(user_id, created_at desc);
create index consultation_sessions_user_id_created_at_idx on public.consultation_sessions(user_id, created_at desc);
create index consultation_messages_session_id_created_at_idx on public.consultation_messages(session_id, created_at);
create index session_summaries_user_id_created_at_idx on public.session_summaries(user_id, created_at desc);
create index safety_events_session_id_idx on public.safety_events(session_id);
create index ad_reward_events_user_id_event_date_idx on public.ad_reward_events(user_id, event_date);
create index analytics_events_event_name_created_at_idx on public.analytics_events(event_name, created_at desc);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger birth_profiles_set_updated_at before update on public.birth_profiles
  for each row execute function public.set_updated_at();
create trigger relationship_links_set_updated_at before update on public.relationship_links
  for each row execute function public.set_updated_at();
create trigger persona_catalog_set_updated_at before update on public.persona_catalog
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger entitlements_set_updated_at before update on public.entitlements
  for each row execute function public.set_updated_at();
create trigger consultation_sessions_set_updated_at before update on public.consultation_sessions
  for each row execute function public.set_updated_at();
create trigger session_summaries_set_updated_at before update on public.session_summaries
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.consent_logs enable row level security;
alter table public.birth_profiles enable row level security;
alter table public.relationship_invites enable row level security;
alter table public.relationship_links enable row level security;
alter table public.persona_catalog enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.entitlements enable row level security;
alter table public.concerns enable row level security;
alter table public.consultation_sessions enable row level security;
alter table public.consultation_messages enable row level security;
alter table public.session_summaries enable row level security;
alter table public.safety_events enable row level security;
alter table public.ad_reward_events enable row level security;
alter table public.analytics_events enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.persona_catalog, public.products to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.consent_logs to authenticated;
grant select, insert, update on public.birth_profiles to authenticated;
grant select, insert, update on public.relationship_invites to authenticated;
grant select, update on public.relationship_links to authenticated;
grant select, insert on public.concerns to authenticated;
grant select on public.orders, public.entitlements, public.consultation_sessions,
  public.consultation_messages, public.session_summaries, public.safety_events,
  public.ad_reward_events to authenticated;
grant insert on public.analytics_events to anon, authenticated;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "consent_logs_select_own" on public.consent_logs
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "consent_logs_insert_own" on public.consent_logs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "birth_profiles_select_own" on public.birth_profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "birth_profiles_insert_own" on public.birth_profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "birth_profiles_update_own" on public.birth_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "relationship_invites_select_own" on public.relationship_invites
  for select to authenticated
  using ((select auth.uid()) = inviter_user_id);
create policy "relationship_invites_insert_own" on public.relationship_invites
  for insert to authenticated
  with check ((select auth.uid()) = inviter_user_id);
create policy "relationship_invites_update_own" on public.relationship_invites
  for update to authenticated
  using ((select auth.uid()) = inviter_user_id)
  with check ((select auth.uid()) = inviter_user_id);

create policy "relationship_links_select_participant" on public.relationship_links
  for select to authenticated
  using ((select auth.uid()) in (user_a_id, user_b_id));
create policy "relationship_links_update_participant" on public.relationship_links
  for update to authenticated
  using ((select auth.uid()) in (user_a_id, user_b_id))
  with check ((select auth.uid()) in (user_a_id, user_b_id));

create policy "persona_catalog_select_catalog" on public.persona_catalog
  for select to anon, authenticated
  using (is_active = true);
create policy "products_select_catalog" on public.products
  for select to anon, authenticated
  using (is_active = true);

create policy "orders_select_own" on public.orders
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "entitlements_select_own" on public.entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "concerns_select_own" on public.concerns
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "concerns_insert_own" on public.concerns
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "consultation_sessions_select_own" on public.consultation_sessions
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "consultation_messages_select_own" on public.consultation_messages
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "session_summaries_select_own" on public.session_summaries
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "safety_events_select_own" on public.safety_events
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "ad_reward_events_select_own" on public.ad_reward_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "analytics_events_insert_minimal" on public.analytics_events
  for insert to anon, authenticated
  with check (true);

insert into public.persona_catalog (id, display_name, role, tone, specialties, sample_message, sort_order)
values
  (
    'miseon',
    '미선 이모',
    '마음을 받아주는 동네 이모',
    '부드러운 존댓말과 생활 비유로 감정을 먼저 받아줍니다.',
    array['부부', '가족', '자녀', '관계 불안'],
    '그동안 혼자 생각을 많이 하셨겠어요. 지금은 상대 마음보다, 내가 어디까지 기다릴 수 있는지가 더 힘든 것 같아요.',
    10
  ),
  (
    'junho',
    '준호 형',
    '따뜻하지만 현실적인 이웃',
    '편한 존댓말로 상황을 요약하고 선택지를 좁혀줍니다.',
    array['연애', '재회', '이직', '자신감'],
    '지금 당장 결론을 내리지 않아도 괜찮아요. 다만 추측과 실제 행동으로 확인된 것은 나눠서 봐야 해요.',
    20
  ),
  (
    'seongu',
    '성우 선생',
    '경험 많은 인생 선배',
    '간결하게 사실, 해석, 감정을 분리해 판단 기준을 세웁니다.',
    array['직장', '사업', '리더십', '결혼생활'],
    '현재 문제는 능력 부족이라기보다 역할과 책임이 불분명한 데서 시작된 것으로 보입니다.',
    30
  )
on conflict (id) do update
set display_name = excluded.display_name,
    role = excluded.role,
    tone = excluded.tone,
    specialties = excluded.specialties,
    sample_message = excluded.sample_message,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.products (id, name, mode, price_krw, turn_limit, valid_for, description, sort_order)
values
  ('trial_3_turns', '무료 상담 체험', 'trial', 0, 3, interval '1 day', '상담사 한 명과 고민의 핵심을 가볍게 잡습니다.', 10),
  ('basic_10_turns', '기본 상담', 'basic', 4900, 10, interval '7 days', '대화 전체를 바탕으로 선택지와 짧은 요약을 제공합니다.', 20),
  ('pro_20_turns', '프로 상담', 'pro', 14900, 20, interval '7 days', '고민 구조화, 상반 근거 검토, 행동 계획까지 깊게 정리합니다.', 30)
on conflict (id) do update
set name = excluded.name,
    mode = excluded.mode,
    price_krw = excluded.price_krw,
    turn_limit = excluded.turn_limit,
    valid_for = excluded.valid_for,
    description = excluded.description,
    sort_order = excluded.sort_order,
    updated_at = now();
