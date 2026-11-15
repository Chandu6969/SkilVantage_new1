"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-4 py-16">
      <h1 className="text-4xl text-ink">Something went wrong.</h1>
      <p className="mt-3 text-muted-foreground">The page could not be loaded. Try again, or return home and continue from there.</p>
      <button type="button" onClick={() => reset()} className="mt-6 h-11 rounded-xl bg-ink px-5 text-paper">
        Try again
      </button>
    </div>
  );
}
