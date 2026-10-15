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
