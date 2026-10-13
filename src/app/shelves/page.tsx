import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "My Shelves" };

export default function ShelvesPage() {
  return (
    <ComingSoon
      title="My Shelves"
      description="Your Want to Read, Reading, and Read shelves will live here once accounts are set up."
    />
  );
}
