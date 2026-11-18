"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { classPay } from "@/lib/faculty";
import { programGradient, programLook, programName } from "@/lib/palette";
import type { Faculty, FacultyDay, FacultyPay } from "@/lib/types";

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function FacultyBoard({
  teachers,
  days,
  pays,
  today,
}: {
  teachers: Faculty[];
  days: FacultyDay[];
  pays: FacultyPay[];
  today: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [view, setView] = useState<"unpaid" | "paid">("unpaid");
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const dayMarks = days.filter((item) => item.date === date);
  const totals = useMemo(() => ({
    due: pays.filter((pay) => pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0),
    paid: pays.filter((pay) => pay.status === "paid").reduce((sum, pay) => sum + pay.amount, 0),
  }), [pays]);
  const rows = pays.filter((pay) => pay.status === view);

  async function mark(id: string, status: "present" | "absent") {
    setPending(id + status);
    setError("");
    const response = await fetch("/api/v1/admin/faculty/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: id, date, status }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save attendance.");
      return;
    }
    setView("unpaid");
    router.refresh();
  }

  async function remove(teacher: Faculty) {
    const sure = window.confirm(`Delete ${teacher.fullName}? Their attendance and class pay will be removed too.`);
    if (!sure) return;
    setPending(teacher.id);
    setError("");
    const response = await fetch(`/api/v1/admin/faculty/${teacher.id}`, { method: "DELETE" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not delete this teacher.");
      return;
    }
    router.refresh();
  }

  async function settle(id: string) {
    setPending(id);
    setError("");
    const response = await fetch(`/api/v1/admin/faculty/pay/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidOn: today }),
    });
    setPending("");
    if (!response.ok) {
      setError("Could not mark this amount paid.");
      return;
    }
    setView("paid");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl p-4 text-white" style={{ background: "linear-gradient(155deg, #065f46, #10b981)" }}>
          <p className="text-xs tracking-wide text-white/80">Teachers</p>
          <p className="mt-1 text-3xl font-semibold">{teachers.length}</p>
        </div>
        <button type="button" onClick={() => setView("unpaid")} className="rounded-2xl p-4 text-left text-white" style={{ background: "linear-gradient(155deg, #9a3412, #f97316)", outline: view === "unpaid" ? "3px solid white" : "none" }}>
          <p className="text-xs tracking-wide text-white/80">Unpaid</p>
          <p className="mt-1 text-3xl font-semibold">{rupees(totals.due)}</p>
        </button>
        <button type="button" onClick={() => setView("paid")} className="rounded-2xl p-4 text-left text-white" style={{ background: "linear-gradient(155deg, #1e3a8a, #3b82f6)", outline: view === "paid" ? "3px solid white" : "none" }}>
          <p className="text-xs tracking-wide text-white/80">Paid</p>
          <p className="mt-1 text-3xl font-semibold">{rupees(totals.paid)}</p>
        </button>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4">
        <label className="text-sm">
          Calendar day
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 h-11 rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card-2)] px-3" />
        </label>
        <p className="max-w-md text-sm text-[var(--desk-muted)]">Present adds that teacher&apos;s class pay to unpaid. The usual amount is {rupees(classPay(0))}.</p>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {teachers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--desk-line)] p-8 text-sm text-[var(--desk-muted)]">No teachers yet. Use Add teacher to fill in a name, course, and class pay.</p>
      ) : (
        <div className="grid gap-3">
          {teachers.map((teacher) => {
            const status = dayMarks.find((item) => item.teacherId === teacher.id)?.status;
            const owed = pays.filter((pay) => pay.teacherId === teacher.id && pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0);
            return (
              <article key={teacher.id} className="overflow-hidden rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)]">
                <div className="h-2" style={{ background: programGradient(teacher.course) }} />
                <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <Link href={`/admin/teacher/${teacher.id}`} className="font-medium hover:underline">{teacher.fullName}</Link>
                    <p className="mt-1 text-sm font-medium" style={{ color: programLook(teacher.course).to }}>{programName(teacher.course)}</p>
                    <p className="mt-1 text-sm text-[var(--desk-muted)]">{teacher.phone}{teacher.email ? ` · ${teacher.email}` : ""} · {rupees(classPay(teacher.rate))} a class</p>
                    <p className="mt-1 text-sm">Unpaid {rupees(owed)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={pending !== ""} onClick={() => mark(teacher.id, "present")} className={`h-10 rounded-xl px-4 text-sm font-medium ${status === "present" ? "bg-emerald-400 text-[#06281c]" : "border border-[var(--desk-line)]"}`}>Present</button>
                    <button type="button" disabled={pending !== ""} onClick={() => mark(teacher.id, "absent")} className={`h-10 rounded-xl px-4 text-sm font-medium ${status === "absent" ? "bg-rose-400 text-[#3b1020]" : "border border-[var(--desk-line)]"}`}>Absent</button>
                    <button type="button" disabled={pending !== ""} onClick={() => void remove(teacher)} className="h-10 rounded-xl border border-rose-400/70 px-4 text-sm font-medium text-rose-300">Delete</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => setView("unpaid")} className={`h-10 rounded-full px-4 text-sm font-medium ${view === "unpaid" ? "bg-[#9a3412] text-white" : "border border-[var(--desk-line)]"}`}>Unpaid</button>
        <button type="button" onClick={() => setView("paid")} className={`h-10 rounded-full px-4 text-sm font-medium ${view === "paid" ? "bg-[#1e3a8a] text-white" : "border border-[var(--desk-line)]"}`}>Paid</button>
      </div>
      <ul className="grid gap-2">
        {rows.map((pay) => {
          const teacher = teachers.find((item) => item.id === pay.teacherId);
          return (
            <li key={pay.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-4 py-3 text-sm">
              <span>
                <Link href={`/admin/teacher/${pay.teacherId}`} className="font-medium hover:underline">{teacher?.fullName || "Teacher"}</Link>
                <span className="text-[var(--desk-muted)]"> · {pay.classDate} · {rupees(pay.amount)}</span>
              </span>
              {pay.status === "paid" ? (
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-200">Paid {pay.paidOn}</span>
              ) : (
                <button type="button" disabled={pending !== ""} onClick={() => void settle(pay.id)} className="h-9 rounded-full bg-[#1e3a8a] px-4 text-xs font-medium text-white">Pay</button>
              )}
            </li>
          );
        })}
        {rows.length === 0 ? <li className="rounded-2xl border border-dashed border-[var(--desk-line)] px-4 py-8 text-sm text-[var(--desk-muted)]">{view === "unpaid" ? "Nothing unpaid. Mark a teacher present to add the class amount." : "Nothing paid yet. Use Pay on an unpaid class."}</li> : null}
      </ul>
    </div>
  );
}
