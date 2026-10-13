import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BookNotFound() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Book not found
      </h1>
      <p className="mt-3 max-w-prose text-muted-foreground">
        We couldn’t find that book. The link may be wrong, or the book may have
        been merged with another edition on Open Library.
      </p>
      <Link href="/search" className={cn(buttonVariants(), "mt-6")}>
        Search for a book
      </Link>
    </section>
  );
}
