import Form from "next/form";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    // A GET form: submitting navigates to /search?q=..., so every search has
    // its own shareable URL. next/form does this without a full page reload.
    <Form action="/search" role="search" className="flex gap-2">
      <label htmlFor="search-q" className="sr-only">
        Search by title, author, or ISBN
      </label>
      <Input
        id="search-q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search by title, author, or ISBN"
        className="h-10"
        required
      />
      <Button type="submit" size="lg" className="h-10">
        <Search aria-hidden="true" />
        Search
      </Button>
    </Form>
  );
}
