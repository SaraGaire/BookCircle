import { createClient } from "@/lib/supabase/server";

export type DiaryEntry = {
  /** reading_sessions.id: one finished read of a book. */
  id: string;
  bookId: string;
  title: string;
  authors: string[];
  coverId: number | null;
  /** 1–10 in half stars; null if not rated. */
  rating: number | null;
  /** Dates as "YYYY-MM-DD". */
  startedOn: string | null;
  finishedOn: string;
  /** True if the reader had already finished this book before this read. */
  isReread: boolean;
};

// The book details embedded in each reading_sessions row (see below).
type EmbeddedBook = {
  title: string;
  authors: string[];
  cover_id: number | null;
  rating: number | null;
};

/** Every book a reader has finished, newest first. */
export async function getDiaryEntries(userId: string): Promise<DiaryEntry[]> {
  const supabase = await createClient();
  // `user_books(...)` pulls in each read's book details in the same request,
  // following the foreign key from reading_sessions to user_books.
  const { data, error } = await supabase
    .from("reading_sessions")
    .select(
      "id, book_id, started_on, finished_on, created_at, user_books(title, authors, cover_id, rating)",
    )
    .eq("user_id", userId)
    .not("finished_on", "is", null)
    // Oldest first, so we can spot re-reads as we go.
    .order("finished_on", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Couldn't load diary: ${error.message}`);

  const finishedBefore = new Set<string>();
  const entries: DiaryEntry[] = data.map((row) => {
    // Each read belongs to exactly one book, so Supabase returns an object
    // here. Without generated database types it can't know that and guesses
    // an array, so we tell TypeScript what we actually get.
    const book = row.user_books as unknown as EmbeddedBook;
    const isReread = finishedBefore.has(row.book_id);
    finishedBefore.add(row.book_id);
    return {
      id: row.id,
      bookId: row.book_id,
      title: book.title,
      authors: book.authors,
      coverId: book.cover_id,
      rating: book.rating,
      startedOn: row.started_on,
      finishedOn: row.finished_on,
      isReread,
    };
  });

  return entries.reverse();
}

/** The reader's goal for a year (number of books), or null if none is set. */
export async function getReadingGoal(
  userId: string,
  year: number,
): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_goals")
    .select("target")
    .eq("user_id", userId)
    .eq("year", year)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load goal: ${error.message}`);
  return data?.target ?? null;
}
