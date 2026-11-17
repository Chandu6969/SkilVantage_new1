"use client";

import Link from "next/link";
import { useState } from "react";

type Slice = { label: string; value: number; color: string };
type Stamp = { at: string };

export function CohortBoard({
  noun,
  batches,
  joined,
  registered,
  removed,
  paid,
}: {
  noun: string;
  batches: Slice[];
  joined: Stamp[];
  registered: Stamp[];
  removed: { at: string; name: string; batchName: string }[];
  paid: { at: string; amount: number; memberId: string }[];
}) {
  const [range, setRange] = useState<"week" | "month" | "year">("month");
  const fresh = registered.filter((item) => inRange(item.at, range)).length;
  const dropped = removed.filter((item) => inRange(item.at, range));
  const arrivals = joined.filter((item) => inRange(item.at, range)).length;
  const paidRows = paid.filter((item) => inRange(item.at, range));
  const paidPeople = new Set(paidRows.map((item) => item.memberId)).size;
  const movement: Slice[] = [
    { label: "Newly registered", value: fresh, color: "#10b981" },
    { label: "Joined a batch", value: arrivals, color: "#3b82f6" },
    { label: "Paid", value: paidPeople, color: "#8b5cf6" },
    { label: "Removed", value: dropped.length, color: "#f43f5e" },
  ];

  return (
    <section
      className="rounded-[28px] p-3 sm:p-5"
      style={{
        color: "#14211c",
        background:
          "radial-gradient(640px 240px at 0% 0%, rgb(52 211 153 / 0.28), transparent 60%), radial-gradient(480px 220px at 100% 0%, rgb(59 130 246 / 0.18), transparent 55%), #f4fbf6",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold capitalize">{noun}s</h2>
          <p className="text-sm" style={{ color: "#3d4a57" }}>Batch size, new registrations, payments, and people sent back to Registrations.</p>
        </div>
        <div className="flex rounded-full bg-white/70 p-1 text-xs">
          {(["week", "month", "year"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setRange(item)} className={`rounded-full px-3 py-1.5 capitalize ${range === item ? "bg-[#149764] text-white" : ""}`} style={range === item ? undefined : { color: "#3d4a57" }}>
              {item === "week" ? "Weekly" : item === "month" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl bg-white/70 p-4" style={{ border: "1px solid rgb(255 255 255 / 0.8)" }}>
          <h3 className="font-semibold">In each batch</h3>
          <div className="mt-3 grid items-center gap-4 sm:grid-cols-[160px_1fr]">
            <Ring slices={batches} />
            <Legend slices={batches} />
          </div>
        </article>
        <article className="rounded-3xl bg-white/70 p-4" style={{ border: "1px solid rgb(255 255 255 / 0.8)" }}>
          <h3 className="font-semibold capitalize">This {range}</h3>
          <div className="mt-3 grid items-center gap-4 sm:grid-cols-[160px_1fr]">
            <Ring slices={movement} />
            <Legend slices={movement} />
          </div>
        </article>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium">Sent back to Registrations</p>
        <ul className="mt-2 grid gap-2">
          {dropped.length === 0 ? <li className="text-sm" style={{ color: "#3d4a57" }}>No one was removed in this {range}.</li> : null}
          {dropped.slice(0, 6).map((item) => (
            <li key={`${item.at}-${item.name}`} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2 text-sm">
              <span>{item.name} · {item.batchName}</span>
              <Link href="/admin/leads" className="font-medium text-[#065f46]">Open leads</Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Legend({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  return (
    <ul className="grid gap-2">
      {slices.map((slice) => (
        <li key={slice.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 font-medium"><span className="size-3 rounded-full" style={{ background: slice.color }} />{slice.label}</span>
          <span style={{ color: "#3d4a57" }}>{slice.value}{total ? ` · ${Math.round((slice.value / total) * 100)}%` : ""}</span>
        </li>
      ))}
    </ul>
  );
}

function Ring({ slices }: { slices: Slice[] }) {
  const active = slices.filter((slice) => slice.value > 0);
  const total = active.reduce((sum, slice) => sum + slice.value, 0);
  const circumference = 2 * Math.PI * 52;
  let offset = 0;
  return (
    <div className="mx-auto grid size-36 place-items-center">
      <svg viewBox="0 0 140 140" className="col-start-1 row-start-1 size-36" role="img" aria-label="Chart">
        <circle cx="70" cy="70" r="52" fill="none" stroke="#e7f6ee" strokeWidth="18" />
        {total
          ? active.map((slice) => {
            const length = Math.max(8, (slice.value / total) * circumference - 3);
            const node = (
              <circle key={slice.label} cx="70" cy="70" r="52" fill="none" stroke={slice.color} strokeWidth="18" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />
            );
            offset += length + 3;
            return node;
          })
          : null}
      </svg>
      <p className="col-start-1 row-start-1 text-xl font-semibold">{slices.reduce((sum, slice) => sum + slice.value, 0)}</p>
    </div>
  );
}

function inRange(value: string, range: "week" | "month" | "year") {
  const key = /^\d{4}-\d{2}-\d{2}/.test(value)
    ? value.slice(0, 10)
    : new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  if (!key || key.startsWith("Invalid")) return false;
  if (range === "year") return key.slice(0, 4) === today.slice(0, 4);
  if (range === "month") return key.slice(0, 7) === today.slice(0, 7);
  const start = new Date(`${today}T12:00:00+05:30`);
  start.setTime(start.getTime() - 6 * 86400000);
  const startKey = start.toLocaleDateString("en-CA", { timeZone: "Asia/Calcutta" });
  return key >= startKey && key <= today;
}
