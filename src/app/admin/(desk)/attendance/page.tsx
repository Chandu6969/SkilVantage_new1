import { AttendanceBoard } from "@/components/admin/attendance-board";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const params = await searchParams;
  const store = getStore();
  const batches = await store.listBatches();
  const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();
  const marks = (await Promise.all(batches.map((batch) => store.listAttendance(batch.id)))).flat();
  return <AttendanceBoard batches={batches} members={members} marks={marks} initialBatch={params.batch || ""} />;
}
