import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

/** Right side of the header: "Sign in", or the signed-in user's email. */
export async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/sign-in" className={buttonVariants({ size: "sm" })}>
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden max-w-48 truncate text-sm text-muted-foreground md:inline"
        title={user.email}
      >
        {user.email}
      </span>
      <form action={signOut}>
        <Button type="submit" size="sm" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  );
}

/** Same size as the button, shown while we check who's signed in. */
export function UserNavSkeleton() {
  return <div className="h-7 w-16 animate-pulse rounded-lg bg-muted" />;
}
