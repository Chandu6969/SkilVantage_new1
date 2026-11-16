import type { Metadata } from "next";
import { ProgramCard } from "@/components/program-card";
import { programs } from "@/lib/content";

export const metadata: Metadata = {
  title: "Data, AI and Career Programs",
  description:
    "Compare SkilVantage career programs in Data Analyst training, Data Science, AI ML, Generative AI and Agentic AI. Job-readiness focused paths for students and professionals.",
};

export default function ProgramsPage() {
  return (
    <>
      <section className="sv-band">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs tracking-[0.16em] text-white/75 uppercase">Programs</p>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">Choose the career you want to be ready for.</h1>
          <p className="mt-4 max-w-2xl text-lg text-paper/75">
            Each program has a roadmap, projects, communication practice, and a separate pace for students and working professionals. Durations are typical cohort lengths.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((program, index) => (
            <ProgramCard key={program.slug} program={program} index={index} />
          ))}
        </div>
      </section>
    </>
  );
}
