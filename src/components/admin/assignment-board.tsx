"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { todayIST } from "@/lib/dates";
import type { AssignmentProgress, BatchMember, ClassAssignment, LearnerType, TrainingBatch } from "@/lib/types";
import { Legend, Ring, audienceTheme, type Slice } from "@/components/admin/desk-charts";

const field = "mt-1 h-11 w-full rounded-xl border border-black/10 bg-white/80 px-3 text-sm text-[#14211c] outline-none";
const tones: Record<AssignmentProgress, string> = { pending: "#f97316", submitted: "#3b82f6", reviewed: "#10b981" };

export function AssignmentBoard({ batches, members, items }: { batches: TrainingBatch[]; members: BatchMember[]; items: ClassAssignment[] }) {
  const router = useRouter();
  const [focus, setFocus] = useState<LearnerType | "dashboard">("dashboard");
  const [batchId, setBatchId] = useState<Record<LearnerType, string>>({
    student: batches.find((batch) => batch.learnerType === "student")?.id || "",
    professional: batches.find((batch) => batch.learnerType === "professional")?.id || "",
  });
  const [title, setTitle] = useState<Record<LearnerType, string>>({ student: "", professional: "" });
  const [dueOn, setDueOn] = useState<Record<LearnerType, string>>({ student: todayIST(), professional: todayIST() });
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  function tally(audience: LearnerType) {
    const ids = new Set(batches.filter((batch) => batch.learnerType === audience).map((batch) => batch.id));
    const rows = items.filter((item) => ids.has(item.batchId));
    return {
      pending: rows.filter((item) => item.status === "pending").length,
      submitted: rows.filter((item) => item.status === "submitted").length,
      reviewed: rows.filter((item) => item.status === "reviewed").length,
    };
  }

  async function submit(event: React.FormEvent, audience: LearnerType) {
    event.preventDefault();
    setPending(audience);
    setError("");
    const response = await fetch("/api/v1/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: batchId[audience], title: title[audience], dueOn: dueOn[audience] }),
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

  return (
    <div className="grid gap-4">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {focus === "dashboard" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {(["student", "professional"] as const).map((key) => {
            const theme = audienceTheme[key];
            const count = tally(key);
            const people = members.filter((member) => batches.some((batch) => batch.id === member.batchId && batch.learnerType === key)).length;
            const slices: Slice[] = [
              { label: "Pending", value: count.pending, color: tones.pending },
              { label: "Submitted", value: count.submitted, color: tones.submitted },
              { label: "Reviewed", value: count.reviewed, color: tones.reviewed },
            ];
            return (
              <article key={key} className="overflow-hidden rounded-3xl" style={{ background: theme.wash, color: theme.from }}>
                <div className="px-4 py-4 text-white" style={{ background: theme.band }}>
                  <p className="text-xs font-semibold tracking-[0.16em] uppercase">{theme.title}</p>
                  <h2 className="mt-1 text-2xl font-semibold">{people} people · {count.pending + count.submitted + count.reviewed} assignments</h2>
                </div>
                <div className="grid items-center gap-3 p-4 sm:grid-cols-[150px_1fr]">
                  <Ring slices={slices} />
                  <Legend slices={slices} />
                </div>
                <div className="px-4 pb-4">
                  <button type="button" onClick={() => setFocus(key)} className="h-11 rounded-xl px-4 text-sm font-medium text-white" style={{ background: theme.from }}>
                    Open {theme.title.toLowerCase()}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <AssignmentDesk
          audience={focus}
          batches={batches.filter((batch) => batch.learnerType === focus)}
          members={members}
          items={items}
          batchId={batchId[focus]}
          title={title[focus]}
          dueOn={dueOn[focus]}
          pending={pending}
          onBatch={(id) => setBatchId((current) => ({ ...current, [focus]: id }))}
          onTitle={(value) => setTitle((current) => ({ ...current, [focus]: value }))}
          onDue={(value) => setDueOn((current) => ({ ...current, [focus]: value }))}
          onBack={() => setFocus("dashboard")}
          onSubmit={(event) => submit(event, focus)}
          onStatus={setStatus}
        />
      )}
    </div>
  );
}

function AssignmentDesk({
  audience,
  batches,
  members,
  items,
  batchId,
  title,
  dueOn,
  pending,
  onBatch,
  onTitle,
  onDue,
  onBack,
  onSubmit,
  onStatus,
}: {
  audience: LearnerType;
  batches: TrainingBatch[];
  members: BatchMember[];
  items: ClassAssignment[];
  batchId: string;
  title: string;
  dueOn: string;
  pending: string;
  onBatch: (id: string) => void;
  onTitle: (value: string) => void;
  onDue: (value: string) => void;
  onBack: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onStatus: (id: string, status: AssignmentProgress) => void;
}) {
  const theme = audienceTheme[audience];
  const selected = batchId || batches[0]?.id || "";
  const focusDay = dueOn || todayIST();
  const rows = items.filter((item) => item.batchId === selected && item.dueOn === focusDay);
  const slices: Slice[] = [
    { label: "Pending", value: rows.filter((item) => item.status === "pending").length, color: tones.pending },
    { label: "Submitted", value: rows.filter((item) => item.status === "submitted").length, color: tones.submitted },
    { label: "Reviewed", value: rows.filter((item) => item.status === "reviewed").length, color: tones.reviewed },
  ];
  return (
    <section className="overflow-hidden rounded-3xl" style={{ background: theme.wash, color: theme.from }}>
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-4 text-white sm:px-5" style={{ background: theme.band }}>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] uppercase">{theme.title}</p>
          <h2 className="mt-1 text-2xl font-semibold">Assignments</h2>
        </div>
        <button type="button" onClick={onBack} className="h-10 rounded-xl bg-white/15 px-3 text-sm">Back to dashboard</button>
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        {batches.length === 0 ? <p className="rounded-2xl bg-white/70 px-4 py-6 text-sm">No {theme.title.toLowerCase()} batch yet.</p> : (
          <>
            <div className="grid items-center gap-4 rounded-2xl bg-white/75 p-4 sm:grid-cols-[150px_1fr]">
              <Ring slices={slices} />
              <Legend slices={slices} />
            </div>
            <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl bg-white/75 p-4 sm:grid-cols-3">
              <label className="text-sm">Batch
                <select value={selected} onChange={(event) => onBatch(event.target.value)} className={field}>
                  {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.label} · {batch.name}</option>)}
                </select>
              </label>
              <label className="text-sm">Assignment<input value={title} onChange={(event) => onTitle(event.target.value)} placeholder="SQL practice set" className={field} /></label>
              <label className="text-sm">Due<input type="date" value={dueOn} onChange={(event) => onDue(event.target.value)} className={field} /></label>
              <button type="submit" disabled={pending === audience} className="h-11 rounded-xl text-sm font-medium text-white disabled:opacity-60 sm:col-span-3 sm:w-fit sm:px-5" style={{ background: theme.from }}>
                {pending === audience ? "Saving…" : "Give to this batch"}
              </button>
            </form>
            <p className="text-sm">Assignments due {focusDay}</p>
            <ul className="grid gap-2">
              {rows.map((item) => (
                <li key={item.id} className="grid gap-2 rounded-2xl bg-white/80 px-3 py-3 sm:grid-cols-[1fr_1.2fr_auto] sm:items-center">
                  <Link href={`/admin/people/${item.memberId}`} className="font-semibold hover:underline">{members.find((member) => member.id === item.memberId)?.fullName || "Learner"}</Link>
                  <span className="text-sm">{item.title} · due {item.dueOn}</span>
                  <span className="flex flex-wrap gap-1">
                    {(["pending", "submitted", "reviewed"] as const).map((status) => {
                      const current = item.status === "submitted" || item.status === "reviewed" ? item.status : "pending";
                      return (
                      <button key={status} type="button" disabled={pending !== ""} aria-pressed={current === status} onClick={() => onStatus(item.id, status)} className="rounded-full px-2.5 py-1 text-xs font-medium capitalize" style={{ background: current === status ? tones[status] : "transparent", color: current === status ? "white" : "#14211c", boxShadow: current === status ? "none" : "inset 0 0 0 1px rgb(20 33 28 / 0.18)" }}>{status}</button>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>
            {rows.length === 0 ? <p className="rounded-2xl bg-white/70 px-4 py-6 text-sm">No assignment due on this day.</p> : null}
          </>
        )}
      </div>
    </section>
  );
}
