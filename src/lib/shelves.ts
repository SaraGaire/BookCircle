import type { ShelfStatus } from "@/lib/shelf-status";
import { createClient } from "@/lib/supabase/server";

export type UserBook = {
  status: ShelfStatus;
  /** 1–10, in half stars; null if not rated. */
  rating: number | null;
  review: string | null;
  reviewHasSpoilers: boolean;
};

/**
 * A reader's shelf, rating, and review for one book, or `null` if the book
 * isn't on any of their shelves.
 */
export async function getUserBook(
  userId: string,
  bookId: string,
): Promise<UserBook | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_books")
    .select("status, rating, review, review_has_spoilers")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load shelf: ${error.message}`);
  if (!data) return null;

  return {
    status: data.status,
    rating: data.rating,
    review: data.review,
    reviewHasSpoilers: data.review_has_spoilers,
  };
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
