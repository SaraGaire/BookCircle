"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Trash2, TriangleAlert } from "lucide-react";
import {
  deleteReview,
  saveReview,
  type ReviewFormState,
} from "@/app/shelves/actions";
import { badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { localToday } from "@/lib/dates";
import { MAX_REVIEW_LENGTH } from "@/lib/rating";

type ReviewSectionProps = {
  bookId: string;
  /** The saved review, or null if there isn't one. */
  review: string | null;
  hasSpoilers: boolean;
};

const initialState: ReviewFormState = {};

/** The signed-in reader's own review: shows it, or lets them write one. */
export function ReviewSection({ bookId, review, hasSpoilers }: ReviewSectionProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, saving] = useActionState(
    saveReview.bind(null, bookId),
    initialState,
  );
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // When a save succeeds, close the form. This runs during render (not in an
  // effect) by remembering which result we last handled, as the React docs
  // suggest for adjusting state when something changes.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.saved) setEditing(false);
  }

  function handleDelete() {
    if (!window.confirm("Delete your review? Your rating stays.")) return;
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteReview(bookId);
      if (result.error) setDeleteError(result.error);
    });
  }

  // Adds the reader's date as the form is sent, in case saving the review
  // also puts the book on their Read shelf (and so in their diary).
  function submit(formData: FormData) {
    formData.set("today", localToday());
    formAction(formData);
  }

  if (editing) {
    return (
      <form action={submit} className="space-y-3">
        <label htmlFor="review" className="text-sm font-medium">
          Your review
        </label>
        {/* Styled to match <Input>; shadcn's Textarea isn't installed. */}
        <textarea
          id="review"
          name="review"
          rows={6}
          maxLength={MAX_REVIEW_LENGTH}
          defaultValue={review ?? ""}
          placeholder="What did you think?"
          required
          autoFocus
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
        <div className="flex items-center gap-2">
          <input
            id="hasSpoilers"
            name="hasSpoilers"
            type="checkbox"
            defaultChecked={hasSpoilers}
            className="size-4 shrink-0 accent-primary"
          />
          <label htmlFor="hasSpoilers" className="text-sm">
            Contains spoilers
          </label>
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save review"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (!review) {
    return (
      <Button variant="outline" onClick={() => setEditing(true)}>
        <Pencil aria-hidden="true" />
        Write a review
      </Button>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium">Your review</h2>
        {hasSpoilers && (
          <span className={badgeVariants({ variant: "secondary" })}>
            <TriangleAlert aria-hidden="true" />
            Spoilers
          </span>
        )}
      </div>
      <p className="mt-2 max-w-prose whitespace-pre-line leading-relaxed">
        {review}
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={deleting}
          onClick={() => setEditing(true)}
        >
          <Pencil aria-hidden="true" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={deleting}
          onClick={handleDelete}
        >
          <Trash2 aria-hidden="true" />
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
      {deleteError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {deleteError}
        </p>
      )}
    </div>
  );
}
