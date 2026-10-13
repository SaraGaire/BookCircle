type ComingSoonProps = {
  title: string;
  description: string;
};

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-3 max-w-prose text-muted-foreground">{description}</p>
    </section>
  );
}
