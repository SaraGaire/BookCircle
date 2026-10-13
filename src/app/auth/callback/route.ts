import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * The link in Supabase's confirmation email lands here with a one-time `code`.
 * We swap the code for a session (which signs the user in) and send them on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/sign-in?error=confirm", origin));
}
