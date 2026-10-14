import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUser } from "@/lib/auth";
import { getProfileById } from "@/lib/profiles";

/** Right side of the header: "Sign in", or the signed-in reader's menu. */
export async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/sign-in" className={buttonVariants({ size: "sm" })}>
        Sign in
      </Link>
    );
  }

  // If the profile can't be loaded, fall back to the email rather than
  // breaking the whole header.
  const profile = await getProfileById(user.id).catch(() => null);
  const name = profile?.displayName ?? profile?.username ?? user.email;

  return <UserMenu name={name} username={profile?.username ?? null} />;
}

/** Same size as the menu button, shown while we check who's signed in. */
export function UserNavSkeleton() {
  return <div className="h-8 w-10 animate-pulse rounded-lg bg-muted md:w-32" />;
}
