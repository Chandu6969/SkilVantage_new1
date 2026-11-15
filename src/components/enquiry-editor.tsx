"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";

export function EnquiryEditor({ id, status, notes }: { id: string; status: LeadStatus; notes: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/v1/admin/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: form.get("status"), counsellorNotes: form.get("notes") }),
    });
    setMessage(response.ok ? "Saved." : "Could not save.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-3">
      <label className="field">Status<select name="status" defaultValue={status}>{LEAD_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field">Notes<textarea name="notes" defaultValue={notes} /></label>
      <button className="h-11 rounded-xl bg-ink text-paper" type="submit">Save enquiry</button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
