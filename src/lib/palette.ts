import type { CSSProperties } from "react";

const looks = {
  "data-analyst": { from: "#065f46", to: "#10b981", name: "Data Analyst" },
  "data-scientist": { from: "#1e3a8a", to: "#3b82f6", name: "Data Scientist" },
  "ai-ml": { from: "#5b21b6", to: "#8b5cf6", name: "AI / ML" },
  "generative-ai": { from: "#9a3412", to: "#f97316", name: "Generative AI" },
  "agentic-ai": { from: "#9f1239", to: "#f43f5e", name: "Agentic AI" },
} as const;

export const programChoices = (Object.keys(looks) as (keyof typeof looks)[]).map((slug) => ({
  slug,
  name: looks[slug].name,
}));

export type ProgramLook = { from: string; to: string };

export function programLook(slug: string): ProgramLook {
  const look = looks[slug as keyof typeof looks] ?? looks["data-analyst"];
  return { from: look.from, to: look.to };
}

export function programName(slug: string) {
  return looks[slug as keyof typeof looks]?.name ?? "Course";
}

export function programGradient(slug: string) {
  const look = programLook(slug);
  return `linear-gradient(155deg, ${look.from} 0%, ${look.to} 100%)`;
}

export function courseVars(slug: string) {
  const look = programLook(slug);
  return {
    "--course": look.from,
    "--course-soft": look.to,
  } as CSSProperties;
}

export function courseWash(slug: string) {
  const look = programLook(slug);
  return {
    ...courseVars(slug),
    background: `linear-gradient(180deg, color-mix(in srgb, ${look.to} 52%, white), color-mix(in srgb, ${look.from} 40%, white))`,
    color: look.from,
  } as CSSProperties;
}
