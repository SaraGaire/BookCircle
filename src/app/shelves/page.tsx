import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BookCard } from "@/components/book-card";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import {
  isShelfStatus,
  SHELF_LABELS,
  SHELF_STATUSES,
  type ShelfStatus,
} from "@/lib/shelf-status";
import { getShelfBooks, type ShelfBook } from "@/lib/shelves";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Shelves" };

// The shelf that opens when the URL doesn't pick one.
const DEFAULT_SHELF: ShelfStatus = "reading";

const EMPTY_MESSAGES: Record<ShelfStatus, string> = {
  want_to_read: "Books you’d like to read someday will show up here.",
  reading: "Nothing on the go. Books you start reading will show up here.",
  read: "Books you finish will show up here.",
};

export default function ShelvesPage({ searchParams }: PageProps<"/shelves">) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        My Shelves
      </h1>
      {/* Who's signed in and which shelf is picked are only known per
          request, so everything below the heading streams in. */}
      <Suspense fallback={<ShelvesSkeleton />}>
        <ShelvesContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ShelvesContent({
  searchParams,
}: Pick<PageProps<"/shelves">, "searchParams">) {
  // Visitors who aren't signed in are sent to /sign-in, then back here.
  const user = await requireUser("/shelves");
  const { shelf } = await searchParams;
  const current = isShelfStatus(shelf) ? shelf : DEFAULT_SHELF;

  let books: ShelfBook[];
  try {
    books = await getShelfBooks(user.id);
  } catch {
    return (
      <p role="alert" className="mt-8 text-sm text-destructive">
        We couldn’t load your shelves right now. Please try again in a moment.
      </p>
    );
  }

  const onShelf = books.filter((book) => book.status === current);

  return (
    <>
      <nav aria-label="Shelves" className="mt-6 border-b">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {SHELF_STATUSES.map((status) => {
            const count = books.filter((book) => book.status === status).length;
            const active = status === current;
            return (
              <li key={status}>
                <Link
                  href={`/shelves?shelf=${status}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {SHELF_LABELS[status]}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                    {count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <h2 className="sr-only">{SHELF_LABELS[current]}</h2>
      {onShelf.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            {EMPTY_MESSAGES[current]}
          </p>
          <Link
            href="/search"
            className={buttonVariants({ variant: "outline", className: "mt-4" })}
          >
            Find a book
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
          {onShelf.map((book) => (
            <li key={book.id}>
              {/* We don't store the publication year, so it's left out here. */}
              <BookCard book={{ ...book, firstPublishYear: null }} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ShelvesSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Loading your shelves…</p>
      <div className="mt-6 flex gap-4 border-b pb-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-6 w-28 animate-pulse rounded bg-muted" />
        ))}
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="space-y-2">
            <div className="aspect-[2/3] animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}
