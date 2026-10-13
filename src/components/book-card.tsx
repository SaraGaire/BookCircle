import { BookCover } from "@/components/book-cover";
import type { BookSummary } from "@/lib/open-library";

export function BookCard({ book }: { book: BookSummary }) {
  return (
    <article className="flex flex-col gap-2">
      <BookCover coverId={book.coverId} title={book.title} />
      <div className="space-y-0.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
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
    </article>
  );
}
