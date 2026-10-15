"use client";

import { useState, useTransition } from "react";
import { BookmarkPlus, Check, ChevronDown, Trash2 } from "lucide-react";
import {
  removeFromShelves,
  setShelfStatus,
  type ShelfActionResult,
} from "@/app/shelves/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SHELF_LABELS, SHELF_STATUSES, type ShelfStatus } from "@/lib/shelf-status";

type ShelfButtonProps = {
  bookId: string;
  /** The shelf the book is on now, or null if it's on none. */
  status: ShelfStatus | null;
};

export function ShelfButton({ bookId, status }: ShelfButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ShelfActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          className={buttonVariants({
            variant: status ? "outline" : "default",
            size: "lg",
          })}
        >
          {status ? <Check aria-hidden="true" /> : <BookmarkPlus aria-hidden="true" />}
          {pending ? "Saving…" : status ? SHELF_LABELS[status] : "Add to shelf"}
          <ChevronDown aria-hidden="true" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-48">
          {SHELF_STATUSES.map((shelf) => (
            <DropdownMenuItem
              key={shelf}
              onClick={() => run(() => setShelfStatus(bookId, shelf))}
            >
              {/* An empty space keeps the labels lined up. */}
              {shelf === status ? <Check aria-hidden="true" /> : <span className="size-4" />}
              {SHELF_LABELS[shelf]}
            </DropdownMenuItem>
          ))}
          {status && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => run(() => removeFromShelves(bookId))}
              >
                <Trash2 aria-hidden="true" />
                Remove from shelves
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
