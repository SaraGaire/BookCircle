// Rating helpers. No server code here, so Client Components can use them.
//
// Ratings are half stars stored as whole numbers (see the reading migration):
// 1 = ½ star, 2 = 1 star, ... 10 = 5 stars. Whole numbers avoid rounding
// surprises that decimals like 3.5 can cause.

export const MAX_RATING = 10;

/** Must match the length check on user_books.review in the reading migration. */
export const MAX_REVIEW_LENGTH = 10000;

export function isRating(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= MAX_RATING;
}

/** 7 -> "3½ stars", 2 -> "1 star", 1 -> "½ star" */
export function describeRating(rating: number) {
  const whole = Math.floor(rating / 2);
  const label = `${whole || ""}${rating % 2 === 1 ? "½" : ""}`;
  // Only exactly one star or half a star is singular.
  return `${label} ${rating <= 2 ? "star" : "stars"}`;
}
