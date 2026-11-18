"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TrainingBatch } from "@/lib/types";

export function BatchRename({ batch, tone }: { batch: TrainingBatch; tone: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(batch.name);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(`/api/v1/admin/batches/${batch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; fields?: Record<string, string> };
    setPending(false);
    if (!response.ok || !data.ok) {
      setError(data.fields ? Object.values(data.fields)[0] || data.error || "The name could not be saved." : data.error || "The name could not be saved.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => { setName(batch.name); setOpen(true); }} className="h-9 rounded-full px-3 text-sm font-medium text-white" style={{ background: tone }}>
        Edit
      </button>
    );
  }

  return (
    <form onSubmit={save} className="grid gap-2">
      <input value={name} onChange={(event) => setName(event.target.value)} aria-label="Batch name" className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm text-[#14211c]" />
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <span className="flex gap-2">
        <button type="submit" disabled={pending} className="h-9 rounded-full px-3 text-sm font-medium text-white disabled:opacity-60" style={{ background: tone }}>{pending ? "Saving…" : "Save"}</button>
        <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-full bg-white/80 px-3 text-sm">Cancel</button>
      </span>
    </form>
  );
}
