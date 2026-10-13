"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Library, Search, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/shelves", label: "My Shelves", icon: Library },
];

function isActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex items-center gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(href, pathname);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active && "bg-muted text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {/* On small screens only the icon shows; screen readers still get the label. */}
              <span className="sr-only sm:not-sr-only">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavLinks() {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} />;
}

export function MainNav() {
  return (
    <nav aria-label="Main">
      {/* usePathname can suspend on dynamic routes (Cache Components), so render
          the links without highlighting until the current path is known. */}
      <Suspense fallback={<NavLinks pathname={null} />}>
        <ActiveNavLinks />
      </Suspense>
    </nav>
  );
}
