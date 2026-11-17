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
      <h1 className="text-2xl font-semibold">Assignments</h1>
      <p className="mt-1 text-sm text-[var(--desk-muted)]">Give one piece of work to a whole batch. Each student gets their own pending, submitted, or reviewed status.</p>
      <div className="mt-5"><AssignmentBoard batches={batches} members={members} items={items} /></div>
    </div>
  );
}
