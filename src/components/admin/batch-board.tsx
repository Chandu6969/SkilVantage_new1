"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { rupees } from "@/components/admin/desk-charts";
import { MESSAGE_TEMPLATES, batchLook, callHref, displayPhone, initials, personalize, whatsAppHref } from "@/lib/batches";
import type { AttendanceMark, BatchMember, ClassDayStatus, FeePayment, TrainingBatch } from "@/lib/types";

type Filter = "all" | "unsent" | "absent";

export function BatchBoard({ batch, members, batches, fees, today, todayMarks }: { batch: TrainingBatch; members: BatchMember[]; batches: TrainingBatch[]; fees: FeePayment[]; today: string; todayMarks: AttendanceMark[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(members);
  const [draft, setDraft] = useState("");
  const [active, setActive] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fullName: "", phone: "", branch: "", batchId: batch.id });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(members.length === 0);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", phone: "", email: "", note: "", batchId: batch.id });
  const [attendance, setAttendance] = useState<Record<string, ClassDayStatus>>(() => {
    const map: Record<string, ClassDayStatus> = {};
    for (const mark of todayMarks) map[mark.memberId] = mark.status;
    return map;
  });
  const [lit, setLit] = useState<Record<string, string>>({});
  const noun = batch.learnerType === "student" ? "student" : "professional";
  const look = batchLook(batch);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "unsent" && row.messaged) return false;
      if (filter === "absent" && !row.absentToday) return false;
      if (!needle) return true;
      return row.fullName.toLowerCase().includes(needle) || row.phone.replace(/\D/g, "").includes(needle.replace(/\D/g, ""));
    });
  }, [filter, query, rows]);

  const sent = rows.filter((row) => row.messaged).length;

  function applyTemplate(id: string, text: string) {
    setActive(id);
    setDraft(text);
  }

  async function patch(id: string, body: { messaged?: boolean; absentToday?: boolean }) {
    const response = await fetch(`/api/v1/admin/batches/${batch.id}/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) return false;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...body } : row)));
    return true;
  }

  function openChat(member: BatchMember, markSent: boolean) {
    const href = whatsAppHref(member.phone, personalize(draft, member.fullName));
    if (!href) {
      setError("That phone number cannot open WhatsApp.");
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
    if (markSent && !member.messaged) void patch(member.id, { messaged: true });
  }

  function openNext() {
    const next = visible.find((row) => !row.messaged) || rows.find((row) => !row.messaged);
    if (!next) {
      setNotice(rows.length ? "Everyone in this batch is already marked sent." : `Add a ${noun} before opening a chat.`);
      return;
    }
    setNotice("");
    openChat(next, true);
  }

  async function copyMessage() {
    const sample = rows[0] ? personalize(draft, rows[0].fullName) : draft;
    try {
      await navigator.clipboard.writeText(sample);
      setNotice(rows[0] ? "Copied with the first name in this batch." : "Copied. {name} stays until a person is added.");
    } catch {
      setNotice("Copy was blocked by the browser.");
    }
  }

  async function resetSent() {
    const response = await fetch(`/api/v1/admin/batches/${batch.id}/reset`, { method: "POST" });
    if (!response.ok) {
      setError("The sent marks could not be cleared.");
      return;
    }
    setRows((current) => current.map((row) => ({ ...row, messaged: false })));
    setNotice("Sent marks cleared for this batch.");
  }

  async function markToday(member: BatchMember, status: string) {
    const allowed = status === "present" || status === "absent" || status === "leave" || status === "late";
    if (status !== "" && !allowed) return;
    const previous = attendance[member.id];
    setAttendance((current) => {
      const next = { ...current };
      if (status === "") delete next[member.id];
      else next[member.id] = status as ClassDayStatus;
      return next;
    });
    setError("");
    const response = await fetch("/api/v1/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: batch.id, memberId: member.id, date: today, status }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setAttendance((current) => {
        const next = { ...current };
        if (previous) next[member.id] = previous;
        else delete next[member.id];
        return next;
      });
      setError(data.error || "Could not save attendance.");
      return;
    }
    await patch(member.id, { absentToday: status === "absent" });
    router.refresh();
  }

  async function sendBack(member: BatchMember) {
    setLit((current) => ({ ...current, [member.id]: "remove" }));
    const sure = window.confirm(`Remove ${member.fullName} from ${batch.name}? They will show up again in Registrations.`);
    if (!sure) {
      setLit((current) => ({ ...current, [member.id]: "" }));
      return;
    }
    setError("");
    const response = await fetch(`/api/v1/admin/batches/${batch.id}/members/${member.id}`, { method: "DELETE" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not return this person to Registrations.");
      return;
    }
    setRows((current) => current.filter((row) => row.id !== member.id));
    setNotice(`${member.fullName} is back in Registrations.`);
    router.refresh();
  }

  function startEdit(member: BatchMember) {
    setEditing(member.id);
    setEditForm({ fullName: member.fullName, phone: member.phone, email: member.email, note: member.note, batchId: member.batchId });
    setError("");
  }

  async function saveEdit(event: React.FormEvent, member: BatchMember) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(`/api/v1/admin/batches/${batch.id}/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; fields?: Record<string, string>; member?: BatchMember };
    setSaving(false);
    if (!response.ok || !data.ok || !data.member) {
      setError(data.fields ? Object.values(data.fields)[0] || data.error || "Check the details." : data.error || "Check the details.");
      return;
    }
    if (data.member.batchId !== batch.id) {
      setRows((current) => current.filter((row) => row.id !== member.id));
      setNotice(`${data.member.fullName} moved to ${batches.find((item) => item.id === data.member?.batchId)?.name || "the other batch"}.`);
    } else {
      setRows((current) => current.map((row) => (row.id === member.id ? data.member! : row)).sort((a, b) => a.fullName.localeCompare(b.fullName)));
      setNotice(`${data.member.fullName} updated.`);
    }
    setEditing(null);
    router.refresh();
  }

  async function addPerson(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(`/api/v1/admin/batches/${form.batchId || batch.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: form.fullName, phone: form.phone, email: "", note: form.branch }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string; fields?: Record<string, string>; member?: BatchMember };
    setSaving(false);
    if (!response.ok || !data.ok || !data.member) {
      setError(data.fields ? Object.values(data.fields)[0] || data.error || "Check the details." : data.error || "Check the details.");
      return;
    }
    if (data.member.batchId === batch.id) {
      setRows((current) => [...current, data.member!].sort((a, b) => a.fullName.localeCompare(b.fullName)));
    }
    const target = batches.find((item) => item.id === data.member?.batchId)?.name || batch.name;
    setForm({ fullName: "", phone: "", branch: "", batchId: batch.id });
    setNotice(`${data.member.fullName} added to ${target}.`);
    router.refresh();
  }

  return (
    <div className="mt-4 grid gap-4">
      <section className="rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4">
        <p className="text-xs tracking-[0.16em] text-[var(--desk-muted)]">MESSAGE</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MESSAGE_TEMPLATES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => applyTemplate(item.id, item.text)}
              className={`rounded-full border px-3 py-1.5 text-sm ${active === item.id ? "border-[#14967c] bg-[#14967c] text-white" : "border-[var(--desk-line)] text-[var(--desk-text)]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="desk-composer mt-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message, or leave this empty to just open the WhatsApp chat…"
          />
        </div>
        <p className="mt-2 text-xs text-[var(--desk-muted)]">Use {"{name}"} to insert each {noun}&apos;s name. Leave the box empty to open the chat without any text.</p>
        <button type="button" onClick={openNext} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#14967c] font-medium text-white">
          Open next unsent
        </button>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => void copyMessage()} className="h-11 rounded-xl border border-[var(--desk-line)] text-sm">Copy message</button>
          <button type="button" onClick={() => void resetSent()} className="h-11 rounded-xl border border-[var(--desk-line)] text-sm">Reset sent</button>
        </div>
        {notice ? <p className="mt-3 text-sm text-[#8ee0c0]">{notice}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.16em] text-[var(--desk-muted)]">{batch.learnerType === "student" ? "STUDENTS" : "PROFESSIONALS"}</p>
            <p className="mt-1 text-sm">{sent} of {rows.length} messaged</p>
          </div>
          <button type="button" onClick={() => setShowForm((value) => !value)} className="h-10 rounded-xl bg-[#14967c] px-4 text-sm text-white">
            {showForm ? "Close form" : `Add ${noun}`}
          </button>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#7c5cff] via-[#22d3ee] to-[#3dff9a]" style={{ width: rows.length ? `${(sent / rows.length) * 100}%` : "0%" }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {(["all", "unsent", "absent"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-3 py-1 ${filter === item ? "bg-white/15" : "text-[var(--desk-muted)]"}`}>
              {item === "all" ? "All" : item === "unsent" ? "Not messaged" : "Absent today"}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${noun} name or number…`}
          className="mt-3 h-11 w-full rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card-2)] px-3 text-sm outline-none"
        />
        {showForm ? (
          <form onSubmit={addPerson} className="mt-4 grid gap-3 rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card-2)] p-3">
            <p className="text-sm font-medium">Add {noun} details</p>
            <input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Full name" className="h-11 rounded-xl border border-[var(--desk-line)] bg-transparent px-3" />
            <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone number" inputMode="tel" className="h-11 rounded-xl border border-[var(--desk-line)] bg-transparent px-3" />
            <select required value={form.batchId} onChange={(event) => setForm({ ...form, batchId: event.target.value })} aria-label="Batch" className="h-11 rounded-xl border border-[var(--desk-line)] bg-transparent px-3">
              {batches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <input value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} placeholder="Branch" className="h-11 rounded-xl border border-[var(--desk-line)] bg-transparent px-3" />
            <button type="submit" disabled={saving} className="h-11 rounded-xl bg-[#14967c] text-sm text-white disabled:opacity-60">{saving ? "Saving…" : `Save ${noun}`}</button>
          </form>
        ) : null}
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.length === 0 ? (
            <li className="rounded-3xl border border-dashed border-[var(--desk-line)] px-4 py-8 text-center text-sm text-[var(--desk-muted)] sm:col-span-2">
              {rows.length === 0 ? `No ${noun}s yet. Add the first name and phone when you have them.` : "Nothing matches this filter."}
            </li>
          ) : visible.map((member, index) => editing === member.id ? (
            <li key={member.id} className="rounded-xl bg-[var(--desk-card-2)] px-3 py-3">
              <form onSubmit={(event) => void saveEdit(event, member)} className="grid gap-2">
                <p className="text-sm font-medium">Edit {member.fullName}</p>
                <input required value={editForm.fullName} onChange={(event) => setEditForm({ ...editForm, fullName: event.target.value })} placeholder="Full name" className="h-11 rounded-xl border border-[var(--desk-line)] bg-transparent px-3" />
                <input required value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} placeholder="Phone number" inputMode="tel" className="h-11 rounded-xl border border-[var(--desk-line)] bg-transparent px-3" />
                <input value={editForm.note} onChange={(event) => setEditForm({ ...editForm, note: event.target.value })} placeholder="Branch" className="h-11 rounded-xl border border-[var(--desk-line)] bg-transparent px-3" />
                <select value={editForm.batchId} onChange={(event) => setEditForm({ ...editForm, batchId: event.target.value })} className="h-11 rounded-xl border border-[var(--desk-line)] bg-transparent px-3">
                  {batches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <span className="flex gap-2">
                  <button type="submit" disabled={saving} className="h-10 rounded-xl bg-[#14967c] px-4 text-sm text-white disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
                  <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-xl border border-[var(--desk-line)] px-4 text-sm">Cancel</button>
                </span>
              </form>
            </li>
          ) : (
            <li key={member.id} className="relative overflow-hidden rounded-3xl p-4 text-white" style={{ background: `linear-gradient(165deg, ${look.from}, ${look.to})` }}>
              <span className="absolute top-3 right-4 text-sm text-white/70">{index + 1}</span>
              <span className="mx-auto grid size-28 place-items-center rounded-full bg-white text-3xl font-semibold" style={{ color: look.from }}>{initials(member.fullName)}</span>
              <p className="mt-4 text-sm text-white/80">{member.note ? `${member.note} · ${batch.name}` : batch.name}</p>
              <Link href={`/admin/people/${member.id}`} className="mt-1 block text-2xl font-semibold leading-tight hover:underline">{member.fullName}</Link>
              <CallNumber phone={member.phone} />
              <PaymentLine fees={fees.filter((fee) => fee.memberId === member.id)} tone={look.from} />
              <div className="mt-4 flex flex-wrap gap-2">
                <select
                  aria-label={`Attendance for ${member.fullName}`}
                  value={attendance[member.id] === "holiday" ? "holiday" : attendance[member.id] || ""}
                  onChange={(event) => void markToday(member, event.target.value)}
                  className={attendance[member.id] ? "h-9 rounded-full border border-white bg-white px-3 text-sm font-medium outline-none" : "h-9 rounded-full border border-white/55 bg-transparent px-3 text-sm text-white outline-none"}
                  style={{ color: attendance[member.id] ? look.from : undefined, colorScheme: attendance[member.id] ? "light" : "dark" }}
                >
                  <option value="">Attendance</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                  <option value="late">Late join</option>
                  {attendance[member.id] === "holiday" ? <option value="holiday">Holiday</option> : null}
                </select>
                <button type="button" onClick={() => { setLit((current) => ({ ...current, [member.id]: "edit" })); startEdit(member); }} className={actionClass(lit[member.id] === "edit")} style={lit[member.id] === "edit" ? { color: look.from } : undefined}>Edit</button>
                <button type="button" onClick={() => { setLit((current) => ({ ...current, [member.id]: "whatsapp" })); openChat(member, true); }} className={actionClass(lit[member.id] === "whatsapp")} style={lit[member.id] === "whatsapp" ? { color: look.from } : undefined}>WhatsApp</button>
                <button type="button" onClick={() => void sendBack(member)} className={actionClass(lit[member.id] === "remove")} style={lit[member.id] === "remove" ? { color: look.from } : undefined}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function actionClass(active: boolean) {
  return active
    ? "rounded-full border border-white bg-white px-3 py-1.5 text-sm font-medium"
    : "rounded-full border border-white/55 bg-transparent px-3 py-1.5 text-sm text-white";
}

function CallNumber({ phone }: { phone: string }) {
  const label = displayPhone(phone);
  const href = callHref(phone);
  if (!href) return <p className="mt-1 text-sm text-white/75">{label}</p>;
  return <a href={href} className="mt-1 inline-block text-sm text-white underline-offset-2 hover:underline">{label}</a>;
}

function PaymentLine({ fees, tone }: { fees: FeePayment[]; tone: string }) {
  const latest = [...fees].sort((a, b) => b.paidOn.localeCompare(a.paidOn))[0];
  if (!latest) {
    return <p className="mt-3"><span className="inline-flex rounded-full border border-white/40 px-3 py-1 text-sm">Payment not recorded</span></p>;
  }
  const [year, month] = latest.paidOn.split("-").map(Number);
  const label = year && month ? new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }) : latest.paidOn;
  return (
    <div className="mt-3">
      <span className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-medium" style={{ color: tone }}>Payment recorded</span>
      <p className="mt-2 text-sm text-white/90">{rupees(latest.amount)} · {label}</p>
    </div>
  );
}
