"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TeacherNote, TrainingBatch } from "@/lib/types";

const field = "mt-1 h-11 w-full rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card-2)] px-3 text-sm text-[var(--desk-text)] outline-none";

export function TeacherBoard({ batches, notes }: { batches: TrainingBatch[]; notes: TeacherNote[] }) {
  const router = useRouter();
  const [batchId, setBatchId] = useState(batches[0]?.id || "");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const rows = notes.filter((note) => note.batchId === batchId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/v1/admin/teacher-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId, body }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save the note.");
      return;
    }
    setBody("");
    router.refresh();
  }

  if (batches.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[var(--desk-line)] p-8 text-sm text-[var(--desk-muted)]">Add a batch first. Notes stay with that batch.</p>;
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={submit} className="rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4">
        <label className="block text-sm">Batch<select value={batchId} onChange={(event) => setBatchId(event.target.value)} className={field}>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
        <label className="mt-3 block text-sm">Class note<textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder="What was taught, who needs a follow-up, and what is due next." className="mt-1 w-full rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card-2)] px-3 py-2 text-sm outline-none" /></label>
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        <button type="submit" disabled={pending} className="mt-3 h-11 rounded-xl bg-[#14967c] px-5 text-sm font-medium text-white disabled:opacity-60">{pending ? "Saving…" : "Save note"}</button>
      </form>
      <div className="grid gap-3">
        {rows.map((note) => (
          <article key={note.id} className="rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4">
            <p className="text-sm leading-6">{note.body}</p>
            <p className="mt-2 text-xs text-[var(--desk-muted)]">{new Date(note.createdAt).toLocaleString("en-IN")}</p>
          </article>
        ))}
        {rows.length === 0 ? <p className="text-sm text-[var(--desk-muted)]">No notes for this batch yet.</p> : null}
      </div>
    </div>
  );
}
