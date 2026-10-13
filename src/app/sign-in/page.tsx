import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { safeRedirectPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <section className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-2 text-muted-foreground">
        Sign in to see your shelves and reviews.
      </p>
      <div className="mt-8">
        <Suspense fallback={<AuthForm mode="sign-in" />}>
          <SignInForm searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function SignInForm({
  searchParams,
}: Pick<PageProps<"/sign-in">, "searchParams">) {
  const { next, error } = await searchParams;
  const notice =
    error === "confirm"
      ? "That confirmation link didn’t work. It may have expired, or it was opened in a different browser. Try signing in, or sign up again."
      : undefined;

  return <AuthForm mode="sign-in" next={safeRedirectPath(next)} notice={notice} />;
}
