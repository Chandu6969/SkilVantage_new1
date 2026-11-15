import type { Metadata } from "next";
import Link from "next/link";
import { brand, communicationTopics, jobSteps, jobSupports } from "@/lib/content";

export const metadata: Metadata = {
  title: "Job Ready Training",
  description:
    "SkilVantage job-readiness training: learn, practice, build projects and a portfolio, prepare a resume, and practice technical and HR interviews. No placement guarantee.",
};

export default function JobReadyPage() {
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs tracking-[0.16em] text-copper uppercase">Job readiness</p>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">Become Job Ready</h1>
          <p className="mt-4 max-w-2xl text-lg text-paper/75">
            {brand.communication} The work below is scheduled into every program. It prepares you for a search. It does not promise an offer.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobSteps.map((step, index) => (
            <li key={step.title} className="rounded-3xl border border-border bg-card p-5">
              <span className="font-heading text-4xl text-copper">0{index + 1}</span>
              <h2 className="mt-2 text-2xl text-ink">{step.title}</h2>
              <p className="mt-2 text-muted-foreground">{step.body}</p>
              {index < jobSteps.length - 1 ? <p className="mt-3 text-copper" aria-hidden="true">↓</p> : null}
            </li>
          ))}
        </ol>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {jobSupports.map((item) => (
            <article key={item.title} className="rounded-3xl bg-secondary p-5">
              <h2 className="text-xl text-ink">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="communication" className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="max-w-3xl text-4xl">Technical Skills + Communication = Career Success</h2>
          <p className="mt-4 max-w-2xl text-lg text-paper/80">Knowing the answer is important. Communicating the answer is what makes you stand out.</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {communicationTopics.map((topic) => (
              <li key={topic.title} className="rounded-2xl border border-white/10 p-4">
                <p className="font-medium">{topic.title}</p>
                <p className="mt-1 text-sm text-paper/70">{topic.body}</p>
              </li>
            ))}
          </ul>
          <Link href="/register?focus=communication" className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-copper text-white sm:w-auto sm:px-5">
            Improve My Communication Skills
          </Link>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <Link href="/register" className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-ink text-paper sm:w-auto sm:px-5">Start Learning</Link>
      </section>
    </>
  );
}
