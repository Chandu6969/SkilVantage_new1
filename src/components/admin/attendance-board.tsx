"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Download, Filter } from "lucide-react";
import { avatarColor, displayPhone, initials } from "@/lib/batches";
import { todayIST } from "@/lib/dates";
import type { AttendanceMark, BatchMember, ClassDayStatus, LearnerType, TrainingBatch } from "@/lib/types";

const PAGE_SIZE = 6;

type View = "summary" | "detail";
type Audience = "all" | LearnerType;
type Cell = ClassDayStatus | "off" | "open";

const pill: Record<Cell, { label: string; className: string }> = {
  present: { label: "P", className: "bg-[#34d399] text-[#052e16]" },
  absent: { label: "A", className: "bg-[#fb7185] text-[#4c0519]" },
  leave: { label: "L", className: "bg-[#fbbf24] text-[#451a03]" },
  holiday: { label: "H", className: "bg-[#38bdf8] text-[#082f49]" },
  off: { label: "WO", className: "bg-[#c4b5fd] text-[#2e1065]" },
  open: { label: "—", className: "bg-[#31384c] text-[#a7b0c4]" },
};

function asMark(status: ClassDayStatus | undefined): ClassDayStatus | "" {
  return status === "present" || status === "absent" || status === "leave" || status === "holiday" ? status : "";
}

function nextMark(current: Cell): ClassDayStatus {
  if (current === "present") return "absent";
  if (current === "absent") return "leave";
  if (current === "leave") return "holiday";
  return "present";
}

function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1 + delta, 1)).toISOString().slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function daysOf(key: string) {
  const [year, month] = key.split("-").map(Number);
  const count = new Date(Date.UTC(year, month || 1, 0)).getUTCDate();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, (month || 1) - 1, index + 1));
    return {
      iso: date.toISOString().slice(0, 10),
      day: index + 1,
      weekday: date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      off: date.getUTCDay() === 0,
    };
  });
}

function learnerCode(member: BatchMember, batch?: TrainingBatch) {
  const tail = member.id.replace(/\W/g, "").slice(-4).toUpperCase() || "0000";
  return `${(batch?.name || "BATCH").slice(0, 12).toUpperCase()}/${tail}`;
}

