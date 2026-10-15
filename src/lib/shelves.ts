import type { ShelfStatus } from "@/lib/shelf-status";
import { createClient } from "@/lib/supabase/server";

/** Which shelf a reader has a book on, or `null` if it's not on any. */
export async function getShelfStatus(
  userId: string,
  bookId: string,
): Promise<ShelfStatus | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_books")
    .select("status")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load shelf: ${error.message}`);
  return data?.status ?? null;
}

export type ShelfBook = {
  /** Open Library work ID, e.g. "OL82563W". */
  id: string;
  title: string;
  authors: string[];
  coverId: number | null;
  status: ShelfStatus;
};

/** Every book on a reader's shelves, most recently changed first. */
export async function getShelfBooks(userId: string): Promise<ShelfBook[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_books")
    .select("book_id, title, authors, cover_id, status")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Couldn't load shelves: ${error.message}`);

  return data.map((row) => ({
    id: row.book_id,
    title: row.title,
    authors: row.authors,
    coverId: row.cover_id,
    status: row.status,
  }));
}
