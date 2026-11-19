"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeacherForm } from "@/components/admin/teacher-form";
import { classPay } from "@/lib/faculty";
import { programName } from "@/lib/palette";
import type { Faculty, FacultyDay, FacultyPay } from "@/lib/types";

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function TeacherDetail({ teacher, days, pays, today }: { teacher: Faculty; days: FacultyDay[]; pays: FacultyPay[]; today: string }) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<"unpaid" | "paid">("unpaid");
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const owed = pays.filter((pay) => pay.status === "due" && pay.kind !== "deducted");
  const paid = pays.filter((pay) => pay.status === "paid");
  const rows = view === "unpaid" ? owed : paid;
  const todayMark = days.find((item) => item.date === date)?.status;

  async function mark(status: "present" | "absent") {
    setPending(status);
    setError("");
    const response = await fetch("/api/v1/admin/faculty/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: teacher.id, date, status }),
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

  async function remove() {
    const sure = window.confirm(`Delete ${teacher.fullName}? Their attendance and class pay will be removed too.`);
    if (!sure) return;
    setPending("delete");
    setError("");
    const response = await fetch(`/api/v1/admin/faculty/${teacher.id}`, { method: "DELETE" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not delete this teacher.");
      return;
    }
    router.push("/admin/teacher");
    router.refresh();
  }

  async function settle(id: string, status: "paid" | "due") {
    setPending(id);
    setError("");
    const response = await fetch(`/api/v1/admin/faculty/pay/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, paidOn: today }),
    });
    setPending("");
    if (!response.ok) {
      setError(status === "paid" ? "Could not mark this amount paid." : "Could not undo this payment.");
      return;
    }
    setView(status === "paid" ? "paid" : "unpaid");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <Link href="/admin/teacher" className="text-sm text-[var(--desk-muted)] hover:underline">All teachers</Link>
      <header className="rounded-3xl p-5 text-white" style={{ background: "linear-gradient(155deg, #065f46, #10b981)" }}>
        <p className="text-xs font-semibold tracking-[0.16em] uppercase">{programName(teacher.course)}</p>
        <h1 className="mt-1 text-3xl font-semibold">{teacher.fullName}</h1>
        <p className="mt-2 text-sm text-white/85">{teacher.phone}{teacher.email ? ` · ${teacher.email}` : ""}{teacher.note ? ` · ${teacher.note}` : ""}</p>
        <p className="mt-3 text-sm">Unpaid {rupees(owed.reduce((sum, pay) => sum + pay.amount, 0))} · Paid {rupees(paid.reduce((sum, pay) => sum + pay.amount, 0))} · {rupees(classPay(teacher.rate))} a class</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/admin/print?section=teachers&id=${teacher.id}`} className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-medium text-[#065f46]">Payment PDF</Link>
          <button type="button" onClick={() => setEditing((value) => !value)} className="h-10 rounded-xl border border-white/40 px-4 text-sm font-medium text-white">{editing ? "Close" : "Edit details"}</button>
          <button type="button" disabled={pending !== ""} onClick={() => void remove()} className="h-10 rounded-xl border border-white/40 px-4 text-sm font-medium text-white">Delete teacher</button>
        </div>
      </header>
      {editing ? <TeacherForm teacher={teacher} /> : null}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4">
        <label className="text-sm">Class day<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 h-11 rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card-2)] px-3" /></label>
        <button type="button" disabled={pending !== ""} onClick={() => mark("present")} className={`h-11 rounded-xl px-4 text-sm font-medium ${todayMark === "present" ? "bg-emerald-400 text-[#06281c]" : "border border-[var(--desk-line)]"}`}>Present · add {rupees(classPay(teacher.rate))}</button>
        <button type="button" disabled={pending !== ""} onClick={() => mark("absent")} className={`h-11 rounded-xl px-4 text-sm font-medium ${todayMark === "absent" ? "bg-rose-400 text-[#3b1020]" : "border border-[var(--desk-line)]"}`}>Absent</button>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="flex gap-2">
        <button type="button" onClick={() => setView("unpaid")} className={`h-10 rounded-full px-4 text-sm font-medium ${view === "unpaid" ? "bg-[#9a3412] text-white" : "border border-[var(--desk-line)]"}`}>Unpaid</button>
        <button type="button" onClick={() => setView("paid")} className={`h-10 rounded-full px-4 text-sm font-medium ${view === "paid" ? "bg-[#1e3a8a] text-white" : "border border-[var(--desk-line)]"}`}>Paid</button>
      </div>
      <ul className="grid gap-2">
        {rows.map((pay) => (
          <li key={pay.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-4 py-3 text-sm">
            <span>{pay.classDate} · {rupees(pay.amount)}{pay.note ? ` · ${pay.note}` : ""}</span>
            {pay.status === "paid" ? (
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">Paid {pay.paidOn}</span>
                <button type="button" disabled={pending !== ""} onClick={() => void settle(pay.id, "due")} className="h-9 rounded-full border border-white/30 px-3 text-xs font-medium">Undo</button>
              </span>
            ) : <button type="button" disabled={pending !== ""} onClick={() => void settle(pay.id, "paid")} className="h-9 rounded-full bg-[#1e3a8a] px-4 text-xs font-medium text-white">Pay</button>}
          </li>
        ))}
        {rows.length === 0 ? <li className="rounded-2xl border border-dashed border-[var(--desk-line)] px-4 py-8 text-sm text-[var(--desk-muted)]">{view === "unpaid" ? "No unpaid classes." : "No paid classes yet."}</li> : null}
      </ul>
    </div>
  );
}
