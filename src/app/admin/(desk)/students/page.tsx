import { BatchLink } from "@/components/admin/batch-link";
import { AddBatchForm } from "@/components/admin/add-batch-form";
import { CohortBoard } from "@/components/admin/cohort-board";
import { DeskHeader, DeskTitle } from "@/components/admin/desk-header";
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
      <DeskHeader eyebrow="Students" title={<DeskTitle />} subtitle="College batches. SASI is green, WISE is blue." />
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
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          {batches.map((batch) => (
            <BatchLink key={batch.id} batch={batch} count={counts.get(batch.id) || 0} noun="student" />
          ))}
        </div>
        <AddBatchForm learnerType="student" />
      </div>
    </div>
  );
}
