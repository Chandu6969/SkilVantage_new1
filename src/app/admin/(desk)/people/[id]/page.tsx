import { notFound } from "next/navigation";
import { PersonBoard } from "@/components/admin/person-board";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const batches = await store.listBatches();
  const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();
  const member = members.find((item) => item.id === id);
  const batch = member ? batches.find((item) => item.id === member.batchId) : undefined;
  if (!member || !batch) notFound();
  const marks = (await store.listAttendance(batch.id)).filter((item) => item.memberId === member.id);
  const fees = (await store.listFees()).filter((item) => item.memberId === member.id);
  const assignments = (await store.listAssignments(batch.id)).filter((item) => item.memberId === member.id);
  return <PersonBoard member={member} batch={batch} marks={marks} fees={fees} assignments={assignments} />;
}
