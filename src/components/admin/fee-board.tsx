"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { todayIST } from "@/lib/dates";
import type { BatchMember, FeeKind, FeePayment, LearnerType, TrainingBatch } from "@/lib/types";
import { Legend, Ring, audienceTheme, rupees, type Slice } from "@/components/admin/desk-charts";

const field = "mt-1 h-11 w-full rounded-xl border border-black/10 bg-white/80 px-3 text-sm text-[#14211c] outline-none";
const kindColor: Record<FeeKind, string> = { cash: "#10b981", bank: "#3b82f6", upi: "#8b5cf6" };

export function FeeBoard({ batches, members, fees }: { batches: TrainingBatch[]; members: BatchMember[]; fees: FeePayment[] }) {
  const router = useRouter();
  const [focus, setFocus] = useState<LearnerType | "dashboard">("dashboard");
  const [batchId, setBatchId] = useState<Record<LearnerType, string>>({
    student: batches.find((batch) => batch.learnerType === "student")?.id || "",
    professional: batches.find((batch) => batch.learnerType === "professional")?.id || "",
  });
  const [memberId, setMemberId] = useState<Record<LearnerType, string>>({ student: "", professional: "" });
  const [amount, setAmount] = useState<Record<LearnerType, string>>({ student: "", professional: "" });
  const [kind, setKind] = useState<Record<LearnerType, FeeKind>>({ student: "cash", professional: "cash" });
  const [paidOn, setPaidOn] = useState<Record<LearnerType, string>>({ student: todayIST(), professional: todayIST() });
  const [note, setNote] = useState<Record<LearnerType, string>>({ student: "", professional: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  function money(audience: LearnerType, onlyBatch = "") {
    const ids = new Set(batches.filter((batch) => batch.learnerType === audience && (!onlyBatch || batch.id === onlyBatch)).map((batch) => batch.id));
    const rows = fees.filter((fee) => ids.has(fee.batchId));
    return {
      rows,
      cash: rows.filter((fee) => fee.kind === "cash").reduce((sum, fee) => sum + fee.amount, 0),
      bank: rows.filter((fee) => fee.kind === "bank").reduce((sum, fee) => sum + fee.amount, 0),
      upi: rows.filter((fee) => fee.kind === "upi").reduce((sum, fee) => sum + fee.amount, 0),
    };
  }

  async function submit(event: React.FormEvent, audience: LearnerType) {
    event.preventDefault();
    const group = batches.filter((batch) => batch.learnerType === audience);
    const selected = batchId[audience] || group[0]?.id || "";
    const roster = members.filter((member) => member.batchId === selected);
    const chosen = memberId[audience] || roster[0]?.id || "";
    setPending(audience);
    setError("");
    const response = await fetch("/api/v1/admin/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: selected, memberId: chosen, amount: Number(amount[audience]), kind: kind[audience], paidOn: paidOn[audience], note: note[audience] }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending("");
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save the payment.");
      return;
    }
    setAmount((current) => ({ ...current, [audience]: "" }));
    setNote((current) => ({ ...current, [audience]: "" }));
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {focus === "dashboard" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {(["student", "professional"] as const).map((key) => {
            const theme = audienceTheme[key];
            const totals = money(key);
            const collected = totals.cash + totals.bank + totals.upi;
            const people = members.filter((member) => batches.some((batch) => batch.id === member.batchId && batch.learnerType === key));
            const paidPeople = people.filter((member) => fees.some((fee) => fee.memberId === member.id)).length;
            const slices: Slice[] = [
              { label: "Cash", value: totals.cash, color: kindColor.cash },
              { label: "Bank", value: totals.bank, color: kindColor.bank },
              { label: "UPI", value: totals.upi, color: kindColor.upi },
            ];
            return (
              <article key={key} className="overflow-hidden rounded-3xl" style={{ background: theme.wash, color: theme.from }}>
                <div className="px-4 py-4 text-white" style={{ background: theme.band }}>
                  <p className="text-xs font-semibold tracking-[0.16em] uppercase">{theme.title}</p>
                  <h2 className="mt-1 text-2xl font-semibold">{rupees(collected)}</h2>
                  <p className="mt-1 text-sm text-white/85">{paidPeople} of {people.length} have paid</p>
                </div>
                <div className="grid items-center gap-3 p-4 sm:grid-cols-[150px_1fr]">
                  <Ring slices={slices} caption={paidPeople ? String(paidPeople) : "0"} />
                  <Legend slices={slices} />
                </div>
                <div className="px-4 pb-4">
                  <button type="button" onClick={() => setFocus(key)} className="h-11 rounded-xl px-4 text-sm font-medium text-white" style={{ background: theme.from }}>
                    Open {theme.title.toLowerCase()}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <FeeDesk
          audience={focus}
          batches={batches.filter((batch) => batch.learnerType === focus)}
          members={members}
          fees={fees}
          batchId={batchId[focus]}
          memberId={memberId[focus]}
          amount={amount[focus]}
          kind={kind[focus]}
          paidOn={paidOn[focus]}
          note={note[focus]}
          pending={pending === focus}
          onBatch={(id) => { setBatchId((current) => ({ ...current, [focus]: id })); setMemberId((current) => ({ ...current, [focus]: "" })); }}
          onMember={(id) => setMemberId((current) => ({ ...current, [focus]: id }))}
          onAmount={(value) => setAmount((current) => ({ ...current, [focus]: value }))}
          onKind={(value) => setKind((current) => ({ ...current, [focus]: value }))}
          onPaidOn={(value) => setPaidOn((current) => ({ ...current, [focus]: value }))}
          onNote={(value) => setNote((current) => ({ ...current, [focus]: value }))}
          onBack={() => setFocus("dashboard")}
          onSubmit={(event) => submit(event, focus)}
        />
      )}
    </div>
  );
}

function FeeDesk(props: {
  audience: LearnerType;
  batches: TrainingBatch[];
  members: BatchMember[];
  fees: FeePayment[];
  batchId: string;
  memberId: string;
  amount: string;
  kind: FeeKind;
  paidOn: string;
  note: string;
  pending: boolean;
  onBatch: (id: string) => void;
  onMember: (id: string) => void;
  onAmount: (value: string) => void;
  onKind: (value: FeeKind) => void;
  onPaidOn: (value: string) => void;
  onNote: (value: string) => void;
  onBack: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const theme = audienceTheme[props.audience];
  const selected = props.batchId || props.batches[0]?.id || "";
  const roster = props.members.filter((member) => member.batchId === selected);
  const chosen = props.memberId || roster[0]?.id || "";
  const rows = props.fees.filter((fee) => fee.batchId === selected);
  const slices: Slice[] = (["cash", "bank", "upi"] as const).map((item) => ({
    label: item.toUpperCase(),
    value: rows.filter((fee) => fee.kind === item).reduce((sum, fee) => sum + fee.amount, 0),
    color: kindColor[item],
  }));
  return (
    <section className="overflow-hidden rounded-3xl" style={{ background: theme.wash, color: theme.from }}>
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-4 text-white sm:px-5" style={{ background: theme.band }}>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] uppercase">{theme.title}</p>
          <h2 className="mt-1 text-2xl font-semibold">Payments</h2>
        </div>
        <button type="button" onClick={props.onBack} className="h-10 rounded-xl bg-white/15 px-3 text-sm">Back to dashboard</button>
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        {props.batches.length === 0 ? <p className="rounded-2xl bg-white/70 px-4 py-6 text-sm">No {theme.title.toLowerCase()} batch yet.</p> : (
          <>
            <div className="grid items-center gap-4 rounded-2xl bg-white/75 p-4 sm:grid-cols-[150px_1fr]">
              <Ring slices={slices} caption={rupees(slices.reduce((sum, slice) => sum + slice.value, 0))} />
              <Legend slices={slices} />
            </div>
            <form onSubmit={props.onSubmit} className="grid gap-3 rounded-2xl bg-white/75 p-4 sm:grid-cols-2">
              <label className="text-sm">Batch<select value={selected} onChange={(event) => props.onBatch(event.target.value)} className={field}>{props.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
              <label className="text-sm">Name<select value={chosen} onChange={(event) => props.onMember(event.target.value)} className={field}>{roster.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}{roster.length === 0 ? <option value="">No names yet</option> : null}</select></label>
              <label className="text-sm">Amount in rupees<input value={props.amount} onChange={(event) => props.onAmount(event.target.value)} inputMode="numeric" className={field} /></label>
              <label className="text-sm">Paid by<select value={props.kind} onChange={(event) => props.onKind(event.target.value as FeeKind)} className={field}><option value="cash">Cash</option><option value="bank">Bank</option><option value="upi">UPI</option></select></label>
              <label className="text-sm">Paid on<input type="date" value={props.paidOn} onChange={(event) => props.onPaidOn(event.target.value)} className={field} /></label>
              <label className="text-sm">Note<input value={props.note} onChange={(event) => props.onNote(event.target.value)} placeholder="First instalment" className={field} /></label>
              <button type="submit" disabled={props.pending || !chosen} className="h-11 rounded-xl text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:w-fit sm:px-5" style={{ background: theme.from }}>{props.pending ? "Saving…" : "Record payment"}</button>
            </form>
            <ul className="grid gap-2">
              {roster.map((member) => {
                const paid = props.fees.filter((fee) => fee.memberId === member.id).reduce((sum, fee) => sum + fee.amount, 0);
                return (
                  <li key={member.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 px-3 py-2.5">
                    <Link href={`/admin/people/${member.id}`} className="font-semibold hover:underline">{member.fullName}</Link>
                    <span className="text-sm">{rupees(paid)}</span>
                  </li>
                );
              })}
            </ul>
            {rows.length === 0 ? <p className="rounded-2xl bg-white/70 px-4 py-6 text-sm">No payments recorded for this batch yet.</p> : null}
          </>
        )}
      </div>
    </section>
  );
}
