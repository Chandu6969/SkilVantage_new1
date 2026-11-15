import type { Metadata } from "next";
import Link from "next/link";
import { getProgram } from "@/lib/content";
import { formatStamp } from "@/lib/dates";
import { isRegistrationId } from "@/lib/ids";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Welcome to SkilVantage",
  description: "Your SkilVantage registration has been received. The career team will review it and contact you.",
  robots: { index: false, follow: false },
};

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ id?: string; duplicate?: string }> }) {
  const params = await searchParams;
  const id = params.id || "";
  const record = isRegistrationId(id) ? await getStore().getRegistration(id) : null;
  const program = record ? getProgram(record.program) : null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs tracking-[0.16em] text-copper uppercase">Registration</p>
      <h1 className="mt-3 text-4xl text-ink sm:text-5xl">Welcome to SkilVantage!</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        Thank you for taking the first step toward becoming job ready. Our career team will review your details and contact you shortly.
      </p>
      {record && program ? (
        <dl className="mt-8 grid gap-4 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2">
          <div><dt className="text-sm text-muted-foreground">Registration ID</dt><dd className="text-xl text-ink">{record.id}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Selected Program</dt><dd className="text-xl text-ink">{program.name}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Learner Type</dt><dd className="text-xl text-ink">{record.learnerType === "student" ? "Student / Fresher" : "Working Professional"}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Received (IST)</dt><dd className="text-xl text-ink">{formatStamp(record.createdAt)}</dd></div>
        </dl>
      ) : (
        <p className="mt-6 rounded-2xl bg-secondary px-4 py-3 text-sm">We could not find that registration. If you just submitted the form, go back and submit again, or contact the career team.</p>
      )}
      {params.duplicate === "1" ? (
        <p className="mt-4 text-sm text-muted-foreground">We already had a registration for this email and program from the last day, so this is the original registration id.</p>
      ) : null}
      <h2 className="mt-10 text-2xl text-ink">Next steps</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">
        <li>The career team reviews what you shared.</li>
        <li>They contact you on the phone number or email in the form.</li>
        <li>The conversation covers your background, the program, batch options, and a learning plan.</li>
        <li>You can read the roadmap while you wait. A seat is confirmed only after counselling.</li>
      </ol>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="inline-flex h-12 items-center justify-center rounded-xl bg-ink px-5 text-paper">Back to Home</Link>
        <Link href={program ? `/roadmaps/${program.slug}` : "/roadmaps"} className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5">Explore Career Roadmap</Link>
        <Link href="/contact" className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5">Contact SkilVantage</Link>
      </div>
    </section>
  );
}
