"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isGoalYear, MAX_GOAL_TARGET } from "@/lib/goal-limits";
import { createClient } from "@/lib/supabase/server";

export type GoalFormState = {
  error?: string;
  /** True once the goal is saved, so the form can close itself. */
  saved?: boolean;
};

/** Sets "Read N books in YEAR". Used with useActionState. */
export async function setReadingGoal(
  _prevState: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session ended. Sign in again to save." };

  const year = Number(formData.get("year"));
  const target = Number(formData.get("target"));
  if (!isGoalYear(year)) return { error: "That isn’t a year we can set a goal for." };
  if (!Number.isInteger(target) || target < 1 || target > MAX_GOAL_TARGET) {
    return { error: `Pick a goal from 1 to ${MAX_GOAL_TARGET} books.` };
  }

  // "Upsert" means insert, or update if a goal for that year already exists.
  // The table's primary key is (user_id, year), so that's what clashes.
  const supabase = await createClient();
  const { error } = await supabase
    .from("reading_goals")
    .upsert({ user_id: user.id, year, target }, { onConflict: "user_id,year" });
  if (error) {
    console.error("setReadingGoal failed:", error);
    return { error: "We couldn’t save your goal. Please try again." };
  }

  refresh();
  return { saved: true };
}

export async function removeReadingGoal(year: number): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to manage your goals." };
  if (!isGoalYear(year)) return { error: "That isn’t a year we can set a goal for." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reading_goals")
    .delete()
    .eq("user_id", user.id)
    .eq("year", year);
  if (error) {
    console.error("removeReadingGoal failed:", error);
    return { error: "We couldn’t remove your goal. Please try again." };
  }

  refresh();
  return {};
}
