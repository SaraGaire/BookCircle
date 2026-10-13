import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route
 * Handlers. Create a new one per request; never share it between requests.
 */
export async function createClient() {
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
