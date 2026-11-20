"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteRegistration } from "@/components/admin/delete-registration";
import { formatStamp } from "@/lib/dates";
import { programName } from "@/lib/palette";
import { LEAD_STATUSES, type LeadStatus, type Registration } from "@/lib/types";

type Tab = "all" | "contacted" | "pending";

const choices: LeadStatus[] = [
  "Pending",
  "Contacted",
  ...LEAD_STATUSES.filter((item) => item !== "Pending" && item !== "Contacted"),
];

function paint(status: string) {
  if (status === "Contacted") {
    return {
      row: "border-[#166534] bg-[#15803d] text-white",
      muted: "text-white/85",
      link: "text-white underline-offset-4 hover:underline",
    };
  }
  if (status === "Pending") {
    return {
      row: "border-[#c2410c] bg-[#ea580c] text-white",
      muted: "text-white/85",
      link: "text-white underline-offset-4 hover:underline",
    };
  }
  return {
    row: "border-[var(--desk-line)] bg-[var(--desk-card)]",
    muted: "text-[var(--desk-muted)]",
    link: "underline-offset-4 hover:underline",
  };
}

export function RegistrationRoster({ rows, canDelete }: { rows: Registration[]; canDelete: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [overrides, setOverrides] = useState<Record<string, LeadStatus>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  function statusOf(row: Registration) {
    return overrides[row.id] ?? row.status;
  }

  const contacted = rows.filter((row) => statusOf(row) === "Contacted").length;
  const pending = rows.filter((row) => statusOf(row) === "Pending").length;
  const visible = rows.filter((row) => {
    const status = statusOf(row);
    if (tab === "contacted") return status === "Contacted";
    if (tab === "pending") return status === "Pending";
    return true;
  });

  async function mark(id: string, status: LeadStatus) {
    const previous = rows.find((row) => row.id === id)?.status;
    setOverrides((current) => ({ ...current, [id]: status }));
    setBusy(id);
    setError("");
    const response = await fetch(`/api/v1/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    setBusy("");
    if (!response.ok || !data.ok) {
      setOverrides((current) => {
        const next = { ...current };
        if (previous) next[id] = previous;
        else delete next[id];
        return next;
      });
      setError(data.error || "Could not update this registration.");
      return;
    }
    router.refresh();
  }

  const tabs: { id: Tab; label: string; count: number; on: string }[] = [
    { id: "all", label: "All", count: rows.length, on: "bg-[#6d4dff] text-white" },
    { id: "contacted", label: "Contacted", count: contacted, on: "bg-[#15803d] text-white" },
    { id: "pending", label: "Pending", count: pending, on: "bg-[#ea580c] text-white" },
  ];

  return (
    <div>
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Registration status">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === item.id ? item.on : "border border-[var(--desk-line)] bg-[var(--desk-card)]"}`}
          >
            {item.label} · {item.count}
          </button>
        ))}
      </div>
      <h2 className="mt-5 text-lg font-semibold">{tab === "contacted" ? "Contacted" : tab === "pending" ? "Pending" : "All registrations"}</h2>
      <p className="mt-1 text-sm text-[var(--desk-muted)]">{visible.length} {visible.length === 1 ? "record" : "records"}. Contacted rows are green. Pending rows are orange.</p>
      {error ? <p className="mt-2 text-sm text-[#fb7185]">{error}</p> : null}
      <div className="mt-4 space-y-3 lg:hidden">
        {visible.slice(0, 200).map((lead) => {
          const status = statusOf(lead);
          const tone = paint(status);
          return (
            <article key={lead.id} className={`rounded-2xl border p-4 ${tone.row}`}>
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/leads/${lead.id}`} className="min-w-0">
                  <p className="font-medium">{lead.fullName}</p>
                  <p className={`text-sm ${tone.muted}`}>{lead.learnerType === "student" ? "Student" : "Professional"} · {programName(lead.program)}</p>
                  <p className={`text-sm ${tone.muted}`}>{lead.phone}{lead.email ? ` · ${lead.email}` : ""}</p>
                  <p className={`text-sm ${tone.muted}`}>{formatStamp(lead.createdAt)}</p>
                </Link>
                {canDelete ? <DeleteRegistration id={lead.id} name={lead.fullName} /> : null}
              </div>
              <StatusSelect status={status} disabled={busy === lead.id} onChange={(next) => void mark(lead.id, next)} />
            </article>
          );
        })}
      </div>
      <div className="mt-4 hidden overflow-x-auto rounded-3xl border border-[var(--desk-line)] lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--desk-line)] bg-[var(--desk-card)] text-[var(--desk-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Date (IST)</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Follow-up</th>
              {canDelete ? <th className="px-4 py-3 font-medium"> </th> : null}
            </tr>
          </thead>
          <tbody>
            {visible.slice(0, 200).map((lead) => {
              const status = statusOf(lead);
              const tone = paint(status);
              return (
                <tr key={lead.id} className={`border-b last:border-0 ${tone.row}`}>
                  <td className="px-4 py-3 whitespace-nowrap">{formatStamp(lead.createdAt)}</td>
                  <td className="px-4 py-3"><Link className={tone.link} href={`/admin/leads/${lead.id}`}>{lead.fullName}</Link></td>
                  <td className="px-4 py-3">{lead.phone}</td>
                  <td className="px-4 py-3">{lead.learnerType === "student" ? "Student" : "Professional"}</td>
                  <td className="px-4 py-3">{programName(lead.program)}</td>
                  <td className="px-4 py-3"><StatusSelect status={status} disabled={busy === lead.id} onChange={(next) => void mark(lead.id, next)} /></td>
                  <td className="px-4 py-3">{lead.followUpDate || "—"}</td>
                  {canDelete ? <td className="px-4 py-3"><DeleteRegistration id={lead.id} name={lead.fullName} /></td> : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {visible.length > 200 ? <p className="mt-3 text-sm text-[var(--desk-muted)]">Showing the latest 200. Export CSV for the full list.</p> : null}
      {visible.length === 0 ? <p className="mt-6 text-sm text-[var(--desk-muted)]">{tab === "all" ? "No registrations yet." : `No ${tab} registrations yet.`}</p> : null}
    </div>
  );
}

function StatusSelect({ status, disabled, onChange }: { status: LeadStatus; disabled: boolean; onChange: (status: LeadStatus) => void }) {
  return (
    <select
      aria-label="Registration status"
      value={status}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as LeadStatus)}
      className="mt-3 rounded-full border border-white/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#14211c] disabled:opacity-60 lg:mt-0"
    >
      {choices.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
  );
}
