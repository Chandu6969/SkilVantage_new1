"use client";

import { useState } from "react";

export function SheetsSync({ configured }: { configured: boolean }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function sync() {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/v1/admin/sheets", { method: "POST" });
    const data = (await response.json()) as { ok?: boolean; synced?: number; error?: string; lastError?: string | null };
    setPending(false);
    if (!response.ok || !data.ok) {
      setMessage(data.error || "Sync failed.");
      return;
    }
    setMessage(data.synced ? `Synced ${data.synced} record${data.synced === 1 ? "" : "s"}.` : data.lastError || "Nothing new to sync.");
  }

  if (!configured) return null;
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button type="button" onClick={() => void sync()} disabled={pending} className="h-10 rounded-xl border border-border px-4 text-sm">
        {pending ? "Syncing…" : "Sync to Google Sheets"}
      </button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
