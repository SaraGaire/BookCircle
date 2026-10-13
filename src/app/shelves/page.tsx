import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "My Shelves" };

export default function ShelvesPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        My Shelves
      </h1>
      <Suspense
        fallback={<div className="mt-3 h-5 w-64 animate-pulse rounded bg-muted" />}
      >
        <ShelvesContent />
      </Suspense>
    </section>
  );
}

async function ShelvesContent() {
  // Visitors who aren't signed in are sent to /sign-in, then back here.
  const user = await requireUser("/shelves");

  return (
    <p className="mt-3 max-w-prose text-muted-foreground">
      Signed in as <span className="text-foreground">{user.email}</span>. Your
      Want to Read, Reading, and Read shelves are coming in the next step.
    </p>
  );
}
