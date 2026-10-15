"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getBook } from "@/lib/open-library";
import { isShelfStatus, type ShelfStatus } from "@/lib/shelf-status";
import { createClient } from "@/lib/supabase/server";

export type ShelfActionResult = { error?: string };

export async function setShelfStatus(
  bookId: string,
  status: ShelfStatus,
): Promise<ShelfActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to use shelves." };
  // Anyone can call a Server Action with any values, so check them here.
  if (!isShelfStatus(status)) return { error: "That isn't a shelf." };

  // Look the book up ourselves rather than trusting a title sent from the
  // browser. getBook is cached, so this is usually instant.
  const book = await getBook(bookId).catch(() => null);
  if (!book) return { error: "We couldn’t find that book." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_shelf_status", {
    p_book_id: book.id,
    p_title: book.title,
    p_authors: book.authors,
    p_cover_id: book.coverId,
    p_status: status,
  });
  if (error) {
    // Readers see a friendly message; the details go to the server log.
    console.error("set_shelf_status failed:", error);
    return { error: "We couldn’t update your shelf. Please try again." };
  }

  refresh();
  return {};
}

export async function removeFromShelves(
  bookId: string,
): Promise<ShelfActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to use shelves." };

  // Also deletes the book's diary entries (the foreign key cascades).
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("user_id", user.id)
    .eq("book_id", bookId);
  if (error) {
    console.error("removeFromShelves failed:", error);
    return { error: "We couldn’t remove this book. Please try again." };
  }

  refresh();
  return {};
}
