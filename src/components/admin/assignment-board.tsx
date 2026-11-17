"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssignmentProgress, BatchMember, ClassAssignment, LearnerType, TrainingBatch } from "@/lib/types";

const field = "mt-1 h-11 w-full rounded-xl border border-black/10 bg-white/80 px-3 text-sm text-[#14211c] outline-none";

const audiences: { key: LearnerType; title: string; hint: string; from: string; to: string }[] = [
  { key: "student", title: "Students", hint: "College batches, in the same green as the website.", from: "#065f46", to: "#10b981" },
  { key: "professional", title: "Working professionals", hint: "Kept in the indigo used for professionals on the website.", from: "#312e81", to: "#6366f1" },
];

const statusTone: Record<AssignmentProgress, string> = {
  pending: "#f97316",
  submitted: "#3b82f6",
  reviewed: "#10b981",
};

export function AssignmentBoard({ batches, members, items }: { batches: TrainingBatch[]; members: BatchMember[]; items: ClassAssignment[] }) {
  const router = useRouter();
  const [batchId, setBatchId] = useState<Record<LearnerType, string>>({
    student: batches.find((batch) => batch.learnerType === "student")?.id || "",
    professional: batches.find((batch) => batch.learnerType === "professional")?.id || "",
  });
  const [title, setTitle] = useState<Record<LearnerType, string>>({ student: "", professional: "" });
  const [dueOn, setDueOn] = useState<Record<LearnerType, string>>({ student: "", professional: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  async function submit(event: React.FormEvent, audience: LearnerType) {
    event.preventDefault();
    const id = batchId[audience];
    setPending(audience);
    setError("");
    const response = await fetch("/api/v1/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: id, title: title[audience], dueOn: dueOn[audience] }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not add the assignment.");
      return;
    }
    setTitle((current) => ({ ...current, [audience]: "" }));
    router.refresh();
  }

  async function setStatus(id: string, status: AssignmentProgress) {
    setPending(id);
    await fetch(`/api/v1/admin/assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPending("");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {audiences.map((audience) => {
        const group = batches.filter((batch) => batch.learnerType === audience.key);
        const selected = batchId[audience.key] || group[0]?.id || "";
        const roster = members.filter((member) => group.some((batch) => batch.id === member.batchId) && (!selected || member.batchId === selected));
        const rows = items.filter((item) => item.batchId === selected);
        return (
          <section
            key={audience.key}
            className="rounded-3xl p-4 sm:p-5"
            style={{
              background: `linear-gradient(180deg, color-mix(in srgb, ${audience.to} 48%, white), color-mix(in srgb, ${audience.from} 34%, white))`,
              color: audience.from,
            }}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] uppercase">{audience.title}</p>
                <h2 className="mt-1 text-2xl font-semibold">{group.length} batches · {members.filter((member) => group.some((batch) => batch.id === member.batchId)).length} people</h2>
                <p className="mt-1 text-sm opacity-80">{audience.hint}</p>
              </div>
            </div>
            {group.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-white/70 px-4 py-6 text-sm">No {audience.title.toLowerCase()} batch yet.</p>
            ) : (
              <>
                <form onSubmit={(event) => submit(event, audience.key)} className="mt-4 grid gap-3 rounded-2xl bg-white/75 p-4 sm:grid-cols-3">
                  <label className="text-sm">
                    Batch
                    <select value={selected} onChange={(event) => setBatchId((current) => ({ ...current, [audience.key]: event.target.value }))} className={field}>
                      {group.map((batch) => (
                        <option key={batch.id} value={batch.id}>{batch.label} · {batch.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">Assignment<input value={title[audience.key]} onChange={(event) => setTitle((current) => ({ ...current, [audience.key]: event.target.value }))} placeholder="SQL practice set" className={field} /></label>
                  <label className="text-sm">Due<input type="date" value={dueOn[audience.key]} onChange={(event) => setDueOn((current) => ({ ...current, [audience.key]: event.target.value }))} className={field} /></label>
                  <button type="submit" disabled={pending === audience.key} className="h-11 rounded-xl text-sm font-medium text-white disabled:opacity-60 sm:col-span-3 sm:w-fit sm:px-5" style={{ background: audience.from }}>
                    {pending === audience.key ? "Saving…" : `Give to ${group.find((batch) => batch.id === selected)?.name || "this batch"}`}
                  </button>
                </form>
                <div className="mt-4 overflow-x-auto rounded-2xl bg-white/80">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead>
                      <tr className="text-xs tracking-wide uppercase opacity-70">
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Work</th>
                        <th className="px-4 py-3 font-medium">Due</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((item) => (
                        <tr key={item.id} className="border-t border-black/5">
                          <td className="px-4 py-3 font-medium">{members.find((member) => member.id === item.memberId)?.fullName || "Learner"}</td>
                          <td className="px-4 py-3">{item.title}</td>
                          <td className="px-4 py-3">{item.dueOn}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(["pending", "submitted", "reviewed"] as AssignmentProgress[]).map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  disabled={pending !== ""}
                                  onClick={() => setStatus(item.id, status)}
                                  className="rounded-full px-2.5 py-1 text-xs font-medium capitalize text-white"
                                  style={{ background: item.status === status ? statusTone[status] : "rgb(20 33 28 / 0.28)" }}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0
                        ? roster.map((member) => (
                          <tr key={member.id} className="border-t border-black/5">
                            <td className="px-4 py-3 font-medium">{member.fullName}</td>
                            <td className="px-4 py-3 opacity-70" colSpan={3}>No assignment yet</td>
                          </tr>
                        ))
                        : null}
                    </tbody>
                  </table>
                  {rows.length === 0 && roster.length === 0 ? <p className="px-4 py-6 text-sm">This batch has no names yet.</p> : null}
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
