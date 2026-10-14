"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { normalizeUsername, validateUsername } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormValues = {
  username: string;
  displayName: string;
  bio: string;
  isPrivate: boolean;
};

export type ProfileFormState = {
  error?: string;
  message?: string;
  /** What was submitted, so the form keeps it after saving or an error. */
  values?: ProfileFormValues;
};

// Postgres error code for "this value must be unique but already exists".
const UNIQUE_VIOLATION = "23505";

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session ended. Sign in again to save." };

  const values: ProfileFormValues = {
    username: normalizeUsername(String(formData.get("username") ?? "")),
    displayName: String(formData.get("displayName") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    // An unticked checkbox isn't sent at all, so "present" means ticked.
    isPrivate: formData.get("isPrivate") === "on",
  };

  const usernameError = validateUsername(values.username);
  if (usernameError) return { error: usernameError, values };
  if (values.displayName.length > 50) {
    return { error: "Display names are at most 50 characters.", values };
  }
  if (values.bio.length > 300) {
    return { error: "Bios are at most 300 characters.", values };
  }

  // Row Level Security already limits this to the reader's own row; the
  // .eq() picks that row out explicitly.
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username: values.username,
      // Empty fields are saved as "not set" rather than as blank text.
      display_name: values.displayName || null,
      bio: values.bio || null,
      is_private: values.isPrivate,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        error: `The username “${values.username}” is taken. Try another.`,
        values,
      };
    }
    return { error: "We couldn’t save your profile. Please try again.", values };
  }

  // Re-render the page so anything showing the old details updates.
  refresh();
  return { message: "Profile saved.", values };
}
