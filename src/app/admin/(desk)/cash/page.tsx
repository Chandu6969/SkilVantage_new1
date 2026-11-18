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
      <p className="inline-flex items-center gap-1.5 rounded-full bg-[#0f766e] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-white uppercase">Payments</p>
      <div className="mt-5"><FeeBoard batches={batches} members={members} fees={fees} /></div>
    </div>
  );
}
