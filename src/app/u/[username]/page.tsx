import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Pencil } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { badgeVariants } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getProfileByUsername } from "@/lib/profiles";

export async function generateMetadata({
  params,
}: PageProps<"/u/[username]">): Promise<Metadata> {
  const { username } = await params;
  // The username is already in the URL, so the title doesn't need the database.
  return { title: `@${username.toLowerCase()}` };
}

export default function ProfilePage({ params }: PageProps<"/u/[username]">) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10">
      {/* The username comes from the URL, which is only known per request. */}
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileDetails params={params} />
      </Suspense>
    </section>
  );
}

async function ProfileDetails({
  params,
}: Pick<PageProps<"/u/[username]">, "params">) {
  const { username } = await params;

  let profile, viewer;
  try {
    [profile, viewer] = await Promise.all([
      getProfileByUsername(username),
      getCurrentUser(),
    ]);
  } catch {
    return (
      <p role="alert" className="text-sm text-destructive">
        We couldn’t load this profile right now. Please try again in a moment.
      </p>
    );
  }
  if (!profile) notFound();
  const isOwnProfile = viewer?.id === profile.id;

  const name = profile.displayName ?? profile.username;
  const joined = new Date(profile.createdAt).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <>
      <header className="flex items-center gap-5">
        {/* Avatar uploads come later; for now everyone gets their initial. */}
        <Avatar className="size-20 text-2xl">
          <AvatarFallback className="text-2xl">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-3xl font-semibold tracking-tight">
            {name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
            <span>@{profile.username}</span>
            <span aria-hidden="true">·</span>
            <span>Joined {joined}</span>
            {profile.isPrivate && (
              <span className={badgeVariants({ variant: "secondary" })}>
                <Lock aria-hidden="true" />
                Private
              </span>
            )}
          </p>
        </div>
        {isOwnProfile && (
          <Link
            href="/settings/profile"
            className={buttonVariants({ variant: "outline", className: "ml-auto" })}
          >
            <Pencil aria-hidden="true" />
            Edit profile
          </Link>
        )}
      </header>

      {profile.bio && (
        <p className="mt-6 max-w-prose whitespace-pre-line leading-relaxed">
          {profile.bio}
        </p>
      )}

      <section aria-labelledby="activity-heading" className="mt-10 border-t pt-8">
        <h2 id="activity-heading" className="font-heading text-xl font-semibold">
          Reading
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile.isPrivate
            ? `${name} keeps their reading private.`
            : "Shelves, ratings, and reviews will show up here soon."}
        </p>
      </section>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-5" aria-busy="true">
      <p className="sr-only">Loading profile…</p>
      <div className="size-20 animate-pulse rounded-full bg-muted" />
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
