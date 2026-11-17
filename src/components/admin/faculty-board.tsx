"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { programChoices, programGradient, programLook, programName } from "@/lib/palette";
import type { Faculty, FacultyDay, FacultyPay } from "@/lib/types";

const field = "mt-1 h-11 w-full rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card-2)] px-3 text-sm text-[var(--desk-text)] outline-none";

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
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState<string>(programChoices[0].slug);
  const [rate, setRate] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [payStatus, setPayStatus] = useState<"due" | "paid">("due");
  const [payNote, setPayNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  const chosen = teacherId || teachers[0]?.id || "";
  const chosenTeacher = teachers.find((teacher) => teacher.id === chosen);
  const dayMarks = days.filter((item) => item.date === date);
  const totals = useMemo(() => {
    const due = pays.filter((pay) => pay.status === "due").reduce((sum, pay) => sum + pay.amount, 0);
    const paid = pays.filter((pay) => pay.status === "paid").reduce((sum, pay) => sum + pay.amount, 0);
    return { due, paid };
  }, [pays]);

  async function addTeacher(event: React.FormEvent) {
    event.preventDefault();
    setPending("add");
    setError("");
    const response = await fetch("/api/v1/admin/faculty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, email, course, rate: Number(rate), note }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not add the teacher.");
      return;
    }
    setFullName("");
    setPhone("");
    setEmail("");
    setRate("");
    setNote("");
    router.refresh();
  }

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
    router.refresh();
  }

  async function savePay(event: React.FormEvent) {
    event.preventDefault();
    setPending("pay");
    setError("");
    const response = await fetch("/api/v1/admin/faculty/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId: chosen,
        amount: Number(amount || chosenTeacher?.rate || 0),
        classDate: date,
        paidOn: payStatus === "paid" ? date : "",
        status: payStatus,
        note: payNote,
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save the class payment.");
      return;
    }
    setAmount("");
    setPayNote("");
    router.refresh();
  }

  async function settle(id: string) {
    setPending(id);
    await fetch(`/api/v1/admin/faculty/pay/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidOn: today }),
    });
    setPending("");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl p-4 text-white" style={{ background: "linear-gradient(155deg, #065f46, #10b981)" }}>
          <p className="text-xs tracking-wide text-white/80">Teachers</p>
          <p className="mt-1 text-3xl font-semibold">{teachers.length}</p>
        </div>
        <div className="rounded-2xl p-4 text-white" style={{ background: "linear-gradient(155deg, #9a3412, #f97316)" }}>
          <p className="text-xs tracking-wide text-white/80">Class pay still due</p>
          <p className="mt-1 text-3xl font-semibold">{rupees(totals.due)}</p>
        </div>
        <div className="rounded-2xl p-4 text-white" style={{ background: "linear-gradient(155deg, #1e3a8a, #3b82f6)" }}>
          <p className="text-xs tracking-wide text-white/80">Already paid</p>
          <p className="mt-1 text-3xl font-semibold">{rupees(totals.paid)}</p>
        </div>
      </div>

      <form onSubmit={addTeacher} className="grid gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4 sm:grid-cols-2">
        <p className="text-sm font-medium sm:col-span-2">Add teacher</p>
        <label className="text-sm">Name<input value={fullName} onChange={(event) => setFullName(event.target.value)} className={field} /></label>
        <label className="text-sm">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className={field} /></label>
        <label className="text-sm">Email<input value={email} onChange={(event) => setEmail(event.target.value)} className={field} /></label>
        <label className="text-sm">
          Course
          <select value={course} onChange={(event) => setCourse(event.target.value)} className={field}>
            {programChoices.map((item) => (
              <option key={item.slug} value={item.slug}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">Pay per class, in rupees<input value={rate} onChange={(event) => setRate(event.target.value)} inputMode="numeric" className={field} /></label>
        <label className="text-sm">Note<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Weekday evenings" className={field} /></label>
        <button type="submit" disabled={pending === "add"} className="h-11 rounded-xl bg-[#14967c] text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:w-fit sm:px-5">
          {pending === "add" ? "Saving…" : "Add teacher"}
        </button>
      </form>

      <div className="grid gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4 sm:grid-cols-[220px_1fr]">
        <label className="text-sm">
          Calendar day
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={field} />
        </label>
        <p className="self-end text-sm text-[var(--desk-muted)]">Mark who took class on this day. A present mark opens the class amount still to pay.</p>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {teachers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--desk-line)] p-8 text-sm text-[var(--desk-muted)]">No teachers yet. Add a name, the course they teach, and what one class costs.</p>
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
                    <p className="font-medium">{teacher.fullName}</p>
                    <p className="mt-1 text-sm font-medium" style={{ color: programLook(teacher.course).to }}>{programName(teacher.course)}</p>
                    <p className="mt-1 text-sm text-[var(--desk-muted)]">{teacher.phone}{teacher.email ? ` · ${teacher.email}` : ""} · {rupees(teacher.rate)} a class</p>
                    <p className="mt-1 text-sm">Still to pay {rupees(owed)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={pending !== ""} onClick={() => mark(teacher.id, "present")} className={`h-10 rounded-xl px-4 text-sm font-medium ${status === "present" ? "bg-emerald-400 text-[#06281c]" : "border border-[var(--desk-line)]"}`}>Present</button>
                    <button type="button" disabled={pending !== ""} onClick={() => mark(teacher.id, "absent")} className={`h-10 rounded-xl px-4 text-sm font-medium ${status === "absent" ? "bg-rose-400 text-[#3b1020]" : "border border-[var(--desk-line)]"}`}>Absent</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <form onSubmit={savePay} className="grid gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4 sm:grid-cols-2">
        <p className="text-sm font-medium sm:col-span-2">Class payment</p>
        <label className="text-sm">
          Teacher
          <select value={chosen} onChange={(event) => setTeacherId(event.target.value)} className={field}>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
            ))}
            {teachers.length === 0 ? <option value="">Add a teacher first</option> : null}
          </select>
        </label>
        <label className="text-sm">Amount<input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={chosenTeacher ? String(chosenTeacher.rate) : "0"} inputMode="numeric" className={field} /></label>
        <label className="text-sm">
          Status
          <select value={payStatus} onChange={(event) => setPayStatus(event.target.value as "due" | "paid")} className={field}>
            <option value="due">Due — still to pay</option>
            <option value="paid">Paid</option>
          </select>
        </label>
        <label className="text-sm">Note<input value={payNote} onChange={(event) => setPayNote(event.target.value)} placeholder="Tuesday class" className={field} /></label>
        <button type="submit" disabled={pending === "pay" || !chosen} className="h-11 rounded-xl bg-[#14967c] text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:w-fit sm:px-5">
          {pending === "pay" ? "Saving…" : `Save payment for ${date}`}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[var(--desk-line)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[var(--desk-card)] text-[var(--desk-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Teacher</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Class day</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {pays.map((pay) => {
              const teacher = teachers.find((item) => item.id === pay.teacherId);
              return (
                <tr key={pay.id} className="border-t border-[var(--desk-line)]">
                  <td className="px-4 py-3">{teacher?.fullName || "Teacher"}</td>
                  <td className="px-4 py-3">{teacher ? programName(teacher.course) : "—"}</td>
                  <td className="px-4 py-3">{pay.classDate}</td>
                  <td className="px-4 py-3">{rupees(pay.amount)}</td>
                  <td className="px-4 py-3">
                    {pay.status === "paid" ? (
                      <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-300">Paid {pay.paidOn}</span>
                    ) : (
                      <button type="button" disabled={pending === pay.id} onClick={() => settle(pay.id)} className="rounded-full bg-orange-400 px-3 py-1 text-xs font-medium text-[#3b1d08]">
                        Due · mark paid
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pays.length === 0 ? <p className="px-4 py-8 text-sm text-[var(--desk-muted)]">No class payments yet. Mark a teacher present, or record an amount above.</p> : null}
      </div>
    </div>
  );
}
