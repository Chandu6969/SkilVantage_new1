import Link from "next/link";
import { Bell, Briefcase, GraduationCap, Search } from "lucide-react";
import { initials } from "@/lib/batches";
import { programs } from "@/lib/content";
import { addDaysIST, istDate, todayIST } from "@/lib/dates";
import { isFollowUpPending } from "@/lib/metrics";
import { programName } from "@/lib/palette";
import type { Registration } from "@/lib/types";

function clock(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(date);
}

function shortDay(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return day;
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function RegistrationsBoard({ rows }: { rows: Registration[] }) {
  const today = todayIST();
  const days = Array.from({ length: 10 }, (_, index) => addDaysIST(index - 9));
  const students = rows.filter((row) => row.learnerType === "student").length;
  const professionals = rows.filter((row) => row.learnerType === "professional").length;
  const todayCount = rows.filter((row) => istDate(row.createdAt) === today).length;
  const followUps = rows.filter((row) => isFollowUpPending(row, today));
  const series = days.map((day) => {
    const onDay = rows.filter((row) => istDate(row.createdAt) === day);
    return { day, total: onDay.length };
  });
  const peak = series.reduce((best, item) => (item.total >= best.total ? item : best), series[0]!);
  const courses = programs.map((program) => ({ name: program.name, count: rows.filter((row) => row.program === program.slug).length }));
  const recent = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);

  return (
    <div className="rounded-[28px] bg-[#16122e] p-3 text-white sm:p-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric tint="linear-gradient(160deg, #7c6bff, #5b4dff)" title="People registered" value={rows.length} of={rows.length} hint="all registrations" />
            <Metric tint="linear-gradient(160deg, #49d4ff, #2aa8f0)" title="Students" value={students} of={rows.length} hint={`of ${rows.length} total`} />
            <Metric tint="linear-gradient(160deg, #8b6cff, #6a4dff)" title="Professionals" value={professionals} of={rows.length} hint={`of ${rows.length} total`} />
            <Metric tint="linear-gradient(160deg, #e879f9, #c026d3)" title="Signed up today" value={todayCount} of={rows.length} hint={`of ${rows.length} · ${shortDay(today)}`} />
          </div>
          <section className="rounded-[24px] bg-[#1c1738] p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Registrations in time</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{shortDay(days[0]!)} – {shortDay(today)}</span>
            </div>
            <AreaChart series={series} peak={peak} />
          </section>
          <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-[24px] bg-[#1c1738] p-4">
              <h2 className="font-semibold">Latest signups</h2>
              <ul className="mt-3 grid gap-2">
                {recent.length === 0 ? <li className="text-sm text-white/60">No registrations in this view.</li> : null}
                {recent.map((lead) => (
                  <li key={lead.id}>
                    <Link href={`/admin/leads/${lead.id}`} className="flex items-center gap-3 rounded-2xl bg-[#241e42] px-3 py-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#6d4dff] text-xs font-semibold">{initials(lead.fullName)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{lead.fullName}</span>
                        <span className="block truncate text-xs text-white/60">{programName(lead.program)} · {lead.learnerType === "student" ? "Student" : "Professional"} · {lead.status}</span>
                      </span>
                      <span className="text-xs text-white/60">{clock(lead.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-[24px] bg-[#1c1738] p-4">
              <h2 className="font-semibold">Daily total</h2>
              <p className="text-xs text-white/60">{shortDay(days[0]!)} – {shortDay(today)}</p>
              <AreaChart series={series} peak={peak} compact />
            </section>
          </div>
        </div>
        <aside className="grid content-start gap-3">
          <section className="rounded-[24px] bg-[#1c1738] p-4">
            <h2 className="font-semibold">Registration desk</h2>
            <ul className="mt-3 grid gap-3">
              <DeskRow icon={Bell} title="Follow-ups" detail={`${followUps.length} people are waiting for a call or a reply.`} href={followUps[0] ? `/admin/leads/${followUps[0].id}` : "/admin/leads"} />
              <DeskRow icon={GraduationCap} title="Students" detail={`${students} student signups across the courses.`} href="/admin/students" />
              <DeskRow icon={Briefcase} title="Professionals" detail={`${professionals} working professionals have registered.`} href="/admin/professionals" />
              <DeskRow icon={Search} title="Courses" detail={courses.map((course) => `${course.name} ${course.count}`).join(" · ")} href="/admin/leads" />
            </ul>
          </section>
          <section className="rounded-[24px] bg-[#1c1738] p-4">
            <h2 className="font-semibold">By course</h2>
            <ul className="mt-3 grid gap-3">
              {courses.map((course) => (
                <li key={course.name}>
                  <div className="mb-1 flex justify-between text-xs text-white/80"><span>{course.name}</span><span>{course.count}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#49d4ff] to-[#8b6cff]" style={{ width: `${rows.length ? (course.count / rows.length) * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Metric({ tint, title, value, of, hint }: { tint: string; title: string; value: number; of: number; hint: string }) {
  const share = percent(value, of);
  const radius = 15;
  const length = 2 * Math.PI * radius;
  return (
    <article className="rounded-[22px] p-4" style={{ background: tint }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/90">{title}</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight">{String(value).padStart(2, "0")}</p>
          <p className="mt-1 text-xs text-white/80">{hint}</p>
        </div>
        <span className="relative mt-0.5 grid size-14 shrink-0 place-items-center">
          <svg viewBox="0 0 44 44" className="size-14 -rotate-90">
            <circle cx="22" cy="22" r={radius} fill="none" stroke="rgb(255 255 255 / 0.28)" strokeWidth="3" />
            <circle cx="22" cy="22" r={radius} fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${(share / 100) * length} ${length}`} strokeLinecap="round" />
          </svg>
          <span className="absolute text-[11px] leading-none font-semibold">{share}%</span>
        </span>
      </div>
    </article>
  );
}

function DeskRow({ icon: Icon, title, detail, href }: { icon: typeof Bell; title: string; detail: string; href: string }) {
  return (
    <li>
      <Link href={href} className="flex gap-3 rounded-2xl bg-[#241e42] p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10"><Icon className="size-4" /></span>
        <span>
          <span className="block text-sm font-medium">{title}</span>
          <span className="mt-0.5 block text-xs leading-4 text-white/60">{detail}</span>
        </span>
      </Link>
    </li>
  );
}

function AreaChart({ series, peak, compact = false }: { series: { day: string; total: number }[]; peak: { day: string; total: number }; compact?: boolean }) {
  const width = 640;
  const height = compact ? 150 : 220;
  const padX = 16;
  const padY = 18;
  const max = Math.max(1, ...series.map((item) => item.total));
  const points = series.map((item, index) => ({
    x: padX + (series.length === 1 ? 0 : (index / (series.length - 1)) * (width - padX * 2)),
    y: height - padY - (item.total / max) * (height - padY * 2),
    ...item,
  }));
  let line = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]!;
    const next = points[index + 1]!;
    const mid = (current.x + next.x) / 2;
    line += ` C ${mid} ${current.y}, ${mid} ${next.y}, ${next.x} ${next.y}`;
  }
  const area = `${line} L ${points.at(-1)!.x} ${height} L ${points[0]!.x} ${height} Z`;
  const marker = points.reduce((best, point) => (point.total >= best.total ? point : best), points[0]!);
  const label = series.filter((_, index) => compact ? index % 3 === 0 : true);
  return (
    <div className="mt-2">
      <svg viewBox={`0 0 ${width} ${height}`} className={compact ? "h-32 w-full" : "h-52 w-full"} role="img" aria-label="Registrations by date">
        <defs>
          <linearGradient id={compact ? "reg-area-sm" : "reg-area"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c6bff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#3d7dff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#49d4ff" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${compact ? "reg-area-sm" : "reg-area"})`} />
        <path d={line} fill="none" stroke="#d7dcff" strokeWidth="2" />
        <circle cx={marker.x} cy={marker.y} r="5" fill="white" />
        {!compact ? (
          <g>
            <rect x={Math.min(marker.x - 36, width - 84)} y={Math.max(marker.y - 42, 8)} width="72" height="28" rx="8" fill="#2a2350" />
            <text x={Math.min(marker.x - 36, width - 84) + 36} y={Math.max(marker.y - 42, 8) + 18} textAnchor="middle" fill="white" fontSize="12">{peak.total} · {shortDay(peak.day)}</text>
          </g>
        ) : null}
      </svg>
      <div className="grid text-[11px] text-white/55" style={{ gridTemplateColumns: `repeat(${label.length}, minmax(0, 1fr))` }}>
        {label.map((item) => <span key={item.day} className="text-center">{shortDay(item.day)}</span>)}
      </div>
    </div>
  );
}
