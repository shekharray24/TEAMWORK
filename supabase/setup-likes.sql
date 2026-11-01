-- Run this once in Supabase Dashboard -> SQL Editor.
-- Stores a single global TEAMWORK count and one salted hash per browser ID.
create table if not exists public.site_likes (
  id text primary key,
  count bigint not null default 0
);

insert into public.site_likes (id, count)
values ('teamwork', 0)
on conflict (id) do nothing;

create table if not exists public.site_like_voters (
  voter_hash text primary key,
  created_at timestamptz not null default now()
);

alter table public.site_likes enable row level security;
alter table public.site_like_voters enable row level security;

create or replace function public.increment_teamwork_likes(p_voter_hash text)
returns table(like_count bigint, added boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_vote boolean := false;
  current_count bigint;
begin
  insert into public.site_like_voters (voter_hash)
  values (p_voter_hash)
  on conflict (voter_hash) do nothing;

  new_vote := found;

  if new_vote then
    update public.site_likes
      set count = count + 1
      where id = 'teamwork';
  end if;

  select count into current_count
  from public.site_likes
  where id = 'teamwork';

  return query select current_count, new_vote;
end;
$$;

-- Only the server-side Netlify function (service role) may call the function.
revoke all on function public.increment_teamwork_likes(text) from public, anon, authenticated;
grant execute on function public.increment_teamwork_likes(text) to service_role;
grant select on public.site_likes to service_role;
