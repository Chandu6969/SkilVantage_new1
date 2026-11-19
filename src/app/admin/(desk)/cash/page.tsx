import { CashBoard } from "@/components/admin/cash-board";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CashPage() {
  const store = getStore();
  const [book, entries, batches, teachers] = await Promise.all([
    store.getCashBook(),
    store.listCashEntries(),
    store.listBatches(),
    store.listFaculty(),
  ]);
  const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();
  return (
    <CashBoard
      book={book}
      entries={entries}
      batches={batches.map((batch) => ({ id: batch.id, name: batch.name, learnerType: batch.learnerType }))}
      people={members.map((member) => ({ id: member.id, batchId: member.batchId, fullName: member.fullName }))}
      teachers={teachers.map((teacher) => ({ id: teacher.id, fullName: teacher.fullName }))}
    />
  );
}
