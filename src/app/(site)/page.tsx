import Link from "next/link";
import { Compass, FolderKanban, MessagesSquare, Mic, Briefcase, Building2 } from "lucide-react";
import { FaqList } from "@/components/faq-list";
import { ProgramCard } from "@/components/program-card";
import { QuoteRotator } from "@/components/quote-rotator";
import { brand, communicationTopics, faqs, jobSteps, journey, professionalAudience, programs, projectGroups, studentAudience, trustCards, whyCards } from "@/lib/content";

const whyIcons = [Building2, FolderKanban, Briefcase, MessagesSquare, Mic, Compass];

const organization = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "SkilVantage",
  description: brand.about,
  email: "hello@skilvantage.com",
  areaServed: "IN",
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} />
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="hero-grid absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-copper uppercase">Career training consultancy</p>
            <h1 className="mt-4 max-w-xl text-5xl leading-[1.02] text-paper sm:text-6xl">
              Build Skills That Build Your Career.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper/75">
              Industry-focused training programs for students, freshers and working professionals in Data, AI, ML, Generative AI and Agentic AI.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/programs" className="inline-flex h-12 items-center justify-center rounded-xl bg-copper px-5 text-base text-white">
                Explore Courses
              </Link>
              <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-xl border border-paper/30 px-5 text-base">
                Register Now
              </Link>
              <Link href="/contact?intent=counselling" className="inline-flex h-12 items-center justify-center px-2 text-base text-paper/80 underline-offset-4 hover:underline">
                Talk to a Career Advisor
              </Link>
            </div>
            <p className="mt-8 max-w-lg border-l-2 border-copper pl-4 text-paper/90">{brand.communication}</p>
            <div className="mt-8 max-w-xl">
              <QuoteRotator light />
            </div>
          </div>
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <p className="text-xs tracking-[0.16em] text-copper uppercase">{brand.bridge}</p>
            <ol className="mt-4 grid grid-cols-2 gap-3">
              {["Foundation", "Core Skills", "Advanced Skills", "Projects", "Portfolio", "Resume", "Interview Preparation", "Job Ready"].map((step, index) => (
                <li key={step} className="rounded-2xl border border-white/10 px-3 py-3">
                  <span className="text-xs text-copper">0{index + 1}</span>
                  <p className="mt-1 text-sm">{step}</p>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
          {[
            ["05", "Career programs, from analyst to agentic AI"],
            ["02", "Tracks for students and working professionals"],
            ["03", "Online, offline, and hybrid learning modes"],
          ].map(([value, label]) => (
            <p key={label} className="text-sm text-muted-foreground">
              <span className="mr-2 font-heading text-2xl text-ink">{value}</span>
              {label}
            </p>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-medium tracking-[0.16em] text-copper uppercase">Why SkilVantage?</p>
        <h2 className="mt-3 max-w-2xl text-4xl text-ink">A career path, not a pile of tools.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {whyCards.map((card, index) => {
            const Icon = whyIcons[index]!;
            return (
              <article key={card.title} className="rounded-3xl border border-border bg-card p-5">
                <Icon className="size-5 text-copper" aria-hidden="true" />
                <h3 className="mt-4 text-xl text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
              </article>
            );
          })}
        </div>
        <p className="mt-8 max-w-3xl font-heading text-2xl leading-snug text-ink">{brand.promise}</p>
      </section>

      <section className="bg-secondary/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-medium tracking-[0.16em] text-copper uppercase">Who Can Join?</p>
          <h2 className="mt-3 text-4xl text-ink">Two ways in. The same standard of work.</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl bg-ink p-6 text-paper sm:p-8">
              <h3 className="text-3xl">Students & Freshers</h3>
              <ul className="mt-5 space-y-2 text-paper/80">
                {studentAudience.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <Link href="/register?type=student" className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-copper text-white sm:w-auto sm:px-5">
                Explore Student Programs
              </Link>
            </article>
            <article className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h3 className="text-3xl text-ink">Working Professionals</h3>
              <ul className="mt-5 space-y-2 text-muted-foreground">
                {professionalAudience.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <Link href="/register?type=professional" className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-ink text-paper sm:w-auto sm:px-5">
                Explore Professional Programs
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section id="programs" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-medium tracking-[0.16em] text-copper uppercase">Choose Your Career Path</p>
        <h2 className="mt-3 max-w-2xl text-4xl text-ink">Five programs. One idea of being ready.</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">Open a program to see who it is for, the full roadmap, the projects, and how students and professionals move through it.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((program, index) => <ProgramCard key={program.slug} program={program} index={index} />)}
        </div>
      </section>

      <section className="bg-ink text-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] sm:py-20">
          <div>
            <p className="text-xs tracking-[0.16em] text-copper uppercase">Communication</p>
            <h2 className="mt-3 text-4xl">Technical Skills + Communication = Career Success</h2>
            <p className="mt-4 text-lg text-paper/80">Knowing the answer is important. Communicating the answer is what makes you stand out.</p>
            <p className="mt-4 text-paper/70">{brand.communication}</p>
            <Link href="/register?focus=communication" className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-copper text-white sm:w-auto sm:px-5">
              Improve My Communication Skills
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {communicationTopics.map((topic) => (
              <li key={topic.title} className="rounded-2xl border border-white/10 p-4">
                <p className="font-medium">{topic.title}</p>
                <p className="mt-1 text-sm text-paper/70">{topic.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-copper uppercase">Become Job Ready</p>
            <h2 className="mt-3 text-4xl text-ink">Six steps from the first lesson to the interview.</h2>
          </div>
          <Link href="/job-ready" className="text-sm underline-offset-4 hover:underline">See the full job-readiness path</Link>
        </div>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobSteps.map((step, index) => (
            <li key={step.title} className="rounded-3xl border border-border bg-card p-5">
              <span className="font-heading text-3xl text-copper">0{index + 1}</span>
              <h3 className="mt-2 text-xl text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.16em] text-copper uppercase">Projects</p>
          <h2 className="mt-3 text-4xl text-ink">Build Real-World Projects</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projectGroups.slice(0, 3).map((group) => (
              <article key={group.title} className="rounded-3xl bg-card p-5">
                <h3 className="text-xl text-ink">{group.title}</h3>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {group.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
          <Link href="/projects" className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-ink px-5 text-paper">
            View all project work
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-4xl text-ink">Why Learners Choose SkilVantage</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustCards.map((card) => (
            <article key={card.title} className="rounded-3xl border border-border p-5">
              <h3 className="text-lg text-ink">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <h2 className="text-4xl text-ink">A simple path</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {journey.map((step, index) => (
            <li key={step} className="rounded-2xl bg-secondary px-3 py-4 text-sm">
              <span className="text-copper">0{index + 1}</span>
              <p className="mt-1 text-ink">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-4xl text-ink">Questions before you register</h2>
        <div className="mt-6">
          <FaqList items={faqs} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl bg-ink px-6 py-10 text-paper sm:px-10">
          <h2 className="max-w-xl text-4xl">Start with a conversation, or go straight to registration.</h2>
          <p className="mt-3 max-w-2xl text-paper/75">Tell us whether you are a student or a working professional. The career team reviews every registration and contacts you. A seat is confirmed only after that conversation.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-xl bg-copper px-5 text-white">Register Now</Link>
            <Link href="/contact?intent=counselling" className="inline-flex h-12 items-center justify-center rounded-xl border border-paper/30 px-5">Talk to a Career Advisor</Link>
          </div>
        </div>
      </section>
    </>
  );
}
