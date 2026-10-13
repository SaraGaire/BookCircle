import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <ComingSoon
      title="Search books"
      description="Soon you'll be able to search millions of books from Open Library right here."
    />
  );
}
