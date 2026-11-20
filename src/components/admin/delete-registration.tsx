"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteRegistration({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    const sure = window.confirm(`Delete ${name}? This registration will be removed.`);
    if (!sure) return;
    setPending(true);
    setError("");
    const response = await fetch(`/api/v1/admin/leads/${id}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setPending(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not delete this registration.");
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" disabled={pending} onClick={() => void remove()} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#9f1239] shadow-[inset_0_0_0_1.5px_#9f1239] disabled:opacity-60">
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? <span className="max-w-40 rounded-md bg-white px-2 py-1 text-xs font-medium text-[#9f1239]">{error}</span> : null}
    </span>
  );
}
