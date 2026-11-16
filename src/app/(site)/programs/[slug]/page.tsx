import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqList } from "@/components/faq-list";
import { JourneyTimeline } from "@/components/journey-timeline";
import { faqs, getProgram, programs } from "@/lib/content";

export function generateStaticParams() {
  return programs.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const program = getProgram((await params).slug);
  if (!program) return {};
  return {
    title: program.seoTitle,
    description: program.seoDescription,
    openGraph: { title: program.seoTitle, description: program.seoDescription },
  };
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const program = getProgram((await params).slug);
  if (!program) notFound();
  const courseJson = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${program.name} training`,
    description: program.seoDescription,
    provider: { "@type": "EducationalOrganization", name: "SkilVantage" },
    educationalLevel: program.level,
    timeRequired: program.duration,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJson).replace(/</g, "\\u003c") }} />
      <section className="sv-band">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs tracking-[0.16em] text-copper uppercase">Job-readiness focused training</p>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-6xl">{program.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-paper/80">{program.description}</p>
          <dl className="mt-6 flex flex-wrap gap-6 text-sm text-paper/70">
            <div><dt className="text-paper/50">Typical duration</dt><dd className="text-paper">{program.duration}</dd></div>
            <div><dt className="text-paper/50">Level</dt><dd className="text-paper">{program.level}</dd></div>
          </dl>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={`/roadmaps/${program.slug}`} className="inline-flex h-12 items-center justify-center rounded-xl bg-copper px-5 text-white">{program.roadmapLabel}</Link>
            <Link href={`/register?program=${program.slug}`} className="inline-flex h-12 items-center justify-center rounded-xl border border-paper/30 px-5">{program.registerLabel}</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6">
        <section>
          <h2 className="text-3xl text-ink">Course overview</h2>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">{program.overview}</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-border p-6">
            <h2 className="text-2xl text-ink">Who should join</h2>
            <h3 className="mt-4 text-lg">Students and freshers</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{program.whoStudents.map((item) => <li key={item}>{item}</li>)}</ul>
            <h3 className="mt-4 text-lg">Working professionals</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">{program.whoProfessionals.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="rounded-3xl bg-secondary p-6">
            <h2 className="text-2xl text-ink">Prerequisites</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">{program.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-border p-6">
            <h2 className="text-2xl text-ink">Student track</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">{program.studentTrack.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="rounded-3xl border border-border p-6">
            <h2 className="text-2xl text-ink">Professional track</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">{program.professionalTrack.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </section>

        <section>
          <h2 className="text-3xl text-ink">Skills covered</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {program.skills.map((skill) => <li key={skill} className="rounded-full border border-border px-3 py-1 text-sm">{skill}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-3xl text-ink">Tools and technologies</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {program.tools.map((tool) => <li key={tool} className="rounded-full bg-ink px-3 py-1 text-sm text-paper">{tool}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="text-3xl text-ink">Complete roadmap</h2>
          <ol className="mt-4 space-y-2">
            {program.curriculum.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <span className="w-8 text-copper">{String(index + 1).padStart(2, "0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-3xl text-ink">How the journey is organised</h2>
          <div className="mt-8"><JourneyTimeline program={program} /></div>
        </section>

        <section>
          <h2 className="text-3xl text-ink">Projects</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {program.projects.map((project) => (
              <article key={project.title} className="rounded-3xl bg-secondary p-5">
                <h3 className="text-xl text-ink">{project.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{project.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl text-ink">Learning methodology</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">{program.methodology.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {[
            ["Interview preparation", program.interviewPrep],
            ["Communication training", program.communication],
            ["Resume support", program.resumeSupport],
            ["Career guidance", program.careerGuidance],
          ].map(([title, items]) => (
            <article key={String(title)} className="rounded-3xl border border-border p-5">
              <h2 className="text-2xl text-ink">{title}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">{(items as string[]).map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </section>

        <section>
          <h2 className="text-3xl text-ink">Career roles</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {program.roles.map((role) => <li key={role} className="rounded-full border border-border px-3 py-1 text-sm">{role}</li>)}
          </ul>
          <p className="mt-4 max-w-3xl text-sm text-muted-foreground">These are roles the curriculum is aimed at. SkilVantage does not guarantee interviews or offers.</p>
        </section>

        <section>
          <h2 className="text-3xl text-ink">FAQ</h2>
          <div className="mt-4"><FaqList items={[...program.faqs, ...faqs.slice(0, 4)]} /></div>
        </section>

        <section className="rounded-3xl bg-ink p-6 text-paper sm:p-8">
          <h2 className="text-3xl">Ready to talk about {program.name}?</h2>
          <p className="mt-2 max-w-2xl text-paper/75">Register for counselling. The career team will contact you about fit, batch mode, and timing.</p>
          <Link href={`/register?program=${program.slug}`} className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-copper text-white sm:w-auto sm:px-5">{program.registerLabel}</Link>
        </section>
      </div>
      <div className="sticky bottom-0 z-30 border-t border-border bg-paper/95 p-3 backdrop-blur lg:hidden">
        <Link href={`/register?program=${program.slug}`} className="flex h-12 items-center justify-center rounded-xl sv-band">{program.registerLabel}</Link>
      </div>
    </>
  );
}
