"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { displayPhone } from "@/lib/batches";
import { todayIST } from "@/lib/dates";
import type { AssignmentProgress, AttendanceMark, BatchMember, ClassAssignment, ClassDayStatus, FeeKind, FeePayment, TrainingBatch } from "@/lib/types";
import { Legend, Ring, audienceTheme, dayLabel, rupees, type Slice } from "@/components/admin/desk-charts";

const field = "mt-1 h-11 w-full rounded-xl border border-black/10 bg-white/80 px-3 text-sm text-[#14211c] outline-none";
const tones: Record<AssignmentProgress, string> = { pending: "#f97316", submitted: "#3b82f6", reviewed: "#10b981" };

export function PersonBoard({
  member,
  batch,
  batches,
  marks,
  fees,
  assignments,
}: {
  member: BatchMember;
  batch: TrainingBatch;
  batches: TrainingBatch[];
  marks: AttendanceMark[];
  fees: FeePayment[];
  assignments: ClassAssignment[];
}) {
  const router = useRouter();
  const theme = audienceTheme[batch.learnerType];
  const today = todayIST();
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<FeeKind>("cash");
  const [paidOn, setPaidOn] = useState(today);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: member.fullName, phone: member.phone, email: member.email, note: member.note, batchId: member.batchId });
  const present = marks.filter((mark) => mark.status === "present").length;
  const absent = marks.filter((mark) => mark.status === "absent").length;
  const leave = marks.filter((mark) => mark.status === "leave").length;
  const holiday = marks.filter((mark) => mark.status === "holiday").length;
  const todayMark = marks.find((mark) => mark.date === today)?.status;
  const collected = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const attendance: Slice[] = [
    { label: "Attended", value: present, color: "#10b981" },
    { label: "Absent", value: absent, color: "#f43f5e" },
    { label: "Leave", value: leave, color: "#f59e0b" },
    { label: "Holiday", value: holiday, color: "#0ea5e9" },
  ];
  const payments = paymentMonths(fees, today);
  const work: Slice[] = [
    { label: "Pending", value: assignments.filter((item) => item.status === "pending").length, color: tones.pending },
    { label: "Submitted", value: assignments.filter((item) => item.status === "submitted").length, color: tones.submitted },
    { label: "Reviewed", value: assignments.filter((item) => item.status === "reviewed").length, color: tones.reviewed },
  ];

  async function mark(status: ClassDayStatus) {
    setPending(status);
    setError("");
    const response = await fetch("/api/v1/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: batch.id, memberId: member.id, date: today, status }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save attendance.");
      return;
    }
    router.refresh();
  }

  async function setStatus(id: string, status: AssignmentProgress) {
    setPending(id);
    setError("");
    const response = await fetch(`/api/v1/admin/assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save the assignment.");
      return;
    }
    router.refresh();
  }

  async function savePerson(event: React.FormEvent) {
    event.preventDefault();
    setPending("edit");
    setError("");
    const response = await fetch(`/api/v1/admin/batches/${batch.id}/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; fields?: Record<string, string>; member?: BatchMember };
    setPending("");
    if (!response.ok || !data.ok || !data.member) {
      setError(data.fields ? Object.values(data.fields)[0] || data.error || "Check the details." : data.error || "Check the details.");
      return;
    }
    setEditing(false);
    if (data.member.batchId !== batch.id) {
      router.push(`/admin/people/${member.id}`);
    }
    router.refresh();
  }

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    setPending("pay");
    setError("");
    const response = await fetch("/api/v1/admin/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: batch.id, memberId: member.id, amount: Number(amount), kind, paidOn, note }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save the payment.");
      return;
    }
    setAmount("");
    setNote("");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={batch.learnerType === "student" ? "/admin/students" : "/admin/professionals"} className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-3 py-2">{theme.title}</Link>
        <Link href="/admin/attendance" className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-3 py-2">Attendance</Link>
        <Link href="/admin/assignments" className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-3 py-2">Assignments</Link>
        <Link href="/admin/cash" className="rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-3 py-2">Payments</Link>
      </div>
      <header className="overflow-hidden rounded-3xl text-white" style={{ background: theme.band }}>
        <div className="px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase">{theme.noun} · {batch.name}</p>
          <h1 className="mt-1 text-3xl font-semibold">{member.fullName}</h1>
          <p className="mt-2 text-sm text-white/85">{displayPhone(member.phone) || "No phone"}{member.email ? ` · ${member.email}` : ""}{member.note ? ` · ${member.note}` : ""}</p>
          <p className="mt-3 text-sm">Today {todayMark || "not marked yet"} · {rupees(collected)} collected</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditing((value) => !value)} className="h-10 rounded-xl bg-white px-3 text-sm font-medium" style={{ color: theme.from }}>{editing ? "Close edit" : "Edit details"}</button>
            <Link href={`/admin/print?section=person&id=${member.id}`} className="inline-flex h-10 items-center rounded-xl bg-white px-3 text-sm font-medium" style={{ color: theme.from }}>{batch.learnerType === "student" ? "Student report" : "Professional report"}</Link>
            <button type="button" disabled={pending !== ""} onClick={() => mark("present")} className="h-10 rounded-xl px-3 text-sm font-medium" style={{ background: todayMark === "present" ? "white" : "rgb(255 255 255 / 0.16)", color: todayMark === "present" ? theme.from : "white" }}>Present</button>
            <button type="button" disabled={pending !== ""} onClick={() => mark("absent")} className="h-10 rounded-xl px-3 text-sm font-medium" style={{ background: todayMark === "absent" ? "#ffe4e6" : "rgb(255 255 255 / 0.16)", color: todayMark === "absent" ? "#9f1239" : "white" }}>Absent</button>
            <button type="button" disabled={pending !== ""} onClick={() => mark("leave")} className="h-10 rounded-xl px-3 text-sm font-medium" style={{ background: todayMark === "leave" ? "#fef3c7" : "rgb(255 255 255 / 0.16)", color: todayMark === "leave" ? "#92400e" : "white" }}>Leave</button>
            <button type="button" disabled={pending !== ""} onClick={() => mark("holiday")} className="h-10 rounded-xl px-3 text-sm font-medium" style={{ background: todayMark === "holiday" ? "#e0f2fe" : "rgb(255 255 255 / 0.16)", color: todayMark === "holiday" ? "#075985" : "white" }}>Holiday</button>
          </div>
        </div>
      </header>
      {editing ? (
        <form onSubmit={savePerson} className="grid gap-3 rounded-3xl p-4 sm:grid-cols-2" style={{ background: theme.wash, color: theme.from }}>
          <label className="text-sm">Name<input value={editForm.fullName} onChange={(event) => setEditForm({ ...editForm, fullName: event.target.value })} className={field} /></label>
          <label className="text-sm">Phone<input value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} className={field} /></label>
          <label className="text-sm">Email<input value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} className={field} /></label>
          <label className="text-sm">Note<input value={editForm.note} onChange={(event) => setEditForm({ ...editForm, note: event.target.value })} className={field} /></label>
          <label className="text-sm">Batch
            <select value={editForm.batchId} onChange={(event) => setEditForm({ ...editForm, batchId: event.target.value })} className={field}>
              {batches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button type="submit" disabled={pending !== ""} className="h-11 self-end rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ background: theme.from }}>{pending === "edit" ? "Saving…" : "Save details"}</button>
        </form>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Attendance" slices={attendance} caption={present + absent ? `${Math.round((present / (present + absent)) * 100)}%` : "0%"} />
        <ChartCard title="Payments" slices={payments} caption={rupees(collected)} />
        <ChartCard title="Assignments" slices={work} />
      </div>
      <section className="rounded-3xl p-4" style={{ background: theme.wash, color: theme.from }}>
        <h2 className="text-lg font-semibold">Attendance days</h2>
        <ul className="mt-3 grid gap-2">
          {marks.length === 0 ? <li className="rounded-2xl bg-white/75 px-3 py-4 text-sm">No attendance marked yet.</li> : null}
          {[...marks].sort((a, b) => b.date.localeCompare(a.date)).map((mark) => (
            <li key={mark.id} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-sm">
              <span>{dayLabel(mark.date)}</span>
              <span className="font-medium capitalize" style={{ color: mark.status === "present" ? "#047857" : mark.status === "leave" ? "#b45309" : mark.status === "holiday" ? "#0369a1" : "#e11d48" }}>{mark.status}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-3xl p-4" style={{ background: theme.wash, color: theme.from }}>
        <h2 className="text-lg font-semibold">Payments</h2>
        <form onSubmit={pay} className="mt-3 grid gap-3 rounded-2xl bg-white/75 p-4 sm:grid-cols-2">
          <label className="text-sm">Amount<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" className={field} /></label>
          <label className="text-sm">Paid by<select value={kind} onChange={(event) => setKind(event.target.value as FeeKind)} className={field}><option value="cash">Cash</option><option value="bank">Bank</option><option value="upi">UPI</option></select></label>
          <label className="text-sm">Paid on<input type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} className={field} /></label>
          <label className="text-sm">Note<input value={note} onChange={(event) => setNote(event.target.value)} className={field} /></label>
          <button type="submit" disabled={pending !== ""} className="h-11 rounded-xl text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:w-fit sm:px-5" style={{ background: theme.from }}>{pending === "pay" ? "Saving…" : "Record payment"}</button>
        </form>
        <ul className="mt-3 grid gap-2">
          {fees.length === 0 ? <li className="rounded-2xl bg-white/75 px-3 py-4 text-sm">No payment recorded yet.</li> : null}
          {[...fees].sort((a, b) => b.paidOn.localeCompare(a.paidOn)).map((fee) => (
            <li key={fee.id} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-sm">
              <span>{dayLabel(fee.paidOn)} · {fee.kind.toUpperCase()}{fee.note ? ` · ${fee.note}` : ""}</span>
              <span className="font-medium">{rupees(fee.amount)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-3xl p-4" style={{ background: theme.wash, color: theme.from }}>
        <h2 className="text-lg font-semibold">Assignments</h2>
        <ul className="mt-3 grid gap-2">
          {assignments.length === 0 ? <li className="rounded-2xl bg-white/75 px-3 py-4 text-sm">No assignment yet.</li> : null}
          {[...assignments].sort((a, b) => b.dueOn.localeCompare(a.dueOn) || b.createdAt.localeCompare(a.createdAt)).map((item) => {
            const current = item.status === "submitted" || item.status === "reviewed" ? item.status : "pending";
            return (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/80 px-3 py-2 text-sm">
              <span className="font-medium">{item.title} · due {dayLabel(item.dueOn)}</span>
              <span className="flex gap-1">
                {(["pending", "submitted", "reviewed"] as const).map((status) => (
                  <button key={status} type="button" disabled={pending !== ""} aria-pressed={current === status} onClick={() => setStatus(item.id, status)} className="rounded-full px-2.5 py-1 text-xs font-medium capitalize" style={{ background: current === status ? tones[status] : "transparent", color: current === status ? "white" : "#14211c", boxShadow: current === status ? "none" : "inset 0 0 0 1px rgb(20 33 28 / 0.18)" }}>{status}</button>
                ))}
              </span>
            </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

const monthColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#f43f5e", "#0ea5e9", "#14b8a6", "#6366f1"];

function monthName(key: string) {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
}

function paymentMonths(fees: FeePayment[], today: string): Slice[] {
  const [year, month] = today.split("-").map(Number);
  const keys: string[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(year || 2026, (month || 1) - 1 - offset, 1));
    keys.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  for (const fee of fees) {
    const key = fee.paidOn.slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(key) && !keys.includes(key)) keys.push(key);
  }
  keys.sort();
  return keys.map((key, index) => ({
    label: monthName(key),
    value: fees.filter((fee) => fee.paidOn.startsWith(key)).reduce((sum, fee) => sum + fee.amount, 0),
    color: monthColors[index % monthColors.length] || "#10b981",
  }));
}

function ChartCard({ title, slices, caption }: { title: string; slices: Slice[]; caption?: string }) {
  return (
    <article className="rounded-3xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4 text-[var(--desk-text)]">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 grid items-center gap-3">
        <Ring slices={slices} caption={caption} />
        <Legend slices={slices} />
      </div>
    </article>
  );
}
