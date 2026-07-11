-- Accept a relationship invite without exposing other users' invite rows.
-- The browser stores only the SHA-256 hash in relationship_invites; the raw
-- high-entropy token lives only in the shared URL fragment.

create or replace function public.accept_relationship_invite(invite_token text)
returns table (
  link_id uuid,
  relationship public.relationship_type,
  inviter_user_id uuid,
  invitee_user_id uuid,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := (select auth.uid());
  invite_record public.relationship_invites%rowtype;
  existing_link public.relationship_links%rowtype;
  token_hash text;
begin
  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if invite_token is null or length(trim(invite_token)) < 32 then
    raise exception 'Invalid invite token'
      using errcode = '22023';
  end if;

  token_hash := encode(digest(invite_token, 'sha256'), 'hex');

  select *
    into invite_record
    from public.relationship_invites
   where invite_token_hash = token_hash
   for update;

  if not found then
    raise exception 'Invite not found'
      using errcode = 'P0002';
  end if;

  if invite_record.inviter_user_id = current_user_id then
    raise exception 'Cannot accept your own invite'
      using errcode = '22023';
  end if;

  if invite_record.revoked_at is not null then
    raise exception 'Invite revoked'
      using errcode = '22023';
  end if;

  if invite_record.expires_at <= now() then
    raise exception 'Invite expired'
      using errcode = '22023';
  end if;

  if invite_record.accepted_at is not null then
    raise exception 'Invite already accepted'
      using errcode = '23505';
  end if;

  select *
    into existing_link
    from public.relationship_links
   where status = 'active'
     and relationship = invite_record.relationship
     and least(user_a_id, user_b_id) = least(invite_record.inviter_user_id, current_user_id)
     and greatest(user_a_id, user_b_id) = greatest(invite_record.inviter_user_id, current_user_id)
   limit 1;

  if found then
    update public.relationship_invites
       set accepted_at = now()
     where id = invite_record.id;

    return query
    select
      existing_link.id,
      existing_link.relationship,
      invite_record.inviter_user_id,
      current_user_id,
      coalesce(existing_link.accepted_at, existing_link.created_at);
    return;
  end if;

  insert into public.relationship_links (
    user_a_id,
    user_b_id,
    relationship,
    status,
    requested_by,
    accepted_at
  )
  values (
    invite_record.inviter_user_id,
    current_user_id,
    invite_record.relationship,
    'active',
    invite_record.inviter_user_id,
    now()
  )
  returning * into existing_link;

  update public.relationship_invites
     set accepted_at = now()
   where id = invite_record.id;

  return query
  select
    existing_link.id,
    existing_link.relationship,
    invite_record.inviter_user_id,
    current_user_id,
    existing_link.accepted_at;
end;
$$;

revoke execute on function public.accept_relationship_invite(text) from public;
revoke execute on function public.accept_relationship_invite(text) from anon;
grant execute on function public.accept_relationship_invite(text) to authenticated;
