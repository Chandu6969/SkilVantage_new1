"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { callHref, displayPhone, initials } from "@/lib/batches";
import { TeacherForm } from "@/components/admin/teacher-form";
import { CLASS_SESSIONS, classPay } from "@/lib/faculty";
import { programName } from "@/lib/palette";
import { dayLabel } from "@/components/admin/desk-charts";
import type { ClassRecordKind, Faculty, FacultyPay } from "@/lib/types";

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function monthKey(iso: string) {
  return /^\d{4}-\d{2}/.test(iso) ? iso.slice(0, 7) : "";
}

function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year || 2026, (month || 1) - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftDay(iso: string, delta: number) {
  const [year, month, date] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, (date || 1) + delta)).toISOString().slice(0, 10);
}

function monthTitle(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
}

const looks = [
  { from: "#065f46", to: "#10b981" },
  { from: "#1e3a8a", to: "#3b82f6" },
  { from: "#5b21b6", to: "#8b5cf6" },
  { from: "#9a3412", to: "#f97316" },
  { from: "#9f1239", to: "#f43f5e" },
  { from: "#155e75", to: "#22d3ee" },
  { from: "#3f6212", to: "#84cc16" },
  { from: "#7c2d12", to: "#fb923c" },
];

const cardShapes = [
  "min-h-[15rem] rounded-[1.15rem]",
  "min-h-[18rem] rounded-[2.4rem]",
  "min-h-[14rem] rounded-[0.85rem]",
  "min-h-[19rem] rounded-[2.8rem]",
  "min-h-[16.5rem] rounded-[1.7rem]",
];

const tabShapes = [
  "rounded-md px-2.5 py-1 text-[11px]",
  "rounded-xl px-4 py-1.5 text-sm",
  "rounded-lg px-3 py-1 text-xs",
  "rounded-[1.35rem] px-5 py-2 text-sm",
  "rounded-2xl px-3.5 py-1 text-xs",
];

const field = "mt-1 h-10 w-full rounded-xl bg-[#232a3d] px-3 text-sm text-white outline-none disabled:text-white/40";

