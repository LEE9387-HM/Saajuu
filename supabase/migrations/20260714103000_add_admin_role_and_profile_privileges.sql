alter table public.profiles
  add column if not exists role text not null default 'user',
  add constraint profiles_role_allowed check (role in ('user', 'admin'));

revoke update on public.profiles from authenticated;
grant update (display_name, marketing_opt_in) on public.profiles to authenticated;
