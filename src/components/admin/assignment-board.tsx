"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssignmentProgress, BatchMember, ClassAssignment, TrainingBatch } from "@/lib/types";

const field = "mt-1 h-11 w-full rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card-2)] px-3 text-sm text-[var(--desk-text)] outline-none";

export function AssignmentBoard({ batches, members, items }: { batches: TrainingBatch[]; members: BatchMember[]; items: ClassAssignment[] }) {
  const router = useRouter();
  const [batchId, setBatchId] = useState(batches[0]?.id || "");
  const [title, setTitle] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const rows = items.filter((item) => item.batchId === batchId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/v1/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId, title, dueOn }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not add the assignment.");
      return;
    }
    setTitle("");
    router.refresh();
  }

  async function setStatus(id: string, status: AssignmentProgress) {
    await fetch(`/api/v1/admin/assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  if (batches.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[var(--desk-line)] p-8 text-sm text-[var(--desk-muted)]">Add a batch and its students first. Assignments are given to those names.</p>;
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4 sm:grid-cols-3">
        <label className="text-sm">Batch<select value={batchId} onChange={(event) => setBatchId(event.target.value)} className={field}>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
        <label className="text-sm">Assignment<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="SQL practice set" className={field} /></label>
        <label className="text-sm">Due<input type="date" value={dueOn} onChange={(event) => setDueOn(event.target.value)} className={field} /></label>
        {error ? <p className="text-sm text-red-300 sm:col-span-3">{error}</p> : null}
        <button type="submit" disabled={pending} className="h-11 rounded-xl bg-[#14967c] text-sm font-medium text-white disabled:opacity-60 sm:col-span-3 sm:w-fit sm:px-5">{pending ? "Saving…" : "Give to this batch"}</button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-[var(--desk-line)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--desk-card)] text-[var(--desk-muted)]">
            <tr><th className="px-4 py-3 font-medium">Student</th><th className="px-4 py-3 font-medium">Work</th><th className="px-4 py-3 font-medium">Due</th><th className="px-4 py-3 font-medium">Status</th></tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-[var(--desk-line)]">
                <td className="px-4 py-3">{members.find((member) => member.id === item.memberId)?.fullName || "Student"}</td>
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3">{item.dueOn}</td>
                <td className="px-4 py-3">
                  <select value={item.status} onChange={(event) => setStatus(item.id, event.target.value as AssignmentProgress)} className="h-9 rounded-lg border border-[var(--desk-line)] bg-[var(--desk-card-2)] px-2">
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-8 text-sm text-[var(--desk-muted)]">No assignments for this batch yet.</p> : null}
      </div>
    </div>
  );
}
