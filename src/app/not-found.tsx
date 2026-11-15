import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-16">
      <Logo />
      <h1 className="mt-8 text-4xl text-ink">That page is not on the map.</h1>
      <p className="mt-3 text-muted-foreground">The link may be old. The programs, roadmaps, and registration form are still here.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="h-11 px-5">
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 px-5">
          <Link href="/programs">Explore Programs</Link>
        </Button>
      </div>
    </div>
  );
}
