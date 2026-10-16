import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, Star } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { GoalCard } from "@/components/goal-card";
import { badgeVariants } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getDiaryEntries, getReadingGoal, type DiaryEntry } from "@/lib/diary";
import { isGoalYear, MIN_GOAL_YEAR } from "@/lib/goal-limits";
import { describeRating } from "@/lib/rating";

export const metadata: Metadata = { title: "Reading Diary" };

export default function DiaryPage({ searchParams }: PageProps<"/diary">) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Reading Diary
      </h1>
      <p className="mt-2 text-muted-foreground">
        Every book you’ve finished, and how you’re doing on your yearly goal.
      </p>
      {/* Who's signed in and which year is picked are only known per request. */}
      <Suspense fallback={<DiarySkeleton />}>
        <DiaryContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function DiaryContent({
  searchParams,
}: Pick<PageProps<"/diary">, "searchParams">) {
  // Visitors who aren't signed in are sent to /sign-in, then back here.
  const user = await requireUser("/diary");

  // Dates in the diary are calendar days, so we count years in UTC to match.
  const currentYear = new Date().getUTCFullYear();
  const { year: yearParam } = await searchParams;
  const requested = Number(yearParam);
  const year = isGoalYear(requested) && requested <= currentYear ? requested : currentYear;

  let entries: DiaryEntry[];
  let target: number | null;
  try {
    [entries, target] = await Promise.all([
      getDiaryEntries(user.id),
      getReadingGoal(user.id, year),
    ]);
  } catch {
    return (
      <p role="alert" className="mt-8 text-sm text-destructive">
        We couldn’t load your diary right now. Please try again in a moment.
      </p>
    );
  }

  // finishedOn is "YYYY-MM-DD", so the first four characters are the year.
  const thisYear = entries.filter((entry) => entry.finishedOn.startsWith(`${year}-`));

  return (
    <>
      <nav aria-label="Years" className="mt-8 flex items-center justify-between">
        {year > MIN_GOAL_YEAR ? (
          <Link
            href={`/diary?year=${year - 1}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ChevronLeft aria-hidden="true" />
            {year - 1}
          </Link>
        ) : (
          <span />
        )}
        <h2 className="font-heading text-xl font-semibold tabular-nums">{year}</h2>
        {year < currentYear ? (
          <Link
            href={`/diary?year=${year + 1}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {year + 1}
            <ChevronRight aria-hidden="true" />
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <div className="mt-4">
        {/* `key` resets the card (e.g. closes an open form) when the year changes. */}
        <GoalCard key={year} year={year} target={target} finished={thisYear.length} />
      </div>

      {thisYear.length === 0 ? (
        <div className="mt-10">
          <p className="text-sm text-muted-foreground">
            No finished books in {year} yet. When you move a book to your Read
            shelf, it shows up here.
          </p>
          <Link
            href="/shelves?shelf=reading"
            className={buttonVariants({ variant: "outline", className: "mt-4" })}
          >
            See what you’re reading
          </Link>
        </div>
      ) : (
        groupByMonth(thisYear).map(([month, monthEntries]) => (
          <section key={month} aria-labelledby={`month-${month}`} className="mt-10">
            <h3
              id={`month-${month}`}
              className="border-b pb-2 text-sm font-medium tracking-wide text-muted-foreground uppercase"
            >
              {monthName(month)}
            </h3>
            <ol className="divide-y">
              {monthEntries.map((entry) => (
                <li key={entry.id}>
                  <DiaryRow entry={entry} />
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
    </>
  );
}

function DiaryRow({ entry }: { entry: DiaryEntry }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <time
        dateTime={entry.finishedOn}
        className="w-8 shrink-0 text-center text-lg font-semibold tabular-nums"
      >
        {Number(entry.finishedOn.slice(8, 10))}
      </time>
      <Link href={`/books/${entry.bookId}`} className="w-10 shrink-0">
        <BookCover coverId={entry.coverId} title={entry.title} size="S" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/books/${entry.bookId}`}
          className="line-clamp-1 font-medium hover:underline"
        >
          {entry.title}
        </Link>
        {entry.authors.length > 0 && (
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {entry.authors.join(", ")}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {entry.rating !== null && (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="sr-only">Rated </span>
            {describeRating(entry.rating)}
          </span>
        )}
        {entry.isReread && (
          <span className={badgeVariants({ variant: "secondary" })}>
            <RotateCcw aria-hidden="true" />
            Re-read
          </span>
        )}
      </div>
    </div>
  );
}

/** Groups entries (already newest first) by month: [["2026-10", [...]], ...] */
function groupByMonth(entries: DiaryEntry[]) {
  const months = new Map<string, DiaryEntry[]>();
  for (const entry of entries) {
    const month = entry.finishedOn.slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), entry]);
  }
  return [...months];
}

/** "2026-10" -> "October" */
function monthName(month: string) {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en", {
    month: "long",
    timeZone: "UTC",
  });
}

function DiarySkeleton() {
  return (
    <div className="mt-8 space-y-4" aria-busy="true">
      <p className="sr-only">Loading your diary…</p>
      <div className="mx-auto h-7 w-20 animate-pulse rounded bg-muted" />
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-6 w-8 animate-pulse rounded bg-muted" />
          <div className="aspect-[2/3] w-10 animate-pulse rounded bg-muted" />
          <div className="h-5 flex-1 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
