import type { Metadata } from "next";
import Link from "next/link";
import { getProgram, projectGroups } from "@/lib/content";
import { courseWash, programLook } from "@/lib/palette";

export const metadata: Metadata = {
  title: "Real-World Projects",
  description:
    "Projects in SkilVantage career programs: analytics dashboards, data science models, AI applications, RAG systems and AI agents for a job-ready portfolio.",
};

export default function ProjectsPage() {
  return (
    <>
      <section className="sv-band">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs tracking-[0.16em] text-copper uppercase">Portfolio</p>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">Build Real-World Projects</h1>
          <p className="mt-4 max-w-2xl text-lg text-paper/75">
            Projects are how a reviewer sees that you can apply a skill. Each one is practiced inside a program, then written up for a portfolio.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
        {projectGroups.map((group) => {
          const program = getProgram(group.slug);
          return (
            <article key={group.title} className="sv-course-body rounded-[1.7rem] p-6" style={courseWash(group.slug)}>
              <h2 className="text-3xl">{group.title}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {group.items.map((item) => {
                  const detail = program?.projects.find((project) => project.title === item);
                  return (
                    <div key={item} className="sv-course-panel rounded-2xl p-4">
                      <h3 className="text-lg">{item}</h3>
                      <p className="mt-1 text-sm">{detail?.summary}</p>
                    </div>
                  );
                })}
              </div>
              <Link href={`/programs/${group.slug}`} className="mt-5 inline-flex text-sm font-semibold underline-offset-4 hover:underline" style={{ color: programLook(group.slug).from }}>
                See this work inside the {program?.name} program
              </Link>
            </article>
          );
        })}
      </section>
    </>
  );
}
