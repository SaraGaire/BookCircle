import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
};

/**
 * Returns the signed-in user, or `null` if nobody is signed in.
 *
 * Uses getClaims(), which verifies the session token's signature, so the result
 * can be trusted. Reads cookies, so callers must render inside <Suspense>.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;

  return {
    id: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : "",
  };
}

/** Like getCurrentUser, but sends visitors to the sign-in page first. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/**
 * Only allow redirects to pages on our own site, so a link like
 * /sign-in?next=https://evil.example can't send people elsewhere.
 */
export function safeRedirectPath(path: unknown, fallback = "/shelves") {
  if (typeof path !== "string") return fallback;
  // "//x" and "/\x" are treated by browsers as links to another site.
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  return path;
}