export function AttendanceBoard({
  batches,
  members,
  marks,
  initialBatch = "",
}: {
  batches: TrainingBatch[];
  members: BatchMember[];
  marks: AttendanceMark[];
  initialBatch?: string;
}) {
  const router = useRouter();
  const today = todayIST();
  const opened = batches.find((batch) => batch.id === initialBatch);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [day, setDay] = useState(today);
  const [view, setView] = useState<View>("detail");
  const [audience, setAudience] = useState<Audience>(opened?.learnerType || "all");
  const [batchId, setBatchId] = useState(opened?.id || "all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(Boolean(opened));
  const [page, setPage] = useState(1);
  const [overrides, setOverrides] = useState<Record<string, ClassDayStatus>>({});
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");

  const days = useMemo(() => daysOf(month), [month]);
  const monthChoices = useMemo(() => {
    const keys = new Set<string>([month, day.slice(0, 7)]);
    for (let step = -11; step <= 1; step += 1) keys.add(shiftMonth(today.slice(0, 7), step));
    for (const mark of marks) if (/^\d{4}-\d{2}-\d{2}$/.test(mark.date)) keys.add(mark.date.slice(0, 7));
    return [...keys].sort().reverse();
  }, [day, marks, month, today]);

  const lookup = useMemo(() => {
    const map = new Map<string, ClassDayStatus>();
    for (const mark of marks) {
      if (mark.date.startsWith(month)) map.set(`${mark.memberId}|${mark.date}`, mark.status);
    }
    for (const [key, status] of Object.entries(overrides)) {
      if (key.includes(`|${month}`)) map.set(key, status);
    }
    return map;
  }, [marks, month, overrides]);

  function cellOf(memberId: string, iso: string, off: boolean): Cell {
    const status = lookup.get(`${memberId}|${iso}`);
    const marked = asMark(status);
    if (marked) return marked;
    return off ? "off" : "open";
  }

  const batchOf = useMemo(() => new Map(batches.map((batch) => [batch.id, batch])), [batches]);
  const visibleBatches = batches.filter((batch) => audience === "all" || batch.learnerType === audience);

  const roster = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members
      .filter((member) => {
        const batch = batchOf.get(member.batchId);
        if (!batch) return false;
        if (audience !== "all" && batch.learnerType !== audience) return false;
        if (batchId !== "all" && member.batchId !== batchId) return false;
        if (needle && !member.fullName.toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort((a, b) => {
        const order = (batchOf.get(a.batchId)?.sort || 0) - (batchOf.get(b.batchId)?.sort || 0);
        return order || a.fullName.localeCompare(b.fullName);
      });
  }, [audience, batchId, batchOf, members, query]);

  const totals = useMemo(() => {
    const tally = { present: 0, absent: 0, leave: 0, holiday: 0, open: 0, off: 0 };
    for (const member of roster) {
      for (const day of days) {
        if (day.iso > today) continue;
        const marked = asMark(lookup.get(`${member.id}|${day.iso}`));
        const cell: Cell = marked || (day.off ? "off" : "open");
        tally[cell] += 1;
      }
    }
    return tally;
  }, [days, lookup, roster, today]);

  const pages = Math.max(1, Math.ceil(roster.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = roster.slice(start, start + PAGE_SIZE);
  const filtering = audience !== "all" || batchId !== "all" || query.trim() !== "";

  function chooseAudience(next: Audience) {
    setAudience(next);
    setPage(1);
    if (next !== "all" && batchId !== "all" && batchOf.get(batchId)?.learnerType !== next) setBatchId("all");
  }

  function chooseMonth(next: string) {
    setMonth(next);
    setPage(1);
    setDay((current) => (current.startsWith(next) ? current : `${next}-01`));
  }

  function moveDay(delta: number) {
    const [year, monthPart, date] = day.split("-").map(Number);
    const next = new Date(Date.UTC(year, (monthPart || 1) - 1, (date || 1) + delta)).toISOString().slice(0, 10);
    setDay(next);
    setMonth(next.slice(0, 7));
    setPage(1);
  }

  function openDay(iso: string) {
    setDay(iso);
    setMonth(iso.slice(0, 7));
    document.getElementById("daily-attendance")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveMark(member: BatchMember, iso: string, status: ClassDayStatus) {
    const key = `${member.id}|${iso}`;
    setPending(key);
    setError("");
    setOverrides((currentMarks) => ({ ...currentMarks, [key]: status }));
    const response = await fetch("/api/v1/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: member.batchId, memberId: member.id, date: iso, status }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setOverrides((currentMarks) => {
        const next = { ...currentMarks };
        delete next[key];
        return next;
      });
      setError(data.error || "Could not save attendance.");
      return;
    }
    router.refresh();
  }

  if (batches.length === 0) {
    return (
      <section className="rounded-[28px] bg-[#141824] p-8 text-sm text-[#c5cde0]">
        Add a batch under Students or Professionals first. Attendance uses those names.
      </section>
    );
  }

  return (
    <div className="grid min-w-0 gap-3 text-white">
      <section className="min-w-0 rounded-[28px] bg-[#141824] p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 px-1 pt-1">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#6d5efc]">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Attendance</h1>
              <p className="mt-0.5 text-sm text-[#9aa6bd]">Daily list and the monthly grid, together</p>
            </div>
          </div>
          <MonthMenu
            month={month}
            choices={monthChoices}
            onPrevious={() => chooseMonth(shiftMonth(month, -1))}
            onNext={() => chooseMonth(shiftMonth(month, 1))}
            onChange={chooseMonth}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex rounded-xl bg-[#232a3d] p-1 text-sm">
            {(["summary", "detail"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={`h-9 rounded-lg px-4 capitalize ${view === item ? "bg-[#4f6dff] font-medium text-white" : "text-[#c5cde0]"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilters((open) => !open)}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm ${filters || filtering ? "bg-[#4f6dff] text-white" : "bg-[#232a3d] text-[#d5dced]"}`}
            >
              <Filter className="size-4" aria-hidden="true" />
              Filter
            </button>
            <Link href="/admin/print?section=attendance" className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-3 text-sm font-medium text-emerald-300">
              <Download className="size-4" aria-hidden="true" />
              Attendance export
            </Link>
          </div>
        </div>

        {filters ? (
          <div className="mt-3 grid gap-3 rounded-2xl bg-[#1b2130] p-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[#9aa6bd]">Group</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {([["all", "All"], ["student", "Students"], ["professional", "Professionals"]] as const).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => chooseAudience(key)} className={`h-9 rounded-lg px-3 text-sm ${audience === key ? "bg-[#4f6dff] text-white" : "bg-[#232a3d] text-[#d5dced]"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="text-xs text-[#9aa6bd]">
              Batch
              <select
                value={visibleBatches.some((batch) => batch.id === batchId) ? batchId : "all"}
                onChange={(event) => { setBatchId(event.target.value); setPage(1); }}
                className="mt-1 h-10 w-full rounded-xl bg-[#232a3d] px-3 text-sm text-white outline-none"
                style={{ colorScheme: "dark" }}
              >
                <option value="all">All batches</option>
                {visibleBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.label} · {batch.name}</option>)}
              </select>
            </label>
            <label className="text-xs text-[#9aa6bd]">
              Name
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder="Search a learner"
                className="mt-1 h-10 w-full rounded-xl bg-[#232a3d] px-3 text-sm text-white outline-none placeholder:text-[#7f8aa3]"
              />
            </label>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

        <DailyReport
          day={day}
          roster={roster}
          batchOf={batchOf}
          pending={pending}
          statusOf={(memberId) => asMark(lookup.get(`${memberId}|${day}`))}
          onPrevious={() => moveDay(-1)}
          onNext={() => moveDay(1)}
          onMark={saveMark}
        />

        <h2 className="mt-5 px-1 text-sm font-semibold text-[#d5dced]">Monthly attendance report</h2>
        {view === "summary" ? (
          <Summary month={monthLabel(month)} days={days} roster={roster} totals={totals} cellOf={cellOf} today={today} batchOf={batchOf} />
        ) : (
          <Detail
            days={days}
            today={today}
            roster={roster}
            slice={slice}
            start={start}
            pages={pages}
            currentPage={currentPage}
            batchOf={batchOf}
            pending={pending}
            selected={day}
            cellOf={cellOf}
            onPage={setPage}
            onToggle={(member, iso, current) => saveMark(member, iso, nextMark(current))}
            onOpenDay={openDay}
          />
        )}
      </section>

      {view === "detail" ? <LegendCard /> : null}
    </div>
  );
}

function longDay(iso: string) {
  const [year, month, date] = iso.split("-").map(Number);
  if (!year || !month || !date) return iso;
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function MonthMenu({
  month,
  choices,
  onPrevious,
  onNext,
  onChange,
}: {
  month: string;
  choices: string[];
  onPrevious: () => void;
  onNext: () => void;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <div className="flex items-center gap-1 rounded-xl bg-[#232a3d] px-1.5 py-1">
        <button type="button" aria-label="Previous month" onClick={onPrevious} className="grid size-8 place-items-center rounded-lg text-[#c5cde0] hover:bg-white/10">
          <ChevronLeft className="size-4" />
        </button>
        <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="inline-flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium text-white">
          <CalendarDays className="size-4 text-[#c4b5fd]" aria-hidden="true" />
          {monthLabel(month)}
        </button>
        <button type="button" aria-label="Next month" onClick={onNext} className="grid size-8 place-items-center rounded-lg text-[#c5cde0] hover:bg-white/10">
          <ChevronRight className="size-4" />
        </button>
      </div>
      {open ? (
        <>
          <button type="button" aria-label="Close month list" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <ul className="absolute right-0 z-50 mt-2 max-h-80 w-56 overflow-auto rounded-2xl bg-[#2c354c] p-1.5 text-white shadow-2xl ring-1 ring-white/15">
            {choices.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => { onChange(key); setOpen(false); }}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm ${key === month ? "bg-[#4f6dff] font-medium" : "hover:bg-white/10"}`}
                >
                  {monthLabel(key)}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function DailyReport({
  day,
  roster,
  batchOf,
  pending,
  statusOf,
  onPrevious,
  onNext,
  onMark,
}: {
  day: string;
  roster: BatchMember[];
  batchOf: Map<string, TrainingBatch>;
  pending: string;
  statusOf: (memberId: string) => ClassDayStatus | "";
  onPrevious: () => void;
  onNext: () => void;
  onMark: (member: BatchMember, iso: string, status: ClassDayStatus) => void;
}) {
  const present = roster.filter((member) => statusOf(member.id) === "present").length;
  const absent = roster.filter((member) => statusOf(member.id) === "absent").length;
  const leave = roster.filter((member) => statusOf(member.id) === "leave").length;
  const holiday = roster.filter((member) => statusOf(member.id) === "holiday").length;
  return (
    <section id="daily-attendance" className="mt-4 rounded-2xl bg-[#1b2130] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Daily attendance report</h2>
          <p className="mt-0.5 text-sm text-[#9aa6bd]">{longDay(day)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous day" onClick={onPrevious} className="grid size-9 place-items-center rounded-lg bg-[#232a3d] text-[#d5dced]">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" aria-label="Next day" onClick={onNext} className="grid size-9 place-items-center rounded-lg bg-[#232a3d] text-[#d5dced]">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm text-[#c5cde0]">{present} present · {absent} absent · {leave} leave · {holiday} holiday · {Math.max(roster.length - present - absent - leave - holiday, 0)} not marked</p>
      <ul className="mt-3 grid gap-2">
        {roster.length === 0 ? <li className="rounded-xl bg-[#232a3d] px-4 py-6 text-sm text-[#c5cde0]">No learners match this filter.</li> : null}
        {roster.map((member) => {
          const status = statusOf(member.id);
          const batch = batchOf.get(member.batchId);
          return (
            <li key={member.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#232a3d] px-3 py-2.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold" style={{ background: avatarColor(member.fullName) }}>{initials(member.fullName)}</span>
              <span className="min-w-0 flex-1">
                <Link href={`/admin/people/${member.id}`} className="block truncate font-medium hover:underline">{member.fullName}</Link>
                <span className="block truncate text-sm text-[#9aa6bd]">{displayPhone(member.phone) || "No phone"}{member.note ? ` · ${member.note}` : ""}{batch ? ` · ${batch.name}` : ""}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <button type="button" disabled={pending === `${member.id}|${day}`} onClick={() => onMark(member, day, "present")} className={`h-9 rounded-full px-3 text-xs font-semibold ${status === "present" ? "bg-[#34d399] text-[#052e16]" : "bg-white/10 text-white"}`}>Present</button>
                <button type="button" disabled={pending === `${member.id}|${day}`} onClick={() => onMark(member, day, "absent")} className={`h-9 rounded-full px-3 text-xs font-semibold ${status === "absent" ? "bg-[#fb7185] text-[#4c0519]" : "bg-[#fb7185]/15 text-[#fecdd3]"}`}>Absent</button>
                <button type="button" disabled={pending === `${member.id}|${day}`} onClick={() => onMark(member, day, "leave")} className={`h-9 rounded-full px-3 text-xs font-semibold ${status === "leave" ? "bg-[#fbbf24] text-[#451a03]" : "bg-[#fbbf24]/15 text-[#fde68a]"}`}>Leave</button>
                <button type="button" disabled={pending === `${member.id}|${day}`} onClick={() => onMark(member, day, "holiday")} className={`h-9 rounded-full px-3 text-xs font-semibold ${status === "holiday" ? "bg-[#38bdf8] text-[#082f49]" : "bg-[#38bdf8]/15 text-[#bae6fd]"}`}>Holiday</button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Summary({
  month,
  days,
  roster,
  totals,
  cellOf,
  today,
  batchOf,
}: {
  month: string;
  days: ReturnType<typeof daysOf>;
  roster: BatchMember[];
  totals: Record<Cell, number>;
  cellOf: (memberId: string, iso: string, off: boolean) => Cell;
  today: string;
  batchOf: Map<string, TrainingBatch>;
}) {
  const marked = totals.present + totals.absent;
  const rate = marked ? Math.round((totals.present / marked) * 100) : 0;
  const daily = days.map((day) => ({
    ...day,
    count: day.iso > today ? 0 : roster.filter((member) => cellOf(member.id, day.iso, day.off) === "present").length,
  }));
  const peak = Math.max(1, ...daily.map((day) => day.count));
  const groups = (["student", "professional"] as const).map((key) => {
    const people = roster.filter((member) => batchOf.get(member.batchId)?.learnerType === key);
    let present = 0;
    let absent = 0;
    let leave = 0;
    let holiday = 0;
    for (const member of people) {
      for (const day of days) {
        if (day.iso > today) continue;
        const cell = cellOf(member.id, day.iso, day.off);
        if (cell === "present") present += 1;
        if (cell === "absent") absent += 1;
        if (cell === "leave") leave += 1;
        if (cell === "holiday") holiday += 1;
      }
    }
    return { key, people: people.length, present, absent, leave, holiday };
  }).filter((group) => group.people > 0);

  return (
    <div className="mt-4 grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Present" value={totals.present} hint={month} tone="text-emerald-300" />
        <Stat label="Absent" value={totals.absent} hint="Marked days through today" tone="text-rose-300" />
        <Stat label="Leave" value={totals.leave} hint="Approved leave" tone="text-amber-300" />
        <Stat label="Holiday" value={totals.holiday} hint="Holiday marks" tone="text-sky-300" />
        <Stat label="Not marked" value={totals.open} hint="Weekdays still open" tone="text-[#d5dced]" />
        <Stat label="Attendance" value={`${rate}%`} hint={marked ? `${marked} class marks` : "No class marks yet"} tone="text-[#c4b5fd]" />
      </div>
      <div className="rounded-2xl bg-[#1b2130] p-4">
        <p className="text-sm font-medium">Present each day</p>
        <div className="mt-4 flex h-28 items-end gap-1">
          {daily.map((day) => (
            <div key={day.iso} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${day.day} ${day.weekday}: ${day.iso > today ? "ahead" : `${day.count} present`}`}>
              <div className={`w-full rounded-t ${day.off ? "bg-[#6d5efc]/70" : "bg-emerald-400"}`} style={{ height: `${day.iso > today ? 4 : Math.max(4, (day.count / peak) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-[#9aa6bd]">
          <span>1</span>
          <span>{days.length}</span>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {groups.map((group) => (
          <article key={group.key} className="rounded-2xl bg-[#1b2130] p-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#9aa6bd] uppercase">{group.key === "student" ? "Students" : "Professionals"}</p>
            <p className="mt-2 text-2xl font-semibold">{group.people} on the roster</p>
            <p className="mt-1 text-sm text-[#c5cde0]">{group.present} present · {group.absent} absent · {group.leave} leave · {group.holiday} holiday</p>
          </article>
        ))}
        {groups.length === 0 ? <p className="rounded-2xl bg-[#1b2130] px-4 py-6 text-sm text-[#c5cde0]">No learners match this filter.</p> : null}
      </div>
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: number | string; hint: string; tone: string }) {
  return (
    <article className="rounded-2xl bg-[#1b2130] px-4 py-3">
      <p className="text-xs text-[#9aa6bd]">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tracking-tight ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-[#7f8aa3]">{hint}</p>
    </article>
  );
}

function Detail({
  days,
  today,
  roster,
  slice,
  start,
  pages,
  currentPage,
  batchOf,
  pending,
  selected,
  cellOf,
  onPage,
  onToggle,
  onOpenDay,
}: {
  days: ReturnType<typeof daysOf>;
  today: string;
  roster: BatchMember[];
  slice: BatchMember[];
  start: number;
  pages: number;
  currentPage: number;
  batchOf: Map<string, TrainingBatch>;
  pending: string;
  selected: string;
  cellOf: (memberId: string, iso: string, off: boolean) => Cell;
  onPage: (page: number) => void;
  onToggle: (member: BatchMember, iso: string, current: Cell) => void;
  onOpenDay: (iso: string) => void;
}) {
  const pageNumbers = pageWindow(currentPage, pages);
  return (
    <div className="mt-4 overflow-hidden rounded-2xl bg-[#1b2130]">
      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-[#9aa6bd]">
              <th className="sticky top-0 left-0 z-30 box-border hidden w-12 min-w-12 bg-[#1b2130] px-3 py-3 text-left font-medium lg:table-cell">#</th>
              <th className="sticky top-0 left-0 z-30 box-border w-40 min-w-40 bg-[#1b2130] px-3 py-3 text-left font-medium shadow-[8px_0_12px_-10px_rgb(0_0_0/0.8)] lg:w-56 lg:min-w-56 lg:shadow-none lg:left-12">Learner</th>
              <th className="sticky top-0 z-30 box-border hidden w-36 min-w-36 bg-[#1b2130] px-3 py-3 text-left font-medium lg:table-cell" style={{ left: 272 }}>Batch</th>
              <th className="sticky top-0 z-30 box-border hidden w-28 min-w-28 bg-[#1b2130] px-3 py-3 text-left font-medium shadow-[8px_0_12px_-10px_rgb(0_0_0/0.8)] lg:table-cell" style={{ left: 416 }}>Status</th>
              {days.map((day) => (
                <th key={day.iso} className={`sticky top-0 z-20 w-12 px-1 py-1 text-center font-medium ${day.iso === selected ? "bg-[#4f6dff] text-white" : day.iso === today ? "bg-[#243056] text-white" : "bg-[#1b2130]"}`}>
                  <button type="button" onClick={() => onOpenDay(day.iso)} className="w-full rounded-lg py-1" aria-label={`Open ${day.iso} in the daily report`}>
                    <span className="block text-xs">{day.day}</span>
                    <span className={`block text-[10px] font-normal ${day.off ? "text-[#c4b5fd]" : day.iso === selected ? "text-white/80" : "text-[#7f8aa3]"}`}>{day.weekday}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((member, index) => {
              const batch = batchOf.get(member.batchId);
              return (
                <tr key={member.id} className="group">
                  <td className="sticky left-0 z-10 box-border hidden w-12 min-w-12 bg-[#1b2130] px-3 py-3 text-[#9aa6bd] group-hover:bg-[#232a3d] lg:table-cell">{start + index + 1}</td>
                  <td className="sticky left-0 z-10 box-border w-40 min-w-40 max-w-40 bg-[#1b2130] px-3 py-2.5 shadow-[8px_0_12px_-10px_rgb(0_0_0/0.8)] group-hover:bg-[#232a3d] lg:w-56 lg:min-w-56 lg:max-w-56 lg:shadow-none lg:left-12">
                    <Link href={`/admin/people/${member.id}`} className="flex items-center gap-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold" style={{ background: avatarColor(member.fullName) }}>{initials(member.fullName)}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{member.fullName}</span>
                        <span className="block truncate text-[11px] text-[#7f8aa3]">{learnerCode(member, batch)}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="sticky z-10 box-border hidden w-36 min-w-36 bg-[#1b2130] px-3 py-3 group-hover:bg-[#232a3d] lg:table-cell" style={{ left: 272 }}>
                    <span className="text-xs tracking-wide text-[#d5dced] uppercase">{batch?.name || "Batch"}</span>
                  </td>
                  <td className="sticky z-10 box-border hidden w-28 min-w-28 bg-[#1b2130] px-3 py-3 shadow-[8px_0_12px_-10px_rgb(0_0_0/0.8)] group-hover:bg-[#232a3d] lg:table-cell" style={{ left: 416 }}>
                    <span className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">Active</span>
                  </td>
                  {days.map((day) => {
                    const cell = cellOf(member.id, day.iso, day.off);
                    const look = pill[cell];
                    const key = `${member.id}|${day.iso}`;
                    return (
                      <td key={day.iso} className={`px-1 py-2 text-center ${day.iso === selected ? "bg-[#4f6dff]/25" : day.iso === today ? "bg-[#243056]/80 group-hover:bg-[#2a3864]" : "group-hover:bg-[#232a3d]"}`}>
                        <button
                          type="button"
                          disabled={pending === key}
                          onClick={() => onToggle(member, day.iso, cell)}
                          aria-label={`${member.fullName} ${day.iso} ${look.label === "—" ? "not marked" : look.label}`}
                          className={`inline-grid h-7 min-w-7 place-items-center rounded-full px-1 text-[10px] font-bold disabled:opacity-50 ${look.className}`}
                        >
                          {look.label}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {slice.length === 0 ? <p className="px-4 py-8 text-sm text-[#c5cde0]">No learners match this filter.</p> : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-4 py-3 text-sm text-[#9aa6bd]">
        <p>Showing {roster.length === 0 ? 0 : start + 1}–{Math.min(start + PAGE_SIZE, roster.length)} of {roster.length}</p>
        <div className="flex items-center gap-1">
          <button type="button" disabled={currentPage === 1} onClick={() => onPage(currentPage - 1)} className="grid size-8 place-items-center rounded-lg hover:bg-white/10 disabled:opacity-30">
            <ChevronLeft className="size-4" />
          </button>
          {pageNumbers.map((item, index) => (
            <span key={`${item}-${index}`} className="contents">
              {index > 0 && item - pageNumbers[index - 1]! > 1 ? <span className="px-1">…</span> : null}
              <button type="button" onClick={() => onPage(item)} className={`grid size-8 place-items-center rounded-lg text-xs ${item === currentPage ? "bg-[#4f6dff] text-white" : "hover:bg-white/10"}`}>{item}</button>
            </span>
          ))}
          <button type="button" disabled={currentPage === pages} onClick={() => onPage(currentPage + 1)} className="grid size-8 place-items-center rounded-lg hover:bg-white/10 disabled:opacity-30">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <p className="px-4 pb-3 text-xs text-[#7f8aa3]">Click a date to open that day in the daily report. Click a circle to move through present, absent, leave, and holiday.</p>
    </div>
  );
}

function pageWindow(current: number, total: number) {
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  return [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}

function LegendCard() {
  const items = [
    { label: "P Present", className: "bg-[#34d399]" },
    { label: "A Absent", className: "bg-[#fb7185]" },
    { label: "L Leave", className: "bg-[#fbbf24]" },
    { label: "H Holiday", className: "bg-[#38bdf8]" },
    { label: "WO Week off", className: "bg-[#c4b5fd]" },
    { label: "— Not marked", className: "bg-[#31384c]" },
  ];
  return (
    <section className="rounded-[24px] bg-[#141824] px-4 py-4 sm:px-5">
      <h2 className="text-sm font-semibold">Attendance status legend</h2>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#d5dced]">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className={`size-3 rounded-full ${item.className}`} />
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
