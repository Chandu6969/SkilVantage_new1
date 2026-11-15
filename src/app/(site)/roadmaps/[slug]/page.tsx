import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JourneyTimeline } from "@/components/journey-timeline";
import { getProgram, programs } from "@/lib/content";

export function generateStaticParams() {
  return programs.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const program = getProgram((await params).slug);
  if (!program) return {};
  return {
    title: `${program.name} Roadmap`,
    description: `Career roadmap for ${program.name}: foundation, core skills, advanced skills, projects, portfolio, resume, interview preparation and job readiness.`,
  };
}

export default async function RoadmapDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const program = getProgram((await params).slug);
  if (!program) notFound();
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-sm text-paper/60"><Link href="/roadmaps" className="hover:text-paper">Career Roadmaps</Link> / {program.shortName}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">{program.name} roadmap</h1>
          <p className="mt-4 max-w-2xl text-paper/75">{program.description}</p>
          <div className="mt-6 flex gap-2 overflow-x-auto">
            {programs.map((item) => (
              <Link key={item.slug} href={`/roadmaps/${item.slug}`} className={`shrink-0 rounded-full px-4 py-2 text-sm ${item.slug === program.slug ? "bg-copper text-white" : "border border-white/20"}`}>
                {item.shortName}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <JourneyTimeline program={program} />
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href={`/programs/${program.slug}`} className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5">View course details</Link>
          <Link href={`/register?program=${program.slug}`} className="inline-flex h-12 items-center justify-center rounded-xl bg-ink px-5 text-paper">{program.registerLabel}</Link>
        </div>
      </section>
    </>
  );
}
