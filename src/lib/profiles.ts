import { createClient } from "@/lib/supabase/server";

// Must match the check on profiles.username in the profiles migration.
const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

/** Usernames are stored lowercase, so "Sara" and "sara" are the same name. */
export function normalizeUsername(input: string) {
  return input.trim().toLowerCase();
}

/** Returns an error message for an invalid username, or null if it's fine. */
export function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 30) {
    return "Usernames are 3 to 30 characters long.";
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "Use only letters, numbers, and underscores in your username.";
  }
  return null;
}

/** True if another reader already has this username. */
export async function isUsernameTaken(username: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (error) throw new Error(`Couldn't check username: ${error.message}`);
  return data !== null;
}
