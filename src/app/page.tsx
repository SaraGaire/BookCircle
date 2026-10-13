import Link from "next/link";
import { Library, MessageSquareText, Users, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const features: Feature[] = [
  {
    title: "Track your reading",
    description:
      "Keep shelves for books you want to read, are reading, and have finished.",
    icon: Library,
  },
  {
    title: "Rate and review",
    description:
      "Give books a star rating and write down what stayed with you.",
    icon: MessageSquareText,
  },
  {
    title: "Read together",
    description:
      "Follow other readers and see what they're picking up next.",
    icon: Users,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      <section className="py-16 sm:py-24">
        <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Your reading life, shared.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          BookCircle is a home for readers. Log the books you read, say what
          you thought, and find your next favourite through people you trust.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/search" className={buttonVariants({ size: "lg" })}>
            Find a book
          </Link>
          <Link
            href="/shelves"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Start your shelves
          </Link>
        </div>
      </section>

      <section aria-labelledby="features-heading" className="pb-16 sm:pb-24">
        <h2 id="features-heading" className="sr-only">
          What you can do on BookCircle
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <li key={title}>
              <Card className="h-full">
                <CardHeader>
                  <Icon className="mb-2 size-5 text-primary" aria-hidden="true" />
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
