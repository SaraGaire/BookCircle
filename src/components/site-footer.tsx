export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>BookCircle — a social home for readers.</p>
        <p>
          Open source on{" "}
          <a
            href="https://github.com/SaraGaire/BookCircle"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
