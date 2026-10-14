"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Pencil, UserRound } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  /** Display name, or the username if none is set. */
  name: string;
  /** Null if the profile couldn't be loaded; profile links are hidden then. */
  username: string | null;
};

/** The signed-in reader's menu in the header. */
export function UserMenu({ name, username }: UserMenuProps) {
  const [signingOut, startSignOut] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "ghost", className: "gap-2 px-1.5" })}
        aria-label={`Account menu for ${name}`}
      >
        <Avatar size="sm">
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        {/* On small screens only the avatar shows. */}
        <span className="hidden max-w-32 truncate md:inline">{name}</span>
        <ChevronDown className="text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-1.5 py-1.5">
          <p className="truncate text-sm font-medium">{name}</p>
          {username && (
            <p className="truncate text-xs text-muted-foreground">@{username}</p>
          )}
        </div>
        <DropdownMenuSeparator />
        {username && (
          <>
            <DropdownMenuLinkItem render={<Link href={`/u/${username}`} />}>
              <UserRound aria-hidden="true" />
              Your profile
            </DropdownMenuLinkItem>
            <DropdownMenuLinkItem render={<Link href="/settings/profile" />}>
              <Pencil aria-hidden="true" />
              Edit profile
            </DropdownMenuLinkItem>
            <DropdownMenuSeparator />
          </>
        )}
        {/* Server Actions can be called like normal functions from the
            browser; signOut then redirects to the home page. */}
        <DropdownMenuItem
          disabled={signingOut}
          onClick={() => startSignOut(() => signOut())}
        >
          <LogOut aria-hidden="true" />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
