-- BookCircle: putting a book on a shelf
-- One function that updates the shelf and the reading diary together.
--
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

-- ---------------------------------------------------------------------------
-- set_shelf_status: put a book on a shelf (adding it if it's new), and keep
-- the reading diary in step:
--
--   want_to_read → drops any unfinished read (you haven't started after all)
--   reading      → starts a read today, unless one is already open
--   read         → finishes the open read today, or logs a finished read
--
-- A function runs as one transaction: if any part fails, none of it is saved,
-- so the shelf and the diary can't end up disagreeing.
--
-- `security invoker` (the default) runs it as the signed-in reader, so the
-- Row Level Security policies still apply: it can only touch their own rows.
-- ---------------------------------------------------------------------------
create function public.set_shelf_status(
  p_book_id text,
  p_title text,
  p_authors text[],
  p_cover_id integer,
  p_status public.shelf_status
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
    values (p_book_id, current_date)
    -- The one-open-read-per-book index makes this skip if one is open.
    on conflict (user_id, book_id) where finished_on is null do nothing;

  elsif p_status = 'read' then
    update public.reading_sessions
    set finished_on = current_date
    where user_id = auth.uid() and book_id = p_book_id and finished_on is null;

    -- No open read to finish (went straight to "read"): log one anyway, so
    -- it shows in the diary and counts toward the yearly goal.
    if not found then
      insert into public.reading_sessions (book_id, finished_on)
      values (p_book_id, current_date);
    end if;
  end if;
end;
$$;

-- Only signed-in readers may call it.
revoke execute on function public.set_shelf_status(text, text, text[], integer, public.shelf_status)
  from public, anon;
grant execute on function public.set_shelf_status(text, text, text[], integer, public.shelf_status)
  to authenticated;
