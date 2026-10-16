// Reading-goal limits. No server code here, so Client Components can use them.
// Must match the checks on reading_goals in the reading migration.
export const MIN_GOAL_YEAR = 2000;
export const MAX_GOAL_YEAR = 2100;
export const MAX_GOAL_TARGET = 1000;

export function isGoalYear(year: number) {
  return Number.isInteger(year) && year >= MIN_GOAL_YEAR && year <= MAX_GOAL_YEAR;
}
