"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LearnerType } from "@/lib/types";

export function AddBatchForm({ learnerType }: { learnerType: LearnerType }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/v1/admin/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, learnerType }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; batch?: { id: string } };
    setPending(false);
    if (!response.ok || !data.ok || !data.batch) {
      setError(data.error || "The batch could not be saved.");
      return;
    }
    setName("");
    router.push(`/admin/batches/${data.batch.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-dashed border-[var(--desk-line)] bg-[var(--desk-card)] p-4">
      <p className="text-xs tracking-[0.16em] text-[var(--desk-muted)] uppercase">Add batch</p>
      <h2 className="mt-1 text-lg font-semibold">Open a new batch</h2>
      <p className="mt-1 text-sm text-[var(--desk-muted)]">Name the batch, then add people on the next screen. No list is filled in until you type the details.</p>
      <label className="mt-4 block text-sm">
        Batch name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={learnerType === "student" ? "For example, SASI" : "For example, Weekend cohort"}
          className="mt-1 h-11 w-full rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card-2)] px-3 text-[var(--desk-text)] outline-none"
        />
      </label>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      <button type="submit" disabled={pending} className="mt-4 h-11 w-full rounded-xl bg-[#14967c] text-sm font-medium text-white disabled:opacity-60 sm:w-auto sm:px-5">
        {pending ? "Saving…" : "Add batch"}
      </button>
    </form>
  );
}
