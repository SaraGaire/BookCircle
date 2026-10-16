// Calendar-date helpers. No server code here, so Client Components can use them.
//
// The diary stores plain calendar days ("2026-10-16"), not moments in time.
// "Today" depends on where the reader is, so the browser tells the server what
// day it is for them, and the server checks that the answer is believable.

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The reader's own date, e.g. "2026-10-16". Call it in the browser. */
export function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** True for a real calendar date written as "YYYY-MM-DD". */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  // Rejects dates like "2026-02-30" that match the pattern but don't exist.
  return new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
}

/**
 * Checks a "today" sent from the browser. Every time zone's date is within a
 * day of UTC's; we measure from the start of that day, so we allow two. Any
 * further away is a broken clock (or someone meddling), and we return
 * undefined so the database uses its own date instead.
 */
export function readerToday(value: unknown): string | undefined {
  if (!isCalendarDate(value)) return undefined;
  const distance = Math.abs(new Date(`${value}T00:00:00Z`).getTime() - Date.now());
  return distance <= 2 * DAY_MS ? value : undefined;
}
