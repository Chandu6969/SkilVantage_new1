"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

function monthTitle(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
}

const field = "mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#121826] px-3 text-sm text-white outline-none disabled:text-white/40";

export function FacultyBoard({ teachers, pays, today }: { teachers: Faculty[]; pays: FacultyPay[]; today: string }) {
  const router = useRouter();
  const [month, setMonth] = useState(monthKey(today) || today.slice(0, 7));
  const [date, setDate] = useState(today);
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || "");
  const [subject, setSubject] = useState(teachers[0] ? programName(teachers[0].course) : "");
  const [session, setSession] = useState("");
  const [kind, setKind] = useState<ClassRecordKind>("taken");
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [focus, setFocus] = useState("");
  const teacher = teachers.find((item) => item.id === (focus || teacherId));
  const rows = useMemo(
    () => pays.filter((pay) => pay.classDate.startsWith(month) && (!focus || pay.teacherId === focus)).sort((a, b) => b.classDate.localeCompare(a.classDate) || b.createdAt.localeCompare(a.createdAt)),
    [focus, pays, month],
  );
  const payouts = pays.filter((pay) => pay.teacherId === focus && pay.kind !== "deducted");
  const paidTotal = payouts.filter((pay) => pay.status === "paid").reduce((sum, pay) => sum + pay.amount, 0);
  const dueTotal = payouts.filter((pay) => pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0);
  const taken = rows.filter((pay) => pay.kind !== "deducted");
  const deducted = rows.filter((pay) => pay.kind === "deducted");
  const gross = taken.reduce((sum, pay) => sum + pay.amount, 0);
  const deduction = deducted.reduce((sum, pay) => sum + pay.amount, 0);
  const net = gross - deduction;
  const summary = `Classes Taken: ${taken.length} • Gross: ${rupees(gross)} • Deduction: ${rupees(deduction)} • Net: ${rupees(net)}`;

  function chooseTeacher(id: string) {
    setTeacherId(id);
    const next = teachers.find((item) => item.id === id);
    if (next) setSubject(programName(next.course));
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
    if (teacherId === person.id || focus === person.id) {
      const next = teachers.find((item) => item.id !== person.id);
      chooseTeacher(next?.id || "");
      setFocus("");
    }
    router.refresh();
  }

  function openTeacher(person: Faculty) {
    setFocus(person.id);
    chooseTeacher(person.id);
    setError("");
  }

  if (!focus) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {teachers.length === 0 ? <p className="rounded-3xl border border-dashed border-white/15 p-8 text-sm text-white/70 sm:col-span-2">No teachers yet. Use Add teacher, then open the card to record classes.</p> : null}
        {teachers.map((person) => (
          <article key={person.id} className="rounded-3xl border border-white/10 bg-[#161c2b] p-4 text-white">
            <button type="button" onClick={() => openTeacher(person)} className="block w-full text-left">
              <p className="text-xs font-semibold tracking-[0.14em] text-emerald-200 uppercase">{programName(person.course)}</p>
              <h2 className="mt-2 text-2xl font-semibold">{person.fullName}</h2>
              <p className="mt-2 text-sm text-white/70">{rupees(classPay(person.rate))} a class</p>
            </button>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button type="button" onClick={() => openTeacher(person)} className="h-9 rounded-xl bg-[#0f766e] px-3 text-sm font-medium">Open class record</button>
              <button type="button" disabled={pending !== ""} onClick={() => void removeTeacher(person)} className="h-9 rounded-xl border border-rose-300/40 px-3 text-sm text-rose-100">Delete</button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#161c2b] p-4 text-white sm:p-5">
      <button type="button" onClick={() => setFocus("")} className="mb-3 text-sm text-white/70 hover:underline">All teachers</button>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl bg-white/5 px-4 py-3">
          <p className="text-xs tracking-[0.14em] text-white/50 uppercase">Name</p>
          <p className="mt-1 text-xl font-semibold">{teacher?.fullName || "Teacher"}</p>
        </article>
        <article className="rounded-2xl bg-emerald-400/10 px-4 py-3">
          <p className="text-xs tracking-[0.14em] text-emerald-100/80 uppercase">Payment done</p>
          <p className="mt-1 text-xl font-semibold">{rupees(paidTotal)}</p>
        </article>
        <article className="rounded-2xl bg-amber-400/10 px-4 py-3">
          <p className="text-xs tracking-[0.14em] text-amber-100/80 uppercase">Payment due</p>
          <p className="mt-1 text-xl font-semibold">{rupees(dueTotal)}</p>
        </article>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} className="grid size-8 place-items-center rounded-full border border-white/15 text-lg" aria-label="Previous month">‹</button>
            <h2 className="text-2xl font-semibold">Teacher Class Record</h2>
            <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} className="grid size-8 place-items-center rounded-full border border-white/15 text-lg" aria-label="Next month">›</button>
          </div>
          <p className="mt-2 text-sm text-white/70">{monthTitle(month)} • {taken.length} classes taken • Gross {rupees(gross)} • Deduction {rupees(deduction)} • Net payable {rupees(net)}</p>
        </div>
        <p className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">{summary}</p>
      </div>

      <form onSubmit={mark} className="mt-5 grid gap-3 lg:grid-cols-7 lg:items-end">
        <label className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">Date
          <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className={field} style={{ colorScheme: "dark" }} />
        </label>
        <label className="text-xs font-semibold tracking-[0.14em] text-white/60 uppercase">Teacher
          <select required value={teacherId} onChange={(event) => chooseTeacher(event.target.value)} className={field} style={{ colorScheme: "dark" }}>
            {(focus ? teachers.filter((item) => item.id === focus) : teachers).map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
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
        <button type="submit" disabled={pending !== "" || teachers.length === 0} className="h-11 rounded-xl bg-[#0f766e] px-4 text-sm font-semibold text-white disabled:opacity-60">
          {pending === "mark" ? "Saving…" : kind === "taken" ? "✓ Mark Class Taken" : "✓ Mark deduction"}
        </button>
      </form>
      <p className="mt-3 rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-50">Select a teacher to load the saved <span className="font-semibold">Amount per Class</span>. The rate is stored on the teacher profile and is used automatically for new classes.</p>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs tracking-wide text-white/55 uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Teacher</th>
              <th className="px-3 py-2 font-medium">Course / Subject</th>
              <th className="px-3 py-2 font-medium">Class / Session</th>
              <th className="px-3 py-2 font-medium">Amount / Class</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((pay) => {
              const person = teachers.find((item) => item.id === pay.teacherId);
              const deductedRow = pay.kind === "deducted";
              return (
                <tr key={pay.id} className="border-t border-white/10">
                  <td className="px-3 py-3">{dayLabel(pay.classDate)}</td>
                  <td className="px-3 py-3">{person ? <Link href={`/admin/teacher/${person.id}`} className="font-medium hover:underline">{person.fullName}</Link> : "Teacher"}</td>
                  <td className="px-3 py-3">{pay.subject || (person ? programName(person.course) : "—")}</td>
                  <td className="px-3 py-3">{pay.session || "—"}</td>
                  <td className="px-3 py-3">{rupees(pay.amount)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${deductedRow ? "bg-rose-400/15 text-rose-200" : "bg-emerald-400/15 text-emerald-200"}`}>{deductedRow ? "DEDUCTED" : "TAKEN"}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button type="button" disabled={pending !== ""} onClick={() => void removeClass(pay)} className="h-9 rounded-lg bg-rose-950 px-3 text-xs font-semibold text-rose-100">Remove</button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-white/55">No class marked for {monthTitle(month)}.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

    </section>
  );
}
