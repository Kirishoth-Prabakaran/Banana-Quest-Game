-- Banana Quest shared database setup
-- Run these steps in order in the Supabase SQL Editor.
-- Account passwords are stored and verified only by Supabase Auth; never add
-- plaintext passwords or password hashes to the game tables.

-- Step 1: Create one minimal game profile for each Supabase Auth user.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null default 'Banana Explorer'
    check (
      nickname = btrim(nickname)
      and char_length(nickname) between 2 and 20
      and nickname !~ '[^[:alnum:] _-]'
    ),
  created_at timestamptz not null default now()
);

-- Step 2: Create the registration table and a sequence for public player IDs.
-- IDs are generated in order as Player001, Player002, Player003, and so on.
create sequence if not exists public.register_player_id_seq
  as bigint
  start with 1
  increment by 1
  minvalue 1
  no cycle;

create or replace function public.generate_player_id()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  next_player_number bigint;
  player_number_text text;
begin
  next_player_number := nextval('public.register_player_id_seq'::regclass);
  player_number_text := next_player_number::text;

  return 'Player' || lpad(
    player_number_text,
    greatest(3, char_length(player_number_text)),
    '0'
  );
end;
$$;

create table if not exists public.register (
  player_id text primary key default public.generate_player_id(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  nickname text not null
    check (
      nickname = btrim(nickname)
      and char_length(nickname) between 2 and 20
      and nickname !~ '[^[:alnum:] _-]'
    ),
  email text,
  created_at timestamptz not null default now()
);

-- Step 3: Create the profile and registration records whenever Auth creates a user.
-- The nickname comes from signup metadata and is checked before it is stored.
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_nickname text;
begin
  safe_nickname := btrim(coalesce(new.raw_user_meta_data ->> 'nickname', ''));

  if char_length(safe_nickname) not between 2 and 20
    or safe_nickname ~ '[^[:alnum:] _-]' then
    safe_nickname := 'Banana Explorer';
  end if;

  insert into public.profiles (id, nickname)
  values (new.id, safe_nickname)
  on conflict (id) do nothing;

  insert into public.register (auth_user_id, nickname, email)
  values (new.id, safe_nickname, nullif(lower(btrim(new.email)), ''))
  on conflict (auth_user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

-- Step 4: Backfill profiles and registration rows for accounts created before
-- this SQL was applied. Existing users receive IDs in account-creation order.
insert into public.profiles (id, nickname)
select
  users.id,
  case
    when char_length(btrim(coalesce(users.raw_user_meta_data ->> 'nickname', '')))
      between 2 and 20
      and btrim(coalesce(users.raw_user_meta_data ->> 'nickname', ''))
        !~ '[^[:alnum:] _-]'
      then btrim(users.raw_user_meta_data ->> 'nickname')
    else 'Banana Explorer'
  end
from auth.users as users
on conflict (id) do nothing;

insert into public.register (auth_user_id, nickname, email)
select
  users.id,
  case
    when char_length(btrim(coalesce(users.raw_user_meta_data ->> 'nickname', '')))
      between 2 and 20
      and btrim(coalesce(users.raw_user_meta_data ->> 'nickname', ''))
        !~ '[^[:alnum:] _-]'
      then btrim(users.raw_user_meta_data ->> 'nickname')
    else 'Banana Explorer'
  end,
  nullif(lower(btrim(users.email)), '')
from auth.users as users
order by users.created_at, users.id
on conflict (auth_user_id) do nothing;

-- Step 5: Let each signed-in player read their own profile and change only
-- their nickname. Registration rows are read-only to clients.
alter table public.profiles enable row level security;
alter table public.register enable row level security;

drop policy if exists "Players can read their own profile" on public.profiles;
create policy "Players can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Players can update their own nickname" on public.profiles;
create policy "Players can update their own nickname"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Players can read their own registration" on public.register;
create policy "Players can read their own registration"
  on public.register
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id);

-- Step 6: Grant only the client permissions required by the game.
grant select on table public.profiles to authenticated;
revoke update on table public.profiles from authenticated;
grant update (nickname) on table public.profiles to authenticated;

revoke all on table public.register from anon, authenticated;
grant select on table public.register to authenticated;
revoke all on sequence public.register_player_id_seq from public, anon, authenticated;
revoke all on function public.generate_player_id() from public, anon, authenticated;
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
