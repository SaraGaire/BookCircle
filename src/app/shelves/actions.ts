"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getBook } from "@/lib/open-library";
import { isRating, MAX_REVIEW_LENGTH } from "@/lib/rating";
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

  const error = await putOnShelf(bookId, status);
  if (error) return { error };

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

/** Rates a book (1–10 half stars), or clears the rating with `null`. */
export async function setRating(
  bookId: string,
  rating: number | null,
): Promise<ShelfActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to rate books." };
  if (rating !== null && !isRating(rating)) {
    return { error: "Ratings are from ½ to 5 stars." };
  }

  // Rating a book you haven't shelved counts as having read it.
  if (rating !== null) {
    const error = await shelveIfNeeded(user.id, bookId);
    if (error) return { error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_books")
    .update({ rating })
    .eq("user_id", user.id)
    .eq("book_id", bookId);
  if (error) {
    console.error("setRating failed:", error);
    return { error: "We couldn’t save your rating. Please try again." };
  }

  refresh();
  return {};
}

export type ReviewFormState = {
  error?: string;
  /** True once the review is saved, so the form can close itself. */
  saved?: boolean;
};

/**
 * Saves the review form. Used with useActionState, with the book ID bound
 * in first: saveReview.bind(null, bookId).
 */
export async function saveReview(
  bookId: string,
  _prevState: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session ended. Sign in again to save." };

  const review = String(formData.get("review") ?? "").trim();
  // An unticked checkbox isn't sent at all, so "present" means ticked.
  const hasSpoilers = formData.get("hasSpoilers") === "on";

  if (!review) return { error: "Write something before saving." };
  if (review.length > MAX_REVIEW_LENGTH) {
    return {
      error: `Reviews are at most ${MAX_REVIEW_LENGTH.toLocaleString("en")} characters.`,
    };
  }

  // Reviewing a book you haven't shelved counts as having read it.
  const shelveError = await shelveIfNeeded(user.id, bookId);
  if (shelveError) return { error: shelveError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_books")
    .update({ review, review_has_spoilers: hasSpoilers })
    .eq("user_id", user.id)
    .eq("book_id", bookId);
  if (error) {
    console.error("saveReview failed:", error);
    return { error: "We couldn’t save your review. Please try again." };
  }

  refresh();
  return { saved: true };
}

export async function deleteReview(bookId: string): Promise<ShelfActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to manage your reviews." };

  // The book stays on its shelf (and keeps its rating); only the text goes.
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_books")
    .update({ review: null, review_has_spoilers: false })
    .eq("user_id", user.id)
    .eq("book_id", bookId);
  if (error) {
    console.error("deleteReview failed:", error);
    return { error: "We couldn’t delete your review. Please try again." };
  }

  refresh();
  return {};
}

/**
 * Puts a book on a shelf via the set_shelf_status database function, which
 * also keeps the reading diary in step. Returns an error message, or null.
 */
async function putOnShelf(
  bookId: string,
  status: ShelfStatus,
): Promise<string | null> {
  // Look the book up ourselves rather than trusting a title sent from the
  // browser. getBook is cached, so this is usually instant.
  const book = await getBook(bookId).catch(() => null);
  if (!book) return "We couldn’t find that book.";

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
    return "We couldn’t update your shelf. Please try again.";
  }
  return null;
}

/**
 * Ratings and reviews live on the book's shelf row, so a book has to be on a
 * shelf first. If it isn't on any, this puts it on "Read". Books already on a
 * shelf stay where they are.
 */
async function shelveIfNeeded(
  userId: string,
  bookId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_books")
    .select("status")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();
  if (error) {
    console.error("shelveIfNeeded failed:", error);
    return "We couldn’t update your shelf. Please try again.";
  }
  if (data) return null;
  return putOnShelf(bookId, "read");
}
