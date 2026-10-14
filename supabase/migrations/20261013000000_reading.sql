-- BookCircle: reading features
-- Shelves, ratings, reviews, a reading diary (with re-reads), and yearly goals.
--
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

-- ---------------------------------------------------------------------------
-- Shelf status: the three shelves a book can be on.
-- ---------------------------------------------------------------------------
create type public.shelf_status as enum ('want_to_read', 'reading', 'read');

-- ---------------------------------------------------------------------------
-- user_books: one row per (reader, book). Holds the shelf, rating, and review.
-- ---------------------------------------------------------------------------
create table public.user_books (
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  -- Open Library work ID, e.g. 'OL82563W'
  book_id text not null check (book_id ~ '^OL[0-9]+W$'),

  -- Copied from Open Library when the book is first shelved, so the shelves
  -- page can show titles and covers without calling Open Library per book.
  title text not null check (char_length(title) between 1 and 500),
  authors text[] not null default '{}',
  cover_id integer,

  status public.shelf_status not null,
  -- Half-star ratings stored as whole numbers: 1 = ½ star ... 10 = 5 stars.
  rating smallint check (rating between 1 and 10),
  review text check (char_length(review) <= 10000),
  review_has_spoilers boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (user_id, book_id)
);

create index user_books_user_status_idx
  on public.user_books (user_id, status, updated_at desc);

-- ---------------------------------------------------------------------------
-- reading_sessions: each time someone reads a book (re-reads add more rows).
-- Finished sessions make up the reading diary and count toward the goal.
-- ---------------------------------------------------------------------------
create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  book_id text not null,
  started_on date,
  finished_on date,
  created_at timestamptz not null default now(),

  -- Removing a book from your shelves also removes its diary entries.
  foreign key (user_id, book_id)
    references public.user_books (user_id, book_id) on delete cascade,
  check (finished_on is null or started_on is null or finished_on >= started_on)
);

create index reading_sessions_user_finished_idx
  on public.reading_sessions (user_id, finished_on desc);

-- A reader can only have one unfinished read of the same book at a time.
create unique index reading_sessions_one_open_idx
  on public.reading_sessions (user_id, book_id)
  where finished_on is null;

-- ---------------------------------------------------------------------------
-- reading_goals: "Read N books in YEAR".
-- ---------------------------------------------------------------------------
create table public.reading_goals (
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  year smallint not null check (year between 2000 and 2100),
  target smallint not null check (target between 1 and 1000),
  primary key (user_id, year)
);

-- ---------------------------------------------------------------------------
-- Keep user_books.updated_at current.
-- `create or replace` because the profiles migration defines this function
-- too; this way the two migrations can run in either order.
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

create trigger user_books_set_updated_at
  before update on public.user_books
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: the database itself enforces that people can only
-- see and change their own rows, even if a bug in our app tried otherwise.
-- (When we add public profiles, we'll loosen "see" for public shelves.)
-- ---------------------------------------------------------------------------
alter table public.user_books enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.reading_goals enable row level security;

create policy "Readers manage their own books"
  on public.user_books for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Readers manage their own reading sessions"
  on public.reading_sessions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Readers manage their own goals"
  on public.reading_goals for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Signed-in users may use these tables (still limited by the policies above).
grant select, insert, update, delete on public.user_books to authenticated;
grant select, insert, update, delete on public.reading_sessions to authenticated;
grant select, insert, update, delete on public.reading_goals to authenticated;
