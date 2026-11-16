import Link from "next/link";
import { BarChart3, Bot, Cpu, LineChart, Sparkles } from "lucide-react";
import type { Program } from "@/lib/content";
import { programGradient } from "@/lib/palette";

const icons = {
  "data-analyst": BarChart3,
  "data-scientist": LineChart,
  "ai-ml": Cpu,
  "generative-ai": Sparkles,
  "agentic-ai": Bot,
};

export function ProgramCard({ program, index }: { program: Program; index: number }) {
  const Icon = icons[program.slug];
  return (
    <article
      className="sv-color-card relative flex h-full flex-col overflow-hidden rounded-[1.7rem] p-6 text-white shadow-[0_18px_40px_rgb(16_40_30_/_0.12)]"
      style={{ background: programGradient(program.slug) }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-white/20">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="font-heading text-2xl text-white/80">0{index + 1}</span>
      </div>
      <h3 className="mt-5 text-2xl">
        <Link href={`/programs/${program.slug}`} className="hover:text-white">
          {program.name}
        </Link>
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-white/85">{program.description}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {program.skills.slice(0, 4).map((skill) => (
          <li key={skill} className="rounded-full bg-white/20 px-2.5 py-1 text-xs">
            {skill}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-white/90">
        {program.roles.slice(0, 3).join(" · ")}
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Link href={`/roadmaps/${program.slug}`} className="inline-flex h-11 items-center justify-center rounded-full bg-white px-4 text-sm text-[#10281c]">
          {program.roadmapLabel}
        </Link>
        <Link href={`/register?program=${program.slug}`} className="inline-flex h-11 items-center justify-center rounded-full border border-white/70 px-4 text-sm text-white">
          {program.registerLabel}
        </Link>
      </div>
    </article>
  );
}
