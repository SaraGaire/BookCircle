"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth";
import {
  isUsernameTaken,
  normalizeUsername,
  validateUsername,
} from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  message?: string;
  email?: string;
  username?: string;
};

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Enter your email and password.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Supabase's messages are fine to show, e.g. "Invalid login credentials"
    // or "Email not confirmed".
    return { error: error.message, email };
  }

  redirect(safeRedirectPath(formData.get("next")));
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData);
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  if (!email || !password || !username) {
    return { error: "Enter a username, an email, and a password.", email, username };
  }

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError, email, username };
  if (password.length < 8) {
    return { error: "Use a password with at least 8 characters.", email, username };
  }
  if (await isUsernameTaken(username)) {
    return { error: `The username “${username}” is taken. Try another.`, email, username };
  }

  // The confirmation email links back to our site, so we need its address.
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Saved on the account; the database trigger copies it into the new
      // profile (see supabase/migrations/20261014000000_profiles.sql).
      data: { username },
    },
  });
  if (error) return { error: error.message, email, username };

  // If email confirmation is turned off in Supabase, the user is signed in now.
  if (data.session) redirect("/shelves");

  return {
    message: `We sent a confirmation link to ${email}. Open it to finish signing up.`,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
