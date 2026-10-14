import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProfileNotFound() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Reader not found
      </h1>
      <p className="mt-3 max-w-prose text-muted-foreground">
        There’s no reader with that username. They may have changed it, or the
        link may be wrong.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-6")}>
        Back to BookCircle
      </Link>
    </section>
  );
}
