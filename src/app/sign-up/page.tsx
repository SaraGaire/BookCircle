import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <section className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Join BookCircle
      </h1>
      <p className="mt-2 text-muted-foreground">
        Track your reading and share it with friends.
      </p>
      <div className="mt-8">
        <AuthForm mode="sign-up" />
      </div>
    </section>
  );
}
