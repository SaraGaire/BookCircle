"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  updateProfile,
  type ProfileFormState,
  type ProfileFormValues,
} from "@/app/settings/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ProfileFormState = {};

export function ProfileForm({ profile }: { profile: ProfileFormValues }) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );
  // After a submit, show what was submitted; before that, what's saved.
  const values = state.values ?? profile;

  return (
    <form action={formAction} className="space-y-6">
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
          defaultValue={values.username}
          required
        />
        <p id="username-hint" className="text-xs text-muted-foreground">
          Letters, numbers, and underscores. Changing it changes your profile
          link, and old links will stop working.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="displayName" className="text-sm font-medium">
          Display name <span className="text-muted-foreground">(optional)</span>
        </label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          maxLength={50}
          defaultValue={values.displayName}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio <span className="text-muted-foreground">(optional)</span>
        </label>
        {/* Styled to match <Input>; shadcn's Textarea isn't installed. */}
        <textarea
          id="bio"
          name="bio"
          rows={4}
          maxLength={300}
          aria-describedby="bio-hint"
          defaultValue={values.bio}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
        <p id="bio-hint" className="text-xs text-muted-foreground">
          Up to 300 characters.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          id="isPrivate"
          name="isPrivate"
          type="checkbox"
          aria-describedby="isPrivate-hint"
          defaultChecked={values.isPrivate}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <div>
          <label htmlFor="isPrivate" className="text-sm font-medium">
            Private profile
          </label>
          <p id="isPrivate-hint" className="text-xs text-muted-foreground">
            People can still find your profile, but your shelves, ratings, and
            reviews are hidden from them.
          </p>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && !pending && (
        <p role="status" className="text-sm">
          {state.message}{" "}
          <Link
            href={`/u/${values.username}`}
            className="font-medium underline-offset-4 hover:underline"
          >
            View your profile
          </Link>
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
