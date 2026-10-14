"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthFormState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  /** Where to go after signing in, e.g. "/shelves". */
  next?: string;
  /** A message to show before the form is submitted. */
  notice?: string;
};

const initialState: AuthFormState = {};

export function AuthForm({ mode, next, notice }: AuthFormProps) {
  const isSignIn = mode === "sign-in";
  const [state, formAction, pending] = useActionState(
    isSignIn ? signIn : signUp,
    initialState,
  );

  if (state.message) {
    return (
      <p role="status" className="rounded-lg bg-muted p-4 text-sm">
        {state.message}
      </p>
    );
  }

  const error = state.error ?? notice;

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      {!isSignIn && (
        <div className="space-y-1.5">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            minLength={3}
            maxLength={30}
            pattern="[A-Za-z0-9_]+"
            aria-describedby="username-hint"
            defaultValue={state.username}
            required
          />
          <p id="username-hint" className="text-xs text-muted-foreground">
            Letters, numbers, and underscores. Your profile will be at
            /u/username.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignIn ? "current-password" : "new-password"}
          minLength={isSignIn ? undefined : 8}
          aria-describedby={isSignIn ? undefined : "password-hint"}
          required
        />
        {!isSignIn && (
          <p id="password-hint" className="text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending
          ? isSignIn
            ? "Signing in…"
            : "Creating account…"
          : isSignIn
            ? "Sign in"
            : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isSignIn ? "New to BookCircle? " : "Already have an account? "}
        <Link
          href={isSignIn ? "/sign-up" : "/sign-in"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {isSignIn ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
