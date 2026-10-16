-- BookCircle: use the reader's own date in the reading diary
--
-- set_shelf_status used to stamp diary entries with `current_date`, which is
-- the date in UTC on the database server. For a reader in New York after 8pm,
-- that's already tomorrow. Now the app passes the reader's own date as
-- p_today; if it's left out, the function falls back to `current_date`.
--
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

-- Postgres identifies a function by its name *and* its inputs, so adding an
-- input makes a new function. Remove the old one so only one version exists.
drop function public.set_shelf_status(text, text, text[], integer, public.shelf_status);

create function public.set_shelf_status(
  p_book_id text,
  p_title text,
  p_authors text[],
  p_cover_id integer,
  p_status public.shelf_status,
  p_today date default current_date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  old_status public.shelf_status;
begin
  select status into old_status
  from public.user_books
  where user_id = auth.uid() and book_id = p_book_id;

  -- Already on this shelf: nothing to do (and no duplicate diary entry).
  if old_status = p_status then
    return;
  end if;

  if old_status is null then
    -- First time shelving this book: save its details from Open Library.
    insert into public.user_books (book_id, title, authors, cover_id, status)
    values (p_book_id, p_title, p_authors, p_cover_id, p_status);
  else
    update public.user_books
    set status = p_status
    where user_id = auth.uid() and book_id = p_book_id;
  end if;

  if p_status = 'want_to_read' then
    delete from public.reading_sessions
    where user_id = auth.uid() and book_id = p_book_id and finished_on is null;

  elsif p_status = 'reading' then
    insert into public.reading_sessions (book_id, started_on)
    values (p_book_id, p_today)
    -- The one-open-read-per-book index makes this skip if one is open.
    on conflict (user_id, book_id) where finished_on is null do nothing;

  elsif p_status = 'read' then
    -- greatest() keeps the finish date from landing before the start date
    -- (the table's check would reject that).
    update public.reading_sessions
    set finished_on = greatest(p_today, coalesce(started_on, p_today))
    where user_id = auth.uid() and book_id = p_book_id and finished_on is null;

    -- No open read to finish (went straight to "read"): log one anyway, so
    -- it shows in the diary and counts toward the yearly goal.
    if not found then
      insert into public.reading_sessions (book_id, finished_on)
      values (p_book_id, p_today);
    end if;
  end if;
end;
$$;

-- Only signed-in readers may call it.
revoke execute on function public.set_shelf_status(text, text, text[], integer, public.shelf_status, date)
  from public, anon;
grant execute on function public.set_shelf_status(text, text, text[], integer, public.shelf_status, date)
  to authenticated;

-- Tell Supabase's API to pick up the new function straight away.
notify pgrst, 'reload schema';
