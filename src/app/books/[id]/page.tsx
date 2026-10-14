import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { ShelfButton } from "@/components/shelf-button";
import { badgeVariants } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getBook } from "@/lib/open-library";
import { getShelfStatus } from "@/lib/shelves";

export async function generateMetadata({
  params,
}: PageProps<"/books/[id]">): Promise<Metadata> {
  const { id } = await params;
  const book = await getBook(id).catch(() => null);
  if (!book) return { title: "Book not found" };
  return {
    title: book.title,
    description: book.description?.slice(0, 160),
  };
}

export default function BookPage({ params }: PageProps<"/books/[id]">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to search
      </Link>
      {/* The book ID comes from the URL, which is only known per request. */}
      <Suspense fallback={<BookSkeleton />}>
        <BookDetails params={params} />
      </Suspense>
    </div>
  );
}

async function BookDetails({ params }: Pick<PageProps<"/books/[id]">, "params">) {
  const { id } = await params;

  let book;
  try {
    book = await getBook(id);
  } catch {
    return (
      <p role="alert" className="mt-8 text-sm text-destructive">
        We couldn’t load this book from Open Library right now. Please try again
        in a moment.
      </p>
    );
  }
  if (!book) notFound();

  return (
    <article className="mt-6 grid gap-8 sm:grid-cols-[200px_1fr]">
      <BookCover
        coverId={book.coverId}
        title={book.title}
        size="L"
        className="mx-auto max-w-[200px] shadow-sm"
      />
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {book.title}
        </h1>
        {book.authors.length > 0 && (
          <p className="mt-2 text-lg text-muted-foreground">
            by {book.authors.join(", ")}
          </p>
        )}
        {book.firstPublished && (
          <p className="mt-1 text-sm text-muted-foreground">
            First published {book.firstPublished}
          </p>
        )}

        <div className="mt-6">
          {/* Who's signed in is only known per request, so the button streams
              in after the rest of the book details. */}
          <Suspense fallback={<div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />}>
            <ShelfControl bookId={book.id} />
          </Suspense>
        </div>

        <div className="mt-6 max-w-prose whitespace-pre-line leading-relaxed">
          {book.description ?? (
            <span className="text-muted-foreground">
              No description available yet.
            </span>
          )}
        </div>

        {book.subjects.length > 0 && (
          <section aria-labelledby="subjects-heading" className="mt-8">
            <h2 id="subjects-heading" className="text-sm font-medium">
              Subjects
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {book.subjects.map((subject) => (
                <li
                  key={subject}
                  className={badgeVariants({ variant: "secondary" })}
                >
                  {subject}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}

async function ShelfControl({ bookId }: { bookId: string }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link
        href={`/sign-in?next=${encodeURIComponent(`/books/${bookId}`)}`}
        className={buttonVariants({ variant: "outline", size: "lg" })}
      >
        Sign in to add to your shelves
      </Link>
    );
  }

  const status = await getShelfStatus(user.id, bookId).catch(() => null);
  return <ShelfButton bookId={bookId} status={status} />;
}

function BookSkeleton() {
  return (
    <div className="mt-6 grid gap-8 sm:grid-cols-[200px_1fr]" aria-busy="true">
      <p className="sr-only">Loading book…</p>
      <div className="mx-auto aspect-[2/3] w-full max-w-[200px] animate-pulse rounded-md bg-muted" />
      <div className="space-y-3">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
