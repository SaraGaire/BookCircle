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

export type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  createdAt: string;
};

const PROFILE_COLUMNS =
  "id, username, display_name, bio, avatar_url, is_private, created_at";

/** Fetches a profile by username. Returns `null` if there's no such reader. */
export async function getProfileByUsername(
  input: string,
): Promise<Profile | null> {
  const username = normalizeUsername(input);
  // Skip the database for URLs that can't be a username, like /u/a.b
  if (validateUsername(username)) return null;
  return findProfile("username", username);
}

/** Fetches a profile by account id, e.g. the signed-in reader's own. */
export async function getProfileById(id: string): Promise<Profile | null> {
  return findProfile("id", id);
}

async function findProfile(
  column: "id" | "username",
  value: string,
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq(column, value)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load profile: ${error.message}`);
  if (!data) return null;

  // The database uses snake_case names; the rest of our code uses camelCase.
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    bio: data.bio,
    avatarUrl: data.avatar_url,
    isPrivate: data.is_private,
    createdAt: data.created_at,
  };
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
