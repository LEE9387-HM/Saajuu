-- Harden initial schema after Supabase database advisor review.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "analytics_events_insert_minimal" on public.analytics_events;

create policy "analytics_events_insert_minimal" on public.analytics_events
  for insert to anon, authenticated
  with check (
    event_name ~ '^[a-z0-9_:-]{1,80}$'
    and jsonb_typeof(event_properties) = 'object'
    and not (event_properties ? 'birth_date')
    and not (event_properties ? 'birthDate')
    and not (event_properties ? 'birth_time')
    and not (event_properties ? 'birthTime')
    and not (event_properties ? 'name')
    and not (event_properties ? 'display_name')
    and not (event_properties ? 'concern')
    and not (event_properties ? 'message')
    and not (event_properties ? 'content')
  );

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
