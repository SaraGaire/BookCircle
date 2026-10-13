import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <ComingSoon
      title="Sign in"
      description="Accounts are coming soon. We'll add sign-up and sign-in with Supabase in a later step."
    />
  );
}
