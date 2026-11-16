const looks = {
  "data-analyst": { from: "#065f46", to: "#10b981" },
  "data-scientist": { from: "#1e3a8a", to: "#3b82f6" },
  "ai-ml": { from: "#5b21b6", to: "#8b5cf6" },
  "generative-ai": { from: "#9a3412", to: "#f97316" },
  "agentic-ai": { from: "#9f1239", to: "#f43f5e" },
} as const;

export type ProgramLook = { from: string; to: string };

export function programLook(slug: string): ProgramLook {
  return looks[slug as keyof typeof looks] ?? looks["data-analyst"];
}

export function programGradient(slug: string) {
  const look = programLook(slug);
  return `linear-gradient(155deg, ${look.from} 0%, ${look.to} 100%)`;
}
