import type { LearnerType } from "@/lib/types";

export type Slice = { label: string; value: number; color: string };

export const audienceTheme: Record<LearnerType, { title: string; noun: string; from: string; to: string; wash: string; band: string }> = {
  student: {
    title: "Students",
    noun: "student",
    from: "#065f46",
    to: "#10b981",
    wash: "#d1fae5",
    band: "linear-gradient(155deg, #065f46, #10b981)",
  },
  professional: {
    title: "Professionals",
    noun: "professional",
    from: "#312e81",
    to: "#818cf8",
    wash: "#e0e7ff",
    band: "linear-gradient(155deg, #312e81, #6366f1)",
  },
};

export function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function dayLabel(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return day;
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function Ring({ slices, caption }: { slices: Slice[]; caption?: string }) {
  const active = slices.filter((slice) => slice.value > 0);
  const total = active.reduce((sum, slice) => sum + slice.value, 0);
  const circumference = 2 * Math.PI * 52;
  let offset = 0;
  return (
    <div className="mx-auto grid size-36 place-items-center">
      <svg viewBox="0 0 140 140" className="col-start-1 row-start-1 size-36" role="img" aria-label="Chart">
        <circle cx="70" cy="70" r="52" fill="none" stroke="#e7f6ee" strokeWidth="18" />
        {total
          ? active.map((slice) => {
            const length = Math.max(8, (slice.value / total) * circumference - 3);
            const node = (
              <circle key={slice.label} cx="70" cy="70" r="52" fill="none" stroke={slice.color} strokeWidth="18" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />
            );
            offset += length + 3;
            return node;
          })
          : null}
      </svg>
      <p className="col-start-1 row-start-1 text-center text-lg font-semibold leading-5">{caption ?? String(slices.reduce((sum, slice) => sum + slice.value, 0))}</p>
    </div>
  );
}

export function Legend({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  return (
    <ul className="grid gap-2">
      {slices.map((slice) => (
        <li key={slice.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 font-medium"><span className="size-3 rounded-full" style={{ background: slice.color }} />{slice.label}</span>
          <span>{slice.value}{total ? ` · ${Math.round((slice.value / total) * 100)}%` : ""}</span>
        </li>
      ))}
    </ul>
  );
}
