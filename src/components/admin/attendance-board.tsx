"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AttendanceMark, BatchMember, TrainingBatch } from "@/lib/types";

const field = "mt-1 h-11 w-full rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card-2)] px-3 text-sm text-[var(--desk-text)] outline-none";

export function AttendanceBoard({ batches, members, marks }: { batches: TrainingBatch[]; members: BatchMember[]; marks: AttendanceMark[] }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [batchId, setBatchId] = useState(batches[0]?.id || "");
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  const roster = members.filter((member) => member.batchId === batchId);
  const dayMarks = marks.filter((mark) => mark.batchId === batchId && mark.date === date);
  const report = useMemo(() => {
    return roster.map((member) => {
      const rows = marks.filter((mark) => mark.memberId === member.id);
      const present = rows.filter((mark) => mark.status === "present").length;
      const absent = rows.filter((mark) => mark.status === "absent").length;
      const total = present + absent;
      return { member, present, absent, rate: total ? Math.round((present / total) * 100) : 0 };
    });
  }, [marks, roster]);

  async function mark(memberId: string, status: "present" | "absent") {
    setPending(memberId + status);
    setError("");
    const response = await fetch("/api/v1/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId, memberId, date, status }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save attendance.");
      return;
    }
    router.refresh();
  }

  if (batches.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[var(--desk-line)] p-8 text-sm text-[var(--desk-muted)]">Add a batch under Students or Professionals first. Attendance uses those names.</p>;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4 sm:grid-cols-2">
        <label className="text-sm">
          Batch
          <select value={batchId} onChange={(event) => setBatchId(event.target.value)} className={field}>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>{batch.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Class day
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={field} />
        </label>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <div className="overflow-hidden rounded-2xl border border-[var(--desk-line)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--desk-card)] text-[var(--desk-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">This day</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((member) => {
              const current = dayMarks.find((mark) => mark.memberId === member.id)?.status;
              return (
                <tr key={member.id} className="border-t border-[var(--desk-line)]">
                  <td className="px-4 py-3 font-medium">{member.fullName}</td>
                  <td className="px-4 py-3 text-[var(--desk-muted)]">{member.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" disabled={pending !== ""} onClick={() => mark(member.id, "present")} className={`h-9 rounded-lg px-3 text-xs font-medium ${current === "present" ? "bg-emerald-400 text-[#06281c]" : "border border-[var(--desk-line)]"}`}>Present</button>
                      <button type="button" disabled={pending !== ""} onClick={() => mark(member.id, "absent")} className={`h-9 rounded-lg px-3 text-xs font-medium ${current === "absent" ? "bg-rose-400 text-[#3b1020]" : "border border-[var(--desk-line)]"}`}>Absent</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {roster.length === 0 ? <p className="px-4 py-8 text-sm text-[var(--desk-muted)]">This batch has no names yet. Add them from the batch page.</p> : null}
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--desk-line)]">
        <p className="border-b border-[var(--desk-line)] bg-[var(--desk-card)] px-4 py-3 text-sm font-medium">Attendance report</p>
        <table className="w-full text-left text-sm">
          <thead className="text-[var(--desk-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Present</th>
              <th className="px-4 py-3 font-medium">Absent</th>
              <th className="px-4 py-3 font-medium">Rate</th>
            </tr>
          </thead>
          <tbody>
            {report.map((row) => (
              <tr key={row.member.id} className="border-t border-[var(--desk-line)]">
                <td className="px-4 py-3">{row.member.fullName}</td>
                <td className="px-4 py-3">{row.present}</td>
                <td className="px-4 py-3">{row.absent}</td>
                <td className="px-4 py-3">{row.present + row.absent ? `${row.rate}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