export function FacultyBoard({ teachers, pays, today }: { teachers: Faculty[]; pays: FacultyPay[]; today: string }) {
  const router = useRouter();
  const [month, setMonth] = useState(monthKey(today) || today.slice(0, 7));
  const [date, setDate] = useState(today);
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || "");
  const [filterId, setFilterId] = useState("all");
  const [subject, setSubject] = useState(teachers[0] ? programName(teachers[0].course) : "");
  const [session, setSession] = useState("");
  const [kind, setKind] = useState<ClassRecordKind>("taken");
  const [selectedId, setSelectedId] = useState("");
  const [report, setReport] = useState<"daily" | "monthly" | "all">("daily");
  const [filters, setFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [payState, setPayState] = useState<Record<string, "paid" | "due">>({});
  const teacher = teachers.find((item) => item.id === teacherId);

  function statusOf(pay: FacultyPay) {
    return payState[pay.id] || pay.status;
  }

  const selected = teachers.find((item) => item.id === selectedId);
  const visiblePays = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return pays.filter((pay) => {
      const person = teachers.find((item) => item.id === pay.teacherId);
      if (selectedId && pay.teacherId !== selectedId) return false;
      if (!selectedId && filterId !== "all" && pay.teacherId !== filterId) return false;
      if (needle && !person?.fullName.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [filterId, pays, query, selectedId, teachers]);

  const periodPays = visiblePays.filter((pay) => {
    if (report === "all" || selectedId) return true;
    if (report === "daily") return pay.classDate === date;
    return pay.classDate.startsWith(month);
  });
  const taken = periodPays.filter((pay) => pay.kind !== "deducted");
  const deducted = periodPays.filter((pay) => pay.kind === "deducted");
  const gross = taken.reduce((sum, pay) => sum + pay.amount, 0);
  const deduction = deducted.reduce((sum, pay) => sum + pay.amount, 0);
  const paidTotal = taken.filter((pay) => statusOf(pay) === "paid").reduce((sum, pay) => sum + pay.amount, 0);
  const dueTotal = taken.filter((pay) => statusOf(pay) !== "paid").reduce((sum, pay) => sum + pay.amount, 0);

  function chooseTeacher(id: string) {
    setTeacherId(id);
    const next = teachers.find((item) => item.id === id);
    if (next) setSubject(programName(next.course));
  }

  function chooseDate(iso: string) {
    setDate(iso);
    setMonth(iso.slice(0, 7));
  }

  async function mark(event: React.FormEvent) {
    event.preventDefault();
    setPending("mark");
    setError("");
    const response = await fetch("/api/v1/admin/faculty/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, classDate: date, subject, session, kind }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not mark this class.");
      return;
    }
    setMonth(monthKey(date) || month);
    router.refresh();
  }

  async function removeClass(pay: FacultyPay) {
    const name = teachers.find((item) => item.id === pay.teacherId)?.fullName || "this teacher";
    const sure = window.confirm(`Remove this class for ${name} on ${dayLabel(pay.classDate)}?`);
    if (!sure) return;
    setPending(pay.id);
    setError("");
    const response = await fetch(`/api/v1/admin/faculty/pay/${pay.id}`, { method: "DELETE" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not remove this class.");
      return;
    }
    router.refresh();
  }

  async function removeTeacher(person: Faculty) {
    const sure = window.confirm(`Delete ${person.fullName}? Their classes and class pay will be removed too.`);
    if (!sure) return;
    setPending(person.id);
    setError("");
    const response = await fetch(`/api/v1/admin/faculty/${person.id}`, { method: "DELETE" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not delete this teacher.");
      return;
    }
    if (teacherId === person.id) {
      const next = teachers.find((item) => item.id !== person.id);
      chooseTeacher(next?.id || "");
    }
    if (filterId === person.id) setFilterId("all");
    if (selectedId === person.id) setSelectedId("");
    router.refresh();
  }

  function openTeacher(person: Faculty) {
    setSelectedId(person.id);
    setFilterId(person.id);
    chooseTeacher(person.id);
    setReport("all");
    window.setTimeout(() => document.getElementById("teacher-record")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  async function togglePay(pay: FacultyPay) {
    if (pay.kind === "deducted") return;
    const next = statusOf(pay) === "paid" ? "due" : "paid";
    setPending(pay.id);
    setError("");
    setPayState((current) => ({ ...current, [pay.id]: next }));
    const response = await fetch(`/api/v1/admin/faculty/pay/${pay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, paidOn: today }),
    });
    setPending("");
    if (!response.ok) {
      setPayState((current) => {
        const copy = { ...current };
        delete copy[pay.id];
        return copy;
      });
      setError(next === "paid" ? "Could not mark this class paid." : "Could not undo this payment.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid min-w-0 gap-3 text-white">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {teachers.length === 0 ? <p className="rounded-3xl border border-dashed border-white/15 p-8 text-sm text-white/70 sm:col-span-2">No teachers yet. Use Add teacher, then record a class below.</p> : null}
        {teachers.map((person, index) => (
          <TeacherCard
            key={person.id}
            person={person}
            index={index}
            pays={pays}
            payState={payState}
            pending={pending !== ""}
            selected={person.id === selectedId}
            onOpen={() => openTeacher(person)}
            onDelete={() => void removeTeacher(person)}
            onPay={(pay) => void togglePay(pay)}
          />
        ))}
      </div>

      <section id="teacher-record" className="min-w-0 rounded-[28px] bg-[#141824] p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3 px-1 pt-1">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#0f766e]">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{selected ? selected.fullName : "Teacher record"}</h1>
              <p className="mt-0.5 text-sm text-[#9aa6bd]">{selected ? "All records for this teacher" : report === "daily" ? "One day at a time" : report === "monthly" ? "The full month" : "Every class"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href={selected ? `/admin/print?section=teachers&id=${selected.id}` : "/admin/print?section=teachers"} className="inline-flex h-10 items-center rounded-xl bg-[#065f46] px-3 text-sm font-medium text-white">
              Print PDF
            </Link>
            {selected ? (
              <button type="button" onClick={() => { setSelectedId(""); setFilterId("all"); setReport("daily"); }} className="h-10 rounded-xl bg-[#232a3d] px-3 text-sm font-medium text-white">All teachers</button>
            ) : null}
            <label className="sr-only" htmlFor="teacher-report">Report</label>
            <select
              id="teacher-report"
              value={selected ? "all" : report}
              onChange={(event) => {
                const next = event.target.value;
                setReport(next === "monthly" ? "monthly" : next === "all" ? "all" : "daily");
                if (next !== "all") setSelectedId("");
              }}
              className="h-10 rounded-xl bg-[#232a3d] px-3 text-sm font-medium text-white outline-none"
              style={{ colorScheme: "dark" }}
            >
              <option value="all">All records</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
            {!selected && report === "monthly" ? (
              <div className="flex items-center gap-1 rounded-xl bg-[#232a3d] px-1.5 py-1">
                <button type="button" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))} className="grid size-8 place-items-center rounded-lg text-[#c5cde0] hover:bg-white/10">
                  <ChevronLeft className="size-4" />
                </button>
                <span className="inline-flex h-8 items-center gap-2 px-2 text-sm font-medium">
                  <CalendarDays className="size-4 text-[#86efac]" aria-hidden="true" />
                  {monthTitle(month)}
                </span>
                <button type="button" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))} className="grid size-8 place-items-center rounded-lg text-[#c5cde0] hover:bg-white/10">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            ) : !selected && report === "daily" ? (
              <div className="flex items-center gap-1 rounded-xl bg-[#232a3d] px-1.5 py-1">
                <button type="button" aria-label="Previous day" onClick={() => chooseDate(shiftDay(date, -1))} className="grid size-8 place-items-center rounded-lg text-[#c5cde0] hover:bg-white/10">
                  <ChevronLeft className="size-4" />
                </button>
                <label className="inline-flex h-8 items-center gap-2 px-2 text-sm font-medium">
                  <CalendarDays className="size-4 text-[#86efac]" aria-hidden="true" />
                  <span className="sr-only">Class day</span>
                  <input type="date" value={date} onChange={(event) => event.target.value && chooseDate(event.target.value)} className="bg-transparent text-sm outline-none" style={{ colorScheme: "dark" }} />
                </label>
                <button type="button" aria-label="Next day" onClick={() => chooseDate(shiftDay(date, 1))} className="grid size-8 place-items-center rounded-lg text-[#c5cde0] hover:bg-white/10">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={() => setFilters((open) => !open)} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm ${filters || filterId !== "all" || query.trim() ? "bg-[#4f6dff] text-white" : "bg-[#232a3d] text-[#d5dced]"}`}>
            <Filter className="size-4" aria-hidden="true" />
            Filter
          </button>
        </div>
        {filters ? (
          <div className="mt-3 grid gap-3 rounded-2xl bg-[#1b2130] p-3 sm:grid-cols-2">
            <label className="text-xs text-[#9aa6bd]">
              Teacher
              <select value={filterId} onChange={(event) => setFilterId(event.target.value)} className="mt-1 h-10 w-full rounded-xl bg-[#232a3d] px-3 text-sm text-white outline-none" style={{ colorScheme: "dark" }}>
                <option value="all">All teachers</option>
                {teachers.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
              </select>
            </label>
            <label className="text-xs text-[#9aa6bd]">
              Name
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a teacher" className="mt-1 h-10 w-full rounded-xl bg-[#232a3d] px-3 text-sm text-white outline-none placeholder:text-[#7f8aa3]" />
            </label>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl bg-[#1b2130] p-3 sm:p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{selected ? `${selected.fullName}'s class record` : report === "daily" ? "Daily teacher record" : report === "monthly" ? "Monthly teacher record" : "All teacher records"}</h2>
              <p className="mt-0.5 text-sm text-[#9aa6bd]">{selected ? "Every class on file" : report === "daily" ? dayLabel(date) : report === "monthly" ? monthTitle(month) : "Every class"} · {taken.length} classes taken · Gross {rupees(gross)} · Deduction {rupees(deduction)} · Net {rupees(gross - deduction)}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Stat label="Classes taken" value={String(taken.length)} hint={selected || report === "all" ? "Every class" : report === "daily" ? dayLabel(date) : monthTitle(month)} tone="text-emerald-300" />
            <Stat label="Gross" value={rupees(gross)} hint="Taken classes" tone="text-[#d5dced]" />
            <Stat label="Deduction" value={rupees(deduction)} hint="Deducted classes" tone="text-rose-300" />
            <Stat label="Net payable" value={rupees(gross - deduction)} hint="Gross minus deduction" tone="text-[#c4b5fd]" />
            <Stat label="Paid" value={rupees(paidTotal)} hint="Marked paid" tone="text-emerald-300" />
            <Stat label="Due" value={rupees(dueTotal)} hint="Still to pay" tone="text-amber-300" />
          </div>

          <form onSubmit={mark} className="mt-4 grid gap-3 lg:grid-cols-7 lg:items-end">
            <label className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">Date
              <input type="date" required value={date} onChange={(event) => chooseDate(event.target.value)} className={field} style={{ colorScheme: "dark" }} />
            </label>
            <label className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">Teacher
              <select required value={teacherId} onChange={(event) => chooseTeacher(event.target.value)} className={field} style={{ colorScheme: "dark" }}>
                {(selected ? teachers.filter((item) => item.id === selected.id) : teachers).map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">Course / Subject
              <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Course or subject" className={field} />
            </label>
            <label className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">Class / Session
              <select required value={session} onChange={(event) => setSession(event.target.value)} className={field} style={{ colorScheme: "dark" }}>
                <option value="">Select session</option>
                {CLASS_SESSIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">Amount per class
              <input readOnly value={teacher ? rupees(classPay(teacher.rate)) : ""} placeholder="Select teacher" className={field} />
            </label>
            <label className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">Status
              <select value={kind} onChange={(event) => setKind(event.target.value as ClassRecordKind)} className={field} style={{ colorScheme: "dark" }}>
                <option value="taken">Class Taken</option>
                <option value="deducted">Deducted</option>
              </select>
            </label>
            <button type="submit" disabled={pending !== "" || teachers.length === 0} className="h-10 rounded-xl bg-[#0f766e] px-4 text-sm font-semibold text-white disabled:opacity-60">
              {pending === "mark" ? "Saving…" : kind === "taken" ? "Mark class taken" : "Mark deduction"}
            </button>
          </form>
          <p className="mt-3 text-sm text-[#9aa6bd]">The amount per class comes from the teacher profile. Pay marks a taken class as paid, and Undo puts it back.</p>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

          <ul className="mt-3 grid gap-2">
            {periodPays.length === 0 ? <li className="rounded-xl bg-[#232a3d] px-4 py-6 text-sm text-[#c5cde0]">No class marked{selected ? ` for ${selected.fullName}` : report === "daily" ? ` for ${dayLabel(date)}` : report === "monthly" ? ` for ${monthTitle(month)}` : ""}.</li> : null}
            {periodPays
              .slice()
              .sort((a, b) => a.classDate.localeCompare(b.classDate) || a.createdAt.localeCompare(b.createdAt))
              .map((pay) => {
                const person = teachers.find((item) => item.id === pay.teacherId);
                const deductedRow = pay.kind === "deducted";
                const paid = statusOf(pay) === "paid";
                return (
                  <li key={pay.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#232a3d] px-3 py-2.5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold">{initials(person?.fullName || "Teacher")}</span>
                    <span className="min-w-0 flex-1">
                      {person ? <Link href={`/admin/teacher/${person.id}`} className="block truncate font-medium hover:underline">{person.fullName}</Link> : <span className="block truncate font-medium">Teacher</span>}
                      <span className="block truncate text-sm text-[#9aa6bd]">{dayLabel(pay.classDate)} · {pay.subject || (person ? programName(person.course) : "Course")} · {pay.session || "Class"} · {rupees(pay.amount)}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${deductedRow ? "bg-rose-400/15 text-rose-200" : "bg-emerald-400/15 text-emerald-200"}`}>{deductedRow ? "DEDUCTED" : "TAKEN"}</span>
                    {deductedRow ? null : paid ? (
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-[#052e16]">Paid</span>
                        <button type="button" disabled={pending !== ""} onClick={() => void togglePay(pay)} className="h-9 rounded-xl border border-white/20 px-3 text-xs font-medium text-white">Undo</button>
                      </span>
                    ) : (
                      <button type="button" disabled={pending !== ""} onClick={() => void togglePay(pay)} className="h-9 rounded-xl bg-[#1e3a8a] px-4 text-xs font-semibold text-white">Pay</button>
                    )}
                    <button type="button" disabled={pending !== ""} onClick={() => void removeClass(pay)} className="h-9 rounded-xl border border-rose-300/40 px-3 text-xs text-rose-100">Remove</button>
                  </li>
                );
              })}
          </ul>
        </div>
      </section>
    </div>
  );
}

function TeacherCard({
  person,
  index,
  pays,
  payState,
  pending,
  selected,
  onOpen,
  onDelete,
  onPay,
}: {
  person: Faculty;
  index: number;
  pays: FacultyPay[];
  payState: Record<string, "paid" | "due">;
  pending: boolean;
  selected: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onPay: (pay: FacultyPay) => void;
}) {
  const look = looks[index % looks.length]!;
  const shape = cardShapes[index % cardShapes.length]!;
  const tab = tabShapes[index % tabShapes.length]!;
  const mine = pays.filter((pay) => pay.teacherId === person.id && pay.kind !== "deducted");
  const due = mine.filter((pay) => (payState[pay.id] || pay.status) !== "paid").sort((a, b) => a.classDate.localeCompare(b.classDate));
  const latestPaid = mine.filter((pay) => (payState[pay.id] || pay.status) === "paid").sort((a, b) => b.classDate.localeCompare(a.classDate))[0];
  const href = callHref(person.phone);
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <article className={`relative bg-[#10221c] p-4 text-white ${shape} ${selected ? "ring-2 ring-white" : ""}`}>
        <TeacherForm teacher={person} onSaved={() => setEditing(false)} />
        <button type="button" onClick={() => setEditing(false)} className="mt-3 h-9 rounded-xl border border-white/40 px-3 text-sm">Cancel</button>
      </article>
    );
  }
  return (
    <article
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("a, button, select, input, textarea, label")) return;
        onOpen();
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter") onOpen();
      }}
      tabIndex={0}
      className={`relative cursor-pointer overflow-hidden p-4 text-white ${shape} ${selected ? "ring-2 ring-white" : ""}`}
      style={{ background: `linear-gradient(160deg, ${look.from}, ${look.to})` }}
    >
      <span className={`inline-flex max-w-full bg-white font-semibold ${tab}`} style={{ color: look.from }}>{programName(person.course)}</span>
      <span className="mt-4 grid size-16 place-items-center rounded-full bg-white text-xl font-semibold" style={{ color: look.from }}>{initials(person.fullName)}</span>
      <h2 className="mt-3 text-2xl font-semibold leading-tight">{person.fullName}</h2>
      {href ? <a href={href} className="mt-1 inline-block text-sm text-white underline-offset-2 hover:underline">{displayPhone(person.phone)}</a> : <p className="mt-1 text-sm text-white/80">{person.phone || "No phone"}</p>}
      <p className="mt-2 text-sm text-white/85">{rupees(classPay(person.rate))} a class{due.length ? ` · ${due.length} unpaid` : ""}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {due[0] ? (
          <button type="button" disabled={pending} onClick={() => onPay(due[0]!)} className="h-9 rounded-xl border border-white/55 bg-transparent px-3 text-sm">Pay</button>
        ) : latestPaid ? (
          <>
            <span className="inline-flex h-9 items-center rounded-xl bg-white px-3 text-sm font-semibold" style={{ color: look.from }}>Paid</span>
            <button type="button" disabled={pending} onClick={() => onPay(latestPaid)} className="h-9 rounded-xl border border-white/55 px-3 text-sm">Undo</button>
          </>
        ) : (
          <span className="inline-flex h-9 items-center rounded-xl border border-white/40 px-3 text-sm text-white/80">No class yet</span>
        )}
        <button type="button" onClick={() => setEditing(true)} className="h-9 rounded-xl border border-white/55 px-3 text-sm">Edit</button>
        <button type="button" disabled={pending} onClick={onDelete} className="h-9 rounded-xl border border-white/55 px-3 text-sm">Delete</button>
      </div>
    </article>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: string }) {
  return (
    <article className="rounded-2xl bg-[#232a3d] px-4 py-3">
      <p className="text-xs text-[#9aa6bd]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-[#7f8aa3]">{hint}</p>
    </article>
  );
}
