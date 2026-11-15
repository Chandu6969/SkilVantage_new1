"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

export function LeadEditor({
  id,
  status,
  notes,
  followUpDate,
  canDelete,
}: {
  id: string;
  status: LeadStatus;
  notes: string;
  followUpDate: string | null;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("followUpDate") || "");
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch(`/api/v1/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.get("status"),
        counsellorNotes: form.get("counsellorNotes"),
        followUpDate: date || null,
        counsellor: form.get("counsellor"),
        followUpNotes: form.get("followUpNotes"),
      }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setSaving(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "The update was not saved.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this registration and its resume? This cannot be undone.")) return;
    const response = await fetch(`/api/v1/admin/leads/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("The registration could not be deleted.");
      return;
    }
    router.push("/admin/leads");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-border bg-card p-5">
      <h2 className="text-xl text-ink">Counsellor update</h2>
      <label className="field">Status
        <select name="status" defaultValue={status}>{LEAD_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
      </label>
      <label className="field">Counsellor notes<textarea name="counsellorNotes" defaultValue={notes} /></label>
      <label className="field">Follow-up date<input type="date" name="followUpDate" defaultValue={followUpDate || ""} /></label>
      <label className="field">Counsellor<input name="counsellor" defaultValue="Career team" /></label>
      <label className="field">Follow-up note<textarea name="followUpNotes" placeholder="What should happen on that date?" /></label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-teal">{message}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" disabled={saving} className="h-11 rounded-xl bg-ink px-4 text-paper disabled:opacity-60">{saving ? "Saving…" : "Save update"}</button>
        {canDelete ? <button type="button" onClick={() => void remove()} className="h-11 rounded-xl border border-destructive px-4 text-destructive">Delete registration</button> : null}
      </div>
    </form>
  );
}
