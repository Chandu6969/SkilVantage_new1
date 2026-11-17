import { AttendanceBoard } from "@/components/admin/attendance-board";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const store = getStore();
  const batches = await store.listBatches();
  const members = (await Promise.all(batches.map((batch) => store.listMembers(batch.id)))).flat();
  const marks = (await Promise.all(batches.map((batch) => store.listAttendance(batch.id)))).flat();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Attendance</h1>
      <p className="mt-1 text-sm text-[var(--desk-muted)]">Mark present or absent for the names already in each batch, then read the report below.</p>
      <div className="mt-5"><AttendanceBoard batches={batches} members={members} marks={marks} /></div>
    </div>
  );
}
