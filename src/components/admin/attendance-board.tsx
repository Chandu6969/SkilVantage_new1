"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { displayPhone } from "@/lib/batches";
import { todayIST } from "@/lib/dates";
import type { AttendanceMark, BatchMember, LearnerType, TrainingBatch } from "@/lib/types";
import { Legend, Ring, audienceTheme, dayLabel, type Slice } from "@/components/admin/desk-charts";

const field = "mt-1 h-11 w-full rounded-xl border border-black/10 bg-white/80 px-3 text-sm text-[#14211c] outline-none";

export function AttendanceBoard({
  batches,
  members,
  marks,
  initialBatch = "",
}: {
  batches: TrainingBatch[];
  members: BatchMember[];
  marks: AttendanceMark[];
  initialBatch?: string;
}) {
  const router = useRouter();
  const opened = batches.find((batch) => batch.id === initialBatch);
  const [date, setDate] = useState(todayIST());
  const [focus, setFocus] = useState<LearnerType | "dashboard">(opened?.learnerType || "dashboard");
  const [batchId, setBatchId] = useState<Record<LearnerType, string>>({
    student: opened?.learnerType === "student" ? opened.id : batches.find((batch) => batch.learnerType === "student")?.id || "",
    professional: opened?.learnerType === "professional" ? opened.id : batches.find((batch) => batch.learnerType === "professional")?.id || "",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  const summary = useMemo(() => {
    return (["student", "professional"] as const).map((key) => {
      const roster = members.filter((member) => batches.some((batch) => batch.id === member.batchId && batch.learnerType === key));
      const present = roster.filter((member) => marks.some((mark) => mark.memberId === member.id && mark.date === date && mark.status === "present")).length;
      const absent = roster.filter((member) => marks.some((mark) => mark.memberId === member.id && mark.date === date && mark.status === "absent")).length;
      return { key, roster, present, absent, open: Math.max(roster.length - present - absent, 0) };
    });
  }, [batches, date, marks, members]);

  async function mark(batch: string, memberId: string, status: "present" | "absent") {
    setPending(memberId + status);
    setError("");
    const response = await fetch("/api/v1/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: batch, memberId, date, status }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save attendance.");
      return;
    }
    router.refresh();
  }

  if (batches.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[var(--desk-line)] p-8 text-sm text-[var(--desk-muted)]">Add a batch under Students or Professionals first. Attendance uses those names.</p>;
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--desk-text)]">{dayLabel(date)}</p>
          <p className="text-sm text-[var(--desk-muted)]">Present and absent, split by students and professionals.</p>
        </div>
        <label className="text-sm text-[var(--desk-text)]">
          Class day
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 h-11 rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card)] px-3" />
        </label>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {focus === "dashboard" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {summary.map((item) => {
            const theme = audienceTheme[item.key];
            const slices: Slice[] = [
              { label: "Attended", value: item.present, color: "#10b981" },
              { label: "Absent", value: item.absent, color: "#f43f5e" },
              { label: "Not marked", value: item.open, color: "#94a3b8" },
            ];
            return (
              <article key={item.key} className="overflow-hidden rounded-3xl" style={{ background: theme.wash, color: theme.from }}>
                <div className="px-4 py-4 text-white" style={{ background: theme.band }}>
                  <p className="text-xs font-semibold tracking-[0.16em] uppercase">{theme.title}</p>
                  <h2 className="mt-1 text-2xl font-semibold">{item.present} attended · {item.absent} absent</h2>
                </div>
                <div className="grid items-center gap-3 p-4 sm:grid-cols-[150px_1fr]">
                  <Ring slices={slices} />
                  <Legend slices={slices} />
                </div>
                <div className="px-4 pb-4">
                  <button type="button" onClick={() => setFocus(item.key)} className="h-11 rounded-xl px-4 text-sm font-medium text-white" style={{ background: theme.from }}>
                    Open {theme.title.toLowerCase()}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <AudienceDay
          audience={focus}
          batches={batches.filter((batch) => batch.learnerType === focus)}
          members={members}
          marks={marks}
          date={date}
          batchId={batchId[focus]}
          onBatch={(id) => setBatchId((current) => ({ ...current, [focus]: id }))}
          onBack={() => setFocus("dashboard")}
          pending={pending}
          onMark={mark}
        />
      )}
    </div>
  );
}

function AudienceDay({
  audience,
  batches,
  members,
  marks,
  date,
  batchId,
  onBatch,
  onBack,
  pending,
  onMark,
}: {
  audience: LearnerType;
  batches: TrainingBatch[];
  members: BatchMember[];
  marks: AttendanceMark[];
  date: string;
  batchId: string;
  onBatch: (id: string) => void;
  onBack: () => void;
  pending: string;
  onMark: (batchId: string, memberId: string, status: "present" | "absent") => void;
}) {
  const theme = audienceTheme[audience];
  const selected = batchId || batches[0]?.id || "";
  const roster = members.filter((member) => member.batchId === selected);
  const present = roster.filter((member) => marks.some((mark) => mark.memberId === member.id && mark.date === date && mark.status === "present")).length;
  const absent = roster.filter((member) => marks.some((mark) => mark.memberId === member.id && mark.date === date && mark.status === "absent")).length;
  const slices: Slice[] = [
    { label: "Attended", value: present, color: "#10b981" },
    { label: "Absent", value: absent, color: "#f43f5e" },
    { label: "Not marked", value: Math.max(roster.length - present - absent, 0), color: "#94a3b8" },
  ];

  return (
    <section className="overflow-hidden rounded-3xl" style={{ background: theme.wash, color: theme.from }}>
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-4 text-white sm:px-5" style={{ background: theme.band }}>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] uppercase">{theme.title}</p>
          <h2 className="mt-1 text-2xl font-semibold">Mark {dayLabel(date)}</h2>
        </div>
        <button type="button" onClick={onBack} className="h-10 rounded-xl bg-white/15 px-3 text-sm">Back to dashboard</button>
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        {batches.length === 0 ? <p className="rounded-2xl bg-white/70 px-4 py-6 text-sm">No {theme.title.toLowerCase()} batch yet.</p> : (
          <>
            <div className="grid items-center gap-4 rounded-2xl bg-white/75 p-4 lg:grid-cols-[180px_1fr_220px]">
              <Ring slices={slices} />
              <Legend slices={slices} />
              <label className="text-sm">
                Batch
                <select value={selected} onChange={(event) => onBatch(event.target.value)} className={field}>
                  {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.label} · {batch.name}</option>)}
                </select>
              </label>
            </div>
            <ul className="grid gap-2">
              {roster.map((member) => {
                const current = marks.find((mark) => mark.memberId === member.id && mark.date === date)?.status;
                return (
                  <li key={member.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/80 px-3 py-2.5">
                    <Link href={`/admin/people/${member.id}`} className="min-w-0 flex-1 font-semibold hover:underline">{member.fullName}</Link>
                    <span className="text-sm opacity-70">{displayPhone(member.phone) || "No phone"}</span>
                    <button type="button" disabled={pending !== ""} onClick={() => onMark(selected, member.id, "present")} className="h-9 rounded-lg px-3 text-xs font-medium" style={{ background: current === "present" ? "#10b981" : "white", color: current === "present" ? "white" : theme.from, border: "1px solid rgb(0 0 0 / 0.08)" }}>Present</button>
                    <button type="button" disabled={pending !== ""} onClick={() => onMark(selected, member.id, "absent")} className="h-9 rounded-lg px-3 text-xs font-medium" style={{ background: current === "absent" ? "#f43f5e" : "white", color: current === "absent" ? "white" : theme.from, border: "1px solid rgb(0 0 0 / 0.08)" }}>Absent</button>
                  </li>
                );
              })}
            </ul>
            {roster.length === 0 ? <p className="rounded-2xl bg-white/70 px-4 py-6 text-sm">This batch has no names yet.</p> : null}
          </>
        )}
      </div>
    </section>
  );
}
