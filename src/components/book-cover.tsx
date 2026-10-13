import Image from "next/image";
import { BookOpen } from "lucide-react";
import { coverUrl } from "@/lib/open-library";
import { cn } from "@/lib/utils";

type BookCoverProps = {
  coverId: number | null;
  title: string;
  className?: string;
};

export function BookCover({ coverId, title, className }: BookCoverProps) {
  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-md bg-muted",
        className,
      )}
    >
      {coverId ? (
        // Open Library already serves covers at fixed sizes, so we skip
        // Next.js's image optimizer and load them directly.
        <Image
          src={coverUrl(coverId, "M")}
          alt={`Cover of ${title}`}
          fill
          unoptimized
          sizes="(min-width: 640px) 160px, 33vw"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center p-3 text-center">
          <BookOpen
            className="size-8 text-muted-foreground/60"
            aria-hidden="true"
          />
          <span className="sr-only">No cover available</span>
        </div>
      )}
    </div>
  );
}
