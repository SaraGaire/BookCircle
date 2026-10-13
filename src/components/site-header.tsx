import Link from "next/link";
import { BookOpen } from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        <Link
          href="/sign-in"
          className={cn(buttonVariants({ size: "sm" }), "ml-auto")}
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
