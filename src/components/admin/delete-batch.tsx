"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteBatch({ id, name, count, back, light = false }: { id: string; name: string; count: number; back: string; light?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    const people = `${count} ${count === 1 ? "person" : "people"}`;
    const sure = window.confirm(`Delete ${name}? ${people} and their attendance, payments, and assignments in this batch will be removed.`);
    if (!sure) return;
    setPending(true);
    setError("");
    const response = await fetch(`/api/v1/admin/batches/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not delete this batch.");
      return;
    }
    router.push(back);
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button type="button" disabled={pending} onClick={() => void remove()} className={`rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${light ? "border-rose-300/50 text-rose-100" : "border-rose-400/70 text-rose-700"}`}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? <span className="text-xs text-rose-700">{error}</span> : null}
    </span>
  );
}
