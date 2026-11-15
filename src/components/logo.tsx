import { cn } from "cn";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={light ? "#F6F1E8" : "#10203A"} />
        <path d="M8 21.5 16 9.5l8 12" fill="none" stroke="#C56A32" strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="16" cy="9.5" r="1.7" fill="#C56A32" />
      </svg>
      <span className={cn("font-heading text-[1.35rem] leading-none tracking-tight", light ? "text-paper" : "text-ink")}>
        Skil<span className="text-copper">Vantage</span>
      </span>
    </span>
  );
}
