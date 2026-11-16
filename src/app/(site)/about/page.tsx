import type { Metadata } from "next";
import Link from "next/link";
import { aboutFocus, brand } from "@/lib/content";

export const metadata: Metadata = {
  title: "About SkilVantage",
  description:
    "SkilVantage is a career-focused technology training consultancy bridging academic learning and industry expectations in data, AI and communication.",
};

export default function AboutPage() {
  return (
    <>
      <section className="sv-band">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs tracking-[0.16em] text-copper uppercase">About SkilVantage</p>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">Training that treats a career as the outcome.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-paper/80">{brand.about}</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          {aboutFocus.map((item) => (
            <article key={item.title} className="rounded-3xl border border-border p-6">
              <h2 className="text-2xl text-ink">{item.title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-12 max-w-3xl space-y-4 text-lg leading-relaxed text-muted-foreground">
          <p>{brand.communication}</p>
          <p>{brand.promise}</p>
          <p>
            SkilVantage teaches students, freshers, and working professionals. A counsellor reviews each registration before anyone is enrolled. Fees, batch dates, and mode are confirmed in that conversation. The organisation does not guarantee a job, an internship, or a salary.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/programs" className="inline-flex h-12 items-center justify-center rounded-xl bg-ink px-5 text-paper">Explore Programs</Link>
          <Link href="/register?type=professional" className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5">Plan My Career</Link>
        </div>
      </section>
    </>
  );
}
