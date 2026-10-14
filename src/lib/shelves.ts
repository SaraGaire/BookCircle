import { createClient } from "@/lib/supabase/server";

// Must match the shelf_status enum in the reading migration.
export const SHELF_STATUSES = ["want_to_read", "reading", "read"] as const;
export type ShelfStatus = (typeof SHELF_STATUSES)[number];

export const SHELF_LABELS: Record<ShelfStatus, string> = {
  want_to_read: "Want to Read",
  reading: "Reading",
  read: "Read",
};

export function isShelfStatus(value: unknown): value is ShelfStatus {
  return SHELF_STATUSES.includes(value as ShelfStatus);
}

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
