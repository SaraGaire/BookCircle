import Link from "next/link";
import { BookCover } from "@/components/book-cover";
import type { BookSummary } from "@/lib/open-library";

export function BookCard({ book }: { book: BookSummary }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="group flex flex-col gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <BookCover
        coverId={book.coverId}
        title={book.title}
        className="transition-opacity group-hover:opacity-90"
      />
      <div className="space-y-0.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline">
          {book.title}
        </h3>
        {book.authors.length > 0 && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {book.authors.join(", ")}
          </p>
        )}
        {book.firstPublishYear && (
          <p className="text-xs text-muted-foreground">
            {book.firstPublishYear}
          </p>
        )}
      </div>
    </Link>
  );
}
