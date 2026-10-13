import { cacheLife } from "next/cache";

// Open Library asks apps to identify themselves so they can contact us
// if our traffic causes problems: https://openlibrary.org/developers/api
const USER_AGENT = "BookCircle/0.1 (https://github.com/SaraGaire/BookCircle)";

const SEARCH_LIMIT = 24;

export type BookSummary = {
  /** Open Library work ID, e.g. "OL82563W". */
  id: string;
  title: string;
  authors: string[];
  firstPublishYear: number | null;
  coverId: number | null;
};

export type SearchResults = {
  books: BookSummary[];
  total: number;
};

// The subset of fields we ask Open Library for (see `fields` below).
type SearchDoc = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
};

type SearchResponse = {
  numFound: number;
  docs: SearchDoc[];
};

export async function searchBooks(query: string): Promise<SearchResults> {
  "use cache";
  cacheLife("hours");

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set(
    "fields",
    "key,title,author_name,first_publish_year,cover_i",
  );
  url.searchParams.set("limit", String(SEARCH_LIMIT));

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`Open Library search failed: ${response.status}`);
  }

  const data = (await response.json()) as SearchResponse;
  return {
    total: data.numFound,
    books: data.docs.map((doc) => ({
      // "/works/OL82563W" -> "OL82563W"
      id: doc.key.replace("/works/", ""),
      title: doc.title,
      authors: doc.author_name ?? [],
      firstPublishYear: doc.first_publish_year ?? null,
      coverId: doc.cover_i ?? null,
    })),
  };
}

export type BookDetails = {
  id: string;
  title: string;
  authors: string[];
  description: string | null;
  firstPublished: string | null;
  coverId: number | null;
  subjects: string[];
};

// Open Library work IDs look like "OL82563W".
const WORK_ID_PATTERN = /^OL\d+W$/;

type TextValue = string | { type: string; value: string };

type WorkResponse = {
  title?: string;
  description?: TextValue;
  covers?: number[];
  subjects?: string[];
  first_publish_date?: string;
  authors?: { author?: { key: string } }[];
};

type AuthorResponse = {
  name?: string;
};

/**
 * Fetches one book (an Open Library "work"). Returns `null` when the ID is
 * malformed or Open Library has no such book.
 */
export async function getBook(id: string): Promise<BookDetails | null> {
  "use cache";
  cacheLife("days");

  if (!WORK_ID_PATTERN.test(id)) return null;

  const response = await fetch(`https://openlibrary.org/works/${id}.json`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Open Library work request failed: ${response.status}`);
  }

  const work = (await response.json()) as WorkResponse;
  if (!work.title) return null;

  // A work only lists author IDs, so look up names for the first few.
  const authorKeys = (work.authors ?? [])
    .map((entry) => entry.author?.key)
    .filter((key): key is string => Boolean(key))
    .slice(0, 3);
  const authors = await Promise.all(authorKeys.map(getAuthorName));

  return {
    id,
    title: work.title,
    authors: authors.filter((name): name is string => name !== null),
    description: cleanDescription(work.description),
    firstPublished: work.first_publish_date ?? null,
    // Open Library uses -1 for "no cover".
    coverId: work.covers?.find((cover) => cover > 0) ?? null,
    subjects: (work.subjects ?? []).slice(0, 12),
  };
}

async function getAuthorName(key: string): Promise<string | null> {
  // key looks like "/authors/OL23919A"
  const response = await fetch(`https://openlibrary.org${key}.json`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!response.ok) return null;
  const author = (await response.json()) as AuthorResponse;
  return author.name ?? null;
}

function cleanDescription(description: TextValue | undefined) {
  if (!description) return null;
  const text = typeof description === "string" ? description : description.value;
  return (
    text
      // Drop trailing sections like "----------\nAlso contained in: ..."
      .split(/\r?\n-{5,}/)[0]
      // Turn Markdown links "[text](url)" into plain "text"
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim() || null
  );
}

export function coverUrl(coverId: number, size: "S" | "M" | "L" = "M") {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}
