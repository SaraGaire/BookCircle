import { Suspense } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { UserNav, UserNavSkeleton } from "@/components/user-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 sm:gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight"
        >
          <BookOpen className="size-5 text-primary" aria-hidden="true" />
          BookCircle
        </Link>
        <MainNav />
        <div className="ml-auto">
          {/* Checking who's signed in reads cookies, so it streams in. */}
          <Suspense fallback={<UserNavSkeleton />}>
            <UserNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
