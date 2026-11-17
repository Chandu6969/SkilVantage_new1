import { FeeBoard } from "@/components/admin/fee-board";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CashPage() {
  const store = getStore();
  const batches = await store.listBatches();
  const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();
  const fees = await store.listFees();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Cash and bank</h1>
      <p className="mt-1 text-sm text-[var(--desk-muted)]">Record cash, bank, or UPI against a student. The total collected sits with their name.</p>
      <div className="mt-5"><FeeBoard batches={batches} members={members} fees={fees} /></div>
    </div>
  );
}
