"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { setRating } from "@/app/shelves/actions";
import { Button } from "@/components/ui/button";
import { describeRating } from "@/lib/rating";

type StarRatingProps = {
  bookId: string;
  /** The saved rating, 1–10 in half stars, or null if not rated. */
  rating: number | null;
};

// Five stars, each with a half: matches the 1–10 scale in lib/rating.ts.
const STARS = [1, 2, 3, 4, 5];

export function StarRating({ bookId, rating }: StarRatingProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Shows the new rating right away, before the server has saved it. If
  // saving fails, it goes back to `rating` when the transition ends.
  const [optimisticRating, setOptimisticRating] = useOptimistic(rating);
  // The rating under the mouse (or keyboard focus), previewed before a click.
  const [preview, setPreview] = useState<number | null>(null);

  const shown = preview ?? optimisticRating ?? 0;

  function save(value: number | null) {
    setError(null);
    startTransition(async () => {
      setOptimisticRating(value);
      const result = await setRating(bookId, value);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          role="group"
          aria-label="Your rating"
          className="flex"
          onMouseLeave={() => setPreview(null)}
        >
          {STARS.map((star) => {
            // How much of this star is filled: 0, 1 (half), or 2 (full).
            const fill = Math.min(Math.max(shown - (star - 1) * 2, 0), 2);
            const half = star * 2 - 1;
            const full = star * 2;
            return (
              <span key={star} className="relative size-8">
                <Star
                  className="size-8 text-muted-foreground/40"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fill * 50}%` }}
                >
                  <Star
                    className="size-8 fill-amber-400 text-amber-400"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
                {/* Two invisible buttons per star: the left half and the
                    right half, so you can give ½ stars. */}
                {[half, full].map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={pending}
                    aria-label={`Rate ${describeRating(value)}`}
                    aria-pressed={value === optimisticRating}
                    onClick={() => save(value)}
                    onMouseEnter={() => setPreview(value)}
                    onFocus={() => setPreview(value)}
                    onBlur={() => setPreview(null)}
                    className={
                      value === half
                        ? "absolute inset-y-0 left-0 w-1/2 rounded-l-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        : "absolute inset-y-0 right-0 w-1/2 rounded-r-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    }
                  />
                ))}
              </span>
            );
          })}
        </div>

        <span className="text-sm text-muted-foreground" aria-live="polite">
          {shown > 0 ? describeRating(shown) : "Not rated"}
        </span>

        {optimisticRating !== null && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => save(null)}
          >
            Clear
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

