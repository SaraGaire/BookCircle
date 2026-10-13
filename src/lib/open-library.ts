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

export function coverUrl(coverId: number, size: "S" | "M" | "L" = "M") {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}
