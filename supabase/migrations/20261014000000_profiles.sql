-- BookCircle: reader profiles
-- One public profile per account: username, display name, bio, avatar, and a
-- privacy switch. A profile is created automatically when someone signs up.
--
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

-- ---------------------------------------------------------------------------
-- profiles: one row per account, sharing the account's id.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  -- Used in profile URLs (/u/username), so it's lowercase letters, numbers,
  -- and underscores only. Storing it lowercase makes "Sara" and "sara" the
  -- same name, so nobody can register a look-alike.
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) between 1 and 50),
  bio text check (char_length(bio) <= 300),
  avatar_url text check (char_length(avatar_url) <= 500),

  -- Private readers still have a profile page (so links to them work), but
  -- their shelves, ratings, and reviews are hidden from everyone else.
  is_private boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Keep profiles.updated_at current.
-- `create or replace` because the reading migration defines this function too;
-- this way the two migrations can run in either order.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Create a profile whenever a new account is created.
--
-- The sign-up form sends the chosen username along as account metadata. If
-- it's missing, malformed, or already taken, we fall back to a placeholder
-- like "reader_3f9a1c2b7d4e" the reader can change later, so a username
-- problem never makes sign-up itself fail.
--
-- `security definer` runs this as the function's owner, because the new user
-- isn't signed in yet and couldn't insert the row themselves.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := lower(new.raw_user_meta_data ->> 'username');
begin
  if wanted ~ '^[a-z0-9_]{3,30}$' then
    begin
      insert into public.profiles (id, username) values (new.id, wanted);
      return new;
    exception when unique_violation then
      -- Someone already has that name; use the placeholder below instead.
    end;
  end if;

  insert into public.profiles (id, username)
  values (new.id, 'reader_' || substr(replace(new.id::text, '-', ''), 1, 12));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only the trigger should run this function, never a website visitor.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Accounts that existed before this migration get a placeholder profile.
insert into public.profiles (id, username)
select id, 'reader_' || substr(replace(id::text, '-', ''), 1, 12)
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security.
-- Anyone (even signed-out visitors) can view profiles, so profile links can
-- be shared. Only the owner can edit theirs. There are no insert or delete
-- policies: the trigger above creates profiles, and deleting an account
-- deletes its profile.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select to anon, authenticated
  using (true);

create policy "Readers update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Start from no access, then allow exactly what the app needs. Readers can
-- only change these columns; id and the timestamps are off-limits.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, bio, avatar_url, is_private)
  on public.profiles to authenticated;
