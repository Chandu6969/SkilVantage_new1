"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BatchMember, FeePayment, TrainingBatch } from "@/lib/types";

const field = "mt-1 h-11 w-full rounded-xl border border-[var(--desk-line)] bg-[var(--desk-card-2)] px-3 text-sm text-[var(--desk-text)] outline-none";

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function FeeBoard({ batches, members, fees }: { batches: TrainingBatch[]; members: BatchMember[]; fees: FeePayment[] }) {
  const router = useRouter();
  const [batchId, setBatchId] = useState(batches[0]?.id || "");
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"cash" | "bank" | "upi">("cash");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const roster = members.filter((member) => member.batchId === batchId);
  const chosen = memberId || roster[0]?.id || "";
  const rows = useMemo(() => {
    return fees
      .filter((fee) => fee.batchId === batchId)
      .map((fee) => ({ fee, member: members.find((member) => member.id === fee.memberId) }));
  }, [batchId, fees, members]);
  const totals = roster.map((member) => ({
    member,
    paid: fees.filter((fee) => fee.memberId === member.id).reduce((sum, fee) => sum + fee.amount, 0),
  }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/v1/admin/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId, memberId: chosen, amount: Number(amount), kind, paidOn, note }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setPending(false);
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not save the payment.");
      return;
    }
    setAmount("");
    setNote("");
    router.refresh();
  }

  if (batches.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[var(--desk-line)] p-8 text-sm text-[var(--desk-muted)]">Add a batch and its students first. Payments attach to those names.</p>;
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4 sm:grid-cols-2">
        <label className="text-sm">Batch<select value={batchId} onChange={(event) => { setBatchId(event.target.value); setMemberId(""); }} className={field}>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
        <label className="text-sm">Student<select value={chosen} onChange={(event) => setMemberId(event.target.value)} className={field}>{roster.map((member) => <option key={member.id} value={member.id}>{member.fullName}</option>)}{roster.length === 0 ? <option value="">No students yet</option> : null}</select></label>
        <label className="text-sm">Amount in rupees<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" className={field} /></label>
        <label className="text-sm">Paid by<select value={kind} onChange={(event) => setKind(event.target.value as "cash" | "bank" | "upi")} className={field}><option value="cash">Cash</option><option value="bank">Bank</option><option value="upi">UPI</option></select></label>
        <label className="text-sm">Paid on<input type="date" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} className={field} /></label>
        <label className="text-sm">Note<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="First instalment" className={field} /></label>
        {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
        <button type="submit" disabled={pending || !chosen} className="h-11 rounded-xl bg-[#14967c] text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:w-fit sm:px-5">{pending ? "Saving…" : "Record payment"}</button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2">
        {totals.map((row) => (
          <div key={row.member.id} className="rounded-2xl border border-[var(--desk-line)] bg-[var(--desk-card)] p-4">
            <p className="font-medium">{row.member.fullName}</p>
            <p className="mt-1 text-sm text-[var(--desk-muted)]">Collected {rupees(row.paid)}</p>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--desk-line)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--desk-card)] text-[var(--desk-muted)]">
            <tr><th className="px-4 py-3 font-medium">Student</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Mode</th><th className="px-4 py-3 font-medium">Date</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.fee.id} className="border-t border-[var(--desk-line)]">
                <td className="px-4 py-3">{row.member?.fullName || "Student"}</td>
                <td className="px-4 py-3">{rupees(row.fee.amount)}</td>
                <td className="px-4 py-3 capitalize">{row.fee.kind}</td>
                <td className="px-4 py-3">{row.fee.paidOn}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-8 text-sm text-[var(--desk-muted)]">No payments recorded for this batch yet.</p> : null}
      </div>
    </div>
  );
}
