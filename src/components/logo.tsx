import { cn } from "cn";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="10" fill={light ? "rgb(255 255 255 / 0.14)" : "#e8f8ee"} />
        <path d="M8 21.5 16 9.5l8 12" fill="none" stroke="#12a36a" strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="16" cy="9.5" r="1.7" fill="#12a36a" />
      </svg>
      <span className={cn("font-heading text-[1.35rem] leading-none tracking-tight", light ? "text-white" : "text-[#10281c]")}>
        <span className={light ? "text-[#b6ffd0]" : "text-[#12a36a]"}>Skil</span>Vantage
      </span>
    </span>
  );
}
