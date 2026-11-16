import type { Metadata } from "next";
import Link from "next/link";
import { JourneyTimeline } from "@/components/journey-timeline";
import { phases, programs } from "@/lib/content";
import { programGradient, programLook } from "@/lib/palette";

export const metadata: Metadata = {
  title: "Career Roadmaps",
  description:
    "Visual career roadmaps for Data Analyst, Data Scientist, AI/ML, Generative AI and Agentic AI. From foundation and projects to resume, interview preparation and job readiness.",
};

export default function RoadmapsPage() {
  return (
    <>
      <section className="sv-band">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs tracking-[0.16em] text-copper uppercase">Career Roadmaps</p>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">From foundation to job ready.</h1>
          <p className="mt-4 max-w-2xl text-paper/75">Every program follows the same shape. The skills inside change with the role.</p>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {programs.map((program) => (
              <Link key={program.slug} href={`/roadmaps/${program.slug}`} className="shrink-0 rounded-full px-4 py-2 text-sm text-white" style={{ background: programLook(program.slug).from }}>
                {program.shortName}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((phase, index) => (
            <li key={phase.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-copper">0{index + 1}{index < phases.length - 1 ? " ↓" : ""}</p>
              <p className="mt-1 font-medium text-ink">{phase.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{phase.summary}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 space-y-16">
          {programs.map((program) => (
            <section key={program.slug} id={program.slug} className="overflow-hidden rounded-[1.7rem] border border-white/70 bg-white/55">
              <div className="flex flex-col justify-between gap-3 px-5 py-5 text-white sm:flex-row sm:items-end" style={{ background: programGradient(program.slug) }}>
                <div>
                  <h2 className="text-3xl">{program.name}</h2>
                  <p className="mt-2 max-w-2xl text-white/85">{program.description}</p>
                </div>
                <Link href={`/roadmaps/${program.slug}`} className="text-sm text-white underline-offset-4 hover:underline">{program.roadmapLabel}</Link>
              </div>
              <div className="p-4 sm:p-6">
                <JourneyTimeline program={program} />
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
