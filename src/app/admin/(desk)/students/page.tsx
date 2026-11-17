import { BatchLink } from "@/components/admin/batch-link";
import { AddBatchForm } from "@/components/admin/add-batch-form";
import { CohortBoard } from "@/components/admin/cohort-board";
import { batchLook } from "@/lib/batches";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const store = getStore();
  const batches = await store.listBatches("student");
  const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();
  const registrations = (await store.listRegistrations()).filter((item) => !item.sample && item.learnerType === "student");
  const removed = await store.listRemoved("student");
  const fees = await store.listFees();
  const memberIds = new Set(members.map((member) => member.id));
  const counts = new Map(batches.map((batch) => [batch.id, members.filter((member) => member.batchId === batch.id).length]));

  return (
    <div>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-[#065f46] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-white uppercase">
        <span className="size-1.5 rounded-full bg-[#b8ffd4]" />
        Students
      </p>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_0.9fr]">
        {batches.map((batch) => (
          <BatchLink key={batch.id} batch={batch} count={counts.get(batch.id) || 0} noun="student" />
        ))}
        <AddBatchForm learnerType="student" />
      </div>
      <div className="mt-4">
        <CohortBoard
          noun="student"
          batches={batches.map((batch) => ({ label: batch.name, value: counts.get(batch.id) || 0, color: batchLook(batch).to }))}
          joined={members.map((member) => ({ at: member.createdAt }))}
          registered={registrations.map((item) => ({ at: item.createdAt }))}
          removed={removed.map((item) => ({ at: item.removedAt, name: item.fullName, batchName: item.batchName }))}
          paid={fees.filter((fee) => memberIds.has(fee.memberId)).map((fee) => ({ at: fee.paidOn, amount: fee.amount, memberId: fee.memberId }))}
        />
      </div>
    </div>
  );
}
