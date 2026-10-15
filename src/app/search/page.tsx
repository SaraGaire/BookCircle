import { Suspense } from "react";
import type { Metadata } from "next";
import { BookCard } from "@/components/book-card";
import { SearchForm } from "@/components/search-form";
import { searchBooks } from "@/lib/open-library";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Search books
      </h1>
      <p className="mt-2 text-muted-foreground">
        Find any book in the Open Library catalogue.
      </p>
      <div className="mt-6">
        {/* Reading searchParams depends on the request, so it sits inside
            Suspense; the heading above is prerendered and shows instantly. */}
        <Suspense fallback={<SearchForm />}>
          <SearchContent searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function SearchContent({
  searchParams,
}: Pick<PageProps<"/search">, "searchParams">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  return (
    <>
      <SearchForm key={`form:${query}`} defaultValue={query} />
      {query ? (
        // `key` makes the loading state show again for each new search.
        <Suspense key={`results:${query}`} fallback={<ResultsSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Try a title like “The Hobbit” or an author like “Toni Morrison”.
        </p>
      )}
    </>
  );
}

async function SearchResults({ query }: { query: string }) {
  let results;
  try {
    results = await searchBooks(query);
  } catch {
    return (
      <p role="alert" className="mt-8 text-sm text-destructive">
        We couldn’t reach Open Library right now. Please try again in a moment.
      </p>
    );
  }

  if (results.books.length === 0) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        No books found for “{query}”. Check the spelling or try fewer words.
      </p>
    );
  }

  return (
    <div className="mt-8">
      <p className="text-sm text-muted-foreground">
        Showing {results.books.length} of {results.total.toLocaleString("en")}{" "}
        results for “{query}”
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
        {results.books.map((book) => (
          <li key={book.id}>
            <BookCard book={book} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-8" aria-busy="true" aria-live="polite">
      <p className="sr-only">Searching…</p>
      <div className="h-5 w-48 animate-pulse rounded bg-muted" />
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i} className="space-y-2">
            <div className="aspect-[2/3] animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}
