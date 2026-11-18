import Link from "next/link";
import { Briefcase, CalendarDays, GraduationCap, Users } from "lucide-react";
import { initials } from "@/lib/batches";
import { programs } from "@/lib/content";
import { addDaysIST, istDate, todayIST } from "@/lib/dates";
import { isFollowUpPending } from "@/lib/metrics";
import { programName } from "@/lib/palette";
import type { Registration } from "@/lib/types";

function rupeesClock(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(date);
}

function shortDay(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return day;
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function RegistrationsBoard({ rows }: { rows: Registration[] }) {
  const today = todayIST();
  const days = Array.from({ length: 10 }, (_, index) => addDaysIST(index - 9));
  const students = rows.filter((row) => row.learnerType === "student").length;
  const professionals = rows.filter((row) => row.learnerType === "professional").length;
  const todayCount = rows.filter((row) => istDate(row.createdAt) === today).length;
  const series = days.map((day) => {
    const onDay = rows.filter((row) => istDate(row.createdAt) === day);
    return {
      day,
      student: onDay.filter((row) => row.learnerType === "student").length,
      professional: onDay.filter((row) => row.learnerType === "professional").length,
    };
  });
  const courses = programs.map((program) => ({
    name: program.name,
    count: rows.filter((row) => row.program === program.slug).length,
    color: program.slug === "data-analyst" ? "#ff8a1e" : program.slug === "data-scientist" ? "#3db7ff" : program.slug === "ai-ml" ? "#8b6cff" : program.slug === "generative-ai" ? "#f5a524" : "#22d3ee",
  }));
  const followUps = rows.filter((row) => isFollowUpPending(row, today)).slice(0, 4);
  const recent = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const statuses = [
    { label: "New", count: rows.filter((row) => row.status === "New").length },
    { label: "Follow-up", count: rows.filter((row) => row.status === "Follow-up Required").length },
    { label: "Training", count: rows.filter((row) => row.status === "Training Started" || row.status === "Registered").length },
  ];

  return (
    <div className="rounded-[28px] bg-[#171c2c] p-3 text-white sm:p-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Users} tint="#ff7a18" title="People registered" value={String(rows.length)} detail="Every matching registration" />
            <Stat icon={GraduationCap} tint="#7c4dff" title="Students" value={String(students)} detail="Student and fresher signups" />
            <Stat icon={Briefcase} tint="#f5a524" title="Professionals" value={String(professionals)} detail="Working professional signups" />
            <Stat icon={CalendarDays} tint="#2ec8ff" title="Signed up today" value={String(todayCount)} detail={shortDay(today)} />
          </div>
          <section className="rounded-[24px] bg-[#6d4dff] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Registrations by date</h2>
              <p className="flex gap-3 text-xs">
                <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-white" /> Students</span>
                <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[#ffb020]" /> Professionals</span>
              </p>
            </div>
            <DateChart series={series} />
          </section>
          <section className="rounded-[24px] bg-[#22283a] p-4">
            <h2 className="text-lg font-semibold">Recent registrations</h2>
            <ul className="mt-3 grid gap-2">
              {recent.length === 0 ? <li className="text-sm text-white/70">No registrations in this view.</li> : null}
              {recent.map((lead, index) => (
                <li key={lead.id}>
                  <Link href={`/admin/leads/${lead.id}`} className={`flex items-center gap-3 rounded-full px-3 py-2 ${index === 0 ? "bg-[#6d4dff]" : "hover:bg-white/5"}`}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-semibold">{initials(lead.fullName)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{lead.fullName}</span>
                      <span className="block truncate text-xs text-white/70">{programName(lead.program)} · {lead.learnerType === "student" ? "Student" : "Professional"}</span>
                    </span>
                    <span className="hidden text-sm text-white/80 sm:block">{lead.status}</span>
                    <span className="text-xs text-white/70">{rupeesClock(lead.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="grid content-start gap-3">
          <section className="rounded-[24px] bg-[#22283a] p-4">
            <h2 className="font-semibold">Courses</h2>
            <p className="text-xs text-white/60">How the registrations split</p>
            <ul className="mt-4 grid gap-3">
              {courses.map((course) => (
                <li key={course.name}>
                  <div className="mb-1 flex justify-between text-xs"><span>{course.name}</span><span>{course.count}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${rows.length ? (course.count / rows.length) * 100 : 0}%`, background: course.color }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[24px] bg-[#22283a] p-4">
            <h2 className="font-semibold">Follow-ups</h2>
            <ul className="mt-3 grid gap-3">
              {followUps.length === 0 ? <li className="text-sm text-white/70">No follow-up is waiting.</li> : null}
              {followUps.map((lead) => (
                <li key={lead.id}>
                  <Link href={`/admin/leads/${lead.id}`} className="flex items-center gap-3 text-sm">
                    <span className="grid size-8 place-items-center rounded-xl bg-white/10"><CalendarDays className="size-4" /></span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{lead.fullName}</span>
                      <span className="block text-xs text-white/60">{lead.followUpDate || lead.status}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[24px] bg-[#22283a] p-4">
            <h2 className="font-semibold">Status</h2>
            <ul className="mt-3 grid gap-3">
              {statuses.map((item) => (
                <li key={item.label} className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, tint, title, value, detail }: { icon: typeof Users; tint: string; title: string; value: string; detail: string }) {
  return (
    <article className="rounded-[22px] p-4" style={{ background: tint }}>
      <Icon className="size-5" aria-hidden="true" />
      <p className="mt-4 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm font-medium">{title}</p>
      <p className="text-xs text-white/80">{detail}</p>
    </article>
  );
}

function DateChart({ series }: { series: { day: string; student: number; professional: number }[] }) {
  const width = 640;
  const height = 220;
  const padX = 36;
  const padY = 24;
  const max = Math.max(1, ...series.flatMap((item) => [item.student, item.professional]));
  const step = series.length > 1 ? (width - padX * 2) / (series.length - 1) : 0;
  const point = (value: number, index: number) => {
    const x = padX + index * step;
    const y = height - padY - (value / max) * (height - padY * 2);
    return `${x},${y}`;
  };
  const students = series.map((item, index) => point(item.student, index)).join(" ");
  const professionals = series.map((item, index) => point(item.professional, index)).join(" ");
  const ticks = [0, Math.ceil(max / 2), max];
  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Registrations by date">
        {ticks.map((tick) => {
          const y = height - padY - (tick / max) * (height - padY * 2);
          return <g key={tick}><line x1={padX} x2={width - 12} y1={y} y2={y} stroke="rgb(255 255 255 / 0.2)" /><text x="4" y={y + 4} fill="white" fontSize="11">{tick}</text></g>;
        })}
        <polyline points={students} fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round" />
        <polyline points={professionals} fill="none" stroke="#ffb020" strokeWidth="3" strokeLinejoin="round" />
        {series.map((item, index) => {
          const [x, y] = point(item.student, index).split(",");
          const [px, py] = point(item.professional, index).split(",");
          return (
            <g key={item.day}>
              <circle cx={x} cy={y} r="4" fill="white" />
              <circle cx={px} cy={py} r="4" fill="#ffb020" />
            </g>
          );
        })}
      </svg>
      <div className="grid text-[11px] text-white/80" style={{ gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))` }}>
        {series.map((item) => <span key={item.day} className="text-center">{shortDay(item.day)}</span>)}
      </div>
    </div>
  );
}
