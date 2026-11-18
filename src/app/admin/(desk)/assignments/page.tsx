import { AssignmentBoard } from "@/components/admin/assignment-board";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const store = getStore();
  const batches = await store.listBatches();
  const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();
  const items = await store.listAssignments();
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-[#0f766e] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-white uppercase">Assignments</p>
      <div className="mt-5"><AssignmentBoard batches={batches} members={members} items={items} /></div>
    </div>
  );
}
