import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth";
import { getProfileById } from "@/lib/profiles";

export const metadata: Metadata = { title: "Edit profile" };

export default function EditProfilePage() {
  return (
    <section className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Edit profile
      </h1>
      <p className="mt-2 text-muted-foreground">
        This is what other readers see on your profile page.
      </p>
      <div className="mt-8">
        <Suspense fallback={<FormSkeleton />}>
          <EditProfileContent />
        </Suspense>
      </div>
    </section>
  );
}

async function EditProfileContent() {
  // Visitors who aren't signed in are sent to /sign-in, then back here.
  const user = await requireUser("/settings/profile");
  const profile = await getProfileById(user.id);

  if (!profile) {
    // Every account gets a profile from the database trigger, so this only
    // happens if something went wrong there.
    return (
      <p role="alert" className="text-sm text-destructive">
        We couldn’t find your profile. Please sign out and in again, or
        contact us if this keeps happening.
      </p>
    );
  }

  return (
    <ProfileForm
      profile={{
        username: profile.username,
        displayName: profile.displayName ?? "",
        bio: profile.bio ?? "",
        isPrivate: profile.isPrivate,
      }}
    />
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <p className="sr-only">Loading your profile…</p>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  );
}
