// Shelf names and labels. This file has no server code, so it's safe to
// import from Client Components too (database helpers live in shelves.ts).

// Must match the shelf_status enum in the reading migration.
export const SHELF_STATUSES = ["want_to_read", "reading", "read"] as const;
export type ShelfStatus = (typeof SHELF_STATUSES)[number];

export const SHELF_LABELS: Record<ShelfStatus, string> = {
  want_to_read: "Want to Read",
  reading: "Reading",
  read: "Read",
};

export function isShelfStatus(value: unknown): value is ShelfStatus {
  return SHELF_STATUSES.includes(value as ShelfStatus);
}
