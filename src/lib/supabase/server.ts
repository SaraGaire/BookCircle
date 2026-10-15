import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route
 * Handlers. Create a new one per request; never share it between requests.
 */
export async function createClient() {
  // Supabase checks whether the session token has expired, which compares it
  // with the current time. When Next.js prepares pages ahead of a click
  // (partial prefetching), it can read cookies but not the clock, so this
  // tells it to wait for the real request before using the client.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies. That's fine: the proxy
            // (src/proxy.ts) refreshes the session cookie on every request.
          }
        },
      },
    },
  );
}
